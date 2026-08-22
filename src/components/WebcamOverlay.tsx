import { useRef, useState, useEffect } from "react";
import { Camera } from "lucide-react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

const activeStreams = new Set<MediaStream>();

export default function WebcamOverlay() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [started, setStarted] = useState(false);
  const isStartingRef = useRef(false);
  const [permissionState, setPermissionState] = useState<"idle" | "prompt" | "requesting" | "denied">("idle");

  const executeGetUserMedia = async () => {
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
      try {
        const perm = await navigator.permissions.query({ name: "camera" as any });
        if (perm.state === "prompt") {
          setPermissionState("prompt");
          // Keep isStartingRef true to block concurrent starts, but we wait for user action
          return;
        } else if (perm.state === "denied") {
          setPermissionState("denied");
          setHasError(true);
          isStartingRef.current = false;
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
        alignItems: "center",
        justifyContent: "center",
        cursor: "move",
        userSelect: "none"
      }}
    >
      <div
        style={{
          width: "calc(100% - 80px)",
          height: "calc(100% - 80px)",
          borderRadius: "50%",
          border: "3px solid #38bdf8",
          boxSizing: "border-box",
          background: "rgba(15, 23, 42, 0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          clipPath: "circle(50% at 50% 50%)",
          WebkitClipPath: "circle(50% at 50% 50%)",
          transform: "translateZ(0)", // Force GPU layer lock
          position: "relative"
        }}
      >
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
        {!started && permissionState === "idle" && (
          <div
            style={{ position: "absolute", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "bold", textAlign: "center", pointerEvents: "none" }}
          >
            Kamera Kapalı
          </div>
        )}
        {permissionState === "prompt" && (
          <div style={{ position: "absolute", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.95)", zIndex: 10, textAlign: "center", padding: "10%" }}>
            <Camera size={28} color="#38bdf8" style={{ marginBottom: 10 }} />
            <span style={{ fontSize: "14px", fontWeight: "bold", marginBottom: 4 }}>İzin Gerekli</span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", marginBottom: 14, lineHeight: 1.2 }}>Shotera'nın kameraya<br />erişimi gerekiyor</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onMouseDown={(e) => { e.stopPropagation(); setPermissionState("requesting"); executeGetUserMedia(); }} style={{ background: "#38bdf8", border: "none", color: "#000", padding: "6px 14px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", fontSize: "11px", boxShadow: "0 0 10px rgba(56,189,248,0.4)" }}>Evet</button>
              <button onMouseDown={(e) => { e.stopPropagation(); setPermissionState("idle"); isStartingRef.current = false; }} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer", fontSize: "11px" }}>Hayır</button>
            </div>
          </div>
        )}
        {permissionState === "requesting" && (
          <div style={{ position: "absolute", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.95)", zIndex: 10, textAlign: "center", padding: "10%" }}>
            <div className="recording-indicator" style={{ width: 14, height: 14, marginBottom: 12, animation: "pulse-recording 1s infinite", background: "#38bdf8", boxShadow: "0 0 8px #38bdf8" }}></div>
            <span style={{ fontSize: "11px", fontWeight: "bold", lineHeight: 1.3 }}>Ekrana gelen<br />uyarıdan izin verin</span>
          </div>
        )}
        {started && hasError && permissionState !== "denied" && (
          <div
            style={{ position: "absolute", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontSize: 14, fontWeight: "bold", textAlign: "center", pointerEvents: "none" }}
          >
            Kamera<br />Bulunamadı
          </div>
        )}
        {permissionState === "denied" && (
          <div
            style={{ position: "absolute", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontSize: 13, fontWeight: "bold", textAlign: "center", pointerEvents: "none" }}
          >
            Erişim<br />Reddedildi
          </div>
        )}
      </div>
    </div>
  );
}
