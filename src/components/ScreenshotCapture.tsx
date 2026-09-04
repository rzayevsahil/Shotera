import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { Copy, Download, X, Pencil, ArrowUpRight, Type, Undo, Trash2, Slash, Circle, Droplets, CloudUpload, Pin, ScanText, ListOrdered, Palette, Eraser } from "lucide-react";
import Tesseract from "tesseract.js";
import { HexColorPicker } from "react-colorful";
import { translations, getLanguage, Language } from "../i18n";
import shutterSoundUrl from "../assets/shutter.mp3";

interface SelectionRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Tool = "select" | "pencil" | "arrow" | "line" | "rect" | "circle" | "text" | "blur" | "step" | "eraser";

interface Point {
  x: number;
  y: number;
  time?: number;
}

interface DrawingAction {
  type: Tool;
  points?: Point[]; // for pencil
  start?: Point;    // for arrow / rect
  end?: Point;      // for arrow / rect
  text?: string;    // for text
  color: string;
  width: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  stepNumber?: number;
  blurAmount?: number;
  erasingStart?: number; // for soft delete animation
}

interface FadingEraserTrail {
  points: Point[];
  endTime: number;
}

// Custom eraser cursor matching the lucide icon, scaled down to 16x16
const ERASER_CURSOR = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m7%2021-4.3-4.3c-1-1-1-2.5%200-3.4l9.6-9.6c1-1%202.5-1%203.4%200l5.6%205.6c1%201%201%202.5%200%203.4L13%2021%22%20%2F%3E%3Cpath%20d%3D%22M22%2021H7%22%20%2F%3E%3Cpath%20d%3D%22m5%2011%209%209%22%20%2F%3E%3C%2Fsvg%3E") 4 14, crosshair`;

// Custom pencil cursor matching the lucide icon, scaled down to 16x16
const PENCIL_CURSOR = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22M21.174%206.812a1%201%200%200%200-3.986-3.987L3.842%2016.174a2%202%200%200%200-.5.83l-1.321%204.352a.5.5%200%200%200%20.623.622l4.353-1.32a2%202%200%200%200%20.83-.497z%22%20%2F%3E%3Cpath%20d%3D%22m15%205%204%204%22%20%2F%3E%3C%2Fsvg%3E") 0 16, crosshair`;

// Helpers for selection resizing and cursor changes
const getResizeHandle = (x: number, y: number, rect: SelectionRect): string | null => {
  const t = 8; // threshold in pixels
  const { x: rx, y: ry, w: rw, h: rh } = rect;

  // Check corners first
  if (Math.abs(x - rx) <= t && Math.abs(y - ry) <= t) return "tl";
  if (Math.abs(x - (rx + rw)) <= t && Math.abs(y - ry) <= t) return "tr";
  if (Math.abs(x - rx) <= t && Math.abs(y - (ry + rh)) <= t) return "bl";
  if (Math.abs(x - (rx + rw)) <= t && Math.abs(y - (ry + rh)) <= t) return "br";

  // Check edges
  if (Math.abs(y - ry) <= t && x >= rx && x <= rx + rw) return "t";
  if (Math.abs(y - (ry + rh)) <= t && x >= rx && x <= rx + rw) return "b";
  if (Math.abs(x - rx) <= t && y >= ry && y <= ry + rh) return "l";
  if (Math.abs(x - (rx + rw)) <= t && y >= ry && y <= ry + rh) return "r";

  // Check inside
  if (x > rx && x < rx + rw && y > ry && y < ry + rh) return "move";

  return null;
};

const getCursorForHandle = (handle: string | null, tool: Tool): string => {
  if (tool !== "select") return "crosshair";
  if (!handle) return "crosshair";
  switch (handle) {
    case "tl":
    case "br":
      return "nwse-resize";
    case "tr":
    case "bl":
      return "nesw-resize";
    case "t":
    case "b":
      return "ns-resize";
    case "l":
    case "r":
      return "ew-resize";
    case "move":
      return "move";
    default:
      return "crosshair";
  }
};

// Math helpers for eraser
const distPointToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
  const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
  if (l2 === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.sqrt((px - (x1 + t * (x2 - x1))) ** 2 + (py - (y1 + t * (y2 - y1))) ** 2);
};

const getDistanceToDrawing = (act: DrawingAction, px: number, py: number): number => {
  if (act.type === "pencil" && act.points && act.points.length > 0) {
    let minDist = Infinity;
    for (let i = 0; i < act.points.length - 1; i++) {
      const p1 = act.points[i];
      const p2 = act.points[i + 1];
      minDist = Math.min(minDist, distPointToSegment(px, py, p1.x, p1.y, p2.x, p2.y));
    }
    // If only one point
    if (act.points.length === 1) {
      minDist = Math.sqrt((px - act.points[0].x) ** 2 + (py - act.points[0].y) ** 2);
    }
    return minDist;
  }
  
  if (act.type === "line" || act.type === "arrow") {
    if (act.start && act.end) {
      return distPointToSegment(px, py, act.start.x, act.start.y, act.end.x, act.end.y);
    }
  }

  if (act.type === "rect" && act.start && act.end) {
    const minX = Math.min(act.start.x, act.end.x);
    const maxX = Math.max(act.start.x, act.end.x);
    const minY = Math.min(act.start.y, act.end.y);
    const maxY = Math.max(act.start.y, act.end.y);
    
    const d1 = distPointToSegment(px, py, minX, minY, maxX, minY); // top
    const d2 = distPointToSegment(px, py, maxX, minY, maxX, maxY); // right
    const d3 = distPointToSegment(px, py, minX, maxY, maxX, maxY); // bottom
    const d4 = distPointToSegment(px, py, minX, minY, minX, maxY); // left
    return Math.min(d1, d2, d3, d4);
  }

  if (act.type === "circle" && act.start && act.end) {
    const rx = Math.abs(act.end.x - act.start.x) / 2;
    const ry = Math.abs(act.end.y - act.start.y) / 2;
    const cx = act.start.x + (act.end.x - act.start.x) / 2;
    const cy = act.start.y + (act.end.y - act.start.y) / 2;
    
    if (rx === 0 || ry === 0) return Infinity;
    
    // Approximation for ellipse: transform point to circle space
    const dx = (px - cx) / rx;
    const dy = (py - cy) / ry;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    // Rough distance to perimeter
    const avgR = (rx + ry) / 2;
    return Math.abs(distFromCenter - 1) * avgR;
  }

  if (act.type === "text" && act.start && act.text) {
    const estWidth = act.text.length * 10; // rough estimation
    const estHeight = 20;
    if (px >= act.start.x - 5 && px <= act.start.x + estWidth + 5 && 
        py >= act.start.y - 5 && py <= act.start.y + estHeight + 5) {
      return 0;
    }
    return Infinity;
  }

  if (act.type === "step" && act.start) {
    const dist = Math.sqrt((px - act.start.x) ** 2 + (py - act.start.y) ** 2);
    if (dist <= 14) return 0;
    return dist - 14;
  }
  
  if (act.type === "blur" && act.start && act.end) {
    const minX = Math.min(act.start.x, act.end.x);
    const maxX = Math.max(act.start.x, act.end.x);
    const minY = Math.min(act.start.y, act.end.y);
    const maxY = Math.max(act.start.y, act.end.y);
    if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
      return 0; // inside blur area
    }
    return Infinity;
  }

  return Infinity;
};

function ScreenshotCapture() {
  const [lang, setLang] = useState<Language>(getLanguage);

  useEffect(() => {
    const handleStorageChange = () => {
      setLang(getLanguage());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  // Selection state
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);

  // Resize and Move state
  const [dragMode, setDragMode] = useState<string | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [initialSelection, setInitialSelection] = useState<SelectionRect | null>(null);

  // Drawing state
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [drawColor, setDrawColor] = useState("#ef4444"); // Red by default
  const [boardMode, setBoardMode] = useState<"normal" | "white" | "black">("normal");
  const [drawings, setDrawings] = useState<DrawingAction[]>([]);
  const [hoveredDrawingIndex, setHoveredDrawingIndex] = useState<number | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPencilPoints, setCurrentPencilPoints] = useState<Point[]>([]);
  const [currentEraserPoints, setCurrentEraserPoints] = useState<Point[]>([]);
  const [fadingEraserTrails, setFadingEraserTrails] = useState<FadingEraserTrail[]>([]);
  const [drawingStart, setDrawingStart] = useState<Point | null>(null);
  const [drawingEnd, setDrawingEnd] = useState<Point | null>(null);

  const [animFrame, setAnimFrame] = useState(0);

  useEffect(() => {
    const hasErasing = drawings.some(d => d.erasingStart !== undefined);
    const hasFadingTrails = fadingEraserTrails.length > 0;
    const hasActiveEraser = currentEraserPoints.length > 0;
    
    if (hasErasing || hasFadingTrails || hasActiveEraser) {
      const frame = requestAnimationFrame(() => {
        setAnimFrame(f => f + 1);
        
        const now = Date.now();

        // Shrink the current eraser points (comet tail effect, e.g. 250ms long)
        if (currentEraserPoints.length > 0) {
          const validPoints = currentEraserPoints.filter(p => p.time && now - p.time <= 250);
          if (validPoints.length !== currentEraserPoints.length) {
            setCurrentEraserPoints(validPoints);
          }
        }

        // Purge fully erased items from state so we don't leak memory or keep rendering them invisible
        const shouldPurge = drawings.some(d => d.erasingStart && now - d.erasingStart > 400);
        if (shouldPurge) {
          setDrawings(prev => prev.filter(d => !d.erasingStart || now - d.erasingStart <= 400));
        }

        const shouldPurgeTrails = fadingEraserTrails.some(t => now - t.endTime > 500);
        if (shouldPurgeTrails) {
          setFadingEraserTrails(prev => prev.filter(t => now - t.endTime <= 500));
        }
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [drawings, fadingEraserTrails, currentEraserPoints, animFrame]);

  // Text tool state
  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, val: "" });
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [textBold, setTextBold] = useState(true);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [textStrikethrough, setTextStrikethrough] = useState(false);

  // Color picker popover state
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker]);

  // Blur intensity / sharpness state (default 8px)
  const [blurAmount, setBlurAmount] = useState<number>(() => Number(localStorage.getItem("defaultBlurAmount") || "8"));

  const handleBlurAmountChange = (val: number) => {
    setBlurAmount(val);
    localStorage.setItem("defaultBlurAmount", String(val));
    window.dispatchEvent(new Event("storage"));
  };

  useEffect(() => {
    const handleStorage = () => {
      setBlurAmount(Number(localStorage.getItem("defaultBlurAmount") || "8"));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Load screenshot from Rust backend
  const loadScreenshot = async () => {
    try {
      setImgElement(null);
      setImageSrc(null);
      setSelection(null);
      setDrawings([]);
      setActiveTool("select");
      setBoardMode("normal");
      setTextInput({ visible: false, x: 0, y: 0, val: "" });

      const base64Data = await invoke<string>("get_last_screenshot");
      setImageSrc(`data:image/png;base64,${base64Data}`);
    } catch (e) {
      console.error("Failed to load screenshot:", e);
    }
  };

  useEffect(() => {
    loadScreenshot();

    const unlisten = listen("screenshot-captured", () => {
      setImgElement(null);
      setImageSrc(null);
      setSelection(null);
      setDrawings([]);
      setActiveTool("select");
      setBoardMode("normal");
      setTextInput({ visible: false, x: 0, y: 0, val: "" });
      loadScreenshot();
    });

    const unlistenFocus = listen("force-focus", () => {
      window.focus();
    });

    return () => {
      unlisten.then((fn) => fn());
      unlistenFocus.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (textInput.visible) {
          setTextInput({ visible: false, x: 0, y: 0, val: "" });
        } else {
          handleClose();
        }
        return;
      }

      // Do not trigger global copy/save shortcuts when typing text
      if (textInput.visible) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        setDrawings((prev) => prev.slice(0, -1));
      } else if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === "r") setDrawColor("#ef4444"); // Red
        else if (k === "g") setDrawColor("#22c55e"); // Green
        else if (k === "b") setDrawColor("#3b82f6"); // Blue
        else if (k === "y") setDrawColor("#eab308"); // Yellow
        else if (k === "o") setDrawColor("#f97316"); // Orange
        else if (k === "p") setDrawColor("#ec4899"); // Pink
        else if (k === "w") setBoardMode((prev) => (prev === "white" ? "normal" : "white"));
        else if (k === "k") setBoardMode((prev) => (prev === "black" ? "normal" : "black"));
        else if (k === "t") setActiveTool("text");
        else if (k === "e") setActiveTool("eraser");
        else if (k === "c") setDrawings([]);
      }
    };


    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [textInput.visible, selection, drawings, imgElement]);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImgElement(img);
      // Wait for React to render the new image onto the canvas BEFORE displaying the window
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          invoke("show_screenshot_window").catch(console.error);
        });
      });
    };
  }, [imageSrc]);

  // Redraw canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgElement) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    // 1. Draw original screenshot image
    ctx.drawImage(imgElement, 0, 0, w, h);

    // 2. Draw dark screen overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(0, 0, w, h);

    if (selection) {
      // 3. Clear selection area to show original screenshot or whiteboard/blackboard
      ctx.clearRect(selection.x, selection.y, selection.w, selection.h);
      if (boardMode === "white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(selection.x, selection.y, selection.w, selection.h);
      } else if (boardMode === "black") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(selection.x, selection.y, selection.w, selection.h);
      } else {
        ctx.drawImage(
          imgElement,
          (selection.x * imgElement.naturalWidth) / w,
          (selection.y * imgElement.naturalHeight) / h,
          (selection.w * imgElement.naturalWidth) / w,
          (selection.h * imgElement.naturalHeight) / h,
          selection.x,
          selection.y,
          selection.w,
          selection.h
        );
      }


      // 4. Draw selection border
      ctx.strokeStyle = "rgba(0, 242, 254, 0.9)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);

      // Draw 8 resize handles if in select tool
      if (activeTool === "select") {
        const drawHandle = (hx: number, hy: number) => {
          const size = 6;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(hx - size / 2, hy - size / 2, size, size);
          ctx.strokeStyle = "rgba(0, 242, 254, 1)";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(hx - size / 2, hy - size / 2, size, size);
        };

        const { x: rx, y: ry, w: rw, h: rh } = selection;
        drawHandle(rx, ry); // TL
        drawHandle(rx + rw / 2, ry); // T
        drawHandle(rx + rw, ry); // TR
        drawHandle(rx, ry + rh / 2); // L
        drawHandle(rx + rw, ry + rh / 2); // R
        drawHandle(rx, ry + rh); // BL
        drawHandle(rx + rw / 2, ry + rh); // B
        drawHandle(rx + rw, ry + rh); // BR
      }

      // 5. Draw drawings constrained (clipped) within selection area
      ctx.save();
      ctx.beginPath();
      ctx.rect(selection.x, selection.y, selection.w, selection.h);
      ctx.clip();

      const drawAction = (act: DrawingAction, index: number) => {
        let alpha = 1.0;
        if (act.erasingStart) {
          const elapsed = Date.now() - act.erasingStart;
          if (elapsed > 400) return; // fully erased
          alpha = 1.0 - (elapsed / 400);
        }

        const isHovered = index === hoveredDrawingIndex;
        
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = (isHovered || act.erasingStart) ? "rgba(156, 163, 175, 0.7)" : act.color;
        ctx.fillStyle = (isHovered || act.erasingStart) ? "rgba(156, 163, 175, 0.7)" : act.color;
        ctx.lineWidth = isHovered ? act.width + 2 : act.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (act.type === "pencil" && act.points && act.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(act.points[0].x, act.points[0].y);
          for (let i = 1; i < act.points.length; i++) {
            ctx.lineTo(act.points[i].x, act.points[i].y);
          }
          ctx.stroke();
        } else if (act.type === "rect" && act.start && act.end) {
          ctx.strokeRect(
            act.start.x,
            act.start.y,
            act.end.x - act.start.x,
            act.end.y - act.start.y
          );
        } else if (act.type === "line" && act.start && act.end) {
          ctx.beginPath();
          ctx.moveTo(act.start.x, act.start.y);
          ctx.lineTo(act.end.x, act.end.y);
          ctx.stroke();
        } else if (act.type === "circle" && act.start && act.end) {
          const rx = Math.abs(act.end.x - act.start.x) / 2;
          const ry = Math.abs(act.end.y - act.start.y) / 2;
          const cx = act.start.x + (act.end.x - act.start.x) / 2;
          const cy = act.start.y + (act.end.y - act.start.y) / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
          ctx.stroke();
        } else if (act.type === "arrow" && act.start && act.end) {
          const fromX = act.start.x;
          const fromY = act.start.y;
          const toX = act.end.x;
          const toY = act.end.y;
          const angle = Math.atan2(toY - fromY, toX - fromX);
          const headLength = 15;

          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.stroke();

          // Arrow head
          ctx.beginPath();
          ctx.moveTo(toX, toY);
          ctx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.fill();
        } else if (act.type === "blur" && act.start && act.end) {
          ctx.save();
          const bx = Math.min(act.start.x, act.end.x);
          const by = Math.min(act.start.y, act.end.y);
          const bw = Math.abs(act.end.x - act.start.x);
          const bh = Math.abs(act.end.y - act.start.y);

          if (bw > 0 && bh > 0) {
            ctx.beginPath();
            ctx.rect(bx, by, bw, bh);
            ctx.clip();

            const currentBlur = act.blurAmount ?? blurAmount ?? 8;
            const pad = Math.ceil(currentBlur * 2);

            const sx = Math.max(0, bx - pad);
            const sy = Math.max(0, by - pad);
            const sw = Math.min(w - sx, bw + (bx - sx) + pad);
            const sh = Math.min(h - sy, bh + (by - sy) + pad);

            const dx = sx;
            const dy = sy;
            const dw = sw;
            const dh = sh;

            const scaleX = imgElement.naturalWidth / w;
            const scaleY = imgElement.naturalHeight / h;

            ctx.filter = `blur(${currentBlur}px)`;
            ctx.drawImage(
              imgElement,
              sx * scaleX,
              sy * scaleY,
              sw * scaleX,
              sh * scaleY,
              dx, dy, dw, dh
            );
          }
          ctx.restore();
        } else if (act.type === "step" && act.start && act.stepNumber) {
          const radius = 14;
          ctx.beginPath();
          ctx.arc(act.start.x, act.start.y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = act.color;
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 16px Inter, Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(act.stepNumber.toString(), act.start.x, act.start.y + 1);
        } else if (act.type === "text" && act.start && act.text) {
          ctx.textAlign = "left";
          ctx.textBaseline = "top";
          const fontStyle = act.italic ? "italic" : "normal";
          const fontWeight = act.bold ? "bold" : "normal";
          ctx.font = `${fontStyle} ${fontWeight} 16px Inter, Arial, sans-serif`;
          ctx.fillText(act.text, act.start.x, act.start.y);

          // Draw underline or strikethrough if needed
          const textWidth = ctx.measureText(act.text).width;
          const textHeight = 16;

          if (act.underline) {
            ctx.beginPath();
            ctx.moveTo(act.start.x, act.start.y + textHeight + 2);
            ctx.lineTo(act.start.x + textWidth, act.start.y + textHeight + 2);
            ctx.strokeStyle = act.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          if (act.strikethrough) {
            ctx.beginPath();
            ctx.moveTo(act.start.x, act.start.y + textHeight / 2 + 1);
            ctx.lineTo(act.start.x + textWidth, act.start.y + textHeight / 2 + 1);
            ctx.strokeStyle = act.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }
      };

      drawings.forEach((act, idx) => drawAction(act, idx));

      if (isDrawing) {
        if (activeTool === "pencil" && currentPencilPoints.length > 0) {
          drawAction({
            type: "pencil",
            points: currentPencilPoints,
            color: drawColor,
            width: 3,
          }, -1);
        } else if (activeTool === "rect" && drawingStart && drawingEnd) {
          drawAction({
            type: "rect",
            start: drawingStart,
            end: drawingEnd,
            color: drawColor,
            width: 3,
          }, -1);
        } else if (activeTool === "line" && drawingStart && drawingEnd) {
          drawAction({
            type: "line",
            start: drawingStart,
            end: drawingEnd,
            color: drawColor,
            width: 3,
          }, -1);
        } else if (activeTool === "circle" && drawingStart && drawingEnd) {
          drawAction({
            type: "circle",
            start: drawingStart,
            end: drawingEnd,
            color: drawColor,
            width: 3,
          }, -1);
        } else if (activeTool === "arrow" && drawingStart && drawingEnd) {
          drawAction({
            type: "arrow",
            start: drawingStart,
            end: drawingEnd,
            color: drawColor,
            width: 3,
          }, -1);
        } else if (activeTool === "blur" && drawingStart && drawingEnd) {
          drawAction({
            type: "blur",
            start: drawingStart,
            end: drawingEnd,
            color: drawColor, // not used
            width: 3,
            blurAmount: blurAmount,
          }, -1);
        }
      }

      // Draw current active eraser trail
      if (currentEraserPoints.length > 0) {
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.moveTo(currentEraserPoints[0].x, currentEraserPoints[0].y);
        for (let i = 1; i < currentEraserPoints.length; i++) {
          ctx.lineTo(currentEraserPoints[i].x, currentEraserPoints[i].y);
        }
        ctx.strokeStyle = "rgba(156, 163, 175, 0.5)";
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      }

      // Draw fading eraser trails
      fadingEraserTrails.forEach(trail => {
        const elapsed = Date.now() - trail.endTime;
        if (elapsed > 500) return;
        ctx.globalAlpha = Math.max(0, 1.0 - (elapsed / 500));
        ctx.beginPath();
        ctx.moveTo(trail.points[0].x, trail.points[0].y);
        for (let i = 1; i < trail.points.length; i++) {
          ctx.lineTo(trail.points[i].x, trail.points[i].y);
        }
        ctx.strokeStyle = "rgba(156, 163, 175, 0.5)";
        ctx.lineWidth = 10;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      });

      ctx.restore();
    }
  }, [imgElement, selection, drawings, isDrawing, currentPencilPoints, currentEraserPoints, fadingEraserTrails, drawingStart, drawingEnd, activeTool, drawColor, textBold, textItalic, textUnderline, textStrikethrough, blurAmount, animFrame]);

  useEffect(() => {
    if (textInput.visible && textInputRef.current) {
      const input = textInputRef.current;
      input.focus();
      const timer = setTimeout(() => {
        input.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [textInput.visible]);

  useEffect(() => {
    if (canvasRef.current) {
      if (activeTool === "text") {
        canvasRef.current.style.cursor = "text";
      } else if (activeTool === "eraser") {
        canvasRef.current.style.cursor = ERASER_CURSOR;
      } else if (activeTool === "pencil") {
        canvasRef.current.style.cursor = PENCIL_CURSOR;
      } else if (activeTool === "select" && selection) {
        // Handled dynamically by handleMouseMove
      } else {
        canvasRef.current.style.cursor = "crosshair";
      }
    }
  }, [activeTool]);

  const handleClose = async () => {
    try {
      // Synchronously clear the canvas DOM context to prevent old frame buffer flash on next show
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      setImageSrc(null);
      setImgElement(null);
      setSelection(null);
      setDrawings([]);
      setActiveTool("select");
      setBoardMode("normal");
      setTextInput({ visible: false, x: 0, y: 0, val: "" });
      await invoke("hide_screenshot_window");
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleBlur = () => {
      handleClose();
    };
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Drag selection handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // If text tool input is active, submit it first
    if (textInput.visible) {
      handleTextSubmit();
      return;
    }

    if (activeTool === "select") {
      if (selection) {
        // Check if user is clicking on a resize handle or selection body
        const handle = getResizeHandle(x, y, selection);
        if (handle) {
          setDragMode(handle);
          setDragStartPoint({ x, y });
          setInitialSelection({ ...selection });
          return;
        }
      }

      // If no selection clicked, start drawing a new selection box
      setIsSelecting(true);
      setStartPoint({ x, y });
      setSelection({ x, y, w: 0, h: 0 });
      setDrawings([]);
    } else if (selection) {
      // Annotations mode (Pencil, Arrow, Rect, Text)
      if (
        x >= selection.x &&
        x <= selection.x + selection.w &&
        y >= selection.y &&
        y <= selection.y + selection.h
      ) {
        if (activeTool === "eraser") {
          e.preventDefault();
          setIsDrawing(true);
          setCurrentEraserPoints([{ x, y, time: Date.now() }]);
          if (hoveredDrawingIndex !== null) {
            setDrawings((prev) => {
              const next = [...prev];
              if (next[hoveredDrawingIndex] && !next[hoveredDrawingIndex].erasingStart) {
                next[hoveredDrawingIndex] = { ...next[hoveredDrawingIndex], erasingStart: Date.now() };
              }
              return next;
            });
            setHoveredDrawingIndex(null);
          }
        } else if (activeTool === "step") {
          e.preventDefault();
          const nextStep = drawings.filter((d) => d.type === "step").length + 1;
          setDrawings((prev) => [
            ...prev,
            {
              type: "step",
              start: { x, y },
              color: drawColor,
              width: 3,
              stepNumber: nextStep,
            },
          ]);
        } else if (activeTool === "text") {
          e.preventDefault();
          setTextInput({ visible: true, x, y, val: "" });
        } else {
          setIsDrawing(true);
          setDrawingStart({ x, y });
          setDrawingEnd({ x, y });
          if (activeTool === "pencil") {
            setCurrentPencilPoints([{ x, y }]);
          }
        }
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Clamp coordinates to screen boundaries
    const clientX = Math.max(0, Math.min(window.innerWidth, e.clientX));
    const clientY = Math.max(0, Math.min(window.innerHeight, e.clientY));

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    if (isSelecting && startPoint) {
      const w = Math.abs(x - startPoint.x);
      const h = Math.abs(y - startPoint.y);
      const selectX = Math.min(x, startPoint.x);
      const selectY = Math.min(y, startPoint.y);
      setSelection({ x: selectX, y: selectY, w, h });
    } else if (dragMode && dragStartPoint && initialSelection) {
      // Resize/Move drag in progress
      const dx = x - dragStartPoint.x;
      const dy = y - dragStartPoint.y;

      let newX = initialSelection.x;
      let newY = initialSelection.y;
      let newW = initialSelection.w;
      let newH = initialSelection.h;

      if (dragMode === "move") {
        newX = Math.max(0, Math.min(window.innerWidth - newW, initialSelection.x + dx));
        newY = Math.max(0, Math.min(window.innerHeight - newH, initialSelection.y + dy));
      } else {
        // Horizontal updates
        if (dragMode.includes("l")) {
          const proposedX = initialSelection.x + dx;
          const proposedW = initialSelection.w - dx;
          if (proposedW >= 10) {
            newX = Math.max(0, proposedX);
            newW = proposedW;
          }
        } else if (dragMode.includes("r")) {
          const proposedW = initialSelection.w + dx;
          newW = Math.max(10, Math.min(window.innerWidth - newX, proposedW));
        }

        // Vertical updates
        if (dragMode.includes("t")) {
          const proposedY = initialSelection.y + dy;
          const proposedH = initialSelection.h - dy;
          if (proposedH >= 10) {
            newY = Math.max(0, proposedY);
            newH = proposedH;
          }
        } else if (dragMode.includes("b")) {
          const proposedH = initialSelection.h + dy;
          newH = Math.max(10, Math.min(window.innerHeight - newY, proposedH));
        }
      }

      setSelection({ x: newX, y: newY, w: newW, h: newH });
    } else if (isDrawing && selection) {
      // Draw drag in progress
      const clampedX = Math.max(selection.x, Math.min(x, selection.x + selection.w));
      const clampedY = Math.max(selection.y, Math.min(y, selection.y + selection.h));

      if (activeTool === "pencil") {
        setCurrentPencilPoints((prev) => [...prev, { x: clampedX, y: clampedY }]);
      } else if (activeTool === "eraser") {
        setCurrentEraserPoints((prev) => [...prev, { x: clampedX, y: clampedY, time: Date.now() }]);
        
        let minDistance = 15;
        let foundIndex = -1;
        for (let i = drawings.length - 1; i >= 0; i--) {
          if (drawings[i].erasingStart) continue; // Already erasing
          const dist = getDistanceToDrawing(drawings[i], clampedX, clampedY);
          if (dist <= minDistance) {
            foundIndex = i;
            break;
          }
        }
        
        if (foundIndex !== -1) {
          setDrawings((prev) => {
            const next = [...prev];
            if (next[foundIndex] && !next[foundIndex].erasingStart) {
              next[foundIndex] = { ...next[foundIndex], erasingStart: Date.now() };
            }
            return next;
          });
          setHoveredDrawingIndex(null);
        }
      } else {
        setDrawingEnd({ x: clampedX, y: clampedY });
      }
    } else {
      // Hover logic (for eraser or cursors)
      if (activeTool === "eraser" && selection) {
        let foundIndex: number | null = null;
        let minDistance = 10; // Threshold of 10px

        for (let i = drawings.length - 1; i >= 0; i--) {
          const dist = getDistanceToDrawing(drawings[i], x, y);
          if (dist <= minDistance) {
            foundIndex = i;
            break;
          }
        }
        
        if (foundIndex !== hoveredDrawingIndex) {
          setHoveredDrawingIndex(foundIndex);
        }
      } else if (hoveredDrawingIndex !== null) {
        setHoveredDrawingIndex(null);
      }

      if (canvasRef.current) {
        if (activeTool !== "select") {
          canvasRef.current.style.cursor = activeTool === "text" ? "text" : (activeTool === "eraser" ? ERASER_CURSOR : (activeTool === "pencil" ? PENCIL_CURSOR : (activeTool === "step" ? "crosshair" : "crosshair")));
        } else if (selection) {
          const handle = getResizeHandle(x, y, selection);
          canvasRef.current.style.cursor = getCursorForHandle(handle, activeTool);
        } else {
          canvasRef.current.style.cursor = "crosshair";
        }
      }
    }
  };

  const handleMouseMoveRef = useRef(handleMouseMove);
  useEffect(() => {
    handleMouseMoveRef.current = handleMouseMove;
  }, [handleMouseMove]);

  useEffect(() => {
    const onGlobalMouseMove = (e: MouseEvent) => {
      handleMouseMoveRef.current(e);
    };
    window.addEventListener("mousemove", onGlobalMouseMove);
    return () => {
      window.removeEventListener("mousemove", onGlobalMouseMove);
    };
  }, []);

  const handleMouseUp = () => {
    if (isSelecting) {
      setIsSelecting(false);
      setStartPoint(null);
      if (selection && (selection.w < 10 || selection.h < 10)) {
        setSelection(null);
      }
    } else if (dragMode) {
      setDragMode(null);
      setDragStartPoint(null);
      setInitialSelection(null);
    } else if (isDrawing) {
      setIsDrawing(false);

      if (activeTool === "eraser") {
        if (currentEraserPoints.length > 0) {
          setFadingEraserTrails(prev => [...prev, { points: currentEraserPoints, endTime: Date.now() }]);
        }
        setCurrentEraserPoints([]);
      } else if (activeTool === "pencil" && currentPencilPoints.length > 0) {
        setDrawings((prev) => [
          ...prev,
          {
            type: "pencil",
            points: currentPencilPoints,
            color: drawColor,
            width: 3,
          },
        ]);
      } else if (activeTool === "rect" && drawingStart && drawingEnd) {
        setDrawings((prev) => [
          ...prev,
          {
            type: "rect",
            start: drawingStart,
            end: drawingEnd,
            color: drawColor,
            width: 3,
          },
        ]);
      } else if (activeTool === "line" && drawingStart && drawingEnd) {
        setDrawings((prev) => [
          ...prev,
          {
            type: "line",
            start: drawingStart,
            end: drawingEnd,
            color: drawColor,
            width: 3,
          },
        ]);
      } else if (activeTool === "circle" && drawingStart && drawingEnd) {
        setDrawings((prev) => [
          ...prev,
          {
            type: "circle",
            start: drawingStart,
            end: drawingEnd,
            color: drawColor,
            width: 3,
          },
        ]);
      } else if (activeTool === "arrow" && drawingStart && drawingEnd) {
        setDrawings((prev) => [
          ...prev,
          {
            type: "arrow",
            start: drawingStart,
            end: drawingEnd,
            color: drawColor,
            width: 3,
          },
        ]);
      } else if (activeTool === "blur" && drawingStart && drawingEnd) {
        setDrawings((prev) => [
          ...prev,
          {
            type: "blur",
            start: drawingStart,
            end: drawingEnd,
            color: drawColor,
            width: 3,
            blurAmount: blurAmount,
          },
        ]);
      }

      setCurrentPencilPoints([]);
      setCurrentEraserPoints([]);
      setDrawingStart(null);
      setDrawingEnd(null);
    }
  };

  const handleMouseUpRef = useRef(handleMouseUp);
  useEffect(() => {
    handleMouseUpRef.current = handleMouseUp;
  }, [handleMouseUp]);

  useEffect(() => {
    const onGlobalMouseUp = () => {
      handleMouseUpRef.current();
    };
    window.addEventListener("mouseup", onGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", onGlobalMouseUp);
    };
  }, []);

  const handleTextSubmit = () => {
    if (textInput.val.trim() && selection) {
      setDrawings((prev) => [
        ...prev,
        {
          type: "text",
          start: { x: textInput.x, y: textInput.y },
          text: textInput.val,
          color: drawColor,
          width: 3,
          bold: textBold,
          italic: textItalic,
          underline: textUnderline,
          strikethrough: textStrikethrough
        },
      ]);
    }
    setTextInput({ visible: false, x: 0, y: 0, val: "" });
  };

  const getCroppedBase64 = (format = "PNG", quality = 90): string | null => {
    if (!selection || !imgElement) return null;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = selection.w;
    tempCanvas.height = selection.h;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return null;

    const w = window.innerWidth;
    const h = window.innerHeight;
    if (boardMode === "white") {
      tempCtx.fillStyle = "#ffffff";
      tempCtx.fillRect(0, 0, selection.w, selection.h);
    } else if (boardMode === "black") {
      tempCtx.fillStyle = "#000000";
      tempCtx.fillRect(0, 0, selection.w, selection.h);
    } else {
      tempCtx.drawImage(
        imgElement,
        (selection.x * imgElement.naturalWidth) / w,
        (selection.y * imgElement.naturalHeight) / h,
        (selection.w * imgElement.naturalWidth) / w,
        (selection.h * imgElement.naturalHeight) / h,
        0,
        0,
        selection.w,
        selection.h
      );
    }


    tempCtx.save();
    tempCtx.translate(-selection.x, -selection.y);

    const drawAction = (act: DrawingAction) => {
      tempCtx.strokeStyle = act.color;
      tempCtx.fillStyle = act.color;
      tempCtx.lineWidth = act.width;
      tempCtx.lineCap = "round";
      tempCtx.lineJoin = "round";

      if (act.type === "pencil" && act.points && act.points.length > 0) {
        tempCtx.beginPath();
        tempCtx.moveTo(act.points[0].x, act.points[0].y);
        for (let i = 1; i < act.points.length; i++) {
          tempCtx.lineTo(act.points[i].x, act.points[i].y);
        }
        tempCtx.stroke();
      } else if (act.type === "rect" && act.start && act.end) {
        tempCtx.strokeRect(
          act.start.x,
          act.start.y,
          act.end.x - act.start.x,
          act.end.y - act.start.y
        );
      } else if (act.type === "line" && act.start && act.end) {
        tempCtx.beginPath();
        tempCtx.moveTo(act.start.x, act.start.y);
        tempCtx.lineTo(act.end.x, act.end.y);
        tempCtx.stroke();
      } else if (act.type === "circle" && act.start && act.end) {
        const rx = Math.abs(act.end.x - act.start.x) / 2;
        const ry = Math.abs(act.end.y - act.start.y) / 2;
        const cx = act.start.x + (act.end.x - act.start.x) / 2;
        const cy = act.start.y + (act.end.y - act.start.y) / 2;
        tempCtx.beginPath();
        tempCtx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        tempCtx.stroke();
      } else if (act.type === "arrow" && act.start && act.end) {
        const fromX = act.start.x;
        const fromY = act.start.y;
        const toX = act.end.x;
        const toY = act.end.y;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const headLength = 15;

        tempCtx.beginPath();
        tempCtx.moveTo(fromX, fromY);
        tempCtx.lineTo(toX, toY);
        tempCtx.stroke();

        tempCtx.beginPath();
        tempCtx.moveTo(toX, toY);
        tempCtx.lineTo(
          toX - headLength * Math.cos(angle - Math.PI / 6),
          toY - headLength * Math.sin(angle - Math.PI / 6)
        );
        tempCtx.lineTo(
          toX - headLength * Math.cos(angle + Math.PI / 6),
          toY - headLength * Math.sin(angle + Math.PI / 6)
        );
        tempCtx.fill();
      } else if (act.type === "blur" && act.start && act.end) {
        tempCtx.save();
        const bx = Math.min(act.start.x, act.end.x);
        const by = Math.min(act.start.y, act.end.y);
        const bw = Math.abs(act.end.x - act.start.x);
        const bh = Math.abs(act.end.y - act.start.y);

        if (bw > 0 && bh > 0) {
          tempCtx.beginPath();
          tempCtx.rect(bx, by, bw, bh);
          tempCtx.clip();

          const currentBlur = act.blurAmount ?? blurAmount ?? 8;
          const pad = Math.ceil(currentBlur * 2);

          const screenW = window.innerWidth;
          const screenH = window.innerHeight;

          const sx = Math.max(0, bx - pad);
          const sy = Math.max(0, by - pad);
          const sw = Math.min(screenW - sx, bw + (bx - sx) + pad);
          const sh = Math.min(screenH - sy, bh + (by - sy) + pad);

          const dx = sx;
          const dy = sy;
          const dw = sw;
          const dh = sh;

          const scaleX = imgElement.naturalWidth / screenW;
          const scaleY = imgElement.naturalHeight / screenH;

          tempCtx.filter = `blur(${currentBlur}px)`;
          tempCtx.drawImage(
            imgElement,
            sx * scaleX,
            sy * scaleY,
            sw * scaleX,
            sh * scaleY,
            dx, dy, dw, dh
          );
        }
        tempCtx.restore();
      } else if (act.type === "step" && act.start && act.stepNumber) {
        const radius = 14;
        tempCtx.beginPath();
        tempCtx.arc(act.start.x, act.start.y, radius, 0, 2 * Math.PI);
        tempCtx.fillStyle = act.color;
        tempCtx.fill();

        tempCtx.fillStyle = "#ffffff";
        tempCtx.font = "bold 16px Inter, Arial, sans-serif";
        tempCtx.textAlign = "center";
        tempCtx.textBaseline = "middle";
        tempCtx.fillText(act.stepNumber.toString(), act.start.x, act.start.y + 1);
      } else if (act.type === "text" && act.start && act.text) {
        tempCtx.textAlign = "left";
        tempCtx.textBaseline = "top";
        const fontStyle = act.italic ? "italic" : "normal";
        const fontWeight = act.bold ? "bold" : "normal";
        tempCtx.font = `${fontStyle} ${fontWeight} 16px Inter, Arial, sans-serif`;
        tempCtx.fillText(act.text, act.start.x, act.start.y);

        // Draw underline/strikethrough if needed
        const textWidth = tempCtx.measureText(act.text).width;
        const textHeight = 16;

        if (act.underline) {
          tempCtx.beginPath();
          tempCtx.moveTo(act.start.x, act.start.y + textHeight + 2);
          tempCtx.lineTo(act.start.x + textWidth, act.start.y + textHeight + 2);
          tempCtx.strokeStyle = act.color;
          tempCtx.lineWidth = 1.5;
          tempCtx.stroke();
        }

        if (act.strikethrough) {
          tempCtx.beginPath();
          tempCtx.moveTo(act.start.x, act.start.y + textHeight / 2 + 1);
          tempCtx.lineTo(act.start.x + textWidth, act.start.y + textHeight / 2 + 1);
          tempCtx.strokeStyle = act.color;
          tempCtx.lineWidth = 1.5;
          tempCtx.stroke();
        }
      }
    };

    drawings.forEach(drawAction);
    tempCtx.restore();

    const mimeType = format.toLowerCase() === "jpg" ? "image/jpeg" : `image/${format.toLowerCase()}`;
    const qValue = quality / 100;
    const dataUrl = tempCanvas.toDataURL(mimeType, qValue);
    const parts = dataUrl.split(",");
    return parts.length > 1 ? parts[1] : null;
  };

  const playShutterSoundIfEnabled = () => {
    const playAudioSetting = localStorage.getItem("playAudio") !== "false";
    if (playAudioSetting) {
      new Audio(shutterSoundUrl).play().catch((err) => {
        console.error("Failed to play shutter sound:", err);
      });
    }
  };

  const handleCopy = async () => {
    // Copy to clipboard should always remain lossless PNG for high compatibility
    const base64 = getCroppedBase64("PNG", 100);
    if (!base64) return;
    try {
      playShutterSoundIfEnabled();
      await invoke("copy_base64_image_to_clipboard", { base64Str: base64 });
      handleClose();
    } catch (e) {
      console.error("Failed to copy image:", e);
    }
  };

  const handleSave = async () => {
    const format = localStorage.getItem("fileFormat") || "PNG";
    const quality = Number(localStorage.getItem("imageQuality") || "90");
    const base64 = getCroppedBase64(format, quality);
    if (!base64) return;
    try {
      playShutterSoundIfEnabled();
      await invoke("save_base64_image", { base64Str: base64, format: format });
      handleClose();
    } catch (e) {
      console.error("Failed to save image:", e);
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const handleUpload = async () => {
    const base64 = getCroppedBase64("PNG", 100);
    if (!base64) return;
    setIsUploading(true);
    try {
      const link = await invoke("upload_to_imgur", { base64Str: base64 });
      if (link) {
        playShutterSoundIfEnabled(); // success sound
        handleClose();
      }
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePin = async () => {
    const base64 = getCroppedBase64("PNG", 100);
    if (!base64) return;

    const w = selection ? selection.w : window.innerWidth;
    const h = selection ? selection.h : window.innerHeight;
    const x = selection ? selection.x : 0;
    const y = selection ? selection.y : 0;

    try {
      playShutterSoundIfEnabled();
      await invoke("pin_image", { base64Str: base64, width: w + 4, height: h + 4, x: x - 2, y: y - 2 });
      handleClose();
    } catch (e) {
      console.error("Failed to pin image:", e);
    }
  };

  const [isOcring, setIsOcring] = useState(false);
  const handleOcr = async () => {
    const base64 = getCroppedBase64("PNG", 100);
    if (!base64) return;
    setIsOcring(true);
    try {
      const dataUrl = `data:image/png;base64,${base64}`;
      const worker = await Tesseract.createWorker(["tur", "eng"]);
      const { data: { text } } = await worker.recognize(dataUrl);
      await worker.terminate();

      const textClean = text.trim();

      if (textClean) {
        // Use browser clipboard API since it's just text
        await navigator.clipboard.writeText(textClean);
        playShutterSoundIfEnabled();
        const showNotif = localStorage.getItem("showNotifications") !== "false";
        if (showNotif) {
          sendNotification({
            title: "Shotera OCR",
            body: (t as any).ocrSuccess
          });
        }
      } else {
        const showNotif = localStorage.getItem("showNotifications") !== "false";
        if (showNotif) {
          sendNotification({
            title: "Shotera OCR",
            body: (t as any).ocrEmpty
          });
        }
      }
      handleClose();
    } catch (err: any) {
      console.error("OCR error", err);
      const showNotif = localStorage.getItem("showNotifications") !== "false";
      if (showNotif) {
        sendNotification({
          title: "Shotera OCR Error",
          body: (t as any).ocrError(err.message || err)
        });
      }
    } finally {
      setIsOcring(false);
    }
  };

  const getToolbarStyle = () => {
    if (!selection) return {};
    const margin = 12;
    const toolbarHeight = 44;

    // Dynamically estimate width based on active tool extra panels
    let estimatedWidth = 960;
    if (activeTool === "text") estimatedWidth = 1080;
    else if (activeTool === "blur") estimatedWidth = 1180;

    const measuredWidth = toolbarRef.current?.offsetWidth || 0;
    const toolbarWidth = Math.max(estimatedWidth, measuredWidth);

    const screenH = window.innerHeight;
    const screenW = window.innerWidth;

    let top = selection.y + selection.h + margin;
    if (top + toolbarHeight > screenH) {
      top = Math.max(margin, selection.y - toolbarHeight - margin);
    }

    const left = Math.max(
      margin,
      Math.min(
        screenW - toolbarWidth - margin,
        selection.x + selection.w - toolbarWidth
      )
    );
    return { top, left };
  };

  const getSizeIndicatorStyle = () => {
    if (!selection) return {};
    const margin = 8;
    let top = selection.y - 28;
    if (top < 0) {
      top = selection.y + margin;
    }
    const left = Math.min(window.innerWidth - 100 - margin, selection.x);
    return { top, left };
  };

  const t = translations[lang];

  return (
    <div className="capture-container" ref={containerRef}>
      {!selection && (
        <div className="capture-instructions">
          {t.dragToSelect}
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="capture-canvas"
        onMouseDown={handleMouseDown}
      />

      {selection && (
        <div className="size-indicator" style={getSizeIndicatorStyle()}>
          {selection.w} x {selection.h} px
        </div>
      )}

      {/* Floating Text Tool Input Overlay with propagation prevention */}
      {textInput.visible && (
        <input
          ref={textInputRef}
          type="text"
          className="canvas-text-input"
          value={textInput.val}
          onChange={(e) => setTextInput((p) => ({ ...p, val: e.target.value }))}
          onBlur={handleTextSubmit}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") handleTextSubmit();
            if (e.key === "Escape") setTextInput({ visible: false, x: 0, y: 0, val: "" });
          }}
          style={{
            top: textInput.y - 6,
            left: textInput.x - 9,
            color: drawColor,
            fontWeight: textBold ? "bold" : "normal",
            fontStyle: textItalic ? "italic" : "normal",
            textDecoration: `${textUnderline ? "underline" : ""} ${textStrikethrough ? "line-through" : ""}`.trim() || "none",
          }}
        />
      )}

      {selection && !isSelecting && (
        <div className="capture-toolbar" ref={toolbarRef} style={getToolbarStyle()}>
          <button
            className={`toolbar-btn ${activeTool === "select" ? "active" : ""}`}
            onClick={() => setActiveTool("select")}
            title={t.toolSelect}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round">
              <rect x="1.5" y="1.5" width="13" height="13" rx="1" />
            </svg>
          </button>

          <button
            className={`toolbar-btn ${activeTool === "pencil" ? "active" : ""}`}
            onClick={() => setActiveTool("pencil")}
            title={t.toolPencil}
          >
            <Pencil size={16} />
          </button>

          <button
            className={`toolbar-btn ${activeTool === "eraser" ? "active" : ""}`}
            onClick={() => setActiveTool("eraser")}
            title={(t as any).toolEraser || "Silgi (Erase)"}
          >
            <Eraser size={16} />
          </button>

          <button
            className={`toolbar-btn ${activeTool === "line" ? "active" : ""}`}
            onClick={() => setActiveTool("line")}
            title={t.toolLine}
          >
            <Slash size={16} />
          </button>

          <button
            className={`toolbar-btn ${activeTool === "arrow" ? "active" : ""}`}
            onClick={() => setActiveTool("arrow")}
            title={t.toolArrow}
          >
            <ArrowUpRight size={16} />
          </button>

          <button
            className={`toolbar-btn ${activeTool === "rect" ? "active" : ""}`}
            onClick={() => setActiveTool("rect")}
            title={t.toolRect}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="1.5" y="1.5" width="13" height="13" rx="1" />
            </svg>
          </button>

          <button
            className={`toolbar-btn ${activeTool === "circle" ? "active" : ""}`}
            onClick={() => setActiveTool("circle")}
            title={t.toolCircle}
          >
            <Circle size={16} />
          </button>

          <button
            className={`toolbar-btn ${activeTool === "text" ? "active" : ""}`}
            onClick={() => setActiveTool("text")}
            title={t.toolText}
          >
            <Type size={16} />
          </button>

          <button
            className={`toolbar-btn ${activeTool === "step" ? "active" : ""}`}
            onClick={() => setActiveTool("step")}
            title={(t as any).tooltipStepMode}
          >
            <ListOrdered size={16} />
          </button>

          <button
            className={`toolbar-btn ${activeTool === "blur" ? "active" : ""}`}
            onClick={() => setActiveTool("blur")}
            title={t.toolBlur}
          >
            <Droplets size={16} />
          </button>

          <button
            className="toolbar-btn"
            onClick={() => setDrawings((prev) => prev.slice(0, -1))}
            title={(t as any).tooltipUndo}
            disabled={drawings.length === 0}
            style={{ opacity: drawings.length === 0 ? 0.3 : 1 }}
          >
            <Undo size={16} />
          </button>

          <button
            className="toolbar-btn"
            onClick={() => setDrawings([])}
            title={t.toolClear}
            disabled={drawings.length === 0}
            style={{ opacity: drawings.length === 0 ? 0.3 : 1 }}
          >
            <Trash2 size={16} />
          </button>

          {activeTool === "text" && (
            <>
              <div className="toolbar-divider" />
              <div style={{ display: "flex", gap: "2px" }}>
                <button
                  className={`toolbar-btn ${textBold ? "active" : ""}`}
                  onClick={() => setTextBold(!textBold)}
                  style={{ fontWeight: "bold", width: "28px", height: "28px" }}
                  title={t.textBold}
                >
                  B
                </button>
                <button
                  className={`toolbar-btn ${textItalic ? "active" : ""}`}
                  onClick={() => setTextItalic(!textItalic)}
                  style={{ fontStyle: "italic", width: "28px", height: "28px" }}
                  title={t.textItalic}
                >
                  I
                </button>
                <button
                  className={`toolbar-btn ${textUnderline ? "active" : ""}`}
                  onClick={() => setTextUnderline(!textUnderline)}
                  style={{ textDecoration: "underline", width: "28px", height: "28px" }}
                  title={t.textUnderline}
                >
                  U
                </button>
                <button
                  className={`toolbar-btn ${textStrikethrough ? "active" : ""}`}
                  onClick={() => setTextStrikethrough(!textStrikethrough)}
                  style={{ textDecoration: "line-through", width: "28px", height: "28px" }}
                  title={t.textStrikethrough}
                >
                  S
                </button>
              </div>
            </>
          )}

          {activeTool === "blur" && (
            <>
              <div className="toolbar-divider" />
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {(t as any).blurSharpness || "Bulanıklık Yoğunluğu:"}
                </span>
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={blurAmount}
                  onChange={(e) => handleBlurAmountChange(Number(e.target.value))}
                  style={{ width: "90px", accentColor: "var(--accent-cyan)", cursor: "pointer" }}
                  title={`${blurAmount}px`}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontFamily: "monospace", minWidth: "32px", textAlign: "center" }}>
                  {blurAmount}px
                </span>
              </div>
            </>
          )}

          <div className="toolbar-divider" />

          <div style={{ display: "flex", gap: "6px", alignItems: "center", margin: "0 4px" }}>
            {["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#ffffff"].map((c) => (
              <div
                key={c}
                className={`color-option ${drawColor === c ? "active" : ""}`}
                style={{ backgroundColor: c }}
                onClick={() => setDrawColor(c)}
              />
            ))}

            {/* Custom Color Picker Popover */}
            <div style={{ position: "relative" }} ref={colorPickerRef}>
              <div
                className={`color-option ${showColorPicker ? "active" : ""}`}
                style={{
                  backgroundColor: drawColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed rgba(255,255,255,0.6)",
                  cursor: "pointer"
                }}
                onClick={() => setShowColorPicker(!showColorPicker)}
                title={t.colorPicker}
              >
                <Palette size={12} color="#fff" style={{ pointerEvents: "none", opacity: 0.9, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }} />
              </div>
              
              {showColorPicker && (
                <div style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translate(-50%, -10px)",
                  zIndex: 10000,
                  backgroundColor: "#1f2937",
                  padding: "12px",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  alignItems: "center"
                }}>
                  <HexColorPicker 
                    color={drawColor.startsWith("#") && drawColor.length === 7 ? drawColor : "#ef4444"} 
                    onChange={setDrawColor} 
                  />
                  <input
                    type="text"
                    value={drawColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        setDrawColor(val);
                      }
                    }}
                    style={{
                      width: "100%",
                      height: "30px",
                      fontSize: "0.85rem",
                      background: "rgba(0, 0, 0, 0.4)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "4px",
                      color: "#ffffff",
                      padding: "4px 8px",
                      outline: "none",
                      fontFamily: "monospace",
                      textAlign: "center"
                    }}
                    placeholder="#FF0000"
                    maxLength={7}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="toolbar-divider" />

          <button
            className="toolbar-btn action-copy"
            onClick={handleCopy}
            title={t.actionCopy}
          >
            <Copy size={16} />
          </button>

          <button
            className="toolbar-btn"
            style={{ color: "#f59e0b" }}
            onClick={handlePin}
            title={t.actionPin}
          >
            <Pin size={16} />
          </button>

          <button
            className="toolbar-btn"
            style={{ color: "#3b82f6", opacity: isUploading ? 0.5 : 1 }}
            disabled={isUploading}
            onClick={handleUpload}
            title={t.actionUpload}
          >
            <CloudUpload size={16} />
          </button>

          <button
            className="toolbar-btn"
            style={{ color: "#8b5cf6", opacity: isOcring ? 0.5 : 1 }}
            disabled={isOcring}
            onClick={handleOcr}
            title={t.actionOcr}
          >
            <ScanText size={16} />
          </button>

          <button
            className="toolbar-btn action-save"
            onClick={handleSave}
            title={t.actionSave}
          >
            <Download size={16} />
          </button>

          <button
            className="toolbar-btn action-close"
            onClick={handleClose}
            title={t.actionClose}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default ScreenshotCapture;
