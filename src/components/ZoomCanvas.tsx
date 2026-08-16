import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from "@tauri-apps/api/event";
import { translations, getLanguage, Language } from "../i18n";

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

const getPencilCursor = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/><circle cx="2" cy="22" r="1.5" fill="${color}"/></svg>`;
  return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') 2 22, crosshair`;
};

export default function ZoomCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [lang, setLang] = useState<Language>(getLanguage());
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);


  // Zoom & Pan State
  const [zoomLevel, setZoomLevel] = useState<number>(2.0); // Default 2x magnification
  const [panPos, setPanPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 }); // Normalized (0 to 1)
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);

  // Drawing & Board State
  const [isDrawMode, setIsDrawMode] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<"pen" | "text">("pen");
  const [boardMode, setBoardMode] = useState<"normal" | "white" | "black">("normal");
  const [currentColor, setCurrentColor] = useState<string>("#ef4444"); // Red by default
  const [strokeWidth] = useState<number>(4);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  // Text Input State & Time Tracker
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  const textInputRef = useRef(textInput);
  const textInputTimeRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-Hiding Status Badge State
  const [badgeVisible, setBadgeVisible] = useState<boolean>(true);
  const [badgeOpacity, setBadgeOpacity] = useState<number>(1.0);
  const badgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showBadgeTemporarily = (durationMs: number = 2200) => {
    setBadgeVisible(true);
    if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
    badgeTimerRef.current = setTimeout(() => {
      setBadgeVisible(false);
    }, durationMs);
  };

  useEffect(() => {
    textInputRef.current = textInput;
  }, [textInput]);

  const activeToolRef = useRef(activeTool);
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  const currentColorRef = useRef(currentColor);
  useEffect(() => {
    currentColorRef.current = currentColor;
  }, [currentColor]);

  // Focus input automatically whenever textInput opens
  useEffect(() => {
    if (textInput && inputRef.current) {
      inputRef.current.focus();
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [textInput]);

  const shapesRef = useRef(shapes);
  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  const isDrawModeRef = useRef(isDrawMode);
  useEffect(() => {
    isDrawModeRef.current = isDrawMode;
  }, [isDrawMode]);

  // Load language dynamically when window focuses or storage updates
  useEffect(() => {
    const updateLang = () => setLang(getLanguage());
    window.addEventListener("storage", updateLang);
    window.addEventListener("focus", updateLang);
    return () => {
      window.removeEventListener("storage", updateLang);
      window.removeEventListener("focus", updateLang);
    };
  }, []);

  // Smooth fade-in / fade-out animation for badge
  useEffect(() => {
    let animId: number;
    const startTime = performance.now();
    const startOpacity = badgeOpacity;
    const targetOpacity = badgeVisible ? 1.0 : 0.0;
    const duration = 300;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const current = startOpacity + (targetOpacity - startOpacity) * progress;
      setBadgeOpacity(current);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [badgeVisible]);

  // Show badge temporarily when zoom level, mode, or color changes
  useEffect(() => {
    showBadgeTemporarily(2200);
  }, [zoomLevel, isDrawMode, activeTool, currentColor, boardMode]);

  const t = translations[lang] || translations.tr;

  useEffect(() => {
    setLang(getLanguage());

    let animId: number | null = null;

    const startZoomAnimation = (targetX: number, targetY: number, img: HTMLImageElement) => {
      setImgElement(img);
      setPanPos({ x: targetX, y: targetY });
      setZoomLevel(1.0);
      setIsDrawMode(false);
      setActiveTool("pen");
      setBoardMode("normal");
      setShapes([]);
      setCurrentShape(null);
      setTextInput(null);
      setLang(getLanguage());
      showBadgeTemporarily(2500);

      if (animId) cancelAnimationFrame(animId);

      const startTime = performance.now();
      const duration = 220; // 220ms smooth ease-out transition
      const startZoom = 1.0;
      const targetZoom = 2.0;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentZoom = startZoom + (targetZoom - startZoom) * easeOut;

        setZoomLevel(Number(currentZoom.toFixed(3)));

        if (progress < 1) {
          animId = requestAnimationFrame(step);
        }
      };

      animId = requestAnimationFrame(step);
    };

    const fetchAndAnimate = async (cursorX: number, cursorY: number) => {
      try {
        setImgElement(null);
        const base64Data = await invoke<string>("get_last_screenshot");
        const src = `data:image/png;base64,${base64Data}`;
        const img = new Image();
        img.src = src;
        img.onload = () => {
          startZoomAnimation(cursorX, cursorY, img);
          invoke("show_zoom_window").catch(console.error);
        };
      } catch (e) {
        console.error("Failed to load screenshot for Zoom Canvas:", e);
      }
    };

    // Initial mount load
    fetchAndAnimate(0.5, 0.5);

    const unlistenZoom = listen<{ cursor_x?: number; cursor_y?: number; is_live?: boolean }>("zoom-captured", (event) => {
      setImgElement(null);
      const startX = event.payload?.cursor_x ?? 0.5;
      const startY = event.payload?.cursor_y ?? 0.5;
      const isLive = event.payload?.is_live ?? false;
      setIsLiveMode(isLive);
      fetchAndAnimate(startX, startY);
    });

    const unlistenSnapshot = listen("request-zoom-snapshot", async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        await invoke("save_zoom_snapshot", { base64Data });
      } catch (e) {
        console.error("Failed to save zoom snapshot:", e);
      }
    });

    return () => {
      unlistenZoom.then((fn) => fn());
      unlistenSnapshot.then((fn) => fn());
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  const handleClose = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setImgElement(null);
    setShapes([]);
    setBoardMode("normal");

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

  const handleTextSubmit = () => {
    const current = textInputRef.current;
    if (current && current.text.trim()) {
      setShapes((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "text",
          x1: current.x,
          y1: current.y,
          text: current.text.trim(),
          color: currentColorRef.current,
          width: strokeWidth,
        },
      ]);
    }
    setTextInput(null);
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

    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Buffer dimensions match physical display pixels for crisp High-DPI rendering
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Disable bilinear interpolation smoothing for ZoomIt-style pixel-perfect crispness
    ctx.imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;
    (ctx as any).msImageSmoothingEnabled = false;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Background (Zoomed Image / Whiteboard / Blackboard)
    if (boardMode === "white") {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
    } else if (boardMode === "black") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);
    } else if (imgElement) {
      // Round crop coordinates to exact integer pixels to prevent sub-pixel sampling blur
      const cropWidth = Math.floor(imgElement.naturalWidth / zoomLevel);
      const cropHeight = Math.floor(imgElement.naturalHeight / zoomLevel);

      let cropX = Math.floor(panPos.x * imgElement.naturalWidth - cropWidth / 2);
      let cropY = Math.floor(panPos.y * imgElement.naturalHeight - cropHeight / 2);

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

    // 3. Render Status Badge (Top Left Corner) - Auto-Hiding
    if (badgeOpacity > 0.01) {
      ctx.save();
      ctx.globalAlpha = badgeOpacity;

      const badgeText = isLiveMode && !isDrawMode
        ? `Zoom: ${zoomLevel.toFixed(1)}x | ${t.zoomBadgeLiveMode || "Canlı Zoom Modu [Fareyi Takip Eder | Sol Tık: Dondur & Çiz | ESC: Çık]"}`
        : isDrawMode
          ? activeTool === "text"
            ? `Zoom: ${zoomLevel.toFixed(1)}x | ${t.zoomBadgeTextMode || "🔤 Metin Modu"}`
            : `Zoom: ${zoomLevel.toFixed(1)}x | ${t.zoomBadgeDrawMode}`
          : `Zoom: ${zoomLevel.toFixed(1)}x | ${t.zoomBadgeStart}`;

      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";

      const textMetrics = ctx.measureText(badgeText);
      const badgeWidth = textMetrics.width + (isDrawMode ? 54 : 36);

      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.beginPath();
      ctx.roundRect(16, 16, badgeWidth, 36, 18);
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
      ctx.fillText(badgeText, isDrawMode ? 52 : 32, 34);

      ctx.restore();
    }

    ctx.restore();
  }, [imgElement, zoomLevel, panPos, boardMode, shapes, currentShape, isDrawMode, activeTool, currentColor, lang, badgeOpacity]);


  // Keyboard Event Handler (Colors, Board Modes, Undo, Clear, ESC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not process global shortcuts if typing in text input
      if (textInputRef.current !== null || (e.target as HTMLElement)?.tagName === "INPUT") {
        if (e.key === "Escape") {
          setTextInput(null);
        }
        return;
      }

      const key = e.key.toLowerCase();

      // In Live Zoom mode, disable all drawing shortcuts and only handle Zooming & Exit
      if (isLiveMode) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setZoomLevel((prev) => Math.min(5.0, Number((prev + 0.25).toFixed(2))));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setZoomLevel((prev) => Math.max(1.0, Number((prev - 0.25).toFixed(2))));
        } else if (e.key === "Escape" || (e.ctrlKey && e.key === "4")) {
          e.preventDefault();
          handleClose();
        }
        return;
      }

      // Arrow Up (Zoom In) & Arrow Down (Zoom Out)
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setZoomLevel((prev) => Math.min(5.0, Number((prev + 0.25).toFixed(2))));
        return;
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setZoomLevel((prev) => Math.max(1.0, Number((prev - 0.25).toFixed(2))));
        return;
      }

      // Undo (Ctrl + Z)
      if (e.ctrlKey && key === "z") {
        e.preventDefault();
        setShapes((prev) => prev.slice(0, -1));
        return;
      }

      // Color Shortcuts: R, G, B, Y, O, P
      if (key === "r") {
        setCurrentColor("#ef4444"); // Red
        setActiveTool("pen");
        setIsDrawMode(true);
      } else if (key === "g") {
        setCurrentColor("#22c55e"); // Green
        setActiveTool("pen");
        setIsDrawMode(true);
      } else if (key === "b") {
        setCurrentColor("#3b82f6"); // Blue
        setActiveTool("pen");
        setIsDrawMode(true);
      } else if (key === "y") {
        setCurrentColor("#eab308"); // Yellow
        setActiveTool("pen");
        setIsDrawMode(true);
      } else if (key === "o") {
        setCurrentColor("#f97316"); // Orange
        setActiveTool("pen");
        setIsDrawMode(true);
      } else if (key === "p") {
        setCurrentColor("#ec4899"); // Pink
        setActiveTool("pen");
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
        // Text mode: Change cursor to text I-beam, DO NOT open text input box until user left clicks!
        setActiveTool("text");
        setIsDrawMode(true);
        setTextInput(null);
      } else if (e.key === "Escape" || (e.ctrlKey && e.key === "4")) {
        e.preventDefault();
        if (textInputRef.current !== null) {
          // 1. If text input box is active, close it without committing
          setTextInput(null);
        } else if (isDrawModeRef.current || shapesRef.current.length > 0) {
          // 2. Clear all drawings & exit draw mode back to Zoom/Pan mode in one step
          setShapes([]);
          setIsDrawMode(false);
          setActiveTool("pen");
        } else {
          // 3. If already in Zoom/Pan mode with no drawings, close Zoom window
          handleClose();
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoomLevel((prev) => Math.min(5.0, Number((prev + 0.25).toFixed(2))));
      } else if (e.deltaY > 0) {
        setZoomLevel((prev) => Math.max(1.0, Number((prev - 0.25).toFixed(2))));
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      if (textInputRef.current !== null) {
        setTextInput(null);
      } else if (isDrawModeRef.current || shapesRef.current.length > 0) {
        setShapes([]);
        setIsDrawMode(false);
        setActiveTool("pen");
      } else {
        handleClose();
      }
    };

    const ensureFocus = () => {
      getCurrentWindow().setFocus().catch(() => { });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("focus", ensureFocus);
    window.addEventListener("mouseenter", ensureFocus);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("focus", ensureFocus);
      window.removeEventListener("mouseenter", ensureFocus);
    };
  }, []);

  // Mouse Motion Handler for Panning (when not drawing)
  const handleMouseMove = (e: React.MouseEvent) => {
    // Show badge temporarily if mouse moves close to top-left corner
    if (e.clientX < 340 && e.clientY < 70) {
      showBadgeTemporarily(2000);
    }

    if (!isDrawMode) {
      const normX = e.clientX / window.innerWidth;
      const normY = e.clientY / window.innerHeight;
      setPanPos({ x: normX, y: normY });
      return;
    }

    if (!isMouseDown || !startPoint || activeTool === "text") return;
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
    if (isLiveMode) return; // Live Zoom is strictly for viewing/magnifying, drawing is disabled!
    if (e.button !== 0) return; // Only left click

    if (!isDrawMode) {
      // First Left-Click locks the zoom view and activates Draw Mode!
      setIsDrawMode(true);
      return;
    }

    // Check if Text Input is active: submit existing text first!
    if (textInputRef.current !== null) {
      // Only process click outside if input was created > 200ms ago
      if (Date.now() - textInputTimeRef.current > 200) {
        handleTextSubmit();
        if (activeToolRef.current === "text") {
          const clickX = e.clientX;
          const clickY = e.clientY;
          setTimeout(() => {
            textInputTimeRef.current = Date.now();
            setTextInput({ x: clickX, y: clickY, text: "" });
          }, 30);
        }
      }
      return;
    }

    if (activeToolRef.current === "text") {
      textInputTimeRef.current = Date.now();
      setTextInput({ x: e.clientX, y: e.clientY, text: "" });
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
        background: "transparent",
        overflow: "hidden",
        position: "relative",
        cursor: isDrawMode ? (activeTool === "text" ? "text" : getPencilCursor(currentColor)) : "default",
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

      {/* Floating Text Input Box when typing */}
      {textInput && (
        <input
          ref={inputRef}
          autoFocus
          type="text"
          value={textInput.text}
          onChange={(e) => setTextInput({ ...textInput, text: e.target.value })}
          onBlur={() => {
            // Ignore blur events that fire immediately upon mount (< 300ms)
            if (Date.now() - textInputTimeRef.current < 300) return;
            handleTextSubmit();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") {
              e.preventDefault();
              handleTextSubmit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setTextInput(null);
            }
          }}
          placeholder={(t as any).textInputPlaceholder || "Yazı yazın..."}
          style={{
            position: "absolute",
            left: `${textInput.x}px`,
            top: `${textInput.y - 4}px`,
            background: "rgba(15, 23, 42, 0.95)",
            color: currentColor,
            border: `2px solid #38bdf8`,
            borderRadius: "6px",
            padding: "4px 8px",
            fontSize: "24px",
            fontWeight: "bold",
            outline: "none",
            zIndex: 9999,
            minWidth: "160px",
            fontFamily: "Inter, sans-serif",
            caretColor: currentColor,
            boxShadow: "0 0 14px rgba(56, 189, 248, 0.8)",
          }}
        />
      )}
    </div>
  );
}
