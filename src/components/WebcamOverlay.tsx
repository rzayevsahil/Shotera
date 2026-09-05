import { useRef, useState, useEffect } from "react";
import { Camera } from "lucide-react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { convertFileSrc } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { translations, getLanguage, Language } from "../i18n";

const activeStreams = new Set<MediaStream>();

export default function WebcamOverlay() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [started, setStarted] = useState(false);
  const isStartingRef = useRef(false);
  const [permissionState, setPermissionState] = useState<"idle" | "prompt" | "requesting" | "denied">("idle");
  const [lang, setLang] = useState<Language>(getLanguage);
  const t = translations[lang];
  const [borderColor, setBorderColor] = useState(() => localStorage.getItem("webcamBorderColor") || "#38bdf8");
  const [webcamText, setWebcamText] = useState(() => localStorage.getItem("webcamText") || "");
  const [webcamTextColor, setWebcamTextColor] = useState(() => localStorage.getItem("webcamTextColor") || "#ffffff");
  const [webcamTextFont, setWebcamTextFont] = useState(() => localStorage.getItem("webcamTextFont") || "sans");
  const [webcamTextSize, setWebcamTextSize] = useState(() => Number(localStorage.getItem("webcamTextSize") || "11"));
  const [webcamTextAnimation, setWebcamTextAnimation] = useState(() => localStorage.getItem("webcamTextAnimation") || "solid");
  const [webcamBorderAnimation, setWebcamBorderAnimation] = useState(() => localStorage.getItem("webcamBorderAnimation") || "solid");
  const [webcamMode, setWebcamMode] = useState(() => localStorage.getItem("webcamMode") || "camera");
  const [webcamImagePath, setWebcamImagePath] = useState(() => localStorage.getItem("webcamImagePath") || "");
  const [webcamTextBgColor, setWebcamTextBgColor] = useState(() => localStorage.getItem("webcamTextBgColor") || "#000000");
  const [webcamTextBgOpacity, setWebcamTextBgOpacity] = useState(() => Number(localStorage.getItem("webcamTextBgOpacity") || "60"));

  useEffect(() => {
    // Listen for language changes from localStorage
    const handleStorageChange = () => {
      setLang(getLanguage());
      setBorderColor(localStorage.getItem("webcamBorderColor") || "#38bdf8");
      setWebcamText(localStorage.getItem("webcamText") || "");
      setWebcamTextColor(localStorage.getItem("webcamTextColor") || "#ffffff");
      setWebcamTextFont(localStorage.getItem("webcamTextFont") || "sans");
      setWebcamTextSize(Number(localStorage.getItem("webcamTextSize") || "11"));
      setWebcamTextAnimation(localStorage.getItem("webcamTextAnimation") || "solid");
      setWebcamBorderAnimation(localStorage.getItem("webcamBorderAnimation") || "solid");
      setWebcamMode(localStorage.getItem("webcamMode") || "camera");
      setWebcamImagePath(localStorage.getItem("webcamImagePath") || "");
      setWebcamTextBgColor(localStorage.getItem("webcamTextBgColor") || "#000000");
      setWebcamTextBgOpacity(Number(localStorage.getItem("webcamTextBgOpacity") || "60"));
    };
    window.addEventListener("storage", handleStorageChange);

    // Check initially in case it changed before component mounted
    setLang(getLanguage());

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const executeGetUserMedia = async () => {
    localStorage.setItem("webcamHasAllowed", "true");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } }
      });
      activeStreams.add(stream);

      // In case stopCam was called while we were waiting for the camera
      if (!isStartingRef.current) {
        stream.getTracks().forEach(track => track.stop());
        activeStreams.delete(stream);
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStarted(true);
      setHasError(false);
      setPermissionState("idle");
    } catch (e) {
      console.error("Camera error:", e);
      setHasError(true);
      setPermissionState("denied");
    } finally {
      isStartingRef.current = false;
    }
  };

  useEffect(() => {
    async function startCam() {
      if (isStartingRef.current) return;
      isStartingRef.current = true;

      const currentMode = localStorage.getItem("webcamMode") || "camera";
      if (currentMode === "image") {
        setStarted(true);
        setHasError(false);
        setPermissionState("idle");
        isStartingRef.current = false;
        return;
      }

      try {
        const mode = localStorage.getItem("webcamPermissionMode") || "once";
        const hasAllowed = localStorage.getItem("webcamHasAllowed") === "true";
        const perm = await navigator.permissions.query({ name: "camera" as any });

        if (perm.state === "denied") {
          setPermissionState("denied");
          setHasError(true);
          isStartingRef.current = false;
          return;
        }

        if (mode === "always") {
          setPermissionState("prompt");
          return;
        }

        if (perm.state === "prompt") {
          if (mode === "once" && hasAllowed) {
            setPermissionState("requesting");
            executeGetUserMedia();
            return;
          } else {
            setPermissionState("prompt");
            return;
          }
        } else {
          // Granted state, just execute
          setPermissionState("requesting");
          executeGetUserMedia();
          return;
        }
      } catch (e) {
        // Fallback if permissions API fails
      }

      await executeGetUserMedia();
    }

    function stopCam() {
      isStartingRef.current = false; // Cancel any pending start
      setPermissionState("idle");

      activeStreams.forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      });
      activeStreams.clear();

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setStarted(false);
    }

    const unlistenPromises: Promise<() => void>[] = [];

    import("@tauri-apps/api/event").then(({ listen }) => {
      unlistenPromises.push(listen("start-camera", () => startCam()));
      unlistenPromises.push(listen("stop-camera", () => stopCam()));
    });

    return () => {
      stopCam();
      unlistenPromises.forEach(p => p.then(unlisten => unlisten()));
    };
  }, []);

  useEffect(() => {
    const el = document.getElementById("webcam-container");
    if (!el) return;

    const handleDrag = (e: MouseEvent) => {
      if (e.button === 0) {
        getCurrentWindow().startDragging().catch(console.error);
      }
    };

    el.addEventListener("mousedown", handleDrag);

    return () => {
      el.removeEventListener("mousedown", handleDrag);
    };
  }, []);

  const handleWheel = async (e: React.WheelEvent) => {
    try {
      const win = getCurrentWindow();
      const factor = await win.scaleFactor();
      const physicalSize = await win.innerSize();
      const currentLogical = physicalSize.width / factor;

      let newSize = currentLogical;
      if (e.deltaY < 0) {
        newSize += 20; // Reduced step for smoother scaling
      } else {
        newSize -= 20;
      }

      newSize = Math.max(160, Math.min(800, newSize)); // Increased min size to account for padding
      await win.setSize(new LogicalSize(newSize, newSize));
    } catch (err: any) {
      console.error("Tekerlek Hatası:", err);
    }
  };

  return (
    <div
      id="webcam-container"
      onWheel={handleWheel}
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "10px",
        boxSizing: "border-box",
        cursor: "move",
        userSelect: "none"
      }}
    >
      <style>
        {`
          .webcam-border-bg {
             position: absolute;
             inset: 0;
             border-radius: 50%;
             transition: all 0.3s ease;
          }
          .webcam-border-solid { background: ${borderColor}; }
          .webcam-border-pulse { background: ${borderColor}; animation: pulse-border 2s infinite ease-in-out; }
          .webcam-border-breathe { background: ${borderColor}; animation: breathe-border 3s infinite ease-in-out; }
          .webcam-border-spin-rainbow { background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red); animation: spin-border 3s linear infinite; }
          .webcam-border-spin-ocean { background: conic-gradient(#0ea5e9, #38bdf8, #0284c7, #0ea5e9); animation: spin-border 3s linear infinite; }
          .webcam-border-spin-fire { background: conic-gradient(#ef4444, #f97316, #eab308, #ef4444); animation: spin-border 2s linear infinite; }
          .webcam-border-spin-cyber { background: conic-gradient(#ec4899, #a855f7, #06b6d4, #ec4899); animation: spin-border 2.5s linear infinite; }
          
          @keyframes spin-border { 100% { transform: rotate(360deg); } }
          @keyframes pulse-border { 0%, 100% { box-shadow: 0 0 10px ${borderColor}; } 50% { box-shadow: 0 0 30px ${borderColor}; } }
          @keyframes breathe-border { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          
          .webcam-text-anim-solid { color: ${webcamTextColor}; }
          .webcam-text-anim-pulse { color: ${webcamTextColor}; animation: pulse-text 2s infinite ease-in-out; }
          .webcam-text-anim-breathe { color: ${webcamTextColor}; animation: breathe-border 3s infinite ease-in-out; }
          .webcam-text-anim-spin-rainbow { background: linear-gradient(90deg, red, yellow, lime, aqua, blue, magenta, red); background-size: 200% auto; color: transparent; -webkit-background-clip: text; animation: text-gradient-spin 3s linear infinite; }
          .webcam-text-anim-spin-ocean { background: linear-gradient(90deg, #0ea5e9, #38bdf8, #0284c7, #0ea5e9); background-size: 200% auto; color: transparent; -webkit-background-clip: text; animation: text-gradient-spin 3s linear infinite; }
          .webcam-text-anim-spin-fire { background: linear-gradient(90deg, #ef4444, #f97316, #eab308, #ef4444); background-size: 200% auto; color: transparent; -webkit-background-clip: text; animation: text-gradient-spin 2s linear infinite; }
          .webcam-text-anim-spin-cyber { background: linear-gradient(90deg, #ec4899, #a855f7, #06b6d4, #ec4899); background-size: 200% auto; color: transparent; -webkit-background-clip: text; animation: text-gradient-spin 2.5s linear infinite; }
          
          @keyframes text-gradient-spin { to { background-position: 200% center; } }
          @keyframes pulse-text { 0%, 100% { text-shadow: 0 0 2px ${webcamTextColor}; } 50% { text-shadow: 0 0 10px ${webcamTextColor}; } }
        `}
      </style>
      <div
        style={{
          flex: "0 1 auto",
          height: "calc(100vh - 80px)",
          minHeight: 0,
          aspectRatio: "1 / 1",
          borderRadius: "50%",
          padding: "3px",
          boxSizing: "border-box",
          position: "relative",
          boxShadow: webcamBorderAnimation === 'solid' ? `0 0 20px ${borderColor}40` : 'none',
          transition: "all 0.3s ease"
        }}
      >
        <div className={`webcam-border-bg webcam-border-${webcamBorderAnimation}`}></div>
        <div style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          background: "rgba(15, 23, 42, 0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          clipPath: "circle(50% at 50% 50%)",
          WebkitClipPath: "circle(50% at 50% 50%)",
          transform: "translateZ(0)", // Force GPU layer lock
          position: "relative",
          overflow: "hidden",
          zIndex: 1
        }}>
          {webcamMode === "image" ? (
            webcamImagePath ? (
              <img
                src={convertFileSrc(webcamImagePath)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "translateZ(0)",
                  borderRadius: "50%",
                  clipPath: "circle(50% at 50% 50%)",
                  WebkitClipPath: "circle(50% at 50% 50%)",
                  display: (started && !hasError) ? "block" : "none",
                  pointerEvents: "none"
                }}
                alt=""
              />
            ) : (
              <div style={{
                width: "100%",
                height: "100%",
                display: (started && !hasError) ? "flex" : "none",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(15, 23, 42, 0.95)",
                borderRadius: "50%",
                pointerEvents: "none"
              }}>
                <Camera size={56} color={borderColor} style={{ opacity: 0.8 }} />
              </div>
            )
          ) : (
            <video
              ref={videoRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: "scaleX(-1) translateZ(0)", // Maintain mirror + GPU layer lock
                borderRadius: "50%",
                clipPath: "circle(50% at 50% 50%)", // Force circular mask at GPU level
                WebkitClipPath: "circle(50% at 50% 50%)", // Safari/Webkit fallback
                display: (started && !hasError) ? "block" : "none",
                pointerEvents: "none"
              }}
            />
          )}
          {!started && permissionState === "idle" && !isStartingRef.current && (
            <div
              style={{ position: "absolute", inset: 0, borderRadius: "50%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "bold", textAlign: "center", pointerEvents: "none" }}
            >
              {t.webcamOff}
            </div>
          )}
          {permissionState === "prompt" && (
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.95)", zIndex: 10, textAlign: "center", padding: "10px" }}>
              <Camera size={28} color={borderColor} style={{ marginBottom: 10 }} />
              <span style={{ fontSize: "14px", fontWeight: "bold", marginBottom: 4 }}>{t.webcamPermissionRequired}</span>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", marginBottom: 14, lineHeight: 1.2, whiteSpace: "pre-line" }}>{t.webcamPermissionDesc}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onMouseDown={(e) => { e.stopPropagation(); isStartingRef.current = true; setPermissionState("requesting"); setTimeout(() => executeGetUserMedia(), 250); }} style={{ background: borderColor, border: "none", color: "#000", padding: "6px 14px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", fontSize: "11px", boxShadow: `0 0 10px ${borderColor}` }}>{t.webcamYes}</button>
                <button onMouseDown={(e) => { e.stopPropagation(); setPermissionState("denied"); isStartingRef.current = false; emit("webcam-permission-denied"); setTimeout(() => { getCurrentWindow().hide().catch(console.error); }, 1000); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", fontSize: "11px" }}>{t.webcamNo}</button>
              </div>
            </div>
          )}
          {permissionState === "requesting" && (
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.95)", zIndex: 10, textAlign: "center", padding: "10px" }}>
              <div className="recording-indicator" style={{ width: 14, height: 14, marginBottom: 12, animation: "pulse-recording 1s infinite", background: borderColor, boxShadow: `0 0 8px ${borderColor}` }}></div>
              <span style={{ fontSize: "11px", fontWeight: "bold", lineHeight: 1.3, whiteSpace: "pre-line" }}>{t.webcamStarting}</span>
            </div>
          )}
          {started && hasError && permissionState !== "denied" && (
            <div
              style={{ position: "absolute", inset: 0, borderRadius: "50%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontSize: 14, fontWeight: "bold", textAlign: "center", pointerEvents: "none", whiteSpace: "pre-line", padding: "10px" }}
            >
              {t.webcamNotFound}
            </div>
          )}
          {permissionState === "denied" && (
            <div
              style={{ position: "absolute", inset: 0, borderRadius: "50%", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontSize: 13, fontWeight: "bold", textAlign: "center", pointerEvents: "none", whiteSpace: "pre-line", padding: "10px" }}
            >
              {t.webcamAccessDenied}
            </div>
          )}
        </div>
      </div>
      {webcamText.trim() && (
        <div style={{
          backgroundColor: `${webcamTextBgColor}${Math.round((webcamTextBgOpacity / 100) * 255).toString(16).padStart(2, '0')}`,
          padding: "2px 8px",
          borderRadius: "12px",
          maxWidth: "100%",
          display: "flex",
          pointerEvents: "none",
          flexShrink: 0
        }}>
          <span className={`webcam-text-anim-${webcamTextAnimation}`} style={{
            fontFamily: webcamTextFont === "sans" ? "sans-serif" : webcamTextFont === "serif" ? "serif" : webcamTextFont === "monospace" ? "monospace" : webcamTextFont,
            fontSize: `${webcamTextSize}px`,
            fontWeight: "bold",
            textShadow: webcamTextAnimation.startsWith("spin-") ? "none" : (webcamTextAnimation === "pulse" ? undefined : "0 1px 3px rgba(0,0,0,0.8)"),
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "center",
            display: "block",
            width: "100%"
          }}>
            {webcamText}
          </span>
        </div>
      )}
    </div>
  );
}
