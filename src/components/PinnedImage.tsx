import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { X } from "lucide-react";

export default function PinnedImage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    invoke<string>("get_pinned_image")
      .then(async (base64) => {
        setImageSrc(`data:image/png;base64,${base64}`);
        const win = getCurrentWindow();
        await win.show();
      })
      .catch((err) => {
        console.error("Failed to fetch pinned image:", err);
      });
  }, []);

  const closeWindow = async (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await invoke("close_pinned");
    } catch (err) {
      console.error("Failed to close window", err);
    }
  };

  const startDrag = async (e: React.MouseEvent | React.PointerEvent) => {
    if (e.button === 0) { // Left click
      try {
        await invoke("start_drag");
      } catch (err) {
        console.error("Failed to start dragging", err);
      }
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "transparent",
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {imageSrc && (
        <div style={{
          width: "calc(100% - 8px)",
          height: "calc(100% - 8px)",
          margin: "4px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          border: "2px solid rgba(0, 242, 254, 0.8)",
          borderRadius: "6px",
          overflow: "hidden",
          background: "transparent",
        }}
        >
          <img
            src={imageSrc}
            style={{ width: "100%", height: "100%", objectFit: "fill", cursor: "move", userSelect: "none", WebkitUserDrag: "none" }}
            alt="Pinned"
            onPointerDown={startDrag}
          />
        </div>
      )}

      {isHovering && (
        <button
          onPointerDown={closeWindow}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "rgba(239, 68, 68, 0.9)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "white",
            borderRadius: "50%",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 9999,
            boxShadow: "0 2px 10px rgba(0,0,0,0.5)"
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
