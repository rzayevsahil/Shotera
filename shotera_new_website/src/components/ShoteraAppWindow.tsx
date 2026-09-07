import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, WheelEvent as ReactWheelEvent } from 'react';
import {
  MousePointer,
  PenTool,
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
  Save,
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
} from 'lucide-react';
import { InteractiveWebcamOverlay } from './InteractiveWebcamOverlay';

type ToolType = 'pointer' | 'pen' | 'arrow' | 'rect' | 'circle' | 'step' | 'text' | 'blur' | 'eraser';

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
  blurAmount?: number;
  stepNumber?: number;
}

const PRESET_COLORS = [
  { hex: '#38BDF8', label: 'Sky Blue' },
  { hex: '#EF4444', label: 'Coral Red' },
  { hex: '#10B981', label: 'Emerald Green' },
  { hex: '#F59E0B', label: 'Amber Orange' },
  { hex: '#A855F7', label: 'Vibrant Purple' },
  { hex: '#FFFFFF', label: 'Pure White' },
  { hex: '#EC4899', label: 'Bright Pink' },
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

  // Zoom Simulation State
  const [zoomLevel, setZoomLevel] = useState<number>(2);
  const [zoomPan, setZoomPan] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // Recording Simulation State
  const [isRecording, setIsRecording] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [useWebcam, setUseWebcam] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(252); // 00:04:12 matching screenshot
  const [audioLevels, setAudioLevels] = useState<number[]>([35, 60, 80, 45, 90, 70, 50, 85, 65, 95, 40, 75, 90, 60, 45]);

  // Instant OCR State
  const [isOcrScanning, setIsOcrScanning] = useState(false);
  const [ocrCopied, setOcrCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Toast feedback helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

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

  // Eraser collision helper: remove items near point
  const eraseNearPoint = useCallback((px: number, py: number, radius = 22) => {
    setItems((prev) => {
      let erasedCount = 0;
      const filtered = prev.filter((act) => {
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

        if (isHit) erasedCount++;
        return !isHit;
      });

      if (erasedCount > 0) {
        showToast('Silindi (Erased)');
      }
      return filtered;
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

    if (!isDrawing) return;

    if (selectedTool === 'eraser') {
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
    const { id, type, color, strokeWidth: sw, startX = 0, startY = 0, endX = 0, endY = 0 } = item;

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
            className="w-full h-full bg-slate-900/60 border border-white/20"
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
            textDecoration={item.underline ? 'underline' : 'none'}
            fontFamily="monospace"
          >
            {item.text}
          </text>
        </g>
      );
    }

    return null;
  };

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
            className={`px-4 py-1 rounded-full font-bold text-xs transition-all ${
              activeTab === 'annotation'
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Draw & Markup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('zoom')}
            className={`px-4 py-1 rounded-full font-bold text-xs transition-all ${
              activeTab === 'zoom'
                ? 'bg-white text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Zoom
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('record')}
            className={`px-4 py-1 rounded-full font-bold text-xs transition-all ${
              activeTab === 'record'
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
        className="relative bg-[#070b14] min-h-[460px] sm:min-h-[520px] flex items-center justify-center p-4 sm:p-8 select-none overflow-hidden"
        style={{
          cursor:
            selectedTool === 'eraser'
              ? 'cell'
              : selectedTool === 'pointer'
              ? 'default'
              : 'crosshair',
        }}
      >
        {/* Soft deep atmospheric glow in center desktop */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1122] via-[#070b14] to-[#05080f] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[340px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* ----------------------------------------------------------------------- */}
        {/* CENTER CODE EDITOR WINDOW (VS CODE REPLICA - INTERACTIVE TABS) */}
        {/* ----------------------------------------------------------------------- */}
        <div
          className="relative z-10 w-full max-w-xl transition-transform duration-200 ease-out origin-center select-none"
          style={{
            transform:
              activeTab === 'zoom'
                ? `scale(${zoomLevel * 0.85}) translate(${(50 - zoomPan.x) * 0.4}px, ${(50 - zoomPan.y) * 0.4}px)`
                : 'scale(1)',
          }}
        >
          <div
            className={`bg-[#121624]/95 rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden text-slate-200 transition-all ${
              activeTab === 'record' && isRecording
                ? 'border-rose-500/80 ring-2 ring-rose-500/20'
                : 'border-slate-800/80'
            }`}
          >
            {/* Window Tab Bar */}
            <div className="bg-[#0e121d] px-3 py-2 border-b border-slate-800/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {/* Dots */}
                <div className="flex items-center gap-1.5 mr-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>

                {/* Tab 1: index.ts */}
                <button
                  type="button"
                  onClick={() => setActiveCodeFile('index.ts')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono transition-colors ${
                    activeCodeFile === 'index.ts'
                      ? 'bg-[#181d2e] text-slate-200 border border-slate-700/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-[#38bdf8] font-bold text-[10px]">TS</span>
                  <span>index.ts</span>
                </button>

                {/* Tab 2: config.json */}
                <button
                  type="button"
                  onClick={() => setActiveCodeFile('config.json')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono transition-colors ${
                    activeCodeFile === 'config.json'
                      ? 'bg-[#181d2e] text-slate-200 border border-slate-700/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-[#f59e0b] font-bold text-[10px]">JSON</span>
                  <span>config.json</span>
                </button>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                {activeTab === 'zoom' && (
                  <span className="text-[#38bdf8] font-mono text-[10px] bg-sky-950/70 px-2 py-0.5 rounded border border-sky-800/80 font-bold animate-pulse">
                    {zoomLevel}× LENS MAGNIFIED
                  </span>
                )}
                <span className="text-slate-500 font-mono text-[10px]">UTF-8</span>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-5 font-mono text-xs sm:text-[13px] leading-relaxed select-none pointer-events-none">
              {activeCodeFile === 'index.ts' ? (
                <div className="flex items-start gap-4">
                  <div className="text-slate-600 select-none text-right font-mono space-y-1">
                    <div>1</div>
                    <div>2</div>
                    <div>3</div>
                    <div>4</div>
                    <div>5</div>
                    <div>6</div>
                    <div>7</div>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div>
                      <span className="text-[#c084fc]">import</span> &#123; createEngine &#125; <span className="text-[#c084fc]">from</span> <span className="text-[#6ee7b7]">'@shotera/core'</span>;
                    </div>
                    <div>
                      <span className="text-[#c084fc]">const</span> engine = <span className="text-[#60a5fa]">createEngine</span>(&#123;
                    </div>
                    <div className="pl-4">
                      <span className="text-[#38bdf8]">fps</span>: <span className="text-[#fde047]">60</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-[#38bdf8]">mode</span>: <span className="text-[#6ee7b7]">'lossless-gpu'</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-[#38bdf8]">enableZoom</span>: <span className="text-[#fde047]">true</span>,
                    </div>
                    <div>&#125;);</div>
                    <div>
                      <span className="text-[#60a5fa]">engine</span>.<span className="text-[#fde047]">startCapture</span>();
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className="text-slate-600 select-none text-right font-mono space-y-1">
                    <div>1</div>
                    <div>2</div>
                    <div>3</div>
                    <div>4</div>
                    <div>5</div>
                    <div>6</div>
                    <div>7</div>
                  </div>
                  <div className="space-y-1 text-slate-300">
                    <div>&#123;</div>
                    <div className="pl-4">
                      <span className="text-[#38bdf8]">"engine"</span>: <span className="text-[#6ee7b7]">"@shotera/core"</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-[#38bdf8]">"capture"</span>: &#123;
                    </div>
                    <div className="pl-8">
                      <span className="text-[#38bdf8]">"fps"</span>: <span className="text-[#fde047]">60</span>,
                    </div>
                    <div className="pl-8">
                      <span className="text-[#38bdf8]">"mode"</span>: <span className="text-[#6ee7b7]">"lossless-gpu"</span>,
                    </div>
                    <div className="pl-8">
                      <span className="text-[#38bdf8]">"enableZoom"</span>: <span className="text-[#fde047]">true</span>
                    </div>
                    <div className="pl-4">&#125;</div>
                    <div>&#125;</div>
                  </div>
                </div>
              )}
            </div>
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
          style={{ pointerEvents: 'auto' }}
        >
          {items.map((item) => renderDrawingItem(item))}
          {currentDraft && renderDrawingItem(currentDraft)}
        </svg>

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

        {/* Recording Screen Boundary */}
        {activeTab === 'record' && (
          <div className="absolute inset-4 pointer-events-none rounded-2xl border-2 border-dashed border-rose-500/50 z-20 shadow-[inset_0_0_20px_rgba(244,63,94,0.15)]" />
        )}

        {/* ======================================================================= */}
        {/* 3. MODE-SPECIFIC BOTTOM TOOLBARS */}
        {/* ======================================================================= */}

        {/* --------------------------------------------------------------------- */}
        {/* MODE 1: DRAW & MARKUP TOOLBAR - 1:1 WITH USER SCREENSHOT */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'annotation' && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 max-w-[96%]">
            {/* Dynamic Contextual Toolbar: Text Formatting / Blur Slider */}
            {selectedTool === 'text' && (
              <div className="bg-[#0b101c]/95 border border-slate-700/80 rounded-full px-3 py-1 shadow-xl flex items-center gap-2 text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
                <span className="text-slate-400 text-[11px] font-medium">Yazı Stili:</span>
                <button
                  type="button"
                  onClick={() => setTextBold(!textBold)}
                  className={`w-6 h-6 rounded flex items-center justify-center font-bold transition-colors ${
                    textBold ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  title="Kalın (Bold)"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => setTextItalic(!textItalic)}
                  className={`w-6 h-6 rounded flex items-center justify-center italic font-serif transition-colors ${
                    textItalic ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  title="İtalik (Italic)"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => setTextUnderline(!textUnderline)}
                  className={`w-6 h-6 rounded flex items-center justify-center underline transition-colors ${
                    textUnderline ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  title="Altı Çizili (Underline)"
                >
                  U
                </button>
              </div>
            )}

            {selectedTool === 'blur' && (
              <div className="bg-[#0b101c]/95 border border-slate-700/80 rounded-full px-3 py-1 shadow-xl flex items-center gap-2 text-xs backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150">
                <span className="text-slate-400 text-[11px] font-medium">Bulanıklık Yoğunluğu:</span>
                <input
                  type="range"
                  min="4"
                  max="28"
                  value={blurAmount}
                  onChange={(e) => setBlurAmount(Number(e.target.value))}
                  className="w-20 accent-cyan-400 cursor-pointer h-1.5"
                />
                <span className="font-mono text-cyan-400 text-[11px] font-bold">{blurAmount}px</span>
              </div>
            )}

            {/* Main Floating Bottom Pill (Exact Match to Uploaded Screenshot) */}
            <div className="bg-[#0c1220]/95 border border-slate-800/90 rounded-full px-3 py-2 shadow-[0_10px_35px_rgba(0,0,0,0.7)] flex items-center gap-1.5 text-slate-300 backdrop-blur-xl overflow-x-auto">
              {/* 1. Pointer */}
              <button
                type="button"
                onClick={() => setSelectedTool('pointer')}
                className={`p-2 rounded-full transition-all ${
                  selectedTool === 'pointer'
                    ? 'bg-white text-slate-950 shadow-md font-bold'
                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
                title="İmleç / Seçim"
              >
                <MousePointer className="w-4 h-4" />
              </button>

              {/* 2. Freehand Pen (Selected in Screenshot: White Circle, Dark Icon) */}
              <button
                type="button"
                onClick={() => setSelectedTool('pen')}
                className={`p-2 rounded-full transition-all ${
                  selectedTool === 'pen'
                    ? 'bg-white text-slate-950 shadow-md font-bold'
                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
                title="Kalem / Çizim"
              >
                <PenTool className="w-4 h-4" />
              </button>

              {/* 3. Arrow */}
              <button
                type="button"
                onClick={() => setSelectedTool('arrow')}
                className={`p-2 rounded-full transition-all ${
                  selectedTool === 'arrow'
                    ? 'bg-white text-slate-950 shadow-md font-bold'
                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
                title="Yön Oku"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>

              {/* 4. Rectangle */}
              <button
                type="button"
                onClick={() => setSelectedTool('rect')}
                className={`p-2 rounded-full transition-all ${
                  selectedTool === 'rect'
                    ? 'bg-white text-slate-950 shadow-md font-bold'
                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
                title="Dikdörtgen Çerçeve"
              >
                <Square className="w-4 h-4" />
              </button>

              {/* 5. Circle */}
              <button
                type="button"
                onClick={() => setSelectedTool('circle')}
                className={`p-2 rounded-full transition-all ${
                  selectedTool === 'circle'
                    ? 'bg-white text-slate-950 shadow-md font-bold'
                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
                title="Daire / Elips"
              >
                <Circle className="w-4 h-4" />
              </button>

              {/* 6. Step Numbering (1, 2, 3...) */}
              <button
                type="button"
                onClick={() => setSelectedTool('step')}
                className={`p-2 rounded-full transition-all ${
                  selectedTool === 'step'
                    ? 'bg-white text-slate-950 shadow-md font-bold'
                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
                title="Numaralı Adım Rozeti (1, 2, 3...)"
              >
                <ListOrdered className="w-4 h-4" />
              </button>

              {/* 7. Text */}
              <button
                type="button"
                onClick={() => setSelectedTool('text')}
                className={`p-2 rounded-full transition-all ${
                  selectedTool === 'text'
                    ? 'bg-white text-slate-950 shadow-md font-bold'
                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
                title="Metin Yazma"
              >
                <Type className="w-4 h-4" />
              </button>

              {/* 8. Blur / Droplet */}
              <button
                type="button"
                onClick={() => setSelectedTool('blur')}
                className={`p-2 rounded-full transition-all ${
                  selectedTool === 'blur'
                    ? 'bg-white text-slate-950 shadow-md font-bold'
                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
                title="Bulanıklaştır / Sansürle (Blur)"
              >
                <Droplets className="w-4 h-4" />
              </button>

              {/* 9. Eraser (Real Shotera Feature) */}
              <button
                type="button"
                onClick={() => setSelectedTool('eraser')}
                className={`p-2 rounded-full transition-all ${
                  selectedTool === 'eraser'
                    ? 'bg-white text-slate-950 shadow-md font-bold'
                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
                title="Silgi (Çizimleri silmek için üzerlerinden geçin)"
              >
                <Eraser className="w-4 h-4" />
              </button>

              {/* 10. Undo */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={items.length === 0}
                className="p-2 rounded-full hover:bg-slate-800/80 disabled:opacity-25 text-slate-400 hover:text-white transition-colors"
                title="Geri Al (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>

              {/* 11. Trash / Clear */}
              <button
                type="button"
                onClick={handleClearAll}
                disabled={items.length === 0}
                className="p-2 rounded-full hover:bg-rose-950/60 disabled:opacity-25 text-slate-400 hover:text-rose-400 transition-colors"
                title="Tümünü Temizle (Clear)"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Divider */}
              <div className="h-4 w-[1px] bg-slate-800 mx-1 shrink-0" />

              {/* 12. Color Swatches (Exact sequence from screenshot with dual-ring active indicator) */}
              <div className="flex items-center gap-1.5 px-1 shrink-0">
                {PRESET_COLORS.map((c) => {
                  const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      className="relative flex items-center justify-center p-0.5 rounded-full transition-transform hover:scale-110"
                      title={c.label}
                    >
                      {isSelected && (
                        <span className="absolute inset-0 rounded-full border-2 border-white pointer-events-none animate-pulse" />
                      )}
                      <span
                        className="w-3.5 h-3.5 rounded-full block"
                        style={{ backgroundColor: c.hex }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="h-4 w-[1px] bg-slate-800 mx-1 shrink-0" />

              {/* 13. OCR Scan to Clipboard */}
              <button
                type="button"
                onClick={handleInstantOcrScan}
                className={`p-2 rounded-full transition-all ${
                  ocrCopied
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isOcrScanning
                    ? 'bg-cyan-500/30 text-cyan-300 animate-pulse'
                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
                title="OCR: Ekrandaki metni tara ve panoya kopyala"
              >
                {ocrCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <ScanText className="w-4 h-4" />}
              </button>

              {/* 14. Copy to Clipboard */}
              <button
                type="button"
                onClick={handleCopyMock}
                className="p-2 rounded-full hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
                title="Görseli Panoya Kopyala (Ctrl+C)"
              >
                {copiedNotification ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>

              {/* 15. Save Lossless */}
              <button
                type="button"
                onClick={handleSaveMock}
                className="p-2 rounded-full hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
                title="Kaydet (PNG)"
              >
                <Save className="w-4 h-4" />
              </button>

              {/* 16. Pin Window (Shotera Signature PIP) */}
              <button
                type="button"
                onClick={() => {
                  const nextState = !isPinnedOpen;
                  setIsPinnedOpen(nextState);
                  showToast(nextState ? 'Pencere ekrana sabitlendi (Always-on-Top)' : 'Sabitleme kaldırıldı');
                }}
                className={`p-2 rounded-full transition-all ${
                  isPinnedOpen
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
                }`}
                title="Ekrana Sabitle (Pin to Desktop)"
              >
                <Pin className="w-4 h-4" />
              </button>

              {/* 17. Close */}
              <button
                type="button"
                onClick={handleClearAll}
                className="p-2 rounded-full hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                title="Kapat / Çıkış (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* MODE 2: LIVE ZOOM TOOLBAR (REAL SHOTERA MAGNIFIER REPLICA) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'zoom' && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 bg-[#0c1220]/95 border border-slate-800 rounded-full px-4 py-2 shadow-2xl flex items-center gap-2 text-slate-300 backdrop-blur-xl animate-in fade-in duration-150">
            <button
              type="button"
              onClick={() => {
                setZoomLevel((prev) => Math.max(2, prev === 8 ? 4 : prev === 4 ? 2 : 2));
                showToast(`Zoom: ${Math.max(2, Math.floor(zoomLevel / 2))}×`);
              }}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-300 transition-colors"
              title="Uzaklaştır (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-full border border-slate-800 text-xs font-mono">
              {[2, 4, 8].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setZoomLevel(lvl)}
                  className={`px-3 py-1 rounded-full font-bold transition-all ${
                    zoomLevel === lvl ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}×
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setZoomLevel((prev) => Math.min(8, prev === 2 ? 4 : prev === 4 ? 8 : 8));
                showToast(`Zoom: ${Math.min(8, zoomLevel * 2)}×`);
              }}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-300 transition-colors"
              title="Yakınlaştır (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-1 shrink-0" />

            {/* Reset Pan */}
            <button
              type="button"
              onClick={() => {
                setZoomPan({ x: 50, y: 50 });
                setZoomLevel(2);
                showToast('Merkez Konum Sıfırlandı');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-800 text-xs text-slate-300 transition-colors"
              title="Merkeze Dön"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Sıfırla</span>
            </button>

            {/* Freeze & Draw (Real Shotera Shortcut Ctrl+1) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('annotation');
                showToast('Kare Donduruldu -> Çizim Moduna Geçildi (Freeze & Draw)');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold text-cyan-300 transition-colors"
              title="Dondur ve Çiz (Ctrl+1)"
            >
              <PenTool className="w-3.5 h-3.5 text-cyan-400" />
              <span>Freeze & Draw</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-800 mx-1 shrink-0" />

            <button
              type="button"
              onClick={handleCopyMock}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Yakınlaştırılmış Kareyi Kopyala"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('annotation')}
              className="p-2 rounded-full hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
              title="Zoom Modundan Çık"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* MODE 3: SCREEN RECORDING FLOATING PILL (EXACT SHOTERA REPLICA) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'record' && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 bg-[#0f172a]/95 border border-slate-700/70 rounded-full px-4 py-2 shadow-2xl flex items-center gap-3 text-slate-200 backdrop-blur-xl animate-in fade-in duration-150">
            {/* Pulsing Recording Red Dot & Stopwatch */}
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isPaused ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : isRecording ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse' : 'bg-slate-600'
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
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  useWebcam
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
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                  !isMicMuted
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
