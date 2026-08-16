import { useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { translations, getLanguage } from "../i18n";

export default function LiveZoomCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(2.0);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  const [panPos, setPanPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [badgeOpacity, setBadgeOpacity] = useState<number>(1.0);

  const lang = getLanguage();
  const t = (translations[lang] || translations.tr) as any;

  // Auto-hide top badge after 3 seconds of inactivity
  useEffect(() => {
    setBadgeOpacity(1.0);
    const timer = setTimeout(() => {
      setBadgeOpacity(0.25);
    }, 3000);
    return () => clearTimeout(timer);
  }, [panPos, zoomLevel]);

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.hide();
    } catch (e) {
      console.error("Failed to hide live zoom window:", e);
      try {
        await invoke("hide_zoom_window");
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Load screenshot on mount & listen for live-zoom-captured event
  useEffect(() => {
    const fetchScreenshot = async (cx = 0.5, cy = 0.5) => {
      try {
        setImgElement(null);
        const base64Data = await invoke<string>("get_last_screenshot");
        const src = `data:image/png;base64,${base64Data}`;
        const img = new Image();
        img.src = src;
        img.onload = () => {
          setImgElement(img);
          setPanPos({ x: cx, y: cy });
        };
      } catch (e) {
        console.error("Failed to load screenshot for Live Zoom Canvas:", e);
      }
    };

    fetchScreenshot();

    const unlisten = listen<{ cursor_x?: number; cursor_y?: number }>("live-zoom-captured", (event) => {
      const startX = event.payload?.cursor_x ?? 0.5;
      const startY = event.payload?.cursor_y ?? 0.5;
      fetchScreenshot(startX, startY);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Handle Mouse Wheel Zoom In / Out
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setZoomLevel((prev) => Math.min(5.0, Math.max(1.25, Number((prev + delta).toFixed(2)))));
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, []);

  // Handle Keyboard Shortcuts (Arrow Keys Zoom, ESC / Ctrl+4 Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setZoomLevel((prev) => Math.min(5.0, Number((prev + 0.25).toFixed(2))));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setZoomLevel((prev) => Math.max(1.25, Number((prev - 0.25).toFixed(2))));
      } else if (e.key === "Escape" || (e.ctrlKey && e.key === "4")) {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Track Mouse Movement for Real-Time Pan
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const w = window.innerWidth;
    const h = window.innerHeight;
    setPanPos({
      x: Math.min(1.0, Math.max(0.0, clientX / w)),
      y: Math.min(1.0, Math.max(0.0, clientY / h)),
    });
  };

  // High-DPI Crisp Nearest-Neighbor Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = screenW * dpr;
    canvas.height = screenH * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 100% Crisp Pixel-Perfect Sharpness (Identical to Static Zoom)
    ctx.imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;
    (ctx as any).msImageSmoothingEnabled = false;

    ctx.clearRect(0, 0, screenW, screenH);

    // Calculate source rect centered around panPos
    const srcW = imgElement.naturalWidth / zoomLevel;
    const srcH = imgElement.naturalHeight / zoomLevel;

    const maxSrcX = imgElement.naturalWidth - srcW;
    const maxSrcY = imgElement.naturalHeight - srcH;

    const srcX = Math.max(0, Math.min(maxSrcX, panPos.x * imgElement.naturalWidth - srcW / 2));
    const srcY = Math.max(0, Math.min(maxSrcY, panPos.y * imgElement.naturalHeight - srcH / 2));

    ctx.drawImage(
      imgElement,
      srcX, srcY, srcW, srcH,
      0, 0, screenW, screenH
    );

    // Top-Left Floating Badge Indicator
    ctx.save();
    ctx.globalAlpha = badgeOpacity;
    ctx.font = "bold 13px Inter, system-ui, sans-serif";
    const badgeText = `Zoom: ${zoomLevel.toFixed(1)}x | ${t.zoomBadgeLiveModeOnly || "Canlı Zoom [Fareyi Takip Eder | ESC: Çık]"}`;
    const textWidth = ctx.measureText(badgeText).width;

    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.beginPath();
    ctx.roundRect(16, 16, textWidth + 32, 34, 8);
    ctx.fill();

    ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#38bdf8";
    ctx.fillText(badgeText, 32, 38);

    ctx.restore();
    ctx.restore();
  }, [imgElement, zoomLevel, panPos, badgeOpacity, t]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000",
        overflow: "hidden",
        position: "relative",
        cursor: "crosshair",
        userSelect: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100vw",
          height: "100vh",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
