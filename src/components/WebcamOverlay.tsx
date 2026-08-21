import { useRef, useState, useEffect } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";

const activeStreams = new Set<MediaStream>();

export default function WebcamOverlay() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const [started, setStarted] = useState(false);
  const isStartingRef = useRef(false);
  
  useEffect(() => {
    async function startCam() {
      if (isStartingRef.current) return;
      isStartingRef.current = true;
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
      } catch (e) {
        console.error("Camera error:", e);
        setHasError(true);
      } finally {
        isStartingRef.current = false;
      }
    }

    function stopCam() {
      isStartingRef.current = false; // Cancel any pending start
      
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

  const handleWheel = async (e: React.WheelEvent) => {
    try {
      const win = getCurrentWindow();
      const factor = await win.scaleFactor();
      const physicalSize = await win.innerSize();
      const currentSize = physicalSize.width / factor;
      
      let newSize = currentSize;
      if (e.deltaY < 0) {
        newSize += 30; // scroll up -> bigger
      } else {
        newSize -= 30; // scroll down -> smaller
      }
      
      newSize = Math.max(120, Math.min(800, newSize));
      await win.setSize(new LogicalSize(newSize, newSize));
    } catch (err) {
      console.error("Resize error", err);
    }
  };

  return (
    <div 
      onWheel={handleWheel}
      onPointerDown={(e) => {
        if (e.button === 0) {
          getCurrentWindow().startDragging().catch(console.error);
        }
      }}
      data-tauri-drag-region
      style={{
        width: "100vw",
        height: "100vh",
        borderRadius: "50%",
        overflow: "hidden",
        border: "3px solid #38bdf8",
        boxSizing: "border-box",
        background: "rgba(15, 23, 42, 0.95)",
        boxShadow: "0 0 15px rgba(56, 189, 248, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        cursor: "move",
        WebkitAppRegion: "drag",
        userSelect: "none"
      }}
    >
      <video 
        ref={videoRef}
        data-tauri-drag-region
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)",
          borderRadius: "50%",
          display: (started && !hasError) ? "block" : "none",
          pointerEvents: "none"
        }}
      />
      {!started && (
        <div 
          style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "bold", textAlign: "center", pointerEvents: "none" }}
        >
          Kamera Kapalı
        </div>
      )}
      {started && hasError && (
        <div 
          style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", fontSize: 14, fontWeight: "bold", textAlign: "center", pointerEvents: "none" }}
        >
          Kamera<br/>Bulunamadı
        </div>
      )}
    </div>
  );
}
