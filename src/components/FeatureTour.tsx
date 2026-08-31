import { useState, useEffect, useCallback } from "react";
import { X, ArrowLeft, ArrowRight, Check, MousePointerClick, Sparkles, Rocket, Settings, Camera, Save, ZoomIn, Timer, Video, Info } from "lucide-react";
import { translations, getLanguage } from "../i18n";
import "./FeatureTour.css";

export interface TourStep {
  id: string;
  target: string;
  tab?: string;
  titleKey: string;
  descKey: string;
  interactiveHintKey?: string;
  requireClick?: boolean;
}

/**
 * ============================================================================
 * YENİ ÖZELLİK / MENÜ EKLENDİĞİNDE TUR'A NASIL EKLENİR?
 * ============================================================================
 * Gelecekte yeni bir özellik veya menü eklediğinizde yapmanız gereken 3 basit adım:
 * 
 * 1. HEDEF BELİRLEME: Yeni menü veya buton elemanının JSX koduna şu özniteliği ekleyin:
 *    <div data-tour="nav-yeni-ozellik">...</div>
 * 
 * 2. ADIM TANIMLAMA: Aşağıdaki `TOUR_STEPS` dizisine yeni bir adım objesi ekleyin:
 *    {
 *      id: "yeni_ozellik",
 *      target: '[data-tour="nav-yeni-ozellik"]',
 *      tab: "yeni_sekme_id", // Otomatik açılmasını istediğiniz sekme (isteğe bağlı)
 *      titleKey: "tourYeniOzellikTitle",
 *      descKey: "tourYeniOzellikDesc",
 *      interactiveHintKey: "tourClickNavYeniOzellik",
 *      requireClick: true
 *    }
 * 
 * 3. ÇEVİRİ EKLEME: `src/i18n.ts` içinde başlık (titleKey) ve açıklama (descKey)
 *    metinlerini 5 dil için tanımlayın.
 * ============================================================================
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: '[data-tour="brand-logo"]',
    tab: "general",
    titleKey: "tourWelcomeTitle",
    descKey: "tourWelcomeDesc",
    interactiveHintKey: "tourClickToContinue",
    requireClick: true,
  },
  // 1. GENERAL TAB
  {
    id: "general",
    target: '[data-tour="nav-general"]',
    tab: "general",
    titleKey: "tourGeneralTitle",
    descKey: "tourGeneralDesc",
    interactiveHintKey: "tourClickNavGeneral",
    requireClick: true,
  },
  {
    id: "setting_autostart",
    target: '[data-tour="setting-autostart"]',
    tab: "general",
    titleKey: "tourAutostartTitle",
    descKey: "tourAutostartDesc",
    interactiveHintKey: "tourClickAutostart",
    requireClick: true,
  },
  {
    id: "setting_start_in_tray",
    target: '[data-tour="setting-start-in-tray"]',
    tab: "general",
    titleKey: "tourStartInTrayTitle",
    descKey: "tourStartInTrayDesc",
    interactiveHintKey: "tourClickStartInTray",
    requireClick: true,
  },
  {
    id: "setting_show_notifications",
    target: '[data-tour="setting-show-notifications"]',
    tab: "general",
    titleKey: "tourShowNotificationsTitle",
    descKey: "tourShowNotificationsDesc",
    interactiveHintKey: "tourClickShowNotifications",
    requireClick: true,
  },
  {
    id: "setting_language",
    target: '[data-tour="setting-language"]',
    tab: "general",
    titleKey: "tourLanguageTitle",
    descKey: "tourLanguageDesc",
    interactiveHintKey: "tourClickLanguage",
    requireClick: true,
  },
  // 2. CAPTURE TAB
  {
    id: "capture",
    target: '[data-tour="nav-capture"]',
    tab: "capture",
    titleKey: "tourCaptureTitle",
    descKey: "tourCaptureDesc",
    interactiveHintKey: "tourClickNavCapture",
    requireClick: true,
  },
  {
    id: "shortcut_region",
    target: '[data-tour="shortcut-region"]',
    tab: "capture",
    titleKey: "tourShortcutRegionTitle",
    descKey: "tourShortcutRegionDesc",
    interactiveHintKey: "tourClickShortcutRegion",
    requireClick: true,
  },
  {
    id: "shortcut_fullscreen",
    target: '[data-tour="shortcut-fullscreen"]',
    tab: "capture",
    titleKey: "tourShortcutFullscreenTitle",
    descKey: "tourShortcutFullscreenDesc",
    interactiveHintKey: "tourClickShortcutFullscreen",
    requireClick: true,
  },
  {
    id: "setting_shutter",
    target: '[data-tour="setting-shutter"]',
    tab: "capture",
    titleKey: "tourShutterAudioTitle",
    descKey: "tourShutterAudioDesc",
    interactiveHintKey: "tourClickShutterAudio",
    requireClick: true,
  },
  {
    id: "setting_include_cursor",
    target: '[data-tour="setting-include-cursor"]',
    tab: "capture",
    titleKey: "tourIncludeCursorTitle",
    descKey: "tourIncludeCursorDesc",
    interactiveHintKey: "tourClickIncludeCursor",
    requireClick: true,
  },
  {
    id: "setting_blur_amount",
    target: '[data-tour="setting-blur-amount"]',
    tab: "capture",
    titleKey: "tourBlurAmountTitle",
    descKey: "tourBlurAmountDesc",
    interactiveHintKey: "tourClickBlurAmount",
    requireClick: true,
  },
  {
    id: "setting_editor_shortcuts",
    target: '[data-tour="setting-editor-shortcuts"]',
    tab: "capture",
    titleKey: "tourEditorShortcutsTitle",
    descKey: "tourEditorShortcutsDesc",
    interactiveHintKey: "tourClickEditorShortcuts",
    requireClick: true,
  },
  // 3. SAVE TAB
  {
    id: "save",
    target: '[data-tour="nav-save"]',
    tab: "save",
    titleKey: "tourSaveTitle",
    descKey: "tourSaveDesc",
    interactiveHintKey: "tourClickNavSave",
    requireClick: true,
  },
  {
    id: "setting_save_folder",
    target: '[data-tour="setting-save-folder"]',
    tab: "save",
    titleKey: "tourSaveFolderTitle",
    descKey: "tourSaveFolderDesc",
    interactiveHintKey: "tourClickSaveFolder",
    requireClick: true,
  },
  {
    id: "setting_video_save_folder",
    target: '[data-tour="setting-video-save-folder"]',
    tab: "save",
    titleKey: "tourVideoSaveFolderTitle",
    descKey: "tourVideoSaveFolderDesc",
    interactiveHintKey: "tourClickVideoSaveFolder",
    requireClick: true,
  },
  {
    id: "setting_format",
    target: '[data-tour="setting-format"]',
    tab: "save",
    titleKey: "tourFileFormatTitle",
    descKey: "tourFileFormatDesc",
    interactiveHintKey: "tourClickFileFormat",
    requireClick: true,
  },
  // 4. ZOOM TAB
  {
    id: "zoom",
    target: '[data-tour="nav-zoom"]',
    tab: "zoom",
    titleKey: "tourZoomTitle",
    descKey: "tourZoomDesc",
    interactiveHintKey: "tourClickNavZoom",
    requireClick: true,
  },
  {
    id: "shortcut_zoom",
    target: '[data-tour="shortcut-zoom"]',
    tab: "zoom",
    titleKey: "tourShortcutZoomTitle",
    descKey: "tourShortcutZoomDesc",
    interactiveHintKey: "tourClickShortcutZoom",
    requireClick: true,
  },
  {
    id: "setting_zoom_draw",
    target: '[data-tour="setting-zoom-draw"]',
    tab: "zoom",
    titleKey: "tourZoomDrawTitle",
    descKey: "tourZoomDrawDesc",
    interactiveHintKey: "tourClickZoomDraw",
    requireClick: true,
  },
  {
    id: "setting_zoom_nav",
    target: '[data-tour="setting-zoom-nav"]',
    tab: "zoom",
    titleKey: "tourZoomNavTitle",
    descKey: "tourZoomNavDesc",
    interactiveHintKey: "tourClickZoomNav",
    requireClick: true,
  },
  // 5. TIMER TAB
  {
    id: "timer",
    target: '[data-tour="nav-timer"]',
    tab: "timer",
    titleKey: "tourTimerTitle",
    descKey: "tourTimerDesc",
    interactiveHintKey: "tourClickNavTimer",
    requireClick: true,
  },
  {
    id: "shortcut_timer",
    target: '[data-tour="shortcut-timer"]',
    tab: "timer",
    titleKey: "tourShortcutTimerTitle",
    descKey: "tourShortcutTimerDesc",
    interactiveHintKey: "tourClickShortcutTimer",
    requireClick: true,
  },
  {
    id: "setting_timer_reset",
    target: '[data-tour="setting-timer-reset"]',
    tab: "timer",
    titleKey: "tourTimerResetTitle",
    descKey: "tourTimerResetDesc",
    interactiveHintKey: "tourClickTimerReset",
    requireClick: true,
  },
  {
    id: "setting_timer_duration",
    target: '[data-tour="setting-timer-duration"]',
    tab: "timer",
    titleKey: "tourTimerDurationTitle",
    descKey: "tourTimerDurationDesc",
    interactiveHintKey: "tourClickTimerDuration",
    requireClick: true,
  },
  {
    id: "setting_timer_direction",
    target: '[data-tour="setting-timer-direction"]',
    tab: "timer",
    titleKey: "tourTimerDirectionTitle",
    descKey: "tourTimerDirectionDesc",
    interactiveHintKey: "tourClickTimerDirection",
    requireClick: true,
  },
  {
    id: "setting_timer_show_elapsed",
    target: '[data-tour="setting-timer-show-elapsed"]',
    tab: "timer",
    titleKey: "tourTimerShowElapsedTitle",
    descKey: "tourTimerShowElapsedDesc",
    interactiveHintKey: "tourClickTimerShowElapsed",
    requireClick: true,
  },
  {
    id: "setting_timer_lock_workstation",
    target: '[data-tour="setting-timer-lock-workstation"]',
    tab: "timer",
    titleKey: "tourTimerLockWorkstationTitle",
    descKey: "tourTimerLockWorkstationDesc",
    interactiveHintKey: "tourClickTimerLockWorkstation",
    requireClick: true,
  },
  {
    id: "timer_subtab_theme",
    target: '[data-tour="timer-subtab-theme"]',
    tab: "timer",
    titleKey: "tourTimerSubTabThemeTitle",
    descKey: "tourTimerSubTabThemeDesc",
    interactiveHintKey: "tourClickTimerSubTabTheme",
    requireClick: true,
  },
  {
    id: "setting_timer_preview",
    target: '[data-tour="setting-timer-preview"]',
    tab: "timer",
    titleKey: "tourTimerPreviewTitle",
    descKey: "tourTimerPreviewDesc",
    interactiveHintKey: "tourClickTimerPreview",
    requireClick: true,
  },
  {
    id: "timer_subtab_sound",
    target: '[data-tour="timer-subtab-sound"]',
    tab: "timer",
    titleKey: "tourTimerSubTabSoundTitle",
    descKey: "tourTimerSubTabSoundDesc",
    interactiveHintKey: "tourClickTimerSubTabSound",
    requireClick: true,
  },
  {
    id: "setting_timer_sound",
    target: '[data-tour="setting-timer-sound"]',
    tab: "timer",
    titleKey: "tourTimerSoundTitle",
    descKey: "tourTimerSoundDesc",
    interactiveHintKey: "tourClickTimerSound",
    requireClick: true,
  },
  {
    id: "setting_timer_shortcuts",
    target: '[data-tour="setting-timer-shortcuts"]',
    tab: "timer",
    titleKey: "tourTimerShortcutsTitle",
    descKey: "tourTimerShortcutsDesc",
    interactiveHintKey: "tourClickTimerShortcuts",
    requireClick: true,
  },
  // 6. LIVE ZOOM TAB
  {
    id: "live_zoom",
    target: '[data-tour="nav-live_zoom"]',
    tab: "live_zoom",
    titleKey: "tourLiveZoomTitle",
    descKey: "tourLiveZoomDesc",
    interactiveHintKey: "tourClickNavLiveZoom",
    requireClick: true,
  },
  {
    id: "shortcut_live_zoom",
    target: '[data-tour="shortcut-live-zoom"]',
    tab: "live_zoom",
    titleKey: "tourShortcutLiveZoomTitle",
    descKey: "tourShortcutLiveZoomDesc",
    interactiveHintKey: "tourClickShortcutLiveZoom",
    requireClick: true,
  },
  {
    id: "setting_live_zoom_nav",
    target: '[data-tour="setting-live-zoom-nav"]',
    tab: "live_zoom",
    titleKey: "tourLiveZoomNavTitle",
    descKey: "tourLiveZoomNavDesc",
    interactiveHintKey: "tourClickLiveZoomNav",
    requireClick: true,
  },
  // 7. RECORD TAB
  {
    id: "record",
    target: '[data-tour="nav-record"]',
    tab: "record",
    titleKey: "tourRecordTitle",
    descKey: "tourRecordDesc",
    interactiveHintKey: "tourClickNavRecord",
    requireClick: true,
  },
  {
    id: "setting_record_fps",
    target: '[data-tour="setting-record-fps"]',
    tab: "record",
    titleKey: "tourRecordFpsTitle",
    descKey: "tourRecordFpsDesc",
    interactiveHintKey: "tourClickRecordFps",
    requireClick: true,
  },
  {
    id: "setting_webcam_permission",
    target: '[data-tour="setting-webcam-permission"]',
    tab: "record",
    titleKey: "tourWebcamPermissionTitle",
    descKey: "tourWebcamPermissionDesc",
    interactiveHintKey: "tourClickWebcamPermission",
    requireClick: true,
  },
  {
    id: "setting_record_webcam",
    target: '[data-tour="setting-record-webcam"]',
    tab: "record",
    titleKey: "tourRecordWebcamTitle",
    descKey: "tourRecordWebcamDesc",
    interactiveHintKey: "tourClickRecordWebcam",
    requireClick: true,
  },
  {
    id: "setting_record_mic",
    target: '[data-tour="setting-record-mic"]',
    tab: "record",
    titleKey: "tourRecordMicTitle",
    descKey: "tourRecordMicDesc",
    interactiveHintKey: "tourClickRecordMic",
    requireClick: true,
  },
  {
    id: "setting_record_audio",
    target: '[data-tour="setting-record-audio"]',
    tab: "record",
    titleKey: "tourRecordAudioTitle",
    descKey: "tourRecordAudioDesc",
    interactiveHintKey: "tourClickRecordAudio",
    requireClick: true,
  },
  {
    id: "setting_record_controls",
    target: '[data-tour="setting-record-controls"]',
    tab: "record",
    titleKey: "tourRecordControlsTitle",
    descKey: "tourRecordControlsDesc",
    interactiveHintKey: "tourClickRecordControls",
    requireClick: true,
  },
  {
    id: "setting_audio_ducking",
    target: '[data-tour="setting-audio-ducking"]',
    tab: "record",
    titleKey: "tourAudioDuckingTitle",
    descKey: "tourAudioDuckingDesc",
    interactiveHintKey: "tourClickAudioDucking",
    requireClick: true,
  },
  {
    id: "setting_webcam_mode",
    target: '[data-tour="setting-webcam-mode"]',
    tab: "record",
    titleKey: "tourWebcamModeTitle",
    descKey: "tourWebcamModeDesc",
    interactiveHintKey: "tourClickWebcamMode",
    requireClick: true,
  },
  {
    id: "setting_webcam_text_style",
    target: '[data-tour="setting-webcam-text-style"]',
    tab: "record",
    titleKey: "tourWebcamTextStyleTitle",
    descKey: "tourWebcamTextStyleDesc",
    interactiveHintKey: "tourClickWebcamTextStyle",
    requireClick: true,
  },
  {
    id: "shortcut_record",
    target: '[data-tour="shortcut-record"]',
    tab: "record",
    titleKey: "tourShortcutRecordTitle",
    descKey: "tourShortcutRecordDesc",
    interactiveHintKey: "tourClickShortcutRecord",
    requireClick: true,
  },
  {
    id: "shortcut_pause_record",
    target: '[data-tour="shortcut-pause-record"]',
    tab: "record",
    titleKey: "tourShortcutPauseRecordTitle",
    descKey: "tourShortcutPauseRecordDesc",
    interactiveHintKey: "tourClickShortcutPauseRecord",
    requireClick: true,
  },
  {
    id: "shortcut_webcam",
    target: '[data-tour="shortcut-webcam"]',
    tab: "record",
    titleKey: "tourShortcutWebcamTitle",
    descKey: "tourShortcutWebcamDesc",
    interactiveHintKey: "tourClickShortcutWebcam",
    requireClick: true,
  },
  {
    id: "shortcut_mic",
    target: '[data-tour="shortcut-mic"]',
    tab: "record",
    titleKey: "tourShortcutMicTitle",
    descKey: "tourShortcutMicDesc",
    interactiveHintKey: "tourClickShortcutMic",
    requireClick: true,
  },
  {
    id: "setting_record_shortcuts_card",
    target: '[data-tour="setting-record-shortcuts-card"]',
    tab: "record",
    titleKey: "tourRecordShortcutsCardTitle",
    descKey: "tourRecordShortcutsCardDesc",
    interactiveHintKey: "tourClickRecordShortcutsCard",
    requireClick: true,
  },
  {
    id: "setting_webcam_preview",
    target: '[data-tour="setting-webcam-preview"]',
    tab: "record",
    titleKey: "tourWebcamPreviewTitle",
    descKey: "tourWebcamPreviewDesc",
    interactiveHintKey: "tourClickWebcamPreview",
    requireClick: true,
  },
  {
    id: "setting_record_controls_preview",
    target: '[data-tour="setting-record-controls-preview"]',
    tab: "record",
    titleKey: "tourRecordControlsPreviewTitle",
    descKey: "tourRecordControlsPreviewDesc",
    interactiveHintKey: "tourClickRecordControlsPreview",
    requireClick: true,
  },
  // 8. ABOUT TAB
  {
    id: "about",
    target: '[data-tour="nav-about"]',
    tab: "about",
    titleKey: "tourAboutTitle",
    descKey: "tourAboutDesc",
    interactiveHintKey: "tourClickNavAbout",
    requireClick: true,
  },
  {
    id: "setting_about_info",
    target: '[data-tour="setting-about-info"]',
    tab: "about",
    titleKey: "tourAboutInfoTitle",
    descKey: "tourAboutInfoDesc",
    interactiveHintKey: "tourClickAboutInfo",
    requireClick: true,
  },
  {
    id: "setting_update_check",
    target: '[data-tour="setting-update-check"]',
    tab: "about",
    titleKey: "tourUpdateCheckTitle",
    descKey: "tourUpdateCheckDesc",
    interactiveHintKey: "tourClickUpdateCheck",
    requireClick: true,
  },
  // 9. FINAL STEP
  {
    id: "setting_developer_info",
    target: '[data-tour="setting-developer-info"]',
    tab: "about",
    titleKey: "tourDeveloperInfoTitle",
    descKey: "tourDeveloperInfoDesc",
    interactiveHintKey: "tourClickDeveloperInfo",
    requireClick: false,
  },
];

interface FeatureTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: string) => void;
}

export default function FeatureTour({ isOpen, onClose, onSelectTab }: FeatureTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const lang = getLanguage();
  const t = (translations[lang] || translations.en) as any;

  const currentStep = TOUR_STEPS[currentStepIndex];

  // Update target element dimensions & position
  const updateTargetRect = useCallback(() => {
    if (!currentStep) return;
    const el = document.querySelector(currentStep.target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  // Scroll target element into view and update rect
  const scrollToAndRect = useCallback(() => {
    if (!currentStep) return;
    const el = document.querySelector(currentStep.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  // Handle step change
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    if (currentStep.tab && onSelectTab) {
      onSelectTab(currentStep.tab);
    }

    // Scroll to element & update rect with smooth animation sync ticks
    scrollToAndRect();
    const timer1 = setTimeout(updateTargetRect, 60);
    const timer2 = setTimeout(updateTargetRect, 180);
    const timer3 = setTimeout(updateTargetRect, 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen, currentStepIndex, currentStep, onSelectTab, updateTargetRect, scrollToAndRect]);

  // Continuous animation frame loop to track target position during scrolling
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    const loop = () => {
      updateTargetRect();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, updateTargetRect]);

  // Handle interactive clicks on target element
  useEffect(() => {
    if (!isOpen || !currentStep) return;

    const handleTargetClick = (e: MouseEvent) => {
      const el = document.querySelector(currentStep.target);
      if (el && (el.contains(e.target as Node) || e.target === el)) {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          handleFinish();
        }
      }
    };

    window.addEventListener("click", handleTargetClick, true);
    return () => window.removeEventListener("click", handleTargetClick, true);
  }, [isOpen, currentStep, currentStepIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem("shotera_tour_completed", "true");
    onClose();
    setCurrentStepIndex(0);
  };

  if (!isOpen || !currentStep) return null;

  // Calculate tooltip position relative to spotlight target
  let tooltipStyle: React.CSSProperties = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };

  if (targetRect) {
    const isRightSide = targetRect.left > window.innerWidth / 2;
    const isBottomSide = targetRect.top > window.innerHeight / 2;

    if (targetRect.width > 300) {
      // Large element: position centered below or above
      tooltipStyle = {
        position: "fixed",
        left: `${Math.max(20, Math.min(window.innerWidth - 380, targetRect.left + (targetRect.width / 2) - 180))}px`,
        top: isBottomSide ? `${Math.max(20, targetRect.top - 180)}px` : `${Math.min(window.innerHeight - 200, targetRect.bottom + 16)}px`,
      };
    } else {
      // Small element (like sidebar link): position to the right or left
      tooltipStyle = {
        position: "fixed",
        left: isRightSide ? `${Math.max(20, targetRect.left - 360)}px` : `${Math.min(window.innerWidth - 380, targetRect.right + 20)}px`,
        top: `${Math.max(20, Math.min(window.innerHeight - 220, targetRect.top - 10))}px`,
      };
    }
  }

  const titleText = t[currentStep.titleKey] || currentStep.titleKey;
  const descText = t[currentStep.descKey] || currentStep.descKey;
  const interactiveHintText = currentStep.interactiveHintKey ? (t[currentStep.interactiveHintKey] || currentStep.interactiveHintKey) : null;

  const getTabIcon = (step: TourStep) => {
    if (step.id === "welcome") return <Rocket size={20} style={{ color: "var(--accent-cyan)", marginLeft: "8px" }} />;
    switch (step.tab) {
      case "general": return <Settings size={18} style={{ color: "#a855f7", marginLeft: "8px" }} />;
      case "capture": return <Camera size={18} style={{ color: "#ec4899", marginLeft: "8px" }} />;
      case "save": return <Save size={18} style={{ color: "#22c55e", marginLeft: "8px" }} />;
      case "zoom":
      case "live_zoom": return <ZoomIn size={18} style={{ color: "#f59e0b", marginLeft: "8px" }} />;
      case "timer": return <Timer size={18} style={{ color: "#3b82f6", marginLeft: "8px" }} />;
      case "record": return <Video size={18} style={{ color: "#ef4444", marginLeft: "8px" }} />;
      case "about": return <Info size={18} style={{ color: "#8b5cf6", marginLeft: "8px" }} />;
      default: return null;
    }
  };

  return (
    <div className="tour-overlay">
      {/* SVG Spotlight Cutout Mask */}
      <svg className="tour-spotlight-svg">
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="10"
                ry="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0, 0, 0, 0.75)" mask="url(#tour-spotlight-mask)" />
      </svg>

      {/* Target Highlight Pulsing Border */}
      {targetRect && (
        <div
          className="tour-target-glow"
          onClick={handleNext}
          title={interactiveHintText || "Sonraki Adım"}
          style={{
            left: `${targetRect.left - 6}px`,
            top: `${targetRect.top - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            cursor: "pointer",
          }}
        />
      )}

      {/* Floating Interactive Tooltip Card */}
      <div className="tour-card" style={tooltipStyle}>
        <div className="tour-header">
          <span className="tour-badge">
            {currentStepIndex + 1} / {TOUR_STEPS.length}
          </span>
          <button className="tour-skip-btn" onClick={handleFinish} title={t.tourSkip || "Turu Geç"} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {t.tourSkip || "Turu Geç"} <X size={13} strokeWidth={2.5} />
          </button>
        </div>

        <h3 className="tour-title" style={{ display: "flex", alignItems: "center" }}>
          {titleText}
          {getTabIcon(currentStep)}
        </h3>
        <p className="tour-desc">{descText}</p>

        {interactiveHintText && (
          <div className="tour-interactive-hint" onClick={handleNext} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            <MousePointerClick size={16} className="tour-hand-icon" /> {interactiveHintText}
          </div>
        )}

        <div className="tour-footer">
          <button
            className="tour-btn secondary"
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={15} strokeWidth={2.5} /> {(t.tourPrev || "Önceki")}
          </button>

          <button className="tour-btn primary" onClick={handleNext} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {currentStepIndex === TOUR_STEPS.length - 1 ? (
              <>{(t.tourFinish || "Anladım, Bitir")} <Sparkles size={15} strokeWidth={2.5} /></>
            ) : (
              <>{(t.tourNext || "Sonraki")} <ArrowRight size={15} strokeWidth={2.5} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
