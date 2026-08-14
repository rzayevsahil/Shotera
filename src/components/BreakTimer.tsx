import { useEffect, useState, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Play, Pause, RotateCcw, X, Volume2, VolumeX } from "lucide-react";
import { translations, getLanguage, Language } from "../i18n";

import { playTimerSound } from "../utils/audio";

export default function BreakTimer() {
  const [lang, setLang] = useState<Language>(getLanguage());
  const [totalSeconds, setTotalSeconds] = useState<number>(() => {
    return Number(localStorage.getItem("timerDefaultDuration") || "600");
  });
  const [timerDirection, setTimerDirection] = useState<"down" | "up">(() => {
    return (localStorage.getItem("timerCountDirection") as "down" | "up") || "down";
  });
  const [currentSeconds, setCurrentSeconds] = useState<number>(() => {
    const dir = (localStorage.getItem("timerCountDirection") as "down" | "up") || "down";
    const total = Number(localStorage.getItem("timerDefaultDuration") || "600");
    return dir === "down" ? total : 0;
  });
  const [timerRingColor, setTimerRingColor] = useState<string>(() => localStorage.getItem("timerRingColor") || "#38bdf8");
  const [timerBgStyle, setTimerBgStyle] = useState<string>(() => localStorage.getItem("timerBgStyle") || "dark-slate");
  const [timerFontStyle, setTimerFontStyle] = useState<string>(() => localStorage.getItem("timerFontStyle") || "sans");
  const [timerSoundPreset, setTimerSoundPreset] = useState<string>(() => localStorage.getItem("timerSoundPreset") || "chime");

  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const updateLang = () => setLang(getLanguage());
    window.addEventListener("storage", updateLang);
    window.addEventListener("focus", updateLang);
    return () => {
      window.removeEventListener("storage", updateLang);
      window.removeEventListener("focus", updateLang);
    };
  }, []);

  // Sync settings when storage updates or window is opened
  useEffect(() => {
    const applySettings = (isTriggerEvent: boolean) => {
      const mode = localStorage.getItem("timerResetMode") || "reset";
      const defaultDuration = Number(localStorage.getItem("timerDefaultDuration") || "600");
      const dir = (localStorage.getItem("timerCountDirection") as "down" | "up") || "down";

      setTotalSeconds(defaultDuration);
      setTimerDirection(dir);
      setTimerRingColor(localStorage.getItem("timerRingColor") || "#38bdf8");
      setTimerBgStyle(localStorage.getItem("timerBgStyle") || "dark-slate");
      setTimerFontStyle(localStorage.getItem("timerFontStyle") || "sans");
      setTimerSoundPreset(localStorage.getItem("timerSoundPreset") || "chime");

      if (isTriggerEvent) {
        if (mode === "reset") {
          setCurrentSeconds(dir === "down" ? defaultDuration : 0);
          setIsRunning(true);
          setIsFinished(false);
        }
      }
    };

    const handleTrigger = () => {
      applySettings(true);
    };

    const handleStorage = () => {
      applySettings(false);
    };

    const unlistenPromise = listen("timer-opened", handleTrigger);
    window.addEventListener("storage", handleStorage);

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const t = translations[lang] || translations.tr;

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

  // Play audio chime when timer finishes
  const playAlarm = () => {
    if (!soundEnabled) return;
    playTimerSound(timerSoundPreset);
  };

  // Tick timer every second based on direction
  useEffect(() => {
    if (isRunning && !isFinished) {
      timerRef.current = setInterval(() => {
        setCurrentSeconds((prev) => {
          if (timerDirection === "down") {
            if (prev <= 1) {
              setIsRunning(false);
              setIsFinished(true);
              playAlarm();
              return 0;
            }
            return prev - 1;
          } else {
            // Count UP mode (0 -> totalSeconds)
            if (prev >= totalSeconds - 1) {
              setIsRunning(false);
              setIsFinished(true);
              playAlarm();
              return totalSeconds;
            }
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isFinished, timerDirection, totalSeconds, soundEnabled]);

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
          if (timerDirection === "down") {
            setCurrentSeconds((cur) => cur + addSecs);
          }
          return next;
        });
        setIsFinished(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const subSecs = e.shiftKey ? 300 : 60;
        setTotalSeconds((prev) => {
          const next = Math.max(60, prev - subSecs);
          if (timerDirection === "down") {
            setCurrentSeconds((cur) => Math.max(0, cur - subSecs));
          }
          return next;
        });
        setIsFinished(false);
      } else if (e.key.toLowerCase() === "r") {
        setCurrentSeconds(timerDirection === "down" ? totalSeconds : 0);
        setIsRunning(true);
        setIsFinished(false);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const step = e.shiftKey ? 300 : 60;
      if (e.deltaY < 0) {
        setTotalSeconds((prev) => {
          const next = prev + step;
          if (timerDirection === "down") {
            setCurrentSeconds((cur) => cur + step);
          }
          return next;
        });
      } else if (e.deltaY > 0) {
        setTotalSeconds((prev) => {
          const next = Math.max(60, prev - step);
          if (timerDirection === "down") {
            setCurrentSeconds((cur) => Math.max(0, cur - step));
          }
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

  }, [totalSeconds, timerDirection]);

  const minutes = Math.floor(currentSeconds / 60);
  const seconds = currentSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progress = totalSeconds > 0
    ? (timerDirection === "down"
        ? ((totalSeconds - currentSeconds) / totalSeconds) * 100
        : (currentSeconds / totalSeconds) * 100)
    : 0;
  const strokeDashoffset = 880 - (880 * progress) / 100;

  const handleReset = () => {
    setCurrentSeconds(timerDirection === "down" ? totalSeconds : 0);
    setIsRunning(true);
    setIsFinished(false);
  };

  const backgroundStyleCSS =
    timerBgStyle === "oled-black"
      ? "#000000"
      : timerBgStyle === "frosted-dark"
      ? "rgba(15, 23, 42, 0.95)"
      : timerBgStyle === "pomodoro-red"
      ? "radial-gradient(circle at center, #450a0a 0%, #09090b 100%)"
      : "radial-gradient(circle at center, #0f172a 0%, #020617 100%)";

  const fontFamilyCSS =
    timerFontStyle === "heading"
      ? "'Outfit', -apple-system, sans-serif"
      : timerFontStyle === "mono"
      ? "monospace"
      : "'Inter', -apple-system, sans-serif";

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: backgroundStyleCSS,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#ffffff",
        fontFamily: fontFamilyCSS,
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
          }}
          title={soundEnabled ? "Sesi Kapat" : "Sesi Aç"}
        >
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        <button
          onClick={handleClose}
          style={{
            background: "rgba(239, 68, 68, 0.2)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#f87171",
            borderRadius: "50%",
            width: "44px",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            backdropFilter: "blur(12px)",
          }}
          title="Kapat (ESC)"
        >
          <X size={20} />
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
            stroke={isFinished ? "#f87171" : timerRingColor}
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
              fontFamily: fontFamilyCSS,
              color: isFinished ? "#f87171" : "#ffffff",
              textShadow: isFinished
                ? "0 0 30px rgba(248, 113, 113, 0.6)"
                : `0 0 30px ${timerRingColor}80`,
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
            {isFinished
              ? (t.breakTimerFinished || "Süre Bitti!")
              : isRunning
              ? (timerDirection === "up" ? "0'dan İleriye Sayılıyor" : (t.shortcutBreakTimer || "Mola Devam Ediyor"))
              : "Duraklatıldı"}
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
          {isRunning ? "Duraklat (Space)" : "Başlat"}
        </button>

        <button
          onClick={handleReset}
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
        <span><b>ESC:</b> {t.actionClose || "Kapat (ESC)"}</span>
      </div>

    </div>
  );
}
