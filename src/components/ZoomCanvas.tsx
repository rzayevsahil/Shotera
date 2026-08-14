import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";

interface Shape {
  id: string;
  type: "pen" | "line" | "rect" | "ellipse" | "arrow" | "text";
  points?: { x: number; y: number }[];
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  text?: string;
  color: string;
  width: number;
}

export default function ZoomCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  // Zoom & Pan State
  const [zoomLevel, setZoomLevel] = useState<number>(2.0); // Default 2x magnification
  const [panPos, setPanPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 }); // Normalized (0 to 1)

  // Drawing & Board State
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);
  const [boardMode, setBoardMode] = useState<"normal" | "white" | "black">("normal");
  const [currentColor, setCurrentColor] = useState<string>("#ef4444"); // Red by default
  const [strokeWidth] = useState<number>(4);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  // Text Input State
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);

  // Load latest screenshot
  const loadScreenshot = async () => {
    try {
      const base64Data = await invoke<string>("get_last_screenshot");
      setImageSrc(`data:image/png;base64,${base64Data}`);
    } catch (e) {
      console.error("Failed to load screenshot for Zoom Canvas:", e);
    }
  };

  useEffect(() => {
    loadScreenshot();

    const unlisten = listen("zoom-captured", () => {
      setZoomLevel(2.0);
      setPanPos({ x: 0.5, y: 0.5 });
      setIsDrawMode(false);
      setBoardMode("normal");
      setShapes([]);
      setCurrentShape(null);
      setTextInput(null);
      loadScreenshot();
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImgElement(img);
    };
  }, [imageSrc]);

  const handleClose = async () => {
    try {
      await invoke("hide_zoom_window");
    } catch (e) {
      try {
        const win = getCurrentWindow();
        await win.hide();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Helper to draw an arrow
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromx: number,
    fromy: number,
    tox: number,
    toy: number,
    color: string,
    width: number
  ) => {
    const headlen = Math.max(16, width * 3);
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(
      tox - headlen * Math.cos(angle - Math.PI / 6),
      toy - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      tox - headlen * Math.cos(angle + Math.PI / 6),
      toy - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Background (Zoomed Image / Whiteboard / Blackboard)
    if (boardMode === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    } else if (boardMode === "black") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);
    } else if (imgElement) {
      const cropWidth = imgElement.naturalWidth / zoomLevel;
      const cropHeight = imgElement.naturalHeight / zoomLevel;

      let cropX = panPos.x * imgElement.naturalWidth - cropWidth / 2;
      let cropY = panPos.y * imgElement.naturalHeight - cropHeight / 2;

      cropX = Math.max(0, Math.min(imgElement.naturalWidth - cropWidth, cropX));
      cropY = Math.max(0, Math.min(imgElement.naturalHeight - cropHeight, cropY));

      ctx.drawImage(imgElement, cropX, cropY, cropWidth, cropHeight, 0, 0, w, h);
    }

    // 2. Render Saved & Active Shapes
    const allShapes = currentShape ? [...shapes, currentShape] : shapes;
    for (const shape of allShapes) {
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color;
      ctx.lineWidth = shape.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (shape.type === "pen" && shape.points && shape.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
        ctx.stroke();
      } else if (shape.type === "line" && shape.x1 !== undefined && shape.y1 !== undefined && shape.x2 !== undefined && shape.y2 !== undefined) {
        ctx.beginPath();
        ctx.moveTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x2, shape.y2);
        ctx.stroke();
      } else if (shape.type === "rect" && shape.x1 !== undefined && shape.y1 !== undefined && shape.x2 !== undefined && shape.y2 !== undefined) {
        ctx.beginPath();
        ctx.rect(shape.x1, shape.y1, shape.x2 - shape.x1, shape.y2 - shape.y1);
        ctx.stroke();
      } else if (shape.type === "ellipse" && shape.x1 !== undefined && shape.y1 !== undefined && shape.x2 !== undefined && shape.y2 !== undefined) {
        ctx.beginPath();
        const rx = Math.abs(shape.x2 - shape.x1) / 2;
        const ry = Math.abs(shape.y2 - shape.y1) / 2;
        const cx = Math.min(shape.x1, shape.x2) + rx;
        const cy = Math.min(shape.y1, shape.y2) + ry;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (shape.type === "arrow" && shape.x1 !== undefined && shape.y1 !== undefined && shape.x2 !== undefined && shape.y2 !== undefined) {
        drawArrow(ctx, shape.x1, shape.y1, shape.x2, shape.y2, shape.color, shape.width);
      } else if (shape.type === "text" && shape.x1 !== undefined && shape.y1 !== undefined && shape.text) {
        ctx.font = "bold 24px Inter, sans-serif";
        ctx.textBaseline = "top";
        ctx.fillText(shape.text, shape.x1, shape.y1);
      }
    }

    // 3. Render Status Badge (Top Left Corner)
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.beginPath();
    ctx.roundRect(16, 16, isDrawMode ? 420 : 250, 36, 18);
    ctx.fill();
    ctx.strokeStyle = isDrawMode ? currentColor : "rgba(56, 189, 248, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Color Indicator Circle (If in Draw Mode)
    if (isDrawMode) {
      ctx.fillStyle = currentColor;
      ctx.beginPath();
      ctx.arc(36, 34, 7, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.fillStyle = isDrawMode ? "#ffffff" : "#38bdf8";
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const badgeText = isDrawMode
      ? `Zoom: ${zoomLevel.toFixed(1)}x | ✏️ Çizim Modu [R,G,B,Y | Shift/Ctrl/Tab/W/K | ESC: Çık]`
      : `Zoom: ${zoomLevel.toFixed(1)}x | 🖱️ Sol Tık: Çizim Modunu Başlat`;

    ctx.fillText(badgeText, isDrawMode ? 52 : 32, 34);
    ctx.restore();
  }, [imgElement, zoomLevel, panPos, boardMode, shapes, currentShape, isDrawMode, currentColor]);

  // Keyboard Event Handler (Colors, Board Modes, Undo, Clear, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Undo (Ctrl + Z)
      if (e.ctrlKey && key === "z") {
        e.preventDefault();
        setShapes((prev) => prev.slice(0, -1));
        return;
      }

      // Color Shortcuts: R, G, B, Y, O, P
      if (key === "r") {
        setCurrentColor("#ef4444"); // Red
        setIsDrawMode(true);
      } else if (key === "g") {
        setCurrentColor("#22c55e"); // Green
        setIsDrawMode(true);
      } else if (key === "b") {
        setCurrentColor("#3b82f6"); // Blue
        setIsDrawMode(true);
      } else if (key === "y") {
        setCurrentColor("#eab308"); // Yellow
        setIsDrawMode(true);
      } else if (key === "o") {
        setCurrentColor("#f97316"); // Orange
        setIsDrawMode(true);
      } else if (key === "p") {
        setCurrentColor("#ec4899"); // Pink
        setIsDrawMode(true);
      } else if (key === "w") {
        // Whiteboard
        setBoardMode((prev) => (prev === "white" ? "normal" : "white"));
        setIsDrawMode(true);
      } else if (key === "k") {
        // Blackboard
        setBoardMode((prev) => (prev === "black" ? "normal" : "black"));
        setIsDrawMode(true);
      } else if (key === "e") {
        // Clear all drawings
        setShapes([]);
        setBoardMode("normal");
      } else if (key === "t") {
        // Text mode
        setIsDrawMode(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!isDrawMode) {
        if (e.deltaY < 0) {
          setZoomLevel((prev) => Math.min(5.0, Number((prev + 0.25).toFixed(2))));
        } else if (e.deltaY > 0) {
          setZoomLevel((prev) => Math.max(1.0, Number((prev - 0.25).toFixed(2))));
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleClose();
    };


    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [isDrawMode, boardMode, shapes]);

  // Mouse Motion Handler for Panning (when not drawing)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawMode) {
      const normX = e.clientX / window.innerWidth;
      const normY = e.clientY / window.innerHeight;
      setPanPos({ x: normX, y: normY });
      return;
    }

    if (!isMouseDown || !startPoint) return;
    const curX = e.clientX;
    const curY = e.clientY;

    if (e.shiftKey && e.ctrlKey) {
      // Arrow
      setCurrentShape({
        id: "active",
        type: "arrow",
        x1: startPoint.x,
        y1: startPoint.y,
        x2: curX,
        y2: curY,
        color: currentColor,
        width: strokeWidth,
      });
    } else if (e.shiftKey) {
      // Straight Line
      setCurrentShape({
        id: "active",
        type: "line",
        x1: startPoint.x,
        y1: startPoint.y,
        x2: curX,
        y2: curY,
        color: currentColor,
        width: strokeWidth,
      });
    } else if (e.ctrlKey) {
      // Rectangle / Box
      setCurrentShape({
        id: "active",
        type: "rect",
        x1: startPoint.x,
        y1: startPoint.y,
        x2: curX,
        y2: curY,
        color: currentColor,
        width: strokeWidth,
      });
    } else if (e.altKey) {
      // Ellipse / Circle
      setCurrentShape({
        id: "active",
        type: "ellipse",
        x1: startPoint.x,
        y1: startPoint.y,
        x2: curX,
        y2: curY,
        color: currentColor,
        width: strokeWidth,
      });
    } else {
      // Freehand Pen
      setCurrentShape((prev) => {
        const pts = prev?.points ? [...prev.points, { x: curX, y: curY }] : [{ x: startPoint.x, y: startPoint.y }, { x: curX, y: curY }];
        return {
          id: "active",
          type: "pen",
          points: pts,
          color: currentColor,
          width: strokeWidth,
        };
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    if (!isDrawMode) {
      // First Left-Click locks the zoom view and activates Draw Mode!
      setIsDrawMode(true);
      return;
    }

    // Check if Text Input is active
    if (textInput) {
      if (textInput.text.trim()) {
        setShapes((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            type: "text",
            x1: textInput.x,
            y1: textInput.y,
            text: textInput.text,
            color: currentColor,
            width: strokeWidth,
          },
        ]);
      }
      setTextInput(null);
      return;
    }

    setIsMouseDown(true);
    setStartPoint({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    if (!isMouseDown) return;
    setIsMouseDown(false);
    setStartPoint(null);

    if (currentShape) {
      setShapes((prev) => [...prev, { ...currentShape, id: Date.now().toString() }]);
      setCurrentShape(null);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000000",
        overflow: "hidden",
        position: "relative",
        cursor: isDrawMode ? "crosshair" : "default",
        userSelect: "none",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {/* Floating Text Input Box when typing */}
      {textInput && (
        <input
          autoFocus
          type="text"
          value={textInput.text}
          onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (textInput.text.trim()) {
                setShapes((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    type: "text",
                    x1: textInput.x,
                    y1: textInput.y,
                    text: textInput.text,
                    color: currentColor,
                    width: strokeWidth,
                  },
                ]);
              }
              setTextInput(null);
            } else if (e.key === "Escape") {
              setTextInput(null);
            }
          }}
          style={{
            position: "absolute",
            left: `${textInput.x}px`,
            top: `${textInput.y}px`,
            background: "rgba(15, 23, 42, 0.9)",
            color: currentColor,
            border: `2px solid ${currentColor}`,
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "20px",
            fontWeight: "bold",
            outline: "none",
            zIndex: 100,
          }}
        />
      )}
    </div>
  );
}
