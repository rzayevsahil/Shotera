import { useEffect, useState, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { Play, Pause, RotateCcw, X, Volume2, VolumeX } from "lucide-react";

export default function BreakTimer() {
  const [totalSeconds, setTotalSeconds] = useState<number>(600); // 10 minutes default
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleClose = async () => {
    try {
      await invoke("hide_timer_window");
    } catch (e) {
      try {
        const win = getCurrentWindow();
        await win.hide();
      } catch (err) {
        console.error("Failed to hide timer window:", err);
      }
    }
  };


  // Play audio chime when timer reaches 0
  const playAlarm = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };

      // Play chime sequence: C5, E5, G5, C6
      playBeep(523.25, 0, 0.3);
      playBeep(659.25, 0.25, 0.3);
      playBeep(783.99, 0.5, 0.3);
      playBeep(1046.50, 0.75, 0.8);
    } catch (e) {
      console.error("Failed to play timer alarm:", e);
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsFinished(true);
            playAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft, soundEnabled]);

  // Handle Keyboard & Scroll adjustments
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const addSecs = e.shiftKey ? 300 : 60;
        setTotalSeconds((prev) => {
          const next = prev + addSecs;
          setTimeLeft(next);
          return next;
        });
        setIsFinished(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const subSecs = e.shiftKey ? 300 : 60;
        setTotalSeconds((prev) => {
          const next = Math.max(60, prev - subSecs);
          setTimeLeft(next);
          return next;
        });
        setIsFinished(false);
      } else if (e.key.toLowerCase() === "r") {
        setTimeLeft(totalSeconds);
        setIsRunning(true);
        setIsFinished(false);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const step = e.shiftKey ? 300 : 60;
      if (e.deltaY < 0) {
        setTotalSeconds((prev) => {
          const next = prev + step;
          setTimeLeft(next);
          return next;
        });
      } else if (e.deltaY > 0) {
        setTotalSeconds((prev) => {
          const next = Math.max(60, prev - step);
          setTimeLeft(next);
          return next;
        });
      }
      setIsFinished(false);
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("wheel", handleWheel);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("wheel", handleWheel);
    };

  }, [totalSeconds]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const strokeDashoffset = 880 - (880 * progress) / 100;

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        userSelect: "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top Controls */}
      <div
        style={{
          position: "absolute",
          top: "24px",
          right: "24px",
          display: "flex",
          gap: "12px",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setSoundEnabled((prev) => !prev)}
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#fff",
            borderRadius: "50%",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
            transition: "all 0.2s ease",
          }}
          title="Ses Aç/Kapat"
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} color="#f87171" />}
        </button>

        <button
          onClick={handleClose}
          style={{
            background: "rgba(239, 68, 68, 0.2)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#fca5a5",
            borderRadius: "50%",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
            transition: "all 0.2s ease",
          }}
          title="Kapat (ESC)"
        >
          <X size={22} />
        </button>
      </div>

      {/* Main Circular Timer Display */}
      <div style={{ position: "relative", width: "340px", height: "340px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="340" height="340" style={{ transform: "rotate(-90deg)" }}>
          {/* Track Circle */}
          <circle
            cx="170"
            cy="170"
            r="140"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Animated Progress Circle */}
          <circle
            cx="170"
            cy="170"
            r="140"
            stroke={isFinished ? "#f87171" : "#38bdf8"}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray="880"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
          />
        </svg>

        {/* Digital Time Center Text */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "72px",
              fontWeight: 800,
              letterSpacing: "2px",
              fontVariantNumeric: "tabular-nums",
              color: isFinished ? "#f87171" : "#ffffff",
              textShadow: isFinished
                ? "0 0 30px rgba(248, 113, 113, 0.6)"
                : "0 0 30px rgba(56, 189, 248, 0.4)",
            }}
          >
            {formattedTime}
          </span>
          <span
            style={{
              fontSize: "14px",
              color: "rgba(255, 255, 255, 0.5)",
              fontWeight: 500,
              marginTop: "4px",
            }}
          >
            {isFinished ? "Süre Bitti!" : isRunning ? "Mola Devam Ediyor" : "Duraklatıldı"}
          </span>
        </div>
      </div>

      {/* Control Buttons & Hints */}
      <div
        style={{
          marginTop: "36px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <button
          onClick={() => setIsRunning((prev) => !prev)}
          style={{
            background: isRunning ? "rgba(234, 179, 8, 0.2)" : "rgba(34, 197, 94, 0.2)",
            border: `1px solid ${isRunning ? "rgba(234, 179, 8, 0.5)" : "rgba(34, 197, 94, 0.5)"}`,
            color: isRunning ? "#fef08a" : "#86efac",
            padding: "12px 28px",
            borderRadius: "30px",
            fontSize: "16px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
          }}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          {isRunning ? "Duraklat (Uzay)" : "Başlat"}
        </button>

        <button
          onClick={() => {
            setTimeLeft(totalSeconds);
            setIsRunning(true);
            setIsFinished(false);
          }}
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: "30px",
            fontSize: "16px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <RotateCcw size={18} />
          Sıfırla
        </button>
      </div>

      {/* Help Hint Banner */}
      <div
        style={{
          position: "absolute",
          bottom: "28px",
          fontSize: "13px",
          color: "rgba(255, 255, 255, 0.4)",
          display: "flex",
          gap: "16px",
        }}
      >
        <span>💡 <b>Fare Tekerleği / Ok Tuşları:</b> Süre Ayarla (+/- 1 dk)</span>
        <span><b>Shift + Ok:</b> (+/- 5 dk)</span>
        <span><b>ESC:</b> Kapat</span>
      </div>
    </div>
  );
}
