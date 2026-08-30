import { useEffect, useState, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Play, Pause, RotateCcw, X, Volume2, VolumeX } from "lucide-react";
import { translations, getLanguage, Language } from "../i18n";

import { playTimerSound } from "../utils/audio";

function resolveImageSrc(src: string | null | undefined): string {
  if (!src) return "";
  const trimmed = src.trim();
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("http:") ||
    trimmed.startsWith("https:") ||
    trimmed.startsWith("asset:")
  ) {
    return trimmed;
  }
  try {
    return convertFileSrc(trimmed);
  } catch {
    return trimmed;
  }
}

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
  const [timerBgColor, setTimerBgColor] = useState<string>(() => localStorage.getItem("timerBgColor") || "#0f172a");
  const [timerFontStyle, setTimerFontStyle] = useState<string>(() => localStorage.getItem("timerFontStyle") || "sans");
  const [timerSoundPreset, setTimerSoundPreset] = useState<string>(() => localStorage.getItem("timerSoundPreset") || "chime");
  const [timerSoundRepeat, setTimerSoundRepeat] = useState<string>(() => localStorage.getItem("timerSoundRepeat") || "1");

  const [showElapsedAfter, setShowElapsedAfter] = useState<boolean>(() => localStorage.getItem("timerShowElapsedAfterExpiration") === "true");
  const [lockOnStart, setLockOnStart] = useState<boolean>(() => localStorage.getItem("timerLockWorkstationOnStart") === "true");
  const [timerOpacity, setTimerOpacity] = useState<number>(() => Number(localStorage.getItem("timerOpacity") || "100") / 100);
  const [timerPosition, setTimerPosition] = useState<string>(() => localStorage.getItem("timerPosition") || "center");

  const [timerBgMode, setTimerBgMode] = useState<"color" | "desktop" | "image">(() => {
    return (localStorage.getItem("timerBgMode") as "color" | "desktop" | "image") || "color";
  });
  const [timerBgCustomImage, setTimerBgCustomImage] = useState<string>(() => {
    return localStorage.getItem("timerBgCustomImage") || "";
  });
  const [timerBgScale, setTimerBgScale] = useState<boolean>(() => {
    const saved = localStorage.getItem("timerBgScale");
    return saved !== null ? saved === "true" : true;
  });
  const [desktopBgSrc, setDesktopBgSrc] = useState<string | null>(null);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const [isOvertime, setIsOvertime] = useState<boolean>(false);
  const [overtimeSeconds, setOvertimeSeconds] = useState<number>(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };

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
      const defaultDuration = Number(localStorage.getItem("timerDefaultDuration") || "600");
      const dir = (localStorage.getItem("timerCountDirection") as "down" | "up") || "down";

      setTotalSeconds(defaultDuration);
      setTimerDirection(dir);
      setTimerRingColor(localStorage.getItem("timerRingColor") || "#38bdf8");
      setTimerBgStyle(localStorage.getItem("timerBgStyle") || "dark-slate");
      setTimerBgColor(localStorage.getItem("timerBgColor") || "#0f172a");
      setTimerFontStyle(localStorage.getItem("timerFontStyle") || "sans");
      setTimerSoundPreset(localStorage.getItem("timerSoundPreset") || "chime");
      setTimerSoundRepeat(localStorage.getItem("timerSoundRepeat") || "1");

      const shouldShowElapsed = localStorage.getItem("timerShowElapsedAfterExpiration") === "true";
      const shouldLock = localStorage.getItem("timerLockWorkstationOnStart") === "true";
      setShowElapsedAfter(shouldShowElapsed);
      setLockOnStart(shouldLock);
      setTimerOpacity(Number(localStorage.getItem("timerOpacity") || "100") / 100);
      setTimerPosition(localStorage.getItem("timerPosition") || "center");

      const bgMode = (localStorage.getItem("timerBgMode") as "color" | "desktop" | "image") || "color";
      const customImg = localStorage.getItem("timerBgCustomImage") || "";
      const bgScale = localStorage.getItem("timerBgScale") !== "false";

      setTimerBgMode(bgMode);
      setTimerBgCustomImage(resolveImageSrc(customImg));
      setTimerBgScale(bgScale);

      if (bgMode === "desktop") {
        invoke<string>("get_last_screenshot")
          .then((base64Data) => {
            if (base64Data) {
              setDesktopBgSrc(`data:image/png;base64,${base64Data}`);
            }
          })
          .catch((err) => console.error("Failed to fetch desktop screenshot for timer background:", err));
      }

      if (isTriggerEvent) {
        stopAlarm();
        setCurrentSeconds(dir === "down" ? defaultDuration : 0);
        setIsRunning(true);
        setIsFinished(false);
        setIsOvertime(false);
        setOvertimeSeconds(0);

        if (shouldLock) {
          invoke("lock_workstation").catch((err) => console.error("Failed to lock workstation:", err));
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
    const unlistenFocusPromise = listen("force-focus", () => {
      window.focus();
    });
    const unlistenSettingsPromise = listen("timer-settings-updated", () => {
      applySettings(false);
    });
    window.addEventListener("storage", handleStorage);

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
      unlistenFocusPromise.then((unlisten) => unlisten());
      unlistenSettingsPromise.then((unlisten) => unlisten());
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const t = translations[lang] || translations.tr;

  const handleClose = async () => {
    setIsRunning(false);
    setIsFinished(false);
    setIsOvertime(false);
    setOvertimeSeconds(0);
    stopAlarm();
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

  // Play audio chime when timer finishes (only if window is currently visible and sound enabled)
  const playAlarm = async () => {
    stopAlarm();
    if (!soundEnabled) return;

    const playOnce = async () => {
      try {
        const win = getCurrentWindow();
        const isVis = await win.isVisible();
        if (isVis) playTimerSound(timerSoundPreset);
      } catch {
        playTimerSound(timerSoundPreset);
      }
    };

    playOnce();

    if (timerSoundRepeat !== "1") {
      let count = 1;
      const maxCount = timerSoundRepeat === "3" ? 3 : Infinity;
      alarmIntervalRef.current = setInterval(() => {
        if (count >= maxCount) {
          stopAlarm();
        } else {
          playOnce();
          count++;
        }
      }, 3500); // 3.5 seconds between repeats
    }
  };

  // Tick timer every second based on direction
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (isOvertime) {
          setOvertimeSeconds((prev) => prev + 1);
        } else {
          setCurrentSeconds((prev) => {
            if (timerDirection === "down") {
              if (prev <= 1) {
                playAlarm();
                setIsFinished(true);
                if (showElapsedAfter) {
                  setIsOvertime(true);
                  setOvertimeSeconds(0);
                  return 0;
                } else {
                  setIsRunning(false);
                  return 0;
                }
              }
              return prev - 1;
            } else {
              // Count UP mode (0 -> totalSeconds)
              if (prev >= totalSeconds - 1) {
                playAlarm();
                setIsFinished(true);
                if (showElapsedAfter) {
                  setIsOvertime(true);
                  setOvertimeSeconds(0);
                  return totalSeconds;
                } else {
                  setIsRunning(false);
                  return totalSeconds;
                }
              }
              return prev + 1;
            }
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isOvertime, timerDirection, totalSeconds, soundEnabled, showElapsedAfter]);

  const timerDirectionRef = useRef(timerDirection);
  timerDirectionRef.current = timerDirection;
  const totalSecondsRef = useRef(totalSeconds);
  totalSecondsRef.current = totalSeconds;

  // Handle Keyboard & Scroll adjustments
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        setIsRunning((prev) => !prev);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        const step = e.shiftKey ? 300 : 60;
        setTotalSeconds((prev) => prev + step);
        setCurrentSeconds((cur) => (timerDirectionRef.current === "down" ? cur + step : cur));
        setIsFinished(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        const step = e.shiftKey ? 300 : 60;
        setTotalSeconds((prev) => Math.max(60, prev - step));
        setCurrentSeconds((cur) => (timerDirectionRef.current === "down" ? Math.max(0, cur - step) : cur));
        setIsFinished(false);
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        e.stopPropagation();
        handleReset();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const step = e.shiftKey ? 300 : 60;
      if (e.deltaY < 0) {
        setTotalSeconds((prev) => prev + step);
        setCurrentSeconds((cur) => (timerDirectionRef.current === "down" ? cur + step : cur));
      } else if (e.deltaY > 0) {
        setTotalSeconds((prev) => Math.max(60, prev - step));
        setCurrentSeconds((cur) => (timerDirectionRef.current === "down" ? Math.max(0, cur - step) : cur));
      }
      setIsFinished(false);
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel);
    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  const minutes = isOvertime ? Math.floor(overtimeSeconds / 60) : Math.floor(currentSeconds / 60);
  const seconds = isOvertime ? overtimeSeconds % 60 : currentSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progress = isOvertime
    ? 100
    : totalSeconds > 0
      ? (timerDirection === "down"
        ? ((totalSeconds - currentSeconds) / totalSeconds) * 100
        : (currentSeconds / totalSeconds) * 100)
      : 0;
  const strokeDashoffset = 880 - (880 * progress) / 100;

  const handleReset = () => {
    stopAlarm();
    setCurrentSeconds(timerDirection === "down" ? totalSeconds : 0);
    setIsRunning(true);
    setIsFinished(false);
    setIsOvertime(false);
    setOvertimeSeconds(0);
    if (lockOnStart) {
      invoke("lock_workstation").catch((err) => console.error("Failed to lock workstation:", err));
    }
  };

  const backgroundStyleCSS =
    timerBgStyle === "custom" || (timerBgColor && timerBgStyle !== "oled-black" && timerBgStyle !== "frosted-dark" && timerBgStyle !== "pomodoro-red" && timerBgStyle !== "dark-slate")
      ? (timerBgColor.startsWith("#") ? `radial-gradient(circle at center, ${timerBgColor} 0%, #020617 100%)` : timerBgColor)
      : timerBgStyle === "oled-black"
        ? "#000000"
        : timerBgStyle === "frosted-dark"
          ? "rgba(15, 23, 42, 0.95)"
          : timerBgStyle === "pomodoro-red"
            ? "radial-gradient(circle at center, #450a0a 0%, #09090b 100%)"
            : `radial-gradient(circle at center, ${timerBgColor || "#0f172a"} 0%, #020617 100%)`;

  const fontFamilyCSS =
    timerFontStyle === "heading"
      ? "'Outfit', -apple-system, sans-serif"
      : timerFontStyle === "mono"
        ? "monospace"
        : timerFontStyle === "segoe-light"
          ? "'Segoe UI Light', 'Segoe UI', -apple-system, sans-serif"
          : timerFontStyle === "orbitron"
            ? "'Orbitron', sans-serif"
            : timerFontStyle === "chakra"
              ? "'Chakra Petch', sans-serif"
              : timerFontStyle === "share-tech"
                ? "'Share Tech Mono', monospace"
                : timerFontStyle === "rajdhani"
                  ? "'Rajdhani', sans-serif"
                  : timerFontStyle === "dseg"
                    ? "'DSEG7-Modern', 'DSEG7-Classic', 'DS-Digital', 'Digital-7', monospace"
                    : "'Inter', -apple-system, sans-serif";

  const fontWeightCSS =
    timerFontStyle === "segoe-light"
      ? 300
      : timerFontStyle === "orbitron" || timerFontStyle === "chakra" || timerFontStyle === "rajdhani"
        ? 700
        : timerFontStyle === "dseg" || timerFontStyle === "share-tech"
          ? 400
          : 800;

  const getAlignmentStyle = (pos: string) => {
    switch (pos) {
      case "top-left":
        return { justifyContent: "flex-start", alignItems: "flex-start", padding: "40px" };
      case "top-center":
        return { justifyContent: "flex-start", alignItems: "center", paddingTop: "40px" };
      case "top-right":
        return { justifyContent: "flex-start", alignItems: "flex-end", padding: "40px" };
      case "center-left":
        return { justifyContent: "center", alignItems: "flex-start", paddingLeft: "40px" };
      case "center-right":
        return { justifyContent: "center", alignItems: "flex-end", paddingRight: "40px" };
      case "bottom-left":
        return { justifyContent: "flex-end", alignItems: "flex-start", padding: "40px" };
      case "bottom-center":
        return { justifyContent: "flex-end", alignItems: "center", paddingBottom: "40px" };
      case "bottom-right":
        return { justifyContent: "flex-end", alignItems: "flex-end", padding: "40px" };
      case "center":
      default:
        return { justifyContent: "center", alignItems: "center" };
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: timerBgMode === "color" ? backgroundStyleCSS : "#020617",
        display: "flex",
        flexDirection: "column",
        opacity: timerOpacity,
        userSelect: "none",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        ...getAlignmentStyle(timerPosition)
      }}
    >
      {/* Background Image Layer: Faded Desktop */}
      {timerBgMode === "desktop" && desktopBgSrc && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url("${desktopBgSrc}")`,
            backgroundSize: timerBgScale ? "cover" : "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            zIndex: 0,
          }}
        />
      )}

      {/* Background Image Layer: Custom Image File */}
      {timerBgMode === "image" && timerBgCustomImage && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url("${resolveImageSrc(timerBgCustomImage)}")`,
            backgroundSize: timerBgScale ? "cover" : "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            zIndex: 0,
          }}
        />
      )}

      {/* Dark Faded Overlay for Faded Desktop (Sharp & Darkened, No Blur) */}
      {timerBgMode === "desktop" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "radial-gradient(circle at center, rgba(9, 13, 22, 0.45) 0%, rgba(9, 13, 22, 0.7) 100%)",
            zIndex: 1,
          }}
        />
      )}

      {/* Subtle Dark Vignette for Custom Image (Sharp & No Blur) */}
      {timerBgMode === "image" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "radial-gradient(circle at center, rgba(9, 13, 22, 0.15) 0%, rgba(9, 13, 22, 0.45) 100%)",
            zIndex: 1,
          }}
        />
      )}
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
          title={soundEnabled ? ((t as any).timerMute || "Sesi Kapat") : ((t as any).timerUnmute || "Sesi Aç")}
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
          title={t.actionClose || "Kapat (ESC)"}
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Circular Timer Display */}
      <div style={{ position: "relative", width: "340px", height: "340px", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
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
              fontWeight: fontWeightCSS,
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
              color: isOvertime ? "#f87171" : "rgba(255, 255, 255, 0.5)",
              fontWeight: 600,
              marginTop: "4px",
            }}
          >
            {isOvertime
              ? ((t as any).timerOvertimeStatus || "Süre Aşıldı")
              : isFinished
                ? (t.breakTimerFinished || "Süre Bitti!")
                : isRunning
                  ? (timerDirection === "up" ? ((t as any).timerCountingUp || "0'dan İleriye Sayılıyor") : (t.shortcutBreakTimer || "Mola Devam Ediyor"))
                  : ((t as any).timerPaused || "Duraklatıldı")}
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
          zIndex: 10,
        }}
      >
        <button
          onClick={() => setIsRunning((prev) => !prev)}
          style={{
            background: isRunning ? "rgba(234, 179, 8, 0.25)" : "rgba(34, 197, 94, 0.25)",
            border: `1px solid ${isRunning ? "rgba(234, 179, 8, 0.6)" : "rgba(34, 197, 94, 0.6)"}`,
            color: isRunning ? "#fef08a" : "#86efac",
            padding: "12px 28px",
            borderRadius: "30px",
            fontSize: "16px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
            transition: "all 0.2s ease",
          }}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
          {isRunning ? ((t as any).timerPauseBtn || "Duraklat (Space)") : ((t as any).timerStartBtn || "Başlat")}
        </button>

        <button
          onClick={handleReset}
          style={{
            background: "rgba(15, 23, 42, 0.65)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#f8fafc",
            padding: "12px 24px",
            borderRadius: "30px",
            fontSize: "16px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.35)",
            transition: "all 0.2s ease",
          }}
        >
          <RotateCcw size={18} />
          {(t as any).timerResetBtn || "Sıfırla"}
        </button>
      </div>

      {/* Help Hint Banner */}
      <div
        style={{
          position: "absolute",
          bottom: "28px",
          fontSize: "13px",
          color: "rgba(255, 255, 255, 0.7)",
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          padding: "6px 16px",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          gap: "16px",
          zIndex: 10,
        }}
      >
        <span>💡 <b>{(t as any).timerHintWheel || "Fare Tekerleği / Ok Tuşları:"}</b> {(t as any).timerHintAdjust1 || "Süre Ayarla (+/- 1 dk)"}</span>
        <span><b>{(t as any).timerHintShiftOk || "Shift + Ok:"}</b> {(t as any).timerHintAdjust5 || "(+/- 5 dk)"}</span>
        <span><b>ESC:</b> {t.actionClose || "Kapat (ESC)"}</span>
      </div>

    </div>
  );
}
