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
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          border: isHovering ? "2px solid rgba(0, 242, 254, 0.9)" : "2px solid rgba(150, 150, 150, 0.5)",
          borderRadius: "6px",
          overflow: "hidden",
          background: "transparent",
        }}
        >
          <img
            src={imageSrc}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", cursor: "move", userSelect: "none" }}
            alt="Pinned"
            draggable={false}
            onPointerDown={startDrag}
          />
        </div>
      )}

      {isHovering && (
        <button
          className="pinned-close-btn"
          onPointerDown={closeWindow}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
