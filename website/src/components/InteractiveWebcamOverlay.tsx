import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Sparkles, Move, Video, VideoOff, RefreshCw } from 'lucide-react';

interface InteractiveWebcamOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  containerBounds?: { width: number; height: number };
}

export type BorderAnimationType =
  | 'solid'
  | 'pulse'
  | 'breathe'
  | 'spin-rainbow'
  | 'spin-ocean'
  | 'spin-fire'
  | 'spin-cyber';

export function InteractiveWebcamOverlay({
  isOpen,
  onClose,
}: InteractiveWebcamOverlayProps) {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 24, y: 24 }); // from bottom-right
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startMouseX: number; startMouseY: number; startPosX: number; startPosY: number }>({
    startMouseX: 0,
    startMouseY: 0,
    startPosX: 24,
    startPosY: 24,
  });

  const [borderAnimation, setBorderAnimation] = useState<BorderAnimationType>('spin-cyber');
  const [borderColor, setBorderColor] = useState('#38bdf8');
  const [webcamText, setWebcamText] = useState('Shotera Live Camera');
  const [webcamTextAnimation, setWebcamTextAnimation] = useState<'solid' | 'pulse' | 'spin-cyber' | 'spin-rainbow'>('spin-cyber');
  const [webcamSize, setWebcamSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [isMirrored, setIsMirrored] = useState(true);

  // Video stream state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasRealCamera, setHasRealCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hovered, setHovered] = useState(false);

  // Size mapping
  const sizePx = webcamSize === 'sm' ? 120 : webcamSize === 'md' ? 156 : 196;

  // Request browser camera stream
  const startRealCamera = async () => {
    setCameraLoading(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setHasRealCamera(true);
      setCameraLoading(false);
    } catch (err: any) {
      console.warn('Real camera access fallback to simulated feed:', err);
      setHasRealCamera(false);
      setCameraLoading(false);
      setCameraError(err.name === 'NotAllowedError' ? 'Permission denied' : 'Camera unavailable');
    }
  };

  const stopRealCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setHasRealCamera(false);
  };

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopRealCamera();
    }
    return () => {
      stopRealCamera();
    };
  }, [isOpen]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = dragStartRef.current.startMouseX - e.clientX;
      const dy = dragStartRef.current.startMouseY - e.clientY;
      setPosition({
        x: dragStartRef.current.startPosX + dx,
        y: dragStartRef.current.startPosY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute z-50 select-none transition-transform duration-75 ease-out"
      style={{
        bottom: `${position.y}px`,
        right: `${position.x}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <style>{`
        .webcam-border-bg {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          z-index: 0;
          transition: all 0.3s ease;
        }
        .webcam-border-solid { background: ${borderColor}; box-shadow: 0 0 20px ${borderColor}60; }
        .webcam-border-pulse { background: ${borderColor}; animation: pulse-border 2s infinite ease-in-out; }
        .webcam-border-breathe { background: ${borderColor}; animation: breathe-border 3s infinite ease-in-out; }
        .webcam-border-spin-rainbow { background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red); animation: spin-border 3s linear infinite; }
        .webcam-border-spin-ocean { background: conic-gradient(#0ea5e9, #38bdf8, #0284c7, #0ea5e9); animation: spin-border 3s linear infinite; }
        .webcam-border-spin-fire { background: conic-gradient(#ef4444, #f97316, #eab308, #ef4444); animation: spin-border 2s linear infinite; }
        .webcam-border-spin-cyber { background: conic-gradient(#ec4899, #a855f7, #06b6d4, #ec4899); animation: spin-border 2.5s linear infinite; }

        @keyframes spin-border { 100% { transform: rotate(360deg); } }
        @keyframes pulse-border { 0%, 100% { box-shadow: 0 0 10px ${borderColor}; } 50% { box-shadow: 0 0 30px ${borderColor}; } }
        @keyframes breathe-border { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        .webcam-text-anim-solid { color: #ffffff; }
        .webcam-text-anim-pulse { color: #38bdf8; animation: pulse-text 2s infinite ease-in-out; }
        .webcam-text-anim-spin-rainbow { background: linear-gradient(90deg, red, yellow, lime, aqua, blue, magenta, red); background-size: 200% auto; color: transparent; -webkit-background-clip: text; animation: text-gradient-spin 3s linear infinite; }
        .webcam-text-anim-spin-cyber { background: linear-gradient(90deg, #ec4899, #a855f7, #06b6d4, #ec4899); background-size: 200% auto; color: transparent; -webkit-background-clip: text; animation: text-gradient-spin 2.5s linear infinite; }

        @keyframes text-gradient-spin { to { background-position: 200% center; } }
        @keyframes pulse-text { 0%, 100% { text-shadow: 0 0 2px #38bdf8; } 50% { text-shadow: 0 0 10px #38bdf8; } }
      `}</style>



      {/* Circular Webcam Frame */}
      <div
        style={{
          width: `${sizePx}px`,
          height: `${sizePx}px`,
          borderRadius: '50%',
          padding: '3px',
          boxSizing: 'border-box',
          position: 'relative',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.25)',
          transition: 'width 0.25s ease, height 0.25s ease',
        }}
      >
        {/* Animated Conic Border Ring */}
        <div className={`webcam-border-bg webcam-border-${borderAnimation}`} />

        {/* Video / Content Container */}
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            clipPath: 'circle(50% at 50% 50%)',
            WebkitClipPath: 'circle(50% at 50% 50%)',
            transform: 'translateZ(0)',
            position: 'relative',
            overflow: 'hidden',
            zIndex: 1,
          }}
        >
          {/* Real WebRTC Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: isMirrored ? 'scaleX(-1) translateZ(0)' : 'translateZ(0)',
              borderRadius: '50%',
              clipPath: 'circle(50% at 50% 50%)',
              WebkitClipPath: 'circle(50% at 50% 50%)',
              display: hasRealCamera ? 'block' : 'none',
              pointerEvents: 'none',
            }}
          />

          {/* Realistic High-Res Presenter Simulation Feed (when real webcam is not connected) */}
          {!hasRealCamera && (
            <div
              className="w-full h-full relative flex items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800"
              style={{
                transform: isMirrored ? 'scaleX(-1)' : 'none',
              }}
            >
              {/* Studio lighting backdrop effect */}
              <div className="absolute inset-0 bg-radial from-sky-500/20 via-transparent to-transparent opacity-70" />
              <div className="absolute -bottom-4 w-3/4 h-1/2 bg-indigo-500/30 blur-xl rounded-full" />

              {/* Presenter Portrait with dynamic subtle breathing motion */}
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                  alt="Shotera Camera Stream"
                  className="w-full h-full object-cover scale-110 animate-pulse duration-[4000ms]"
                  style={{
                    filter: 'contrast(1.05) saturate(1.1)',
                  }}
                />
              </div>

              {/* Live Status indicator removed */}
            </div>
          )}

          {/* Loading Indicator */}
          {cameraLoading && (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 z-20">
              <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-semibold text-sky-200">Starting Cam...</span>
            </div>
          )}
        </div>
      </div>

      {/* Text Label Badge below Circular Bubble (exact Shotera feature) */}
      {webcamText.trim() && (
        <div
          className="mt-2 mx-auto flex items-center justify-center shadow-lg"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '2px 10px',
            borderRadius: '12px',
            maxWidth: `${sizePx + 20}px`,
            pointerEvents: 'none',
          }}
        >
          <span
            className={`webcam-text-anim-${webcamTextAnimation}`}
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.3px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
              display: 'block',
              width: '100%',
              lineHeight: 1.4,
            }}
          >
            {webcamText}
          </span>
        </div>
      )}
    </div>
  );
}
