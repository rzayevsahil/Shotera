import { ShortcutItem, FeatureCategory } from './types';

export const SHORTCUTS_DATA: ShortcutItem[] = [
  {
    id: 'region-capture',
    keys: ['Ctrl', 'Shift', 'S'],
    action: 'Region Capture',
    category: 'capture',
    description: 'Select rectangular or freeform screen area with live precision loupe & color picker.',
  },
  {
    id: 'fullscreen-capture',
    keys: ['Ctrl', 'Shift', 'F'],
    action: 'Full-Screen Capture',
    category: 'capture',
    description: 'Instantly capture all connected monitors or active display to clipboard and history.',
  },
  {
    id: 'screen-zoom',
    keys: ['Ctrl', '1'],
    action: 'Screen Zoom',
    category: 'zoom',
    description: 'Magnify live screen with smooth hardware scaling and draw overlays on active display.',
  },
  {
    id: 'timer',
    keys: ['Ctrl', '3'],
    action: 'Break & Focus Timer',
    category: 'timer',
    description: 'Trigger full-screen ergonomic 20-20-20 eye rest or Pomodoro focus countdown.',
  },
  {
    id: 'live-zoom',
    keys: ['Ctrl', '4'],
    action: 'Live Screen Zoom',
    category: 'zoom',
    description: 'Interactive live desktop zoom with real-time mouse interaction and active window inputs.',
  },
  {
    id: 'screen-record',
    keys: ['Ctrl', '5'],
    action: 'Screen Recording',
    category: 'record',
    description: 'Toggle hardware-accelerated video capture for full screen or designated application window.',
  },
];

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    id: 'capture',
    title: 'Capture',
    iconName: 'Crop',
    items: [
      {
        title: 'Region & Window Snapping',
        description: 'Pixel-accurate crosshair with smart edge detection and active window outline detection.',
      },
      {
        title: 'Full-Screen & Multi-Monitor',
        description: 'Single-hotkey capture across 4K displays and mixed DPI setups without downscaling artifacts.',
      },
      {
        title: 'Multiple Image Formats',
        description: 'Direct output to lossless PNG, compressed JPEG, modern WebP, or uncompressed BMP.',
      },
      {
        title: 'Lossless Loupe & HEX Inspector',
        description: 'Real-time 8x zoom magnifier showing exact RGB and HEX color codes for UI developers.',
      },
    ],
  },
  {
    id: 'explain',
    title: 'Explain',
    iconName: 'PenTool',
    items: [
      {
        title: 'Step Numbering Badges',
        description: 'Auto-incrementing numbered circles (1, 2, 3...) for documenting workflows and tutorials.',
      },
      {
        title: 'Vector Arrows & Shapes',
        description: 'Clean geometric lines, filled rectangles, ellipses, and curved pointer arrows.',
      },
      {
        title: 'Security Blur & Pixelation',
        description: 'Non-destructive Gaussian blur and pixelation brushes for hiding passwords, tokens, and PII.',
      },
      {
        title: 'Clean Typography Callouts',
        description: 'High-contrast text badges with customizable font weights, background pill, and shadows.',
      },
    ],
  },
  {
    id: 'present',
    title: 'Present',
    iconName: 'ZoomIn',
    items: [
      {
        title: 'Hardware Screen Zoom',
        description: 'Fluid 2x to 8x screen magnification with zero CPU lag during live presentations.',
      },
      {
        title: 'Live Screen Drawing',
        description: 'Draw freehand vector lines, arrows, and circles directly on top of running desktop applications.',
      },
      {
        title: 'Interactive Live Zoom',
        description: 'Keep desktop apps clickable and interactive while working in a magnified viewport.',
      },
      {
        title: 'Screen Pinning (Always-on-Top)',
        description: 'Pin screenshot snippets anywhere on screen as floating reference cards while writing code.',
      },
    ],
  },
  {
    id: 'record',
    title: 'Record',
    iconName: 'Video',
    items: [
      {
        title: 'Hardware Acceleration',
        description: 'Native GPU-backed video encoding (NVENC / QuickSync / AMD AMF) for seamless 60 FPS recording.',
      },
      {
        title: 'Targeted Window Capture',
        description: 'Record specific application windows without capturing confidential taskbar or background clutter.',
      },
      {
        title: 'Synchronized Audio Streams',
        description: 'Simultaneously capture studio microphone audio and internal PC audio with balance sliders.',
      },
      {
        title: 'Lightweight MP4 Packaging',
        description: 'Immediate export to widely supported H.264 MP4 with compact file sizes ready for sharing.',
      },
    ],
  },
  {
    id: 'smarter',
    title: 'Work Smarter',
    iconName: 'Cpu',
    items: [
      {
        title: 'On-Device Screen OCR',
        description: 'Instantly extract text from unselectable UI dialogs, protected PDFs, and videos to clipboard.',
      },
      {
        title: 'Ergonomic Break & Focus Timer',
        description: 'Integrated 20-20-20 rest intervals and Pomodoro timers to reduce eye fatigue during long sessions.',
      },
      {
        title: 'Cloud Upload & Instant Link',
        description: 'Upload captures with one click and receive a clean shareable URL in your clipboard.',
      },
      {
        title: 'System Tray & Auto Updates',
        description: 'Runs silently in background with ~40MB RAM usage; automatic frictionless update engine.',
      },
    ],
  },
];

export const SHOTERA_LINKS = {
  repo: 'https://github.com/rzayevsahil/Shotera',
  releases: 'https://github.com/rzayevsahil/Shotera/releases',
  latestRelease: 'https://github.com/rzayevsahil/Shotera/releases/latest',
  downloadExe: 'https://github.com/rzayevsahil/Shotera/releases/latest/download/Shotera-Setup.exe',
  downloadZip: 'https://github.com/rzayevsahil/Shotera/releases/latest/download/Shotera-Portable.zip',
  issues: 'https://github.com/rzayevsahil/Shotera/issues',
  author: 'https://github.com/rzayevsahil',
};
