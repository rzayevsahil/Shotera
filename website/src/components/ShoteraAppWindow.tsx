import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, WheelEvent as ReactWheelEvent } from 'react';
import {
  Pencil,
  ArrowUpRight,
  Square,
  Circle,
  Type,
  ListOrdered,
  Droplets,
  Eraser,
  Undo2,
  Trash2,
  Copy,
  Download,
  CloudUpload,
  Pin,
  ScanText,
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Camera,
  Mic,
  MicOff,
  ZoomIn,
  ZoomOut,
  Palette,
  Check,
  Slash
} from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { InteractiveWebcamOverlay } from './InteractiveWebcamOverlay';

// Custom eraser cursor matching the lucide icon, scaled down to 16x16
const ERASER_CURSOR = `url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m7%2021-4.3-4.3c-1-1-1-2.5%200-3.4l9.6-9.6c1-1%202.5-1%203.4%200l5.6%205.6c1%201%201%202.5%200%203.4L13%2021%22%20%2F%3E%3Cpath%20d%3D%22M22%2021H7%22%20%2F%3E%3Cpath%20d%3D%22m5%2011%209%209%22%20%2F%3E%3C%2Fsvg%3E") 4 14, crosshair`;

type ToolType = 'pointer' | 'pen' | 'arrow' | 'rect' | 'solid-rect' | 'circle' | 'solid-circle' | 'triangle' | 'solid-triangle' | 'line' | 'dashed-line' | 'wave' | 'step' | 'text' | 'blur' | 'eraser';

interface DrawingItem {
  id: string;
  type: ToolType;
  color: string;
  strokeWidth: number;
  points?: { x: number; y: number }[];
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  blurAmount?: number;
  stepNumber?: number;
  isErasing?: boolean;
}

const PRESET_COLORS = [
  { hex: '#ef4444', label: 'Red' },
  { hex: '#3b82f6', label: 'Blue' },
  { hex: '#10b981', label: 'Green' },
  { hex: '#f59e0b', label: 'Orange' },
  { hex: '#ffffff', label: 'White' },
];
const SHAPE_TOOLS = [
  { id: "rect", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="1" /></svg>, title: "Kare (Boş)" },
  { id: "solid-rect", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="2" y="2" width="12" height="12" rx="1" /></svg>, title: "Kare (Dolu)" },
  { id: "circle", icon: <Circle size={16} />, title: "Yuvarlak (Boş)" },
  { id: "solid-circle", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="6" /></svg>, title: "Yuvarlak (Dolu)" },
  { id: "triangle", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="8,2 14,14 2,14" /></svg>, title: "Üçgen (Boş)" },
  { id: "solid-triangle", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><polygon points="8,2 14,14 2,14" /></svg>, title: "Üçgen (Dolu)" },
  { id: "line", icon: <Slash size={16} />, title: "Çizgi" },
  { id: "dashed-line", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3"><line x1="2" y1="14" x2="14" y2="2" /></svg>, title: "Kırık Çizgi" },
  { id: "arrow", icon: <ArrowUpRight size={16} />, title: "Ok" },
  { id: "wave", icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2,8 Q5,3 8,8 T14,8" /></svg>, title: "Dalga" },
];

export function ShoteraAppWindow() {
  const [activeTab, setActiveTab] = useState<'annotation' | 'zoom' | 'record'>('annotation');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Code File Tab in the Editor
  const [activeCodeFile, setActiveCodeFile] = useState<'index.ts' | 'config.json'>('index.ts');

  // Drawing State
  const [selectedTool, setSelectedTool] = useState<ToolType>('pen');
  const [selectedColor, setSelectedColor] = useState<string>('#38BDF8');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [blurAmount, setBlurAmount] = useState<number>(12);

  // Text formatting
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [textStrikethrough, setTextStrikethrough] = useState(false);

  // Shape Menu State
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [lastShape, setLastShape] = useState<ToolType>('rect');

  // Color Picker State
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Initial demo items showing real capability
  const [items, setItems] = useState<DrawingItem[]>([
    {
      id: 'demo-step',
      type: 'step',
      color: '#38BDF8',
      strokeWidth: 3,
      startX: 230,
      startY: 195,
      stepNumber: 1,
    },
    {
      id: 'demo-arrow',
      type: 'arrow',
      color: '#38BDF8',
      strokeWidth: 3,
      startX: 175,
      startY: 230,
      endX: 218,
      endY: 204,
    },
  ]);

  const [currentDraft, setCurrentDraft] = useState<DrawingItem | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [stepCounter, setStepCounter] = useState(2);

  // Floating Pinned Window Simulation
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);
  const [pinnedPosition, setPinnedPosition] = useState({ x: 40, y: 50 });

  // Text insertion state
  const [activeTextInput, setActiveTextInput] = useState<{ x: number; y: number; text: string } | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Eraser hover and trail state
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [currentEraserPoints, setCurrentEraserPoints] = useState<{ x: number; y: number; time: number }[]>([]);
  const [animFrame, setAnimFrame] = useState(0);

  // Video/Audio mock state
  const [zoomLevel, setZoomLevel] = useState<number>(2);
  const [zoomPan, setZoomPan] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // Recording Simulation State
  const [isRecording, setIsRecording] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(252); // 00:04:12 matching screenshot
  const [audioLevels, setAudioLevels] = useState<number[]>([35, 60, 80, 45, 90, 70, 50, 85, 65, 95, 40, 75, 90, 60, 45]);
  const [recordPanelPos, setRecordPanelPos] = useState({ x: 0, y: 0 });
  const [isDraggingRecord, setIsDraggingRecord] = useState(false);
  const recordDragStart = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });

  const startRecordDrag = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingRecord(true);
    recordDragStart.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: recordPanelPos.x,
      initY: recordPanelPos.y,
    };
  };

  // Instant OCR State
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrCopied, setOcrCopied] = useState(false);

  // Capture Window Resizing Simulation
  const [box, setBox] = useState({ left: -336, top: -189, right: 336, bottom: 189 });
  const [resizingDir, setResizingDir] = useState<string | null>(null);
  const dragStart = useRef({ startX: 0, startY: 0, initL: 0, initR: 0, initT: 0, initB: 0 });

  // Zoom Hint Overlay State
  const [showZoomHint, setShowZoomHint] = useState(false);
  const [fadeZoomHint, setFadeZoomHint] = useState(false);

  const startDrag = (e: React.PointerEvent, dir: string) => {
    e.stopPropagation();
    setResizingDir(dir);
    dragStart.current = {
      startX: e.clientX,
      startY: e.clientY,
      initL: box.left,
      initR: box.right,
      initT: box.top,
      initB: box.bottom
    };
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Zoom Hint Timer
  useEffect(() => {
    if (activeTab === 'zoom') {
      setShowZoomHint(true);
      setFadeZoomHint(false);
      const fadeTimer = setTimeout(() => setFadeZoomHint(true), 2500);
      const removeTimer = setTimeout(() => setShowZoomHint(false), 3000);
      return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); };
    } else {
      setShowZoomHint(false);
      setFadeZoomHint(false);
    }
  }, [activeTab]);

  // Eraser comet tail animation loop
  useEffect(() => {
    if (currentEraserPoints.length > 0) {
      const frame = requestAnimationFrame(() => {
        setAnimFrame((f) => f + 1);
        const now = Date.now();
        setCurrentEraserPoints((prev) => {
          const valid = prev.filter((p) => now - p.time <= 250);
          return valid.length === prev.length ? prev : valid;
        });
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [currentEraserPoints, animFrame]);

  // Recording stopwatch timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
        setAudioLevels((prev) =>
          prev.map(() => Math.floor(Math.random() * 65) + 25)
        );
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  // Recording Panel Drag Logic
  useEffect(() => {
    if (!isDraggingRecord) return;
    const handleGlobalMove = (e: MouseEvent) => {
      const dx = e.clientX - recordDragStart.current.startX;
      const dy = e.clientY - recordDragStart.current.startY;
      setRecordPanelPos({
        x: recordDragStart.current.initX + dx,
        y: recordDragStart.current.initY + dy,
      });
    };
    const handleGlobalUp = () => setIsDraggingRecord(false);

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [isDraggingRecord]);

  // Window Resize Logic
  useEffect(() => {
    if (!resizingDir) return;
    const handleGlobalMove = (e: MouseEvent) => {
      setBox(() => {
        const dx = e.clientX - dragStart.current.startX;
        const dy = e.clientY - dragStart.current.startY;
        
        let newL = dragStart.current.initL;
        let newR = dragStart.current.initR;
        let newT = dragStart.current.initT;
        let newB = dragStart.current.initB;

        if (resizingDir === 'move') {
           return {
             left: newL + dx,
             right: newR + dx,
             top: newT + dy,
             bottom: newB + dy
           };
        }

        if (resizingDir.includes('e')) newR += dx;
        if (resizingDir.includes('w')) newL += dx;
        if (resizingDir.includes('s')) newB += dy;
        if (resizingDir.includes('n')) newT += dy;

        let w = newR - newL;
        let h = newB - newT;

        if (w < 300) {
           if (resizingDir.includes('e')) newR = newL + 300;
           if (resizingDir.includes('w')) newL = newR - 300;
        }
        if (w > 1400) {
           if (resizingDir.includes('e')) newR = newL + 1400;
           if (resizingDir.includes('w')) newL = newR - 1400;
        }

        if (h < 200) {
           if (resizingDir.includes('s')) newB = newT + 200;
           if (resizingDir.includes('n')) newT = newB - 200;
        }
        if (h > 900) {
           if (resizingDir.includes('s')) newB = newT + 900;
           if (resizingDir.includes('n')) newT = newB - 900;
        }

        return {
          left: newL,
          right: newR,
          top: newT,
          bottom: newB
        };
      });
    };
    const handleGlobalUp = () => setResizingDir(null);

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalUp);
    };
  }, [resizingDir]);

  // Format seconds to HH:MM:SS
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get SVG Relative Point
  const getSvgCoordinates = useCallback((e: ReactMouseEvent | ReactTouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
    return { x: Math.round(x), y: Math.round(y) };
  }, []);

  // Eraser collision helper: soft remove items near point
  const eraseNearPoint = useCallback((px: number, py: number, radius = 22) => {
    setItems((prev) => {
      let erasedCount = 0;
      const next = prev.map((act) => {
        if (act.isErasing) return act;

        let isHit = false;
        if (act.type === 'pen' && act.points) {
          isHit = act.points.some((pt) => Math.hypot(pt.x - px, pt.y - py) <= radius);
        } else if (act.type === 'step' && act.startX !== undefined && act.startY !== undefined) {
          isHit = Math.hypot(act.startX - px, act.startY - py) <= radius + 14;
        } else if (act.startX !== undefined && act.startY !== undefined && act.endX !== undefined && act.endY !== undefined) {
          const minX = Math.min(act.startX, act.endX) - radius;
          const maxX = Math.max(act.startX, act.endX) + radius;
          const minY = Math.min(act.startY, act.endY) - radius;
          const maxY = Math.max(act.startY, act.endY) + radius;
          isHit = px >= minX && px <= maxX && py >= minY && py <= maxY;
        } else if (act.startX !== undefined && act.startY !== undefined) {
          isHit = Math.hypot(act.startX - px, act.startY - py) <= radius + 20;
        }

        if (isHit) {
          erasedCount++;
          return { ...act, isErasing: true };
        }
        return act;
      });

      if (erasedCount > 0) {
        showToast('Silindi (Erased)');
        // Trigger actual removal after animation
        setTimeout(() => {
          setItems((current) => current.filter((i) => !i.isErasing));
        }, 400);
      }
      return next;
    });
  }, []);

  // Handle Wheel on Canvas (Dynamic Stroke Width in Draw Mode, Dynamic Zoom in Zoom Mode)
  const handleCanvasWheel = (e: ReactWheelEvent) => {
    if (activeTab === 'annotation') {
      const delta = e.deltaY < 0 ? 1 : -1;
      setStrokeWidth((prev) => {
        const next = Math.max(1, Math.min(18, prev + delta));
        showToast(`Fırça Kalınlığı: ${next}px`);
        return next;
      });
    } else if (activeTab === 'zoom') {
      if (e.deltaY < 0) {
        setZoomLevel((prev) => Math.min(8, prev === 2 ? 4 : prev === 4 ? 8 : 8));
        showToast(`Yakınlaştırma: ${Math.min(8, zoomLevel * 2)}×`);
      } else {
        setZoomLevel((prev) => Math.max(2, prev === 8 ? 4 : prev === 4 ? 2 : 2));
        showToast(`Yakınlaştırma: ${Math.max(2, Math.floor(zoomLevel / 2))}×`);
      }
    }
  };

  // Mouse Down
  const handleMouseDown = (e: ReactMouseEvent) => {
    if (activeTab === 'zoom') {
      setActiveTab('annotation');
      showToast('Kare Donduruldu -> Çizim Moduna Geçildi (Freeze & Draw)');
      return;
    }
    if (activeTab !== 'annotation') return;
    if (selectedTool === 'pointer') return;

    const { x, y } = getSvgCoordinates(e);

    if (selectedTool === 'eraser') {
      setIsDrawing(true);
      eraseNearPoint(x, y);
      return;
    }

    if (selectedTool === 'text') {
      setActiveTextInput({ x, y, text: '' });
      setTimeout(() => textInputRef.current?.focus(), 50);
      return;
    }

    if (selectedTool === 'step') {
      const newStep: DrawingItem = {
        id: `step-${Date.now()}`,
        type: 'step',
        color: selectedColor,
        strokeWidth,
        startX: x,
        startY: y,
        stepNumber: stepCounter,
      };
      setItems((prev) => [...prev, newStep]);
      setStepCounter((c) => c + 1);
      showToast(`Adım ${stepCounter} Rozeti Eklendi`);
      return;
    }

    setIsDrawing(true);

    if (selectedTool === 'pen') {
      setCurrentDraft({
        id: `draft-${Date.now()}`,
        type: 'pen',
        color: selectedColor,
        strokeWidth,
        points: [{ x, y }],
      });
    } else {
      setCurrentDraft({
        id: `draft-${Date.now()}`,
        type: selectedTool,
        color: selectedColor,
        strokeWidth,
        blurAmount,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
      });
    }
  };

  // Mouse Move
  const handleMouseMove = (e: ReactMouseEvent) => {
    const { x, y } = getSvgCoordinates(e);

    // Zoom mode pan tracking
    if (activeTab === 'zoom' && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const panX = Math.round((x / rect.width) * 100);
      const panY = Math.round((y / rect.height) * 100);
      setZoomPan({ x: panX, y: panY });
    }

    if (selectedTool === 'eraser' && !isDrawing) {
      // Hover detection for eraser traces
      let foundId: string | null = null;
      let minDistance = 22;

      for (let i = items.length - 1; i >= 0; i--) {
        const act = items[i];
        if (act.isErasing) continue;

        let isHit = false;
        if (act.type === 'pen' && act.points) {
          isHit = act.points.some((pt) => Math.hypot(pt.x - x, pt.y - y) <= minDistance);
        } else if (act.type === 'step' && act.startX !== undefined && act.startY !== undefined) {
          isHit = Math.hypot(act.startX - x, act.startY - y) <= minDistance + 14;
        } else if (act.startX !== undefined && act.startY !== undefined && act.endX !== undefined && act.endY !== undefined) {
          const minX = Math.min(act.startX, act.endX) - minDistance;
          const maxX = Math.max(act.startX, act.endX) + minDistance;
          const minY = Math.min(act.startY, act.endY) - minDistance;
          const maxY = Math.max(act.startY, act.endY) + minDistance;
          isHit = x >= minX && x <= maxX && y >= minY && y <= maxY;
        } else if (act.startX !== undefined && act.startY !== undefined) {
          isHit = Math.hypot(act.startX - x, act.startY - y) <= minDistance + 20;
        }

        if (isHit) {
          foundId = act.id;
          break;
        }
      }
      setHoveredItemId(foundId);
    } else if (hoveredItemId !== null) {
      setHoveredItemId(null);
    }

    if (!isDrawing) return;

    if (selectedTool === 'eraser') {
      setCurrentEraserPoints((prev) => [...prev, { x, y, time: Date.now() }]);
      eraseNearPoint(x, y);
      return;
    }

    if (!currentDraft) return;

    if (currentDraft.type === 'pen') {
      setCurrentDraft((prev) => {
        if (!prev || !prev.points) return prev;
        return {
          ...prev,
          points: [...prev.points, { x, y }],
        };
      });
    } else {
      setCurrentDraft((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          endX: x,
          endY: y,
        };
      });
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentDraft) {
      if (currentDraft.type === 'pen') {
        if (currentDraft.points && currentDraft.points.length > 1) {
          setItems((prev) => [...prev, currentDraft]);
        }
      } else if (
        currentDraft.startX !== undefined &&
        currentDraft.startY !== undefined &&
        currentDraft.endX !== undefined &&
        currentDraft.endY !== undefined
      ) {
        const dist = Math.hypot(currentDraft.endX - currentDraft.startX, currentDraft.endY - currentDraft.startY);
        if (dist > 5 || currentDraft.type === 'blur') {
          setItems((prev) => [...prev, currentDraft]);
        }
      }
      setCurrentDraft(null);
    }
  };

  // Text Commit
  const handleCommitText = () => {
    if (activeTextInput && activeTextInput.text.trim()) {
      const newTextItem: DrawingItem = {
        id: `text-${Date.now()}`,
        type: 'text',
        color: selectedColor,
        strokeWidth,
        startX: activeTextInput.x,
        startY: activeTextInput.y,
        text: activeTextInput.text.trim(),
        bold: textBold,
        italic: textItalic,
        underline: textUnderline,
        strikethrough: textStrikethrough,
      };
      setItems((prev) => [...prev, newTextItem]);
    }
    setActiveTextInput(null);
  };

  // Undo
  const handleUndo = () => {
    if (items.length === 0) return;
    setItems((prev) => prev.slice(0, -1));
    showToast('Son işlem geri alındı (Undo)');
  };

  // Clear All
  const handleClearAll = () => {
    setItems([]);
    setStepCounter(1);
    showToast('Çizimler temizlendi (Clear)');
  };

  // Copy Mock
  const handleCopyMock = () => {
    setCopiedNotification(true);
    showToast('Ekran görüntüsü panoya kopyalandı! (Ctrl+C)');
    setTimeout(() => setCopiedNotification(false), 2200);
  };

  // Save Mock
  const handleSaveMock = () => {
    showToast('Kayıpsız ekran görüntüsü indirildi (PNG)');
  };

  // Instant OCR Laser Scan
  const handleInstantOcrScan = () => {
    setIsOcrScanning(true);
    const codeSnippet =
      activeCodeFile === 'index.ts'
        ? `import { createEngine } from '@shotera/core';\nconst engine = createEngine({\n  fps: 60,\n  mode: 'lossless-gpu',\n  enableZoom: true,\n});\nengine.startCapture();`
        : `{\n  "engine": "@shotera/core",\n  "capture": {\n    "fps": 60,\n    "mode": "lossless-gpu",\n    "enableZoom": true\n  }\n}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codeSnippet);
      }
    } catch {
      // fallback
    }

    setOcrCopied(true);
    showToast('OCR: Ekrandaki metin başarıyla panoya kopyalandı!');
    setTimeout(() => setIsOcrScanning(false), 900);
    setTimeout(() => setOcrCopied(false), 2500);
  };

  // Arrow Rendering
  const renderArrow = (item: DrawingItem) => {
    const { startX = 0, startY = 0, endX = 0, endY = 0, color, strokeWidth: sw } = item;
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowHeadLen = 14 + sw;
    const arrowPoint1X = endX - arrowHeadLen * Math.cos(angle - Math.PI / 7);
    const arrowPoint1Y = endY - arrowHeadLen * Math.sin(angle - Math.PI / 7);
    const arrowPoint2X = endX - arrowHeadLen * Math.cos(angle + Math.PI / 7);
    const arrowPoint2Y = endY - arrowHeadLen * Math.sin(angle + Math.PI / 7);

    return (
      <g key={item.id} className="cursor-pointer select-none">
        <circle cx={startX} cy={startY} r={sw + 1.5} fill={color} />
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
        />
        <polygon
          points={`${endX},${endY} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`}
          fill={color}
        />
      </g>
    );
  };

  // Render individual annotation item
  const renderDrawingItem = (item: DrawingItem) => {
    const isHovered = item.id === hoveredItemId;
    const isErasing = !!item.isErasing;
    const color = isHovered || isErasing ? 'rgba(156, 163, 175, 0.7)' : item.color;
    const sw = isHovered ? item.strokeWidth + 2 : item.strokeWidth;
    const { id, type, startX = 0, startY = 0, endX = 0, endY = 0 } = item;

    if (type === 'pen' && item.points && item.points.length > 1) {
      const d = item.points.reduce(
        (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
        ''
      );
      return (
        <path
          key={id}
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }

    if (type === 'arrow') {
      return renderArrow(item);
    }

    if (type === 'rect') {
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const w = Math.abs(endX - startX);
      const h = Math.abs(endY - startY);
      return (
        <rect
          key={id}
          x={x}
          y={y}
          width={w}
          height={h}
          fill={`${color}15`}
          stroke={color}
          strokeWidth={sw}
          rx="6"
        />
      );
    }

    if (type === 'circle') {
      const rx = Math.abs(endX - startX) / 2;
      const ry = Math.abs(endY - startY) / 2;
      const cx = (startX + endX) / 2;
      const cy = (startY + endY) / 2;
      return (
        <ellipse
          key={id}
          cx={cx}
          cy={cy}
          rx={Math.max(4, rx)}
          ry={Math.max(4, ry)}
          fill={`${color}15`}
          stroke={color}
          strokeWidth={sw}
        />
      );
    }

    if (type === 'solid-rect') {
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const w = Math.abs(endX - startX);
      const h = Math.abs(endY - startY);
      return (
        <rect
          key={id}
          x={x}
          y={y}
          width={w}
          height={h}
          fill={color}
          rx="6"
        />
      );
    }

    if (type === 'solid-circle') {
      const rx = Math.abs(endX - startX) / 2;
      const ry = Math.abs(endY - startY) / 2;
      const cx = (startX + endX) / 2;
      const cy = (startY + endY) / 2;
      return (
        <ellipse
          key={id}
          cx={cx}
          cy={cy}
          rx={Math.max(4, rx)}
          ry={Math.max(4, ry)}
          fill={color}
        />
      );
    }

    if (type === 'triangle') {
      return (
        <polygon
          key={id}
          points={`${startX + (endX - startX) / 2},${startY} ${endX},${endY} ${startX},${endY}`}
          fill={`${color}15`}
          stroke={color}
          strokeWidth={sw}
        />
      );
    }

    if (type === 'solid-triangle') {
      return (
        <polygon
          key={id}
          points={`${startX + (endX - startX) / 2},${startY} ${endX},${endY} ${startX},${endY}`}
          fill={color}
        />
      );
    }

    if (type === 'line') {
      return (
        <line
          key={id}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      );
    }

    if (type === 'dashed-line') {
      return (
        <line
          key={id}
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray="8,8"
        />
      );
    }

    if (type === 'wave') {
      const dx = endX - startX;
      const dy = endY - startY;
      const distance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const amplitude = 5;
      const frequency = 10;

      let d = `M 0 0`;
      for (let i = 0; i <= distance; i += 2) {
        d += ` L ${i} ${Math.sin(i / frequency) * amplitude}`;
      }

      return (
        <g key={id} transform={`translate(${startX}, ${startY}) rotate(${(angle * 180) / Math.PI})`}>
          <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    }

    if (type === 'blur') {
      const x = Math.min(startX, endX);
      const y = Math.min(startY, endY);
      const w = Math.max(8, Math.abs(endX - startX));
      const h = Math.max(8, Math.abs(endY - startY));
      return (
        <foreignObject
          key={id}
          x={x}
          y={y}
          width={w}
          height={h}
          className="overflow-hidden pointer-events-none select-none rounded-sm"
        >
          <div
            className="w-full h-full bg-transparent"
            style={{ backdropFilter: `blur(${item.blurAmount || 12}px)` }}
          />
        </foreignObject>
      );
    }

    if (type === 'step') {
      return (
        <g key={id} className="cursor-pointer select-none">
          <circle cx={startX} cy={startY} r="13" fill={color} filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))" />
          <text
            x={startX}
            y={startY + 4.5}
            textAnchor="middle"
            fill="#0F172A"
            fontSize="12"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            {item.stepNumber ?? 1}
          </text>
        </g>
      );
    }

    if (type === 'text' && item.text) {
      return (
        <g key={id} className="select-none">
          <rect
            x={startX}
            y={startY - 20}
            width={item.text.length * 8.5 + 20}
            height="28"
            rx="6"
            fill="#0F172A"
            stroke={color}
            strokeWidth="1.5"
            opacity="0.95"
          />
          <text
            x={startX + 10}
            y={startY - 2}
            fill={color}
            fontSize="13"
            fontWeight={item.bold ? '900' : 'bold'}
            fontStyle={item.italic ? 'italic' : 'normal'}
            textDecoration={`${item.underline ? 'underline' : ''} ${item.strikethrough ? 'line-through' : ''}`.trim() || 'none'}
            fontFamily="monospace"
          >
            {item.text}
          </text>
        </g>
      );
    }

    return null;
  };

  const recordBox = { left: -336, top: -189, right: 336, bottom: 189 };
  const currentBox = activeTab === 'record' ? recordBox : box;

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl bg-[#090d16] border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-200"
    >
      {/* ========================================================================= */}
      {/* 1. WINDOW TITLEBAR - 1:1 WITH USER SCREENSHOT ("SHOTERA STUDIO") */}
      {/* ========================================================================= */}
      <div className="bg-[#0b101c] text-slate-200 px-4 py-3 flex items-center justify-between select-none border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {/* Mac window dots */}
          <div className="flex items-center gap-1.5 mr-1">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f] hover:brightness-110 cursor-pointer" />
          </div>

          {/* Aperture / Shutter Icon in Cyan Square + SHOTERA STUDIO */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-cyan-400/80 bg-cyan-950/40 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-cyan-400" />
            </div>
            <span className="text-[13px] font-bold tracking-wider text-white uppercase font-sans">
              SHOTERA STUDIO
            </span>
          </div>
        </div>

        {/* Feature Mode Switcher Pills (Top Right) */}
        <div className="flex items-center bg-[#070b14] p-1 rounded-full border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('annotation')}
            className={`px-4 py-1 rounded-full font-bold text-xs transition-all ${activeTab === 'annotation'
              ? 'bg-white text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            Draw & Markup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('zoom')}
            className={`px-4 py-1 rounded-full font-bold text-xs transition-all ${activeTab === 'zoom'
              ? 'bg-white text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            Live Zoom
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('record')}
            className={`px-4 py-1 rounded-full font-bold text-xs transition-all ${activeTab === 'record'
              ? 'bg-white text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            Recording
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN DESKTOP CANVAS WITH ATMOSPHERIC GLOW */}
      {/* ========================================================================= */}
      <div
        onWheel={handleCanvasWheel}
        className="relative bg-slate-900 h-[460px] sm:h-[550px] flex items-center justify-center p-4 sm:p-8 select-none overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2000&auto=format&fit=crop')"
        }}
      >
        {/* ----------------------------------------------------------------------- */}
        {/* STATIC BACKGROUND CONTENT (MacOS Window on Desktop) */}
        {/* ----------------------------------------------------------------------- */}
        <div
          className="absolute z-0 flex flex-col rounded-lg overflow-hidden shadow-2xl transition-transform duration-200 ease-out origin-center"
          style={{
            width: '672px',
            height: '378px',
            transform:
              activeTab === 'zoom'
                ? `scale(${zoomLevel * 0.85}) translate(${(50 - zoomPan.x) * 0.4}px, ${(50 - zoomPan.y) * 0.4}px)`
                : 'scale(1)',
          }}
        >
          {/* Window Title Bar */}
          <div className="bg-[#2d2d2d]/90 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-black/20 cursor-default">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 w-16">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
              </div>
            </div>
            <div className="text-slate-300 text-xs font-medium font-sans">
              Shotera_Sample_Image.jpg
            </div>
            <div className="w-16 flex justify-end">
              {/* MAGNIFIED badge removed */}
            </div>
          </div>

          {/* Image Body */}
          <div className="relative flex-1 w-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=1200&auto=format&fit=crop"
              alt="Sample desktop"
              className="w-full h-full object-cover opacity-90"
            />
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* CROP MASK (The resizable selection box) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div
            className={`absolute pointer-events-auto origin-center select-none ${resizingDir ? '' : 'transition-transform duration-200 ease-out'}`}
            style={{
              left: `calc(50% + ${currentBox.left}px)`,
              top: `calc(50% + ${currentBox.top}px)`,
              width: `${currentBox.right - currentBox.left}px`,
              height: `${currentBox.bottom - currentBox.top}px`,
              transform:
                activeTab === 'zoom'
                  ? `scale(${zoomLevel * 0.85}) translate(${(50 - zoomPan.x) * 0.4}px, ${(50 - zoomPan.y) * 0.4}px)`
                  : `scale(1)`,
            }}
          >
            {/* Transparent Crop Window with dark shadow overlay */}
            <div
              onPointerDown={(e) => activeTab === 'annotation' && startDrag(e, 'move')}
              className={`w-full h-full transition-shadow ${
                activeTab === 'record'
                  ? 'cursor-default ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)]'
                  : activeTab === 'annotation'
                  ? 'cursor-move ring-2 ring-[#00f2fe] shadow-[0_0_0_9999px_rgba(0,0,0,0.65)]'
                  : 'cursor-default'
              }`}
            />
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* INTERACTIVE VECTOR SVG CANVAS (Drawings, Annotations, Blur, Step Badges) */}
        {/* ----------------------------------------------------------------------- */}
        <svg
          ref={svgRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="absolute inset-0 w-full h-full z-30"
          style={{
            pointerEvents: selectedTool === 'pointer' ? 'none' : 'auto',
            cursor: selectedTool === 'eraser' ? ERASER_CURSOR : selectedTool === 'pointer' ? 'default' : 'crosshair',
            clipPath: `inset(calc(50% + ${currentBox.top}px) calc(50% - ${currentBox.right}px) calc(50% - ${currentBox.bottom}px) calc(50% + ${currentBox.left}px))`
          }}
        >
          {activeTab === 'annotation' && (
            <>
              {items.map((item) => (
                <g key={item.id} className={item.isErasing ? "opacity-0 transition-opacity duration-[400ms] ease-out pointer-events-none" : "transition-colors duration-150"}>
                  {renderDrawingItem(item)}
                </g>
              ))}
              {currentDraft && renderDrawingItem(currentDraft)}
              {currentEraserPoints.length > 1 && (
                <path
                  d={currentEraserPoints.reduce((acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '')}
                  fill="none"
                  stroke="rgba(156, 163, 175, 0.5)"
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none"
                />
              )}
            </>
          )}
        </svg>

        {/* ----------------------------------------------------------------------- */}
        {/* RESIZE HANDLES & DIMENSION TEXT OVERLAY (z-40 to sit above crop mask) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="absolute inset-0 z-40 pointer-events-none">
          <div
            className={`absolute pointer-events-none origin-center select-none ${resizingDir ? '' : 'transition-transform duration-200 ease-out'}`}
            style={{
              left: `calc(50% + ${currentBox.left}px)`,
              top: `calc(50% + ${currentBox.top}px)`,
              width: `${currentBox.right - currentBox.left}px`,
              height: `${currentBox.bottom - currentBox.top}px`,
              transform:
                activeTab === 'zoom'
                  ? `scale(${zoomLevel * 0.85}) translate(${(50 - zoomPan.x) * 0.4}px, ${(50 - zoomPan.y) * 0.4}px)`
                  : `scale(1)`,
            }}
          >

            {activeTab === 'annotation' && (
              <>
                {/* Dimension Text (Top Left) */}
                <div className="absolute -top-8 left-0 bg-[#0b0c10] text-white font-mono text-[11px] font-bold tracking-wider px-2 py-1 rounded shadow-md pointer-events-none">
                  {Math.round(box.right - box.left)} × {Math.round(box.bottom - box.top)} px
                </div>

                {/* Invisible Draggable Borders for Moving */}
                <div onPointerDown={(e) => startDrag(e, 'move')} className="absolute -top-2 -left-2 right-2 h-4 pointer-events-auto cursor-move z-0" />
                <div onPointerDown={(e) => startDrag(e, 'move')} className="absolute -bottom-2 -left-2 right-2 h-4 pointer-events-auto cursor-move z-0" />
                <div onPointerDown={(e) => startDrag(e, 'move')} className="absolute -top-2 -bottom-2 -left-2 w-4 pointer-events-auto cursor-move z-0" />
                <div onPointerDown={(e) => startDrag(e, 'move')} className="absolute -top-2 -bottom-2 -right-2 w-4 pointer-events-auto cursor-move z-0" />

                {/* Resize Handles (Simulating Shotera Selection) */}
                <div onPointerDown={(e) => startDrag(e, 'nw')} className="absolute -top-[3px] -left-[3px] w-1.5 h-1.5 bg-white border-[1.5px] border-[#00f2fe] pointer-events-auto cursor-nwse-resize hover:scale-150 transition-transform z-10" />
                <div onPointerDown={(e) => startDrag(e, 'n')} className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white border-[1.5px] border-[#00f2fe] pointer-events-auto cursor-ns-resize hover:scale-150 transition-transform z-10" />
                <div onPointerDown={(e) => startDrag(e, 'ne')} className="absolute -top-[3px] -right-[3px] w-1.5 h-1.5 bg-white border-[1.5px] border-[#00f2fe] pointer-events-auto cursor-nesw-resize hover:scale-150 transition-transform z-10" />
                <div onPointerDown={(e) => startDrag(e, 'w')} className="absolute top-1/2 -translate-y-1/2 -left-[3px] w-1.5 h-1.5 bg-white border-[1.5px] border-[#00f2fe] pointer-events-auto cursor-ew-resize hover:scale-150 transition-transform z-10" />
                <div onPointerDown={(e) => startDrag(e, 'e')} className="absolute top-1/2 -translate-y-1/2 -right-[3px] w-1.5 h-1.5 bg-white border-[1.5px] border-[#00f2fe] pointer-events-auto cursor-ew-resize hover:scale-150 transition-transform z-10" />
                <div onPointerDown={(e) => startDrag(e, 'sw')} className="absolute -bottom-[3px] -left-[3px] w-1.5 h-1.5 bg-white border-[1.5px] border-[#00f2fe] pointer-events-auto cursor-nesw-resize hover:scale-150 transition-transform z-10" />
                <div onPointerDown={(e) => startDrag(e, 's')} className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white border-[1.5px] border-[#00f2fe] pointer-events-auto cursor-ns-resize hover:scale-150 transition-transform z-10" />
                <div onPointerDown={(e) => startDrag(e, 'se')} className="absolute -bottom-[3px] -right-[3px] w-1.5 h-1.5 bg-white border-[1.5px] border-[#00f2fe] pointer-events-auto cursor-nwse-resize hover:scale-150 transition-transform z-10" />
              </>
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* FLOATING PINNED IMAGE WINDOW SIMULATION (Real Shotera Pinned Feature) */}
        {/* ----------------------------------------------------------------------- */}
        {isPinnedOpen && (
          <div
            className="absolute z-40 bg-[#121624]/95 border-2 border-amber-400/80 rounded-xl shadow-2xl p-2 select-none backdrop-blur-md animate-in zoom-in-95 duration-150"
            style={{
              top: `${pinnedPosition.y}px`,
              right: `${pinnedPosition.x}px`,
              maxWidth: '260px',
            }}
          >
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700/60 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              <div className="flex items-center gap-1">
                <Pin className="w-3 h-3 fill-amber-400" />
                <span>Pinned • Always on Top</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPinnedOpen(false);
                  showToast('Sabitlenmiş pencere kapatıldı (Unpinned)');
                }}
                className="text-slate-400 hover:text-white p-0.5 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="bg-[#0b0e17] rounded-lg p-2 font-mono text-[10px] text-slate-300 leading-tight">
              <div className="text-cyan-400 font-bold">engine.startCapture();</div>
              <div className="text-slate-500 mt-1">fps: 60 • lossless-gpu</div>
            </div>
          </div>
        )}

        {/* Instant OCR Laser Scan Bar */}
        {isOcrScanning && (
          <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden rounded-xl border-2 border-cyan-400 bg-cyan-500/10 backdrop-blur-[1px]">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#00e5ff] animate-bounce" />
            <div className="absolute top-4 right-4 bg-slate-950/90 border border-cyan-400 text-cyan-300 text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center gap-2 shadow-2xl">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>METİN TARANIYOR & KOPYALANIYOR...</span>
            </div>
          </div>
        )}

        {/* Text Input Callout Overlay */}
        {activeTextInput && (
          <div
            className="absolute z-40"
            style={{
              left: `${activeTextInput.x}px`,
              top: `${activeTextInput.y - 14}px`,
            }}
          >
            <input
              ref={textInputRef}
              type="text"
              value={activeTextInput.text}
              onChange={(e) => setActiveTextInput((prev) => (prev ? { ...prev, text: e.target.value } : null))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCommitText();
                if (e.key === 'Escape') setActiveTextInput(null);
              }}
              onBlur={handleCommitText}
              placeholder="Açıklama metnini yazıp Enter'a basın..."
              className="bg-slate-950 text-white font-mono text-xs px-3 py-1.5 rounded-lg border-2 border-cyan-400 shadow-2xl focus:outline-hidden min-w-[220px]"
            />
          </div>
        )}

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0c1220]/95 text-white font-medium text-xs px-4 py-2 rounded-full border border-cyan-500/40 shadow-2xl flex items-center gap-2 animate-fade-in backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Draggable Shotera Real Webcam Overlay in Recording Mode */}
        <InteractiveWebcamOverlay
          isOpen={activeTab === 'record' && useWebcam}
          onClose={() => {
            setUseWebcam(false);
            showToast('Kamera kapatıldı');
          }}
        />


        {/* ======================================================================= */}
        {/* 3. MODE-SPECIFIC BOTTOM TOOLBARS */}
        {/* ======================================================================= */}

        {/* --------------------------------------------------------------------- */}
        {/* MODE 1: DRAW & MARKUP TOOLBAR - 1:1 WITH USER SCREENSHOT */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'annotation' && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 max-w-[96%]">
            {/* Main Floating Bottom Pill (Exact Match to Uploaded Screenshot) */}
            <div className="bg-[#0c1220]/95 border border-slate-800/90 rounded-[10px] px-3 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.7)] flex items-center gap-1.5 text-slate-300 backdrop-blur-xl overflow-visible">
              {/* 1. Freehand Pen */}
              <button
                type="button"
                onClick={() => { setSelectedTool('pen'); setShowShapeMenu(false); }}
                className={`p-2 rounded-md transition-all ${selectedTool === 'pen'
                  ? 'bg-[#00f2fe] text-[#0b0c10] shadow-[0_0_10px_rgba(0,242,254,0.3)] font-bold'
                  : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                title="Kalem / Çizim"
              >
                <Pencil className="w-4 h-4" />
              </button>

              {/* 2. Shape Tools Dropdown */}
              <div className="relative flex items-center">
                <button
                  type="button"
                  className={`p-2 rounded-md transition-all flex items-center justify-center relative ${['rect', 'solid-rect', 'circle', 'solid-circle', 'triangle', 'solid-triangle', 'line', 'dashed-line', 'arrow', 'wave'].includes(selectedTool)
                    ? 'bg-[#00f2fe] text-[#0b0c10] shadow-[0_0_10px_rgba(0,242,254,0.3)] font-bold'
                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                    }`}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    if (x > rect.width - 12 && y > rect.height - 12) {
                      setShowShapeMenu(!showShapeMenu);
                    } else {
                      if (selectedTool === lastShape) {
                        setShowShapeMenu(!showShapeMenu);
                      } else {
                        setSelectedTool(lastShape);
                        setShowShapeMenu(false);
                      }
                    }
                  }}
                  title="Şekiller (Menü için tekrar tıklayın)"
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    {SHAPE_TOOLS.find(s => s.id === lastShape)?.icon}
                  </div>
                  <svg style={{ position: 'absolute', bottom: 2, right: 2, width: 8, height: 8 }} viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6,9 18,9 12,18" />
                  </svg>
                </button>
                {showShapeMenu && (
                  <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-max bg-[#0f172a]/95 border border-white/10 rounded-xl p-2 grid grid-cols-5 gap-1 shadow-2xl z-[100] backdrop-blur-xl">
                    {SHAPE_TOOLS.map(tool => (
                      <button
                        key={tool.id}
                        type="button"
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${selectedTool === tool.id ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        onClick={() => { setSelectedTool(tool.id as ToolType); setLastShape(tool.id as ToolType); setShowShapeMenu(false); }}
                        title={tool.title}
                      >
                        {tool.icon}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Text */}
              <button
                type="button"
                onClick={() => { setSelectedTool('text'); setShowShapeMenu(false); }}
                className={`p-2 rounded-md transition-all ${selectedTool === 'text'
                  ? 'bg-[#00f2fe] text-[#0b0c10] shadow-[0_0_10px_rgba(0,242,254,0.3)] font-bold'
                  : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                title="Metin Yazma"
              >
                <Type className="w-4 h-4" />
              </button>

              {/* 5. Step Numbering */}
              <button
                type="button"
                onClick={() => { setSelectedTool('step'); setShowShapeMenu(false); }}
                className={`p-2 rounded-md transition-all ${selectedTool === 'step'
                  ? 'bg-[#00f2fe] text-[#0b0c10] shadow-[0_0_10px_rgba(0,242,254,0.3)] font-bold'
                  : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                title="Numaralı Adım Rozeti (1, 2, 3...)"
              >
                <ListOrdered className="w-4 h-4" />
              </button>

              {/* 6. Blur / Droplet */}
              <button
                type="button"
                onClick={() => { setSelectedTool('blur'); setShowShapeMenu(false); }}
                className={`p-2 rounded-md transition-all ${selectedTool === 'blur'
                  ? 'bg-[#00f2fe] text-[#0b0c10] shadow-[0_0_10px_rgba(0,242,254,0.3)] font-bold'
                  : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                title="Bulanıklaştır / Sansürle (Blur)"
              >
                <Droplets className="w-4 h-4" />
              </button>

              {/* 7. Eraser */}
              <button
                type="button"
                onClick={() => { setSelectedTool('eraser'); setShowShapeMenu(false); }}
                className={`p-2 rounded-md transition-all ${selectedTool === 'eraser'
                  ? 'bg-[#00f2fe] text-[#0b0c10] shadow-[0_0_10px_rgba(0,242,254,0.3)] font-bold'
                  : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                title="Silgi (Çizimleri silmek için üzerlerinden geçin)"
              >
                <Eraser className="w-4 h-4" />
              </button>

              {/* 8. Undo */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={items.length === 0}
                className="p-2 rounded-md hover:bg-slate-800/80 disabled:opacity-30 text-slate-400 hover:text-white transition-colors"
                title="Geri Al (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>

              {/* 9. Trash / Clear */}
              <button
                type="button"
                onClick={handleClearAll}
                disabled={items.length === 0}
                className="p-2 rounded-md hover:bg-rose-950/60 disabled:opacity-30 text-slate-400 hover:text-rose-400 transition-colors"
                title="Tümünü Temizle (Clear)"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* ======================================= */}
              {/* Inline Contextual Tools for Text / Blur */}
              {/* ======================================= */}
              {selectedTool === 'text' && (
                <>
                  <div className="h-4 w-[1px] bg-slate-800 mx-1 shrink-0" />
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => setTextBold(!textBold)}
                      className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs transition-colors ${textBold ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      title="Kalın (Bold)"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextItalic(!textItalic)}
                      className={`w-7 h-7 rounded flex items-center justify-center italic font-serif text-xs transition-colors ${textItalic ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      title="İtalik (Italic)"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextUnderline(!textUnderline)}
                      className={`w-7 h-7 rounded flex items-center justify-center underline text-xs transition-colors ${textUnderline ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      title="Altı Çizili (Underline)"
                    >
                      U
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextStrikethrough(!textStrikethrough)}
                      className={`w-7 h-7 rounded flex items-center justify-center line-through text-xs transition-colors ${textStrikethrough ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      title="Üstü Çizili (Strikethrough)"
                    >
                      S
                    </button>
                  </div>
                </>
              )}

              {selectedTool === 'blur' && (
                <>
                  <div className="h-4 w-[1px] bg-slate-800 mx-1 shrink-0" />
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Yoğunluk:</span>
                    <input
                      type="range"
                      min="2"
                      max="30"
                      value={blurAmount}
                      onChange={(e) => setBlurAmount(Number(e.target.value))}
                      className="w-20 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-slate-900 [&::-webkit-slider-thumb]:rounded-sm"
                      title={`${blurAmount}px`}
                    />
                    <span className="font-mono text-cyan-400 text-[10px] font-bold w-6 text-right">
                      {blurAmount}px
                    </span>
                  </div>
                </>
              )}

              {/* Divider */}
              <div className="h-4 w-[1px] bg-slate-800 mx-1 shrink-0" />

              {/* 12. Color Swatches and Custom Picker */}
              <div className="flex items-center gap-1.5 px-1 shrink-0 relative">
                {PRESET_COLORS.map((c) => {
                  const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => { setSelectedColor(c.hex); setShowColorPicker(false); }}
                      className="relative flex items-center justify-center p-0.5 rounded-full transition-transform hover:scale-110"
                      title={c.label}
                    >
                      {isSelected && !showColorPicker && (
                        <span className="absolute inset-0 rounded-full border-2 border-white pointer-events-none animate-pulse" />
                      )}
                      <span
                        className="w-3.5 h-3.5 rounded-full block"
                        style={{ backgroundColor: c.hex }}
                      />
                    </button>
                  );
                })}

                {/* Custom Color Picker Button */}
                <button
                  type="button"
                  className={`relative flex items-center justify-center w-5 h-5 rounded-full transition-transform hover:scale-110 ${showColorPicker ? 'scale-110' : ''}`}
                  style={{
                    backgroundColor: selectedColor,
                    border: '1px dashed rgba(255,255,255,0.8)',
                  }}
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  title="Özel Renk Seç (Custom Color)"
                >
                  {showColorPicker && (
                    <span className="absolute inset-[-2px] rounded-full border-2 border-cyan-400 pointer-events-none animate-pulse" />
                  )}
                  <Palette size={10} color="#fff" style={{ pointerEvents: 'none', opacity: 0.9, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />
                </button>

                {/* Custom Color Picker Popover */}
                {showColorPicker && (
                  <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 z-[100] bg-[#1f2937] p-3 rounded-xl shadow-2xl border border-white/10 flex flex-col gap-3 items-center w-max">
                    <div className="relative z-[101]">
                      <HexColorPicker
                        color={selectedColor.startsWith('#') && selectedColor.length === 7 ? selectedColor : '#ef4444'}
                        onChange={setSelectedColor}
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full bg-slate-900 rounded-lg px-2 py-1 border border-slate-700">
                      <span className="text-slate-400 text-xs font-mono">HEX</span>
                      <input
                        type="text"
                        value={selectedColor}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                            setSelectedColor(val);
                          }
                        }}
                        className="bg-transparent text-slate-200 text-xs font-mono w-full outline-none uppercase"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-4 w-[1px] bg-slate-800 mx-1 shrink-0" />

              {/* 13. Copy to Clipboard */}
              <button
                type="button"
                onClick={handleCopyMock}
                className="p-2 rounded-md hover:bg-[#00f2fe]/15 hover:text-white text-[#00f2fe] transition-colors"
                title="Görseli Panoya Kopyala (Ctrl+C)"
              >
                {copiedNotification ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              {/* 14. Pin Window (Shotera Signature PIP) */}
              <button
                type="button"
                onClick={() => {
                  const nextState = !isPinnedOpen;
                  setIsPinnedOpen(nextState);
                  showToast(nextState ? 'Pencere ekrana sabitlendi (Always-on-Top)' : 'Sabitleme kaldırıldı');
                }}
                className={`p-2 rounded-md transition-all ${isPinnedOpen
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'hover:bg-slate-800/80 hover:text-white'
                  }`}
                style={{ color: isPinnedOpen ? undefined : '#f59e0b' }}
                title="Ekrana Sabitle (Pin to Desktop)"
              >
                <Pin className="w-4 h-4" />
              </button>

              {/* 15. Cloud Upload */}
              <button
                type="button"
                onClick={() => showToast('Buluta Yükleniyor... (Cloud Upload)')}
                className="p-2 rounded-md hover:bg-slate-800/80 hover:text-white transition-colors"
                style={{ color: '#3b82f6' }}
                title="Buluta Yükle (Upload)"
              >
                <CloudUpload className="w-4 h-4" />
              </button>

              {/* 16. OCR Scan to Clipboard */}
              <button
                type="button"
                onClick={handleInstantOcrScan}
                className={`p-2 rounded-md transition-all ${ocrCopied
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isOcrScanning
                    ? 'bg-[#8b5cf6]/30 text-white animate-pulse'
                    : 'hover:bg-slate-800/80 hover:text-white'
                  }`}
                style={{ color: ocrCopied || isOcrScanning ? undefined : '#8b5cf6' }}
                title="OCR: Ekrandaki metni tara ve panoya kopyala"
              >
                {ocrCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <ScanText className="w-4 h-4" />}
              </button>

              {/* 17. Save Lossless */}
              <button
                type="button"
                onClick={handleSaveMock}
                className="p-2 rounded-md hover:bg-[#10b981]/15 hover:text-white text-[#10b981] transition-colors"
                title="Kaydet (PNG)"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* 18. Close */}
              <button
                type="button"
                onClick={handleClearAll}
                className="p-2 rounded-md hover:bg-[#ef4444]/15 hover:text-white text-[#ef4444] transition-colors"
                title="Kapat / Çıkış (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Live Zoom Hint Overlay */}
        {showZoomHint && (
          <div className={`absolute inset-0 z-50 pointer-events-none flex flex-col items-center justify-center transition-opacity duration-500 ${fadeZoomHint ? 'opacity-0' : 'opacity-100'}`}>
            <div className="bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-full border border-slate-700/50 shadow-2xl flex flex-col items-center gap-1">
              <span className="text-white font-medium">Yakınlaştırmak için kaydırın (Scroll)</span>
              <span className="text-slate-400 text-xs">Çizime (Freeze & Draw) geçmek için tıklayın</span>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* MODE 3: SCREEN RECORDING FLOATING PILL (EXACT SHOTERA REPLICA) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'record' && (
          <div 
            onPointerDown={startRecordDrag}
            className={`absolute bottom-8 right-8 z-40 bg-[#0f172a]/95 border border-slate-700/70 rounded-full px-4 py-2 shadow-2xl flex items-center gap-3 text-slate-200 backdrop-blur-xl animate-in fade-in ${isDraggingRecord ? 'cursor-grabbing !transition-none' : 'cursor-grab duration-150'}`}
            style={{ transform: `translate(${recordPanelPos.x}px, ${recordPanelPos.y}px)` }}
          >
            {/* Pulsing Recording Red Dot & Stopwatch */}
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : isRecording ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse' : 'bg-slate-600'
                  }`}
              />
              {isPaused && <span className="text-amber-400 text-xs font-bold">Mola</span>}
              <span className="font-mono text-xs font-bold text-white tracking-wider">
                {formatDuration(recordingSeconds)}
              </span>
            </div>

            {/* Audio Waveform Meter */}
            <div className="hidden sm:flex items-center gap-0.5 h-3">
              {audioLevels.slice(0, 7).map((lvl, idx) => (
                <div
                  key={idx}
                  className="w-0.5 bg-cyan-400 rounded-full transition-all duration-150"
                  style={{ height: isMicMuted || isPaused ? '3px' : `${Math.max(3, lvl * 0.14)}px` }}
                />
              ))}
            </div>

            <div className="h-4 w-[1px] bg-slate-700 mx-0.5 shrink-0" />

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              {/* 1. Pause / Resume */}
              <button
                type="button"
                onClick={() => {
                  setIsPaused(!isPaused);
                  showToast(isPaused ? 'Kayıt devam ediyor' : 'Kayıt duraklatıldı (Mola)');
                }}
                className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center hover:bg-amber-500/30 transition-colors"
                title={isPaused ? 'Devam Et' : 'Duraklat'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-amber-400" /> : <Pause className="w-3.5 h-3.5 fill-amber-400" />}
              </button>

              {/* 2. Stop Recording */}
              <button
                type="button"
                onClick={() => {
                  setIsRecording(false);
                  showToast('Kayıt tamamlandı ve galeriye kaydedildi (MP4)');
                }}
                className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center hover:bg-rose-500/30 transition-colors"
                title="Kaydı Durdur ve Kaydet"
              >
                <Square className="w-3 h-3 fill-rose-400" />
              </button>

              {/* 3. Webcam Bubble Toggle */}
              <button
                type="button"
                onClick={() => {
                  const nextState = !useWebcam;
                  setUseWebcam(nextState);
                  showToast(nextState ? 'Kamera açıldı (Shotera Webcam Overlay)' : 'Kamera kapatıldı');
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${useWebcam
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                title={useWebcam ? 'Kamerayı Gizle' : 'Kamerayı Aç (Webcam Overlay)'}
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              {/* 4. Microphone Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsMicMuted(!isMicMuted);
                  showToast(!isMicMuted ? 'Mikrofon susturuldu' : 'Mikrofon açıldı');
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${!isMicMuted
                  ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300'
                  : 'bg-rose-500/20 border border-rose-400 text-rose-400'
                  }`}
                title={!isMicMuted ? 'Mikrofonu Kapat' : 'Mikrofonu Aç'}
              >
                {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. WINDOW STATUS BAR (BOTTOM) - 1:1 WITH USER SCREENSHOT */}
      {/* ========================================================================= */}
      <div className="bg-[#0b101c] px-4 py-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-3">
          <span>3840 × 2160 UHD</span>
          <span className="text-slate-600">•</span>
          <span>60 FPS</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          <span>Active</span>
        </div>
      </div>
    </div>
  );
}
