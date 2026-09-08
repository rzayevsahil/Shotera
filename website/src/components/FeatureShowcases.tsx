import { useState, useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { motion, useInView } from 'motion/react';
import {
  Crop,
  PenTool,
  ZoomIn,
  Video,
  ScanText,
  Timer,
  Check,
  Droplet,
  Trash2,
  Copy,
  Mic,
  Monitor,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ArrowUpRight,
  ListOrdered,
  Type,
  Square,
  Circle,
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { useViewfinder } from '../context/ViewfinderContext';
import { dustRevealVariants } from '../utils/animations';

interface FeatureShowcasesProps {
  currentLang: Language;
}

export function FeatureShowcases({ currentLang }: FeatureShowcasesProps) {
  const t = translations[currentLang];
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);
  const ref4 = useRef(null);
  const ref5 = useRef(null);
  const ref6 = useRef(null);

  const inView1 = useInView(ref1, { margin: "-40% 0px -40% 0px" });
  const inView2 = useInView(ref2, { margin: "-40% 0px -40% 0px" });
  const inView3 = useInView(ref3, { margin: "-40% 0px -40% 0px" });
  const inView4 = useInView(ref4, { margin: "-40% 0px -40% 0px" });
  const inView5 = useInView(ref5, { margin: "-40% 0px -40% 0px" });
  const inView6 = useInView(ref6, { margin: "-40% 0px -40% 0px" });

  const { activeTarget, setActiveTarget } = useViewfinder();

  useEffect(() => {
    if (inView6) setActiveTarget('features-6');
    else if (inView5) setActiveTarget('features-5');
    else if (inView4) setActiveTarget('features-4');
    else if (inView3) setActiveTarget('features-3');
    else if (inView2) setActiveTarget('features-2');
    else if (inView1) setActiveTarget('features-1');
  }, [inView1, inView2, inView3, inView4, inView5, inView6, setActiveTarget]);

  // Showcase 1: Region Selection State
  const [selectedPresetRegion, setSelectedPresetRegion] = useState<'1080p' | '720p' | 'window'>('720p');

  // Showcase 2: Mini Annotation Sandbox State
  const [showcaseStepCount, setShowcaseStepCount] = useState<number>(3);
  const [showcaseBadges, setShowcaseBadges] = useState<Array<{ id: number; x: number; y: number; num: number; text: string }>>([
    { id: 1, x: 28, y: 35, num: 1, text: 'Check token expiration' },
    { id: 2, x: 62, y: 72, num: 2, text: 'Rotate webhook certificate' },
  ]);
  const [activeShowcaseTool, setActiveShowcaseTool] = useState<'step' | 'arrow' | 'blur'>('step');
  const [showcaseSecretBlurred, setShowcaseSecretBlurred] = useState(true);

  // Showcase 3: Zoom Multiplier
  const [zoomMultiplier, setZoomMultiplier] = useState<number>(4);

  // Showcase 5: OCR Copy
  const [copiedOcr, setCopiedOcr] = useState(false);

  // Showcase 6: Interactive Timer State
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(1488); // 24:48
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'rest'>('pomodoro');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning, timerSeconds]);

  const handleCopyOcr = () => {
    setCopiedOcr(true);
    navigator.clipboard?.writeText(
      "[INFO] 2026-09-01 22:54:12 Worker process #4 initialized.\n[INFO] Database connection pool acquired on port 5432.\n[SUCCESS] All 142 integration benchmarks passed in 480ms."
    );
    setTimeout(() => setCopiedOcr(false), 2000);
  };

  const handleSandboxClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    if (activeShowcaseTool === 'step') {
      setShowcaseBadges((prev) => [
        ...prev,
        { id: Date.now(), x, y, num: showcaseStepCount, text: `Step ${showcaseStepCount} action` },
      ]);
      setShowcaseStepCount((c) => c + 1);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <section id="features" className="py-24 space-y-32 bg-white">
      {/* ------------------------------------------------------------------------- */}
      {/* SHOWCASE 1: CAPTURE ANYTHING */}
      {/* ------------------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Text Column */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="lg:col-span-5 space-y-6"
          >
            <div className="inline-flex items-center px-3.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              {t.showcases.capture.tag}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-slate-950 leading-tight">
              {t.showcases.capture.title}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {t.showcases.capture.desc}
            </p>
            <div className="space-y-3 pt-2">
              {t.showcases.capture.points.map((pt, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Product UI Visual: Interactive Snapping Showcase */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="lg:col-span-7 relative"
            ref={ref1}
          >
            {activeTarget === 'features-1' && (
              <motion.div
                layoutId="global-viewfinder"
                className="absolute inset-0 ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] rounded-3xl pointer-events-none z-50"
              />
            )}
            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-3 sm:p-5 shadow-xl overflow-hidden relative z-10">
              <div className="bg-slate-950 rounded-2xl p-5 sm:p-7 border border-slate-800 relative overflow-hidden space-y-4">
                {/* Preset region selector bar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs font-mono-code">
                  <span className="text-slate-400">Capture Frame:</span>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedPresetRegion('720p')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${selectedPresetRegion === '720p'
                          ? 'bg-white text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      1280×720 (16:9)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPresetRegion('1080p')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${selectedPresetRegion === '1080p'
                          ? 'bg-white text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      1920×1080 (FHD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPresetRegion('window')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${selectedPresetRegion === 'window'
                          ? 'bg-white text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      Auto Window Snap
                    </button>
                  </div>
                </div>

                {/* Active Selection Box */}
                <div
                  className={`relative border-2 border-white bg-white/5 rounded-xl p-5 transition-all duration-200 ${selectedPresetRegion === '1080p'
                      ? 'min-h-[190px]'
                      : selectedPresetRegion === '720p'
                        ? 'min-h-[160px]'
                        : 'min-h-[140px] border-emerald-400 bg-emerald-950/20'
                    }`}
                >
                  {/* Dimension pill */}
                  <div className="absolute -top-3 left-4 bg-white text-slate-950 font-mono-code font-bold text-[10px] px-2.5 py-0.5 rounded shadow-xs uppercase">
                    {selectedPresetRegion === '720p' && 'Region: 1280 × 720 (X: 320, Y: 180)'}
                    {selectedPresetRegion === '1080p' && 'Region: 1920 × 1080 (Full Screen 1)'}
                    {selectedPresetRegion === 'window' && 'Window Snapped: VSCode Studio (PID 8492)'}
                  </div>

                  {/* Corner Handles */}
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-full shadow-xs" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full shadow-xs" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-full shadow-xs" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full shadow-xs" />

                  {/* Inner Content */}
                  <div className="space-y-2 text-slate-300 font-mono-code text-xs">
                    <div className="text-white font-bold">// Target Workspace: High-DPI Desktop 1</div>
                    <div className="text-slate-400">FPS: 60.0 • Color Space: sRGB Lossless 32-bit</div>
                    <div className="text-slate-400">Direct Write to Clipboard (Ctrl+C) or Disk (Ctrl+S)</div>
                  </div>

                  {/* Precision Loupe */}
                  <div className="mt-4 inline-flex items-center gap-3 bg-slate-900/95 border border-slate-700 rounded-xl p-2.5 backdrop-blur-md">
                    <div className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-950 relative flex items-center justify-center">
                      <div className="w-full h-[1px] bg-slate-500 absolute" />
                      <div className="h-full w-[1px] bg-slate-500 absolute" />
                      <div className="w-2 h-2 bg-white rounded-2xs" />
                    </div>
                    <div className="font-mono-code text-[11px]">
                      <div className="text-white font-bold">Loupe: 800% Precision</div>
                      <div className="text-slate-400">HEX: #0F172A</div>
                    </div>
                  </div>
                </div>

                {/* Bottom Quick Bar */}
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-code">
                  <span>Press <kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700">Space</kbd> for full monitor</span>
                  <span className="text-white">Hotkeys: Ctrl+Shift+S / F</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* SHOWCASE 2: EXPLAIN WITH CLARITY (INTERACTIVE ANNOTATION SANDBOX) */}
      {/* ------------------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Visual: Interactive Sandbox */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="lg:col-span-7 order-2 lg:order-1 relative"
            ref={ref2}
          >
            {activeTarget === 'features-2' && (
              <motion.div
                layoutId="global-viewfinder"
                className="absolute inset-0 ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] rounded-3xl pointer-events-none z-50"
              />
            )}
            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-3 sm:p-5 shadow-xl relative z-10">
              <div className="bg-slate-950 rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
                {/* Mini Sandbox Workspace */}
                <div
                  onClick={handleSandboxClick}
                  className="relative bg-slate-900 rounded-xl p-5 border border-slate-800 text-xs font-mono-code space-y-3 cursor-crosshair min-h-[190px] select-none"
                >
                  <div className="text-slate-400 flex items-center justify-between pointer-events-none">
                    <span>API Security Configuration</span>
                    <span className="text-slate-300">Click anywhere to drop step badges!</span>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2 relative pointer-events-none">
                    <div>
                      <span className="text-indigo-400 font-bold">POST</span> /v1/system/auth/token
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Secret:</span>
                      <span
                        className={`bg-slate-800/80 px-2 py-0.5 rounded text-slate-300 transition-all select-none ${showcaseSecretBlurred ? 'filter blur-[6px] opacity-75' : ''
                          }`}
                      >
                        sk_live_9481a82bcf08249a88
                      </span>
                    </div>
                  </div>

                  {/* Render interactive badges */}
                  {showcaseBadges.map((b) => (
                    <div
                      key={b.id}
                      className="absolute flex items-center gap-2 bg-slate-950/95 border border-white text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xl animate-fade-in"
                      style={{ left: `${b.x}%`, top: `${b.y}%` }}
                    >
                      <div className="w-4 h-4 rounded-full bg-white text-slate-950 flex items-center justify-center text-[10px] font-black">
                        {b.num}
                      </div>
                      <span className="font-sans font-semibold text-slate-200">{b.text}</span>
                    </div>
                  ))}
                </div>

                {/* Markup Toolbar Sandbox Controls */}
                <div className="bg-slate-900 rounded-xl p-2.5 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveShowcaseTool('step')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activeShowcaseTool === 'step' ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                      <span>Drop Step {showcaseStepCount}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowcaseSecretBlurred(!showcaseSecretBlurred)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${showcaseSecretBlurred ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}
                    >
                      <Droplet className="w-3.5 h-3.5" />
                      <span>{showcaseSecretBlurred ? 'Blur Active' : 'Toggle Blur'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowcaseBadges([]);
                        setShowcaseStepCount(1);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 rounded-lg text-xs transition-colors"
                      title="Clear Badges"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </div>
                  <div className="text-slate-400 font-mono-code text-[11px]">
                    Auto-incrementing Badges
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Text */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="lg:col-span-5 space-y-6 order-1 lg:order-2"
          >
            <div className="inline-flex items-center px-3.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              {t.showcases.annotation.tag}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-slate-950 leading-tight">
              {t.showcases.annotation.title}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {t.showcases.annotation.desc}
            </p>
            <div className="space-y-3 pt-2">
              {t.showcases.annotation.points.map((pt, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* SHOWCASE 3: LIVE SCREEN ZOOM & MAGNIFIER */}
      {/* ------------------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Text */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="lg:col-span-5 space-y-6"
          >
            <div className="inline-flex items-center px-3.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              {t.showcases.zoom.tag}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-slate-950 leading-tight">
              {t.showcases.zoom.title}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {t.showcases.zoom.desc}
            </p>
            <div className="space-y-3 pt-2">
              {t.showcases.zoom.points.map((pt, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual: Interactive Magnifier */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="lg:col-span-7 relative"
            ref={ref3}
          >
            {activeTarget === 'features-3' && (
              <motion.div
                layoutId="global-viewfinder"
                className="absolute inset-0 ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] rounded-3xl pointer-events-none z-50"
              />
            )}
            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-3 sm:p-5 shadow-xl relative z-10">
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ZoomIn className="w-4 h-4 text-slate-300" />
                    <span className="text-xs font-semibold text-slate-200">
                      Live Screen Magnifier Engine
                    </span>
                  </div>
                  {/* Interactive Multiplier Selector */}
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-mono-code">
                    {[2, 4, 8].map((mul) => (
                      <button
                        key={mul}
                        type="button"
                        onClick={() => setZoomMultiplier(mul)}
                        className={`px-2.5 py-0.5 rounded font-bold transition-colors ${zoomMultiplier === mul
                            ? 'bg-white text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                          }`}
                      >
                        {mul}×
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zoom Simulation Box */}
                <div className="relative h-44 bg-slate-900 rounded-xl border border-slate-700 p-4 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between text-xs font-mono-code text-slate-400">
                    <span className="text-white font-bold">Scaling Factor: {zoomMultiplier}.0×</span>
                    <span>Interpolation: Hardware Lanczos / Bicubic</span>
                  </div>

                  <div className="text-center py-2">
                    <div
                      className="font-mono-code font-bold text-slate-200 transition-all duration-200"
                      style={{ fontSize: `${14 * (zoomMultiplier * 0.7)}px` }}
                    >
                      HIGH DPI TEXT RENDERING
                    </div>
                    <div className="text-xs text-slate-400 font-mono-code mt-1">
                      Press 'Ctrl + 1' to freeze & draw • 'Ctrl + 4' for interactive live zoom
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono-code text-slate-500 border-t border-slate-800 pt-2">
                    <span>Frame latency: 0.8ms</span>
                    <span className="text-slate-300">GPU Accelerated</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* SHOWCASE 4: SCREEN RECORDING */}
      {/* ------------------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Visual */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="lg:col-span-7 order-2 lg:order-1 relative"
            ref={ref4}
          >
            {activeTarget === 'features-4' && (
              <motion.div
                layoutId="global-viewfinder"
                className="absolute inset-0 ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] rounded-3xl pointer-events-none z-50"
              />
            )}
            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-3 sm:p-5 shadow-xl relative z-10">
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-mono-code font-bold text-slate-200 tracking-wider">
                      REC 00:08:24
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono-code text-slate-400">
                    <span className="bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
                      60 FPS
                    </span>
                    <span className="bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
                      4K UHD
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Monitor className="w-3.5 h-3.5 text-slate-300" />
                      <span>Video Track</span>
                    </div>
                    <div className="text-slate-200 font-semibold">Native Display Capture</div>
                    <div className="text-slate-500 font-mono-code text-[11px] mt-0.5">
                      H.264 / NVENC Hardware Encoded
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Mic className="w-3.5 h-3.5 text-slate-300" />
                      <span>Dual Audio Stream</span>
                    </div>
                    <div className="text-slate-200 font-semibold">Microphone + PC Output</div>
                    <div className="text-slate-500 font-mono-code text-[11px] mt-0.5">
                      48 kHz Stereo AAC Passthrough
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono-code">
                  <span className="text-slate-400">Press <kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded">Ctrl + 5</kbd> to Stop & Save</span>
                  <span className="text-slate-200 font-bold">MP4 Auto-export</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Text */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="lg:col-span-5 space-y-6 order-1 lg:order-2"
          >
            <div className="inline-flex items-center px-3.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              {t.showcases.record.tag}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-slate-950 leading-tight">
              {t.showcases.record.title}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {t.showcases.record.desc}
            </p>
            <div className="space-y-3 pt-2">
              {t.showcases.record.points.map((pt, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* SHOWCASE 5: INSTANT OCR */}
      {/* ------------------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Text */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="lg:col-span-5 space-y-6"
          >
            <div className="inline-flex items-center px-3.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              {t.showcases.ocr.tag}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-slate-950 leading-tight">
              {t.showcases.ocr.title}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {t.showcases.ocr.desc}
            </p>
            <div className="space-y-3 pt-2">
              {t.showcases.ocr.points.map((pt, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual: OCR Live Extraction Demo */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="lg:col-span-7 relative"
            ref={ref5}
          >
            {activeTarget === 'features-5' && (
              <motion.div
                layoutId="global-viewfinder"
                className="absolute inset-0 ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] rounded-3xl pointer-events-none z-50"
              />
            )}
            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-3 sm:p-5 shadow-xl relative z-10">
              <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-mono-code text-slate-300">
                    Target: Dialog Error Window (Non-selectable)
                  </span>
                  <span className="text-xs font-mono-code text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    Local OCR Engine
                  </span>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 font-mono-code text-xs text-slate-300 space-y-2">
                  <div className="text-slate-200">
                    [INFO] 2026-09-01 22:54:12 Worker process #4 initialized.
                  </div>
                  <div className="text-slate-200">
                    [INFO] Database connection pool acquired on port 5432.
                  </div>
                  <div className="text-white">
                    [SUCCESS] All 142 integration benchmarks passed in 480ms.
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">Parsed 3 lines without network request</span>
                  <button
                    type="button"
                    onClick={handleCopyOcr}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-slate-950 hover:bg-slate-100 rounded-lg font-medium transition-colors shadow-2xs text-xs"
                  >
                    {copiedOcr ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Recognized Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ------------------------------------------------------------------------- */}
      {/* SHOWCASE 6: FOCUS & BREAK TIMER (WITH LIVE START/PAUSE/RESET) */}
      {/* ------------------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Visual: Interactive Countdown Timer */}
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="lg:col-span-7 order-2 lg:order-1 relative"
            ref={ref6}
          >
            {activeTarget === 'features-6' && (
              <motion.div
                layoutId="global-viewfinder"
                className="absolute inset-0 ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] rounded-3xl pointer-events-none z-50"
              />
            )}
            <div className="rounded-3xl bg-slate-50 border border-slate-100 p-3 sm:p-5 shadow-xl relative z-10">
              <div className="bg-slate-950 rounded-2xl p-7 border border-slate-800 text-center space-y-5">
                <div className="inline-flex items-center gap-1.5 text-xs font-mono-code text-slate-300 bg-slate-900 px-3.5 py-1 rounded-full border border-slate-800">
                  <Timer className="w-3.5 h-3.5" />
                  <span>
                    {timerMode === 'pomodoro'
                      ? 'Pomodoro Focus Session'
                      : '20-20-20 Eye Strain & Ergonomic Rest'}
                  </span>
                </div>

                <div className="font-mono-code text-5xl sm:text-6xl font-semibold text-white tracking-tight">
                  {formatTimer(timerSeconds)}
                </div>

                <div className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {timerMode === 'pomodoro'
                    ? '25-minute deep focus interval for uninterrupted coding & design.'
                    : 'Take 20 seconds to look at an object 20 feet away to rest your ciliary muscles.'}
                </div>

                {/* Interactive Timer Controls */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTimerRunning(!timerRunning)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${timerRunning
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-white hover:bg-slate-100 text-slate-950'
                      }`}
                  >
                    {timerRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Timer</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Countdown</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTimerRunning(false);
                      setTimerSeconds(timerMode === 'pomodoro' ? 1500 : 20);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const newMode = timerMode === 'pomodoro' ? 'rest' : 'pomodoro';
                      setTimerMode(newMode);
                      setTimerRunning(false);
                      setTimerSeconds(newMode === 'pomodoro' ? 1500 : 20);
                    }}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-mono-code border border-slate-800 transition-colors"
                  >
                    Switch to {timerMode === 'pomodoro' ? '20-20-20 Rest' : '25m Focus'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Text */}
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="lg:col-span-5 space-y-6 order-1 lg:order-2"
          >
            <div className="inline-flex items-center px-3.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              {t.showcases.timer.tag}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-slate-950 leading-tight">
              {t.showcases.timer.title}
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              {t.showcases.timer.desc}
            </p>
            <div className="space-y-3 pt-2">
              {t.showcases.timer.points.map((pt, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
