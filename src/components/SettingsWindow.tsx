import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Settings, Camera, FolderOpen, Info, Github, Mail, AlertTriangle, ZoomIn, Video, Play, Monitor, Timer, Volume2, Palette, LayoutTemplate, Shapes, Pencil, Undo2, LogOut, Clock, Zap, RotateCcw, Copy, Save, Square } from "lucide-react";
import logo from "../assets/logo.png";
import avatar from "../assets/developer_image.png";
import { translations, getLanguage, setLanguage, Language } from "../i18n";
import { playTimerSound } from "../utils/audio";
import { listen } from "@tauri-apps/api/event";
import shutterSoundUrl from "../assets/shutter.mp3";
import { check as checkUpdate } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { sendNotification } from "@tauri-apps/plugin-notification";
import ScreenRecorderModal from "./ScreenRecorderModal";
type ActiveTab = "general" | "capture" | "save" | "zoom" | "live_zoom" | "timer" | "record" | "about";


function SettingsWindow() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("general");
  const [lang, setLang] = useState<Language>(getLanguage);
  const [appVersion, setAppVersion] = useState("v0.1.0");

  useEffect(() => {
    getVersion().then(v => setAppVersion(`v${v}`)).catch(() => { });
  }, []);

  // Settings state synced with localStorage
  const [startAtBoot, setStartAtBoot] = useState(() => localStorage.getItem("startAtBoot") === "true");
  const [startInTray, setStartInTray] = useState(() => localStorage.getItem("startInTray") !== "false"); // default true
  const [showNotifications, setShowNotifications] = useState(() => localStorage.getItem("showNotifications") !== "false"); // default true
  const [includeCursor, setIncludeCursor] = useState(() => localStorage.getItem("includeCursor") === "true");
  const [playAudio, setPlayAudio] = useState(() => localStorage.getItem("playAudio") !== "false"); // default true
  const [savePath, setSavePath] = useState(() => localStorage.getItem("savePath") || "Pictures/Shotera");
  const [videoSavePath, setVideoSavePath] = useState(() => localStorage.getItem("videoSavePath") || "Videos/Shotera");
  const [fileFormat, setFileFormat] = useState(() => localStorage.getItem("fileFormat") || "PNG");
  const [imageQuality, setImageQuality] = useState(() => Number(localStorage.getItem("imageQuality") || "100"));
  const [regionShortcut, setRegionShortcut] = useState(() => localStorage.getItem("regionShortcut") || "Ctrl+Shift+S");
  const [fullscreenShortcut, setFullscreenShortcut] = useState(() => localStorage.getItem("fullscreenShortcut") || "Ctrl+Shift+F");
  const [zoomShortcut, setZoomShortcut] = useState(() => localStorage.getItem("zoomShortcut") || "Ctrl+1");
  const [liveZoomShortcut, setLiveZoomShortcut] = useState(() => localStorage.getItem("liveZoomShortcut") || "Ctrl+4");
  const [recordShortcut, setRecordShortcut] = useState(() => localStorage.getItem("recordShortcut") || "Ctrl+5");
  const [timerShortcut, setTimerShortcut] = useState(() => localStorage.getItem("timerShortcut") || "Ctrl+3");
  const [timerDefaultDuration, setTimerDefaultDuration] = useState<number>(() => Number(localStorage.getItem("timerDefaultDuration") || "600"));
  const [timerCountDirection, setTimerCountDirection] = useState<"down" | "up">(() => (localStorage.getItem("timerCountDirection") as "down" | "up") || "down");
  const [timerRingColor, setTimerRingColor] = useState<string>(() => localStorage.getItem("timerRingColor") || "#38bdf8");
  const [customTimerRingColor, setCustomTimerRingColor] = useState<string>(() => {
    const savedCustom = localStorage.getItem("customTimerRingColor");
    if (savedCustom) return savedCustom;
    const current = localStorage.getItem("timerRingColor") || "#06b6d4";
    return ["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899"].includes(current) ? "#06b6d4" : current;
  });
  const [timerBgStyle, setTimerBgStyle] = useState<string>(() => localStorage.getItem("timerBgStyle") || "dark-slate");
  const [timerBgColor, setTimerBgColor] = useState<string>(() => localStorage.getItem("timerBgColor") || "#0f172a");
  const [customTimerBgColor, setCustomTimerBgColor] = useState<string>(() => {
    const savedCustom = localStorage.getItem("customTimerBgColor");
    if (savedCustom) return savedCustom;
    const current = localStorage.getItem("timerBgColor") || "#1e1b4b";
    return ["#0f172a", "#000000", "#1e1b4b", "#06202a", "#1c0d24", "#3f0e0e"].includes(current) ? "#1e1b4b" : current;
  });
  const [timerFontStyle, setTimerFontStyle] = useState<string>(() => localStorage.getItem("timerFontStyle") || "sans");
  const [timerSoundPreset, setTimerSoundPreset] = useState<string>(() => localStorage.getItem("timerSoundPreset") || "chime");
  const [timerSoundRepeat, setTimerSoundRepeat] = useState<string>(() => localStorage.getItem("timerSoundRepeat") || "1");
  const [recordingType, setRecordingType] = useState<"region" | "fullscreen" | "zoom" | "live_zoom" | "record" | "timer" | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isRecorderModalOpen, setIsRecorderModalOpen] = useState(false);
  const [recordFps, setRecordFps] = useState<number>(() => Number(localStorage.getItem("recordFps") || "30"));
  const [recordAudio, setRecordAudio] = useState<boolean>(() => localStorage.getItem("recordAudio") !== "false");
  const [recordMic, setRecordMic] = useState<boolean>(() => localStorage.getItem("recordMic") === "true");

  // Updater state
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "up-to-date" | "available" | "downloading" | "downloaded" | "error">("idle");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateManifest, setUpdateManifest] = useState<any>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const handleUpdateCheck = async (silent = false) => {
    if (!silent) setUpdateStatus("checking");
    try {
      const update = await checkUpdate();
      if (update) {
        setUpdateVersion(update.version);
        setUpdateManifest(update);
        setUpdateStatus("available");
        if (silent) {
          sendNotification({
            id: 999,
            title: "Shotera",
            body: (t as any).updateNotificationBody(update.version)
          });
        }
      } else {
        if (!silent) setUpdateStatus("up-to-date");
      }
    } catch (err) {
      console.error("Failed to check for updates:", err);
      if (!silent) setUpdateStatus("error");
    }
  };

  // Listen to notification clicks
  useEffect(() => {
    import("@tauri-apps/plugin-notification").then(({ onAction }) => {
      let unlistenFn: any;
      onAction((notification: any) => {
        if (notification?.id == 999 || notification?.title === "Shotera" || !notification?.id) {
          setActiveTab("about");
          invoke("show_settings_window").catch(console.error);
        }
      }).then((fn) => {
        unlistenFn = fn;
      }).catch(console.error);

      return () => {
        if (unlistenFn && typeof unlistenFn.unregister === 'function') {
          unlistenFn.unregister();
        }
      };
    });
  }, []);

  // Auto-check for updates on mount
  useEffect(() => {
    handleUpdateCheck(true);
  }, []);

  const handleUpdateInstall = async () => {
    if (!updateManifest) return;
    setUpdateStatus("downloading");
    setDownloadProgress(0);
    try {
      let downloaded = 0;
      let total = 0;
      await updateManifest.downloadAndInstall((event: any) => {
        if (event.event === 'Started') {
          total = event.data.contentLength || 0;
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          if (total > 0) {
            setDownloadProgress(Math.round((downloaded / total) * 100));
          }
        }
      });
      setDownloadProgress(100);
      setUpdateStatus("downloaded");
      setTimeout(async () => {
        await relaunch();
      }, 1500);
    } catch (err) {
      console.error("Failed to download and install update:", err);
      setUpdateStatus("error");
    }
  };

  const handleAutostartToggle = async (checked: boolean) => {
    setStartAtBoot(checked);
    localStorage.setItem("startAtBoot", String(checked));
    try {
      if (checked) {
        await enable();
        await invoke("unblock_autostart_registry");
      } else {
        await disable();
      }
    } catch (err) {
      console.error("Failed to toggle autostart:", err);
    }
  };

  // Sync autostart status on mount with OS registry
  useEffect(() => {
    isEnabled().then((enabled: boolean) => {
      const saved = localStorage.getItem("startAtBoot") === "true";
      if (saved && !enabled) {
        enable().catch(err => console.error("Failed to repair autostart on mount:", err));
      } else if (!saved && enabled) {
        disable().catch(err => console.error("Failed to disable autostart on mount:", err));
      }
    }).catch(err => console.error("Failed to check autostart status on mount:", err));
  }, []);

  const [defaultBlurAmount, setDefaultBlurAmount] = useState(() => Number(localStorage.getItem("defaultBlurAmount") || "8"));

  useEffect(() => {
    const handleStorage = () => {
      setDefaultBlurAmount(Number(localStorage.getItem("defaultBlurAmount") || "8"));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Sync settings with localStorage
  useEffect(() => {
    localStorage.setItem("startAtBoot", String(startAtBoot));
    localStorage.setItem("startInTray", String(startInTray));
    localStorage.setItem("includeCursor", String(includeCursor));
    localStorage.setItem("playAudio", String(playAudio));
    localStorage.setItem("savePath", savePath);
    localStorage.setItem("videoSavePath", videoSavePath);
    localStorage.setItem("fileFormat", fileFormat);
    localStorage.setItem("imageQuality", String(imageQuality));
    localStorage.setItem("regionShortcut", regionShortcut);
    localStorage.setItem("fullscreenShortcut", fullscreenShortcut);
    localStorage.setItem("zoomShortcut", zoomShortcut);
    localStorage.setItem("liveZoomShortcut", liveZoomShortcut);
    localStorage.setItem("recordShortcut", recordShortcut);
    localStorage.setItem("timerShortcut", timerShortcut);
    localStorage.setItem("timerDefaultDuration", String(timerDefaultDuration));
    localStorage.setItem("timerCountDirection", timerCountDirection);
    localStorage.setItem("timerRingColor", timerRingColor);
    localStorage.setItem("timerBgStyle", timerBgStyle);
    localStorage.setItem("timerFontStyle", timerFontStyle);
    localStorage.setItem("timerSoundPreset", timerSoundPreset);
    localStorage.setItem("defaultBlurAmount", String(defaultBlurAmount));
    localStorage.setItem("showNotifications", String(showNotifications));

    window.dispatchEvent(new Event("storage"));
  }, [startAtBoot, startInTray, includeCursor, playAudio, savePath, videoSavePath, fileFormat, imageQuality, regionShortcut, fullscreenShortcut, zoomShortcut, liveZoomShortcut, timerShortcut, timerDefaultDuration, timerCountDirection, timerRingColor, timerBgStyle, timerFontStyle, timerSoundPreset, showNotifications, defaultBlurAmount]);

  // Sync keyboard shortcuts with Rust backend
  useEffect(() => {
    invoke("update_shortcuts", {
      regionShortcut: regionShortcut,
      fullscreenShortcut: fullscreenShortcut,
      zoomShortcut: zoomShortcut,
      timerShortcut: timerShortcut,
      liveZoomShortcut: liveZoomShortcut,
      recordShortcut: recordShortcut,
    }).catch((e) => {
      console.error("Failed to sync shortcuts with Rust backend:", e);
    });
  }, [regionShortcut, fullscreenShortcut, zoomShortcut, timerShortcut, liveZoomShortcut, recordShortcut]);

  // Handle global shortcut recording
  useEffect(() => {
    if (!recordingType) return;

    // 1. Temporarily unregister global shortcuts so they don't trigger capture actions
    invoke("unregister_global_shortcuts").catch((err) => console.error(err));

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Ignore single modifier key presses
      if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
        return;
      }

      const parts: string[] = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.shiftKey) parts.push("Shift");
      if (e.altKey) parts.push("Alt");
      if (e.metaKey) parts.push("Super");

      let keyName = e.key;

      if (keyName === "PrintScreen" || keyName === "Snapshot" || e.code === "PrintScreen") {
        keyName = "PrintScreen";
      } else if (e.code.startsWith("Key")) {
        keyName = e.code.slice(3); // e.g. "S", "F"
      } else if (e.code.startsWith("Digit")) {
        keyName = e.code.slice(5); // e.g. "1"
      } else {
        const specialMap: Record<string, string> = {
          "Space": "Space",
          "Escape": "Escape",
          "Enter": "Enter",
          "Backspace": "Backspace",
          "Delete": "Delete",
          "ArrowUp": "Up",
          "ArrowDown": "Down",
          "ArrowLeft": "Left",
          "ArrowRight": "Right",
        };
        keyName = specialMap[e.code] || e.key;
      }

      const isFunctionKey = /^F[1-9][0-2]?$/.test(keyName) || keyName === "PrintScreen";
      if (parts.length === 0 && !isFunctionKey) {
        return;
      }

      parts.push(keyName);
      const shortcutStr = parts.join("+");

      const isMac = navigator.userAgent.toLowerCase().includes('mac');
      const ctrlKeyName = isMac ? "Cmd" : "Ctrl";
      if (shortcutStr.toLowerCase() === "ctrl+c" || shortcutStr.toLowerCase() === "ctrl+s" || shortcutStr.toLowerCase() === "super+c" || shortcutStr.toLowerCase() === "super+s") {
        setWarningMessage(t.shortcutConflictMsg(ctrlKeyName));
        setRecordingType(null);
        return;
      }

      const allShortcuts: Record<string, string> = {
        region: regionShortcut,
        fullscreen: fullscreenShortcut,
        zoom: zoomShortcut,
        live_zoom: liveZoomShortcut,
        record: recordShortcut,
        timer: timerShortcut,
      };

      const conflictingAction = Object.entries(allShortcuts).find(([key, val]) =>
        key !== recordingType && val.toLowerCase() === shortcutStr.toLowerCase()
      );

      if (conflictingAction) {
        setWarningMessage((t as any).shortcutInUseMsg ? (t as any).shortcutInUseMsg(shortcutStr) : `${shortcutStr} is already in use!`);
        setRecordingType(null);
        return;
      }

      if (recordingType === "region") {
        setRegionShortcut(shortcutStr);
        localStorage.setItem("regionShortcut", shortcutStr);
      } else if (recordingType === "fullscreen") {
        setFullscreenShortcut(shortcutStr);
        localStorage.setItem("fullscreenShortcut", shortcutStr);
      } else if (recordingType === "zoom") {
        setZoomShortcut(shortcutStr);
        localStorage.setItem("zoomShortcut", shortcutStr);
      } else if (recordingType === "live_zoom") {
        setLiveZoomShortcut(shortcutStr);
        localStorage.setItem("liveZoomShortcut", shortcutStr);
      } else if (recordingType === "record") {
        setRecordShortcut(shortcutStr);
        localStorage.setItem("recordShortcut", shortcutStr);
      } else if (recordingType === "timer") {
        setTimerShortcut(shortcutStr);
        localStorage.setItem("timerShortcut", shortcutStr);
      }

      setRecordingType(null);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const isPrintScreen = e.key === "PrintScreen" || e.key === "Snapshot" || e.code === "PrintScreen";
      if (!isPrintScreen) return;

      e.preventDefault();
      e.stopPropagation();

      const parts: string[] = [];
      if (e.ctrlKey) parts.push("Ctrl");
      if (e.shiftKey) parts.push("Shift");
      if (e.altKey) parts.push("Alt");
      if (e.metaKey) parts.push("Super");

      parts.push("PrintScreen");
      const shortcutStr = parts.join("+");

      const isMac = navigator.userAgent.toLowerCase().includes('mac');
      const ctrlKeyName = isMac ? "Cmd" : "Ctrl";
      if (shortcutStr.toLowerCase() === "ctrl+c" || shortcutStr.toLowerCase() === "ctrl+s" || shortcutStr.toLowerCase() === "super+c" || shortcutStr.toLowerCase() === "super+s") {
        setWarningMessage(t.shortcutConflictMsg(ctrlKeyName));
        setRecordingType(null);
        return;
      }

      const allShortcuts: Record<string, string> = {
        region: regionShortcut,
        fullscreen: fullscreenShortcut,
        zoom: zoomShortcut,
        live_zoom: liveZoomShortcut,
        record: recordShortcut,
        timer: timerShortcut,
      };

      const conflictingAction = Object.entries(allShortcuts).find(([key, val]) =>
        key !== recordingType && val.toLowerCase() === shortcutStr.toLowerCase()
      );

      if (conflictingAction) {
        setWarningMessage((t as any).shortcutInUseMsg ? (t as any).shortcutInUseMsg(shortcutStr) : `${shortcutStr} is already in use!`);
        setRecordingType(null);
        return;
      }

      if (recordingType === "region") {
        setRegionShortcut(shortcutStr);
        localStorage.setItem("regionShortcut", shortcutStr);
      } else if (recordingType === "fullscreen") {
        setFullscreenShortcut(shortcutStr);
        localStorage.setItem("fullscreenShortcut", shortcutStr);
      } else if (recordingType === "live_zoom") {
        setLiveZoomShortcut(shortcutStr);
        localStorage.setItem("liveZoomShortcut", shortcutStr);
      } else if (recordingType === "record") {
        setRecordShortcut(shortcutStr);
        localStorage.setItem("recordShortcut", shortcutStr);
      } else if (recordingType === "timer") {
        setTimerShortcut(shortcutStr);
        localStorage.setItem("timerShortcut", shortcutStr);
      }

      setRecordingType(null);
    };

    // Cancel if user clicks outside
    const handleOuterClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".customizable")) {
        setRecordingType(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("click", handleOuterClick, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("click", handleOuterClick, true);

      // 2. Re-register and sync shortcuts from localStorage on exit/cleanup
      const regShortcut = localStorage.getItem("regionShortcut") || "Ctrl+Shift+S";
      const fsShortcut = localStorage.getItem("fullscreenShortcut") || "Ctrl+Shift+F";
      const zmShortcut = localStorage.getItem("zoomShortcut") || "Ctrl+1";
      const tmShortcut = localStorage.getItem("timerShortcut") || "Ctrl+3";
      const lzShortcut = localStorage.getItem("liveZoomShortcut") || "Ctrl+4";
      const recShortcut = localStorage.getItem("recordShortcut") || "Ctrl+5";
      invoke("update_shortcuts", {
        regionShortcut: regShortcut,
        fullscreenShortcut: fsShortcut,
        zoomShortcut: zmShortcut,
        timerShortcut: tmShortcut,
        liveZoomShortcut: lzShortcut,
        recordShortcut: recShortcut,
      }).catch((err) => console.error(err));
    };
  }, [recordingType]);

  // Cancel recording shortcut when changing tabs
  useEffect(() => {
    setRecordingType(null);
  }, [activeTab]);

  // Automatically clear warning message after 3.5 seconds (Toast effect)
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => {
        setWarningMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  // Sync file format and quality settings with Rust backend
  useEffect(() => {
    invoke("update_save_settings", {
      fileFormat: fileFormat,
      imageQuality: imageQuality,
      includeCursor: includeCursor
    }).catch((e) => {
      console.error("Failed to sync save settings with Rust backend:", e);
    });

    invoke("update_notification_setting", { show: showNotifications }).catch(console.error);
  }, [fileFormat, imageQuality, includeCursor, showNotifications]);

  // Sync language with multi-window storage events
  useEffect(() => {
    const handleStorageChange = () => {
      setLang(getLanguage());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Listen for global fullscreen screenshots and play shutter sound if enabled
  useEffect(() => {
    const unlisten = listen("fullscreen-captured", () => {
      const playAudioSetting = localStorage.getItem("playAudio") !== "false";
      if (playAudioSetting) {
        new Audio(shutterSoundUrl).play().catch((err) => {
          console.error("Failed to play shutter sound:", err);
        });
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleTakeScreenshot = async () => {
    try {
      await invoke("trigger_capture_command");
    } catch (e) {
      console.error("Failed to trigger screenshot:", e);
    }
  };

  const handleTakeFullscreenScreenshot = async () => {
    try {
      await invoke("trigger_fullscreen_capture_command");
    } catch (e) {
      console.error("Failed to trigger fullscreen screenshot:", e);
    }
  };

  const t = translations[lang];

  const isMac = navigator.userAgent.toLowerCase().includes('mac');
  const ctrlKey = isMac ? "Cmd" : "Ctrl";

  const formatShortcut = (shortcut: string) => {
    let formatted = shortcut.replace(/Ctrl/ig, ctrlKey);
    formatted = formatted.replace(/Super/ig, isMac ? "Cmd" : "Win");
    return formatted;
  };

  return (
    <div className="settings-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="brand" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
            <img src={logo} alt="Shotera Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
            <span className="brand-name" style={{
              fontFamily: "var(--font-title)",
              fontWeight: 800,
              fontSize: "1.45rem",
              color: "#ffffff",
              background: "none",
              WebkitTextFillColor: "initial",
              WebkitBackgroundClip: "initial"
            }}>Shotera</span>
          </div>

          <nav className="nav-links">
            <div
              className={`nav-item ${activeTab === "general" ? "active" : ""}`}
              onClick={() => setActiveTab("general")}
            >
              <Settings className="nav-icon" />
              <span>{t.sidebarGeneral}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "capture" ? "active" : ""}`}
              onClick={() => setActiveTab("capture")}
            >
              <Camera className="nav-icon" />
              <span>{t.sidebarCapture}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "save" ? "active" : ""}`}
              onClick={() => setActiveTab("save")}
            >
              <FolderOpen className="nav-icon" />
              <span>{t.sidebarSave}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "zoom" ? "active" : ""}`}
              onClick={() => setActiveTab("zoom")}
            >
              <ZoomIn className="nav-icon" />
              <span>{(t as any).sidebarZoom}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "timer" ? "active" : ""}`}
              onClick={() => setActiveTab("timer")}
            >
              <Timer className="nav-icon" />
              <span>{(t as any).sidebarTimer}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "live_zoom" ? "active" : ""}`}
              onClick={() => setActiveTab("live_zoom")}
            >
              <Video className="nav-icon" />
              <span>{(t as any).sidebarLiveZoom}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "record" ? "active" : ""}`}
              onClick={() => setActiveTab("record")}
            >
              <Play className="nav-icon" />
              <span>{(t as any).sidebarRecord}</span>
            </div>

            <div
              className={`nav-item ${activeTab === "about" ? "active" : ""}`}
              onClick={() => setActiveTab("about")}
              style={{ position: "relative" }}
            >
              <Info className="nav-icon" />
              <span>{t.sidebarAbout}</span>
              {updateStatus === "available" && (
                <div style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "#f59e0b",
                  boxShadow: "0 0 8px #f59e0b",
                  animation: "pulse-border 1.5s infinite"
                }} />
              )}
            </div>
          </nav>
        </div>

        <div className="sidebar-footer" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px" }}>
          <span>{appVersion}</span>
          {updateStatus === "available" && (
            <div style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#f59e0b",
              boxShadow: "0 0 6px #f59e0b",
            }} title={(t as any).updateAvailableBadge} />
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="settings-content">
        <div>
          <h2 className="section-title">
            {activeTab === "general" && t.generalTitle}
            {activeTab === "capture" && t.captureTitle}
            {activeTab === "save" && t.saveTitle}
            {activeTab === "zoom" && (t as any).zoomTitle}
            {activeTab === "live_zoom" && (t as any).liveZoomTitle}
            {activeTab === "record" && (t as any).recordTitle}
            {activeTab === "timer" && (t as any).timerTitle}
            {activeTab === "about" && t.aboutTitle}
          </h2>
          <p className="section-subtitle">
            {activeTab === "general" && t.generalSubtitle}
            {activeTab === "capture" && t.captureSubtitle}
            {activeTab === "save" && t.saveSubtitle}
            {activeTab === "zoom" && (t as any).zoomSubtitle}
            {activeTab === "live_zoom" && (t as any).liveZoomSubtitle}
            {activeTab === "record" && (t as any).recordSubtitle}
            {activeTab === "timer" && (t as any).timerSubtitle}
            {activeTab === "about" && t.aboutSubtitle}
          </p>

        </div>

        {/* Tab contents */}
        {activeTab === "general" && (
          <div className="settings-card">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{t.runAtStartup}</span>
                <span className="setting-desc">{t.runAtStartupDesc}</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={startAtBoot}
                  onChange={(e) => handleAutostartToggle(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{t.startInTray}</span>
                <span className="setting-desc">{t.startInTrayDesc}</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={startInTray}
                  onChange={(e) => setStartInTray(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{t.showNotifications}</span>
                <span className="setting-desc">{t.showNotificationsDesc}</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showNotifications}
                  onChange={(e) => setShowNotifications(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{t.languageSetting}</span>
                <span className="setting-desc">{t.languageSettingDesc}</span>
              </div>
              <select
                className="premium-input"
                value={lang}
                onChange={(e) => {
                  const val = e.target.value as Language;
                  setLang(val);
                  setLanguage(val);
                }}
                style={{ width: "240px" }}
              >
                <option value="tr">Türkçe</option>
                <option value="az">Azərbaycan dili</option>
                <option value="ru">Русский</option>
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </div>

          </div>
        )}

        {activeTab === "capture" && (
          <div className="settings-card">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{t.globalShortcut}</span>
                <span className="setting-desc">{t.globalShortcutDesc}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  className={`shortcut-badge customizable ${recordingType === "region" ? "recording" : ""}`}
                  onClick={() => setRecordingType(recordingType === "region" ? null : "region")}
                  title={t.shortcutChangeHint}
                  style={{
                    cursor: "pointer",
                    border: recordingType === "region" ? "1px solid var(--accent-cyan)" : "1px solid rgba(255, 255, 255, 0.1)",
                    background: recordingType === "region" ? "rgba(0, 242, 254, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    color: recordingType === "region" ? "var(--accent-cyan)" : "white",
                    fontWeight: 600,
                    animation: recordingType === "region" ? "pulse-border 1.5s infinite" : "none",
                    outline: "none"
                  }}
                >
                  {recordingType === "region" ? t.shortcutPressKeys : formatShortcut(regionShortcut)}
                </button>
                <button
                  className="premium-button"
                  onClick={handleTakeScreenshot}
                  style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                  title={t.captureNow}
                >
                  <Camera size={14} />
                  {t.captureNow}
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{t.globalFullscreenShortcut}</span>
                <span className="setting-desc">{t.globalFullscreenShortcutDesc}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  className={`shortcut-badge customizable ${recordingType === "fullscreen" ? "recording" : ""}`}
                  onClick={() => setRecordingType(recordingType === "fullscreen" ? null : "fullscreen")}
                  title={t.shortcutChangeHint}
                  style={{
                    cursor: "pointer",
                    border: recordingType === "fullscreen" ? "1px solid var(--accent-cyan)" : "1px solid rgba(255, 255, 255, 0.1)",
                    background: recordingType === "fullscreen" ? "rgba(0, 242, 254, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    color: recordingType === "fullscreen" ? "var(--accent-cyan)" : "white",
                    fontWeight: 600,
                    animation: recordingType === "fullscreen" ? "pulse-border 1.5s infinite" : "none",
                    outline: "none"
                  }}
                >
                  {recordingType === "fullscreen" ? t.shortcutPressKeys : formatShortcut(fullscreenShortcut)}
                </button>
                <button
                  className="premium-button"
                  onClick={handleTakeFullscreenScreenshot}
                  style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                  title={t.captureNow}
                >
                  <Camera size={14} />
                  {t.captureNow}
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{t.playShutterSound}</span>
                <span className="setting-desc">{t.playShutterSoundDesc}</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={playAudio}
                  onChange={(e) => setPlayAudio(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{t.includeCursor}</span>
                <span className="setting-desc">{t.includeCursorDesc}</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={includeCursor}
                  onChange={(e) => setIncludeCursor(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).blurAmountSetting}</span>
                <span className="setting-desc">{(t as any).blurAmountDesc}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "240px" }}>
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={defaultBlurAmount}
                  onChange={(e) => setDefaultBlurAmount(Number(e.target.value))}
                  style={{ flexGrow: 1, accentColor: "var(--accent-cyan)", cursor: "pointer" }}
                />
                <span style={{ minWidth: "45px", textAlign: "right", fontWeight: 600, fontFamily: "monospace" }}>{defaultBlurAmount} px</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "8px" }}>
              <div className="setting-info">
                <span className="setting-label">{t.editorShortcuts}</span>
                <span className="setting-desc">{t.editorShortcutsDesc}</span>
              </div>

              <div className="responsive-shortcut-grid">
                {/* 1. Kopyala */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <Copy size={15} color="#38bdf8" />
                    {t.editorCopy}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>Ctrl</kbd>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>+</span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>C</kbd>
                  </div>
                </div>

                {/* 2. Kaydet */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <Save size={15} color="#10b981" />
                    {t.editorSave}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>Ctrl</kbd>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>+</span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>S</kbd>
                  </div>
                </div>

                {/* 3. Geri Al */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <Undo2 size={15} color="#a855f7" />
                    {t.editorUndo}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>Ctrl</kbd>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>+</span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>Z</kbd>
                  </div>
                </div>

                {/* 4. Kapat */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <LogOut size={15} color="#f87171" />
                    {t.editorClose}
                  </span>
                  <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>ESC</kbd>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "save" && (
          <div className="settings-card">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{t.defaultSaveDir}</span>
                <span className="setting-desc">{t.defaultSaveDirDesc}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", flex: 1, maxWidth: "500px", minWidth: "240px" }}>
                <input
                  type="text"
                  className="premium-input"
                  value={savePath}
                  readOnly
                  onClick={async () => {
                    const folder = await invoke<string | null>("select_folder");
                    if (folder) {
                      setSavePath(folder);
                    }
                  }}
                  style={{ minWidth: "0", flexGrow: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", cursor: "pointer" }}
                />
                <button
                  onClick={async () => {
                    const folder = await invoke<string | null>("select_folder");
                    if (folder) {
                      setSavePath(folder);
                    }
                  }}
                  className="action-btn"
                  title={t.selectFolder}
                  style={{
                    padding: "0 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "white",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.borderColor = "var(--accent-cyan)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.borderColor = "var(--border-color)";
                  }}
                >
                  <FolderOpen size={16} />
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).defaultVideoSaveDir || "Varsayılan Video Kayıt Dizini"}</span>
                <span className="setting-desc">{(t as any).defaultVideoSaveDirDesc || "Ekran kayıtlarının (video) kaydedileceği klasör."}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", flex: 1, maxWidth: "500px", minWidth: "240px" }}>
                <input
                  type="text"
                  className="premium-input"
                  value={videoSavePath}
                  readOnly
                  onClick={async () => {
                    const folder = await invoke<string | null>("select_folder");
                    if (folder) {
                      setVideoSavePath(folder);
                    }
                  }}
                  style={{ minWidth: "0", flexGrow: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", cursor: "pointer" }}
                />
                <button
                  onClick={async () => {
                    const folder = await invoke<string | null>("select_folder");
                    if (folder) {
                      setVideoSavePath(folder);
                    }
                  }}
                  className="action-btn"
                  title={t.selectFolder}
                  style={{
                    padding: "0 12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    color: "white",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.borderColor = "var(--accent-cyan)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.borderColor = "var(--border-color)";
                  }}
                >
                  <FolderOpen size={16} />
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{t.fileFormat}</span>
                <span className="setting-desc">{t.fileFormatDesc}</span>
              </div>
              <select
                className="premium-input"
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value)}
                style={{ width: "240px" }}
              >
                <option value="PNG">PNG ({t.formatLossless})</option>
                <option value="JPG">JPG ({t.formatCompressed})</option>
                <option value="WebP">WebP ({t.formatModern})</option>
              </select>
            </div>

            {fileFormat !== "PNG" && (
              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">{t.imageQuality}</span>
                  <span className="setting-desc">{t.imageQualityDesc}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: "240px" }}>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={imageQuality}
                    onChange={(e) => setImageQuality(Number(e.target.value))}
                    style={{ flexGrow: 1, accentColor: "var(--accent-cyan)" }}
                  />
                  <span style={{ minWidth: "36px", textAlign: "right", fontWeight: 600 }}>%{imageQuality}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "zoom" && (
          <div className="settings-card">
            {/* Screen Zoom Row */}
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).shortcutZoom}</span>
                <span className="setting-desc">{(t as any).shortcutZoomDesc}</span>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  className={`shortcut-badge customizable ${recordingType === "zoom" ? "recording" : ""}`}
                  onClick={() => setRecordingType(recordingType === "zoom" ? null : "zoom")}
                  title={t.shortcutChangeHint}
                  style={{
                    cursor: "pointer",
                    border: recordingType === "zoom" ? "1px solid var(--accent-cyan)" : "1px solid rgba(255, 255, 255, 0.1)",
                    background: recordingType === "zoom" ? "rgba(0, 242, 254, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    color: recordingType === "zoom" ? "var(--accent-cyan)" : "white",
                    fontWeight: 600,
                    animation: recordingType === "zoom" ? "pulse-border 1.5s infinite" : "none",
                    outline: "none",
                    minWidth: "100px",
                    textAlign: "center"
                  }}
                >
                  {recordingType === "zoom" ? t.shortcutPressKeys : formatShortcut(zoomShortcut)}
                </button>
                <button
                  className="premium-button"
                  onClick={() => invoke("open_zoom_view").catch(console.error)}
                  style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                >
                  <Monitor size={14} />
                  Test Zoom
                </button>
              </div>
            </div>

            {/* Quick Draw Shortcuts Card */}
            <div className="setting-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "12px" }}>
              <div className="setting-info">
                <span className="setting-label">{(t as any).drawModeShortcutsTitle}</span>
                <span className="setting-desc">{(t as any).drawModeShortcutsDesc}</span>
              </div>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                width: "100%",
                background: "rgba(255, 255, 255, 0.025)",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)"
              }}>
                {/* Color Selection Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <Palette size={15} color="#38bdf8" />
                    {(t as any).drawModeColorChange}
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end" }}>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", color: "#f87171", border: "1px solid rgba(248, 113, 113, 0.25)", background: "rgba(248, 113, 113, 0.08)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(248, 113, 113, 0.25)", border: "1px solid rgba(248, 113, 113, 0.5)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>R</kbd>
                      {(t as any).badgeRed || "Kırmızı"}
                    </span>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", color: "#4ade80", border: "1px solid rgba(74, 222, 128, 0.25)", background: "rgba(74, 222, 128, 0.08)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(74, 222, 128, 0.25)", border: "1px solid rgba(74, 222, 128, 0.5)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>G</kbd>
                      {(t as any).badgeGreen || "Yeşil"}
                    </span>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", color: "#60a5fa", border: "1px solid rgba(96, 165, 250, 0.25)", background: "rgba(96, 165, 250, 0.08)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(96, 165, 250, 0.25)", border: "1px solid rgba(96, 165, 250, 0.5)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>B</kbd>
                      {(t as any).badgeBlue || "Mavi"}
                    </span>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", color: "#facc15", border: "1px solid rgba(250, 204, 21, 0.25)", background: "rgba(250, 204, 21, 0.08)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(250, 204, 21, 0.25)", border: "1px solid rgba(250, 204, 21, 0.5)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>Y</kbd>
                      {(t as any).badgeYellow || "Sarı"}
                    </span>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", color: "#fb923c", border: "1px solid rgba(251, 146, 60, 0.25)", background: "rgba(251, 146, 60, 0.08)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(251, 146, 60, 0.25)", border: "1px solid rgba(251, 146, 60, 0.5)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>O</kbd>
                      {(t as any).badgeOrange || "Turuncu"}
                    </span>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", color: "#f472b6", border: "1px solid rgba(244, 114, 182, 0.25)", background: "rgba(244, 114, 182, 0.08)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(244, 114, 182, 0.25)", border: "1px solid rgba(244, 114, 182, 0.5)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>P</kbd>
                      {(t as any).badgePink || "Pembe"}
                    </span>
                  </div>
                </div>

                {/* Board Modes Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderTop: "1px dashed rgba(255, 255, 255, 0.08)", paddingTop: "10px" }}>
                  <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <LayoutTemplate size={15} color="#a855f7" />
                    {(t as any).drawModeBoardModes}
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end" }}>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>W</kbd>
                      {(t as any).badgeWhiteboard || "Beyaz Tahta"}
                    </span>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>K</kbd>
                      {(t as any).badgeBlackboard || "Siyah Tahta"}
                    </span>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>T</kbd>
                      {(t as any).badgeTextMode || "Metin Modu"}
                    </span>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>E</kbd>
                      {(t as any).badgeClear || "Temizle"}
                    </span>
                  </div>
                </div>

                {/* Shape Modifiers Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderTop: "1px dashed rgba(255, 255, 255, 0.08)", paddingTop: "10px" }}>
                  <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <Shapes size={15} color="#10b981" />
                    {(t as any).drawModeShapes}
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "flex-end" }}>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>Shift</kbd>
                      {(t as any).badgeLine || "Düz Çizgi"}
                    </span>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>Ctrl</kbd>
                      {(t as any).badgeBox || "Kutu"}
                    </span>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>Alt</kbd>
                      {(t as any).badgeCircle || "Daire"}
                    </span>
                    <span className="shortcut-badge" style={{ fontSize: "0.78rem", padding: "3px 8px 3px 4px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "0 5px", fontFamily: "monospace", fontWeight: 700, color: "#ffffff" }}>Shift+Ctrl</kbd>
                      {(t as any).badgeArrow || "Ok"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zoom Navigation & Exit Shortcuts Card */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "8px" }}>
              <div className="setting-info">
                <span className="setting-label">{(t as any).zoomNavShortcutsTitle}</span>
                <span className="setting-desc">{(t as any).zoomNavShortcutsDesc}</span>
              </div>

              <div className="responsive-shortcut-grid">
                {/* 1. Zoom In/Out */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <ZoomIn size={15} color="#38bdf8" />
                    {(t as any).zoomInKeyLabel}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>{(t as any).badgeWheel || "Tekerlek"}</kbd>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/</span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>↑↓</kbd>
                  </div>
                </div>

                {/* 2. Start Drawing */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <Pencil size={15} color="#10b981" />
                    {(t as any).zoomDrawLockLabel}
                  </span>
                  <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 8px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>{(t as any).badgeLeftClick || "Sol Tık"}</kbd>
                </div>

                {/* 3. Undo Last Drawing */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <Undo2 size={15} color="#a855f7" />
                    {(t as any).zoomUndoLabel}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>Ctrl</kbd>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>+</span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>Z</kbd>
                  </div>
                </div>

                {/* 4. Exit & Clear */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <LogOut size={15} color="#f87171" />
                    {(t as any).zoomExitLabel}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>ESC</kbd>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/</span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>{(t as any).badgeRightClick || "Sağ Tık"}</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "live_zoom" && (
          <div className="settings-card">
            {/* Live Screen Zoom Row */}
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).shortcutLiveZoom || "Canlı Zoom Kısayolu"}</span>
                <span className="setting-desc">{(t as any).shortcutLiveZoomDesc || "Ekranı canlı takip eden yüksek kaliteli büyüteç modunu başlatan kısayol."}</span>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  className={`shortcut-badge customizable ${recordingType === "live_zoom" ? "recording" : ""}`}
                  onClick={() => setRecordingType(recordingType === "live_zoom" ? null : "live_zoom")}
                  title={t.shortcutChangeHint}
                  style={{
                    cursor: "pointer",
                    border: recordingType === "live_zoom" ? "1px solid var(--accent-cyan)" : "1px solid rgba(255, 255, 255, 0.1)",
                    background: recordingType === "live_zoom" ? "rgba(0, 242, 254, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    color: recordingType === "live_zoom" ? "var(--accent-cyan)" : "white",
                    fontWeight: 600,
                    animation: recordingType === "live_zoom" ? "pulse-border 1.5s infinite" : "none",
                    outline: "none",
                    minWidth: "100px",
                    textAlign: "center"
                  }}
                >
                  {recordingType === "live_zoom" ? t.shortcutPressKeys : formatShortcut(liveZoomShortcut)}
                </button>
                <button
                  className="premium-button"
                  onClick={() => invoke("open_live_zoom_view").catch(console.error)}
                  style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                >
                  <Video size={14} />
                  Test Live Zoom
                </button>
              </div>
            </div>

            {/* Live Zoom Navigation & Exit Shortcuts Card */}
            <div className="setting-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
              <div className="setting-info">
                <span className="setting-label">{(t as any).liveZoomNavShortcutsTitle}</span>
                <span className="setting-desc">{(t as any).liveZoomNavShortcutsDesc}</span>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
                width: "100%",
                background: "rgba(255, 255, 255, 0.025)",
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)"
              }}>
                {/* 1. Cursor Panning */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <Zap size={15} color="#a855f7" />
                    {(t as any).liveZoomPanLabel}
                  </span>
                  <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 8px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>{(t as any).badgeMouseTrack}</kbd>
                </div>

                {/* 2. Exit Live Zoom */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <LogOut size={15} color="#f87171" />
                    {(t as any).liveZoomExitLabel || "Çıkış"}
                  </span>
                  <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 8px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>{formatShortcut(liveZoomShortcut)}</kbd>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "timer" && (
          <div className="settings-card">
            {/* Break Timer Row */}
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).shortcutBreakTimer}</span>
                <span className="setting-desc">{(t as any).shortcutBreakTimerDesc}</span>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  className={`shortcut-badge customizable ${recordingType === "timer" ? "recording" : ""}`}
                  onClick={() => setRecordingType(recordingType === "timer" ? null : "timer")}
                  title={t.shortcutChangeHint}
                  style={{
                    cursor: "pointer",
                    border: recordingType === "timer" ? "1px solid var(--accent-cyan)" : "1px solid rgba(255, 255, 255, 0.1)",
                    background: recordingType === "timer" ? "rgba(0, 242, 254, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    color: recordingType === "timer" ? "var(--accent-cyan)" : "white",
                    fontWeight: 600,
                    animation: recordingType === "timer" ? "pulse-border 1.5s infinite" : "none",
                    outline: "none",
                    minWidth: "100px",
                    textAlign: "center"
                  }}
                >
                  {recordingType === "timer" ? t.shortcutPressKeys : formatShortcut(timerShortcut)}
                </button>
                <button
                  className="premium-button"
                  onClick={() => invoke("open_break_timer").catch(console.error)}
                  style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                >
                  <Play size={14} />
                  Test Timer
                </button>
              </div>
            </div>

            {/* Default Break Duration Row */}
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).timerDefaultDuration}</span>
                <span className="setting-desc">{(t as any).timerDefaultDurationDesc}</span>
              </div>
              <div style={{ width: "240px", display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="number"
                  min={1}
                  max={360}
                  className="premium-input"
                  value={Math.round(timerDefaultDuration / 60)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    const mins = val <= 0 ? 1 : Math.min(360, val);
                    const secs = mins * 60;
                    setTimerDefaultDuration(secs);
                    localStorage.setItem("timerDefaultDuration", String(secs));
                    window.dispatchEvent(new Event("storage"));
                  }}
                  style={{ flex: 1, minWidth: 0, padding: "8px 12px", textAlign: "center" }}
                />
                <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 500, whiteSpace: "nowrap" }}>
                  {(t as any).timerUnitMinutes || "Dakika"}
                </span>
              </div>
            </div>

            {/* Count Direction Row */}
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).timerCountDirection}</span>
                <span className="setting-desc">{(t as any).timerCountDirectionDesc}</span>
              </div>
              <select
                className="premium-input"
                value={timerCountDirection}
                onChange={(e) => {
                  const dir = e.target.value as "down" | "up";
                  setTimerCountDirection(dir);
                  localStorage.setItem("timerCountDirection", dir);
                  window.dispatchEvent(new Event("storage"));
                }}
                style={{ width: "240px" }}
              >
                <option value="down">{(t as any).timerCountDirectionDown}</option>
                <option value="up">{(t as any).timerCountDirectionUp}</option>
              </select>
            </div>

            {/* Theme & Ring Color Selection Section */}
            <div>
              <div className="setting-info" style={{ marginBottom: "14px" }}>
                <span className="setting-label">{(t as any).timerThemeTitle}</span>
                <span className="setting-desc">{(t as any).timerThemeDesc}</span>
              </div>

              {/* Live Preview Box */}
              <div
                style={{
                  width: "100%",
                  height: "170px",
                  borderRadius: "14px",
                  border: "1px solid var(--border-color)",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  background:
                    timerBgStyle === "custom" || (timerBgColor && timerBgStyle !== "oled-black" && timerBgStyle !== "frosted-dark" && timerBgStyle !== "pomodoro-red" && timerBgStyle !== "dark-slate")
                      ? (timerBgColor.startsWith("#") ? `radial-gradient(circle at center, ${timerBgColor} 0%, #020617 100%)` : timerBgColor)
                      : timerBgStyle === "oled-black"
                        ? "#000000"
                        : timerBgStyle === "frosted-dark"
                          ? "rgba(15, 23, 42, 0.95)"
                          : timerBgStyle === "pomodoro-red"
                            ? "radial-gradient(circle at center, #450a0a 0%, #09090b 100%)"
                            : `radial-gradient(circle at center, ${timerBgColor || "#0f172a"} 0%, #020617 100%)`,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)"
                }}
              >
                {/* Live Preview Badge */}
                <span
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "14px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: "rgba(255, 255, 255, 0.4)",
                    background: "rgba(0, 0, 0, 0.3)",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    border: "1px solid rgba(255, 255, 255, 0.08)"
                  }}
                >
                  {(t as any).timerLivePreview || "Canlı Önizleme"}
                </span>

                {/* Mini Circle SVG */}
                <div style={{ position: "relative", width: "120px", height: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="60" cy="60" r="48" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="6" fill="transparent" />
                    <circle
                      cx="60"
                      cy="60"
                      r="48"
                      stroke={timerRingColor}
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray="301"
                      strokeDashoffset="75"
                      strokeLinecap="round"
                      style={{ transition: "stroke 0.3s ease" }}
                    />
                  </svg>
                  <span
                    style={{
                      position: "absolute",
                      fontSize: "24px",
                      fontWeight:
                        timerFontStyle === "segoe-light"
                          ? 300
                          : timerFontStyle === "orbitron" || timerFontStyle === "chakra" || timerFontStyle === "rajdhani"
                            ? 700
                            : timerFontStyle === "dseg" || timerFontStyle === "share-tech"
                              ? 400
                              : 800,
                      color: "#ffffff",
                      fontFamily:
                        timerFontStyle === "heading"
                          ? "'Outfit', sans-serif"
                          : timerFontStyle === "mono"
                            ? "monospace"
                            : timerFontStyle === "segoe-light"
                              ? "'Segoe UI Light', 'Segoe UI', sans-serif"
                              : timerFontStyle === "orbitron"
                                ? "'Orbitron', sans-serif"
                                : timerFontStyle === "chakra"
                                  ? "'Chakra Petch', sans-serif"
                                  : timerFontStyle === "share-tech"
                                    ? "'Share Tech Mono', monospace"
                                    : timerFontStyle === "rajdhani"
                                      ? "'Rajdhani', sans-serif"
                                      : timerFontStyle === "dseg"
                                        ? "'DSEG7-Modern', 'DSEG7-Classic', 'DS-Digital', 'Digital-7', monospace"
                                        : "'Inter', sans-serif",
                      textShadow: `0 0 16px ${timerRingColor}80`
                    }}
                  >
                    14:57
                  </span>
                </div>
              </div>

              {/* Ring Color Preset Row */}
              <div className="setting-row" style={{ borderBottom: "none", paddingBottom: "12px" }}>
                <div className="setting-info">
                  <span className="setting-label">{(t as any).timerRingColorLabel}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", flex: "1 1 50%" }}>
                  {["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899"].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setTimerRingColor(color);
                        localStorage.setItem("timerRingColor", color);
                        window.dispatchEvent(new Event("storage"));
                      }}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: color,
                        border: timerRingColor === color ? "2px solid #ffffff" : "2px solid transparent",
                        cursor: "pointer",
                        boxShadow: timerRingColor === color ? `0 0 10px ${color}` : "none",
                        transition: "all 0.2s ease"
                      }}
                    />
                  ))}
                  {/* Circular Custom Color Picker Swatch */}
                  <div
                    onClick={() => {
                      const isPreset = ["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899"].includes(timerRingColor);
                      if (isPreset) {
                        const activeCustom = customTimerRingColor || "#06b6d4";
                        setTimerRingColor(activeCustom);
                        localStorage.setItem("timerRingColor", activeCustom);
                        window.dispatchEvent(new Event("storage"));
                      }
                    }}
                    style={{
                      position: "relative",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: ["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899"].includes(timerRingColor)
                        ? customTimerRingColor
                        : timerRingColor,
                      border: !["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899"].includes(timerRingColor)
                        ? "2px solid #ffffff"
                        : "2px solid transparent",
                      boxShadow: !["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899"].includes(timerRingColor)
                        ? `0 0 10px ${timerRingColor}`
                        : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    title="Özel Renk Seç"
                  >
                    <input
                      type="color"
                      value={customTimerRingColor.startsWith("#") && customTimerRingColor.length === 7 ? customTimerRingColor : "#06b6d4"}
                      onClick={() => {
                        const activeCustom = customTimerRingColor || "#06b6d4";
                        setTimerRingColor(activeCustom);
                        localStorage.setItem("timerRingColor", activeCustom);
                        window.dispatchEvent(new Event("storage"));
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomTimerRingColor(val);
                        setTimerRingColor(val);
                        localStorage.setItem("customTimerRingColor", val);
                        localStorage.setItem("timerRingColor", val);
                        window.dispatchEvent(new Event("storage"));
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer"
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "#ffffff", fontWeight: "bold", pointerEvents: "none", lineHeight: 1, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>+</span>
                  </div>

                  {/* Hex Color Text Input */}
                  <input
                    type="text"
                    className="premium-input"
                    value={timerRingColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTimerRingColor(val);
                      if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
                        if (!["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899"].includes(val)) {
                          setCustomTimerRingColor(val);
                          localStorage.setItem("customTimerRingColor", val);
                        }
                        localStorage.setItem("timerRingColor", val);
                        window.dispatchEvent(new Event("storage"));
                      }
                    }}
                    placeholder="#38BDF8"
                    style={{
                      width: "110px",
                      padding: "10px 12px",
                      fontSize: "0.9rem",
                      fontFamily: "monospace",
                      textTransform: "uppercase",
                      textAlign: "center"
                    }}
                  />
                </div>
              </div>

              {/* Background Color Swatches Row */}
              <div className="setting-row" style={{ borderBottom: "none", paddingBottom: "12px" }}>
                <div className="setting-info">
                  <span className="setting-label">{(t as any).timerBgColorLabel || "Arka Plan Rengi"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", flex: "1 1 50%" }}>
                  {["#0f172a", "#000000", "#1e1b4b", "#06202a", "#1c0d24", "#3f0e0e"].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setTimerBgColor(color);
                        localStorage.setItem("timerBgColor", color);
                        localStorage.setItem("timerBgStyle", "custom");
                        setTimerBgStyle("custom");
                        window.dispatchEvent(new Event("storage"));
                      }}
                      title={color}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: color,
                        border: timerBgColor === color ? "2px solid #ffffff" : "2px solid transparent",
                        cursor: "pointer",
                        boxShadow: timerBgColor === color ? `0 0 10px ${color}` : "none",
                        transition: "all 0.2s ease"
                      }}
                    />
                  ))}
                  {/* Circular Custom Background Color Picker Swatch */}
                  <div
                    onClick={() => {
                      const isPreset = ["#0f172a", "#000000", "#1e1b4b", "#06202a", "#1c0d24", "#3f0e0e"].includes(timerBgColor);
                      if (isPreset) {
                        const activeCustom = customTimerBgColor || "#1e1b4b";
                        setTimerBgColor(activeCustom);
                        setTimerBgStyle("custom");
                        localStorage.setItem("timerBgColor", activeCustom);
                        localStorage.setItem("timerBgStyle", "custom");
                        window.dispatchEvent(new Event("storage"));
                      }
                    }}
                    style={{
                      position: "relative",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: ["#0f172a", "#000000", "#1e1b4b", "#06202a", "#1c0d24", "#3f0e0e"].includes(timerBgColor)
                        ? customTimerBgColor
                        : timerBgColor,
                      border: !["#0f172a", "#000000", "#1e1b4b", "#06202a", "#1c0d24", "#3f0e0e"].includes(timerBgColor)
                        ? "2px solid #ffffff"
                        : "2px solid transparent",
                      boxShadow: !["#0f172a", "#000000", "#1e1b4b", "#06202a", "#1c0d24", "#3f0e0e"].includes(timerBgColor)
                        ? `0 0 10px ${timerBgColor}`
                        : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    title={(t as any).timerPickCustomBgColor || "Özel Arka Plan Rengi Seç"}
                  >
                    <input
                      type="color"
                      value={customTimerBgColor.startsWith("#") && customTimerBgColor.length === 7 ? customTimerBgColor : "#1e1b4b"}
                      onClick={() => {
                        const activeCustom = customTimerBgColor || "#1e1b4b";
                        setTimerBgColor(activeCustom);
                        setTimerBgStyle("custom");
                        localStorage.setItem("timerBgColor", activeCustom);
                        localStorage.setItem("timerBgStyle", "custom");
                        window.dispatchEvent(new Event("storage"));
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomTimerBgColor(val);
                        setTimerBgColor(val);
                        setTimerBgStyle("custom");
                        localStorage.setItem("customTimerBgColor", val);
                        localStorage.setItem("timerBgColor", val);
                        localStorage.setItem("timerBgStyle", "custom");
                        window.dispatchEvent(new Event("storage"));
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer"
                      }}
                    />
                    <span style={{ fontSize: "11px", color: "#ffffff", fontWeight: "bold", pointerEvents: "none", lineHeight: 1, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>+</span>
                  </div>

                  {/* Hex Color Text Input for Background */}
                  <input
                    type="text"
                    className="premium-input"
                    value={timerBgColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTimerBgColor(val);
                      setTimerBgStyle("custom");
                      if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
                        if (!["#0f172a", "#000000", "#1e1b4b", "#06202a", "#1c0d24", "#3f0e0e"].includes(val)) {
                          setCustomTimerBgColor(val);
                          localStorage.setItem("customTimerBgColor", val);
                        }
                        localStorage.setItem("timerBgColor", val);
                        localStorage.setItem("timerBgStyle", "custom");
                        window.dispatchEvent(new Event("storage"));
                      }
                    }}
                    placeholder="#0F172A"
                    style={{
                      width: "110px",
                      padding: "10px 12px",
                      fontSize: "0.9rem",
                      fontFamily: "monospace",
                      textTransform: "uppercase",
                      textAlign: "center"
                    }}
                  />
                </div>
              </div>

              {/* Background Style Row */}
              <div className="setting-row" style={{ borderBottom: "none", paddingBottom: "12px" }}>
                <div className="setting-info">
                  <span className="setting-label">{(t as any).timerBgStyleLabel}</span>
                </div>
                <select
                  className="premium-input"
                  value={timerBgStyle}
                  onChange={(e) => {
                    setTimerBgStyle(e.target.value);
                    localStorage.setItem("timerBgStyle", e.target.value);
                    window.dispatchEvent(new Event("storage"));
                  }}
                  style={{ width: "240px" }}
                >
                  <option value="dark-slate">{(t as any).timerBgSlate}</option>
                  <option value="oled-black">{(t as any).timerBgOled}</option>
                  <option value="frosted-dark">{(t as any).timerBgGlass}</option>
                  <option value="pomodoro-red">{(t as any).timerBgPomodoro}</option>
                </select>
              </div>

              {/* Clock Font Style Row */}
              <div className="setting-row" style={{ borderBottom: "none", paddingBottom: "12px" }}>
                <div className="setting-info">
                  <span className="setting-label">{(t as any).timerFontStyleLabel}</span>
                </div>
                <select
                  className="premium-input"
                  value={timerFontStyle}
                  onChange={(e) => {
                    setTimerFontStyle(e.target.value);
                    localStorage.setItem("timerFontStyle", e.target.value);
                    window.dispatchEvent(new Event("storage"));
                  }}
                  style={{ width: "240px" }}
                >
                  <option value="sans">{(t as any).timerFontSans}</option>
                  <option value="segoe-light">{(t as any).timerFontSegoeLight}</option>
                  <option value="heading">{(t as any).timerFontHeading}</option>
                  <option value="orbitron">{(t as any).timerFontOrbitron}</option>
                  <option value="chakra">{(t as any).timerFontChakra}</option>
                  <option value="share-tech">{(t as any).timerFontShareTech}</option>
                  <option value="rajdhani">{(t as any).timerFontRajdhani}</option>
                  <option value="dseg">{(t as any).timerFontDseg}</option>
                  <option value="mono">{(t as any).timerFontMono}</option>
                </select>
              </div>

              {/* Sound Ringtone Preset Section */}
              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "18px", marginTop: "6px" }}>
                <div className="setting-row" style={{ borderBottom: "none", paddingBottom: 0 }}>
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).timerSoundTitle}</span>
                    <span className="setting-desc">{(t as any).timerSoundDesc}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", flex: "1 1 50%" }}>
                    <select
                      className="premium-input"
                      value={timerSoundPreset}
                      onChange={(e) => {
                        setTimerSoundPreset(e.target.value);
                        localStorage.setItem("timerSoundPreset", e.target.value);
                        window.dispatchEvent(new Event("storage"));
                        playTimerSound(e.target.value);
                      }}
                      style={{ width: "170px" }}
                    >
                      <option value="chime">{(t as any).timerSoundChime}</option>
                      <option value="digital">{(t as any).timerSoundDigital}</option>
                      <option value="bell">{(t as any).timerSoundBell}</option>
                      <option value="classic">{(t as any).timerSoundClassic}</option>
                    </select>
                    <button
                      className="premium-button"
                      onClick={() => playTimerSound(timerSoundPreset)}
                      style={{ padding: "6px 12px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                      title={(t as any).timerTestSoundHint || "Seçilen zil sesini test et"}
                    >
                      <Volume2 size={14} />
                      {(t as any).timerTestSound || "Sesi Dinle"}
                    </button>
                  </div>
                </div>

                {/* Sound Repeat Row */}
                <div className="setting-row" style={{ borderBottom: "none", paddingBottom: 0, marginTop: "12px" }}>
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).timerSoundRepeatLabel}</span>
                  </div>
                  <select
                    className="premium-input"
                    value={timerSoundRepeat}
                    onChange={(e) => {
                      setTimerSoundRepeat(e.target.value);
                      localStorage.setItem("timerSoundRepeat", e.target.value);
                      window.dispatchEvent(new Event("storage"));
                    }}
                    style={{ width: "240px" }}
                  >
                    <option value="1">{(t as any).timerSoundRepeat1}</option>
                    <option value="3">{(t as any).timerSoundRepeat3}</option>
                    <option value="loop">{(t as any).timerSoundRepeatLoop}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Break Timer Quick Shortcuts Card */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px", marginTop: "8px" }}>
              <div className="setting-info">
                <span className="setting-label">{(t as any).timerShortcutsTitle}</span>
                <span className="setting-desc">{(t as any).timerShortcutsDesc}</span>
              </div>

              <div className="responsive-shortcut-grid">
                {/* 1. Toggle Pause/Play */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <Play size={15} color="#38bdf8" />
                    {(t as any).timerToggleLabel}
                  </span>
                  <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>{(t as any).badgeSpace || "Boşluk"}</kbd>
                </div>

                {/* 2. Adjust +/- 1 min */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <Clock size={15} color="#10b981" />
                    {(t as any).timerAdjust1Label}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>{(t as any).badgeWheel || "Tekerlek"}</kbd>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/</span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>↑↓</kbd>
                  </div>
                </div>

                {/* 3. Adjust +/- 5 min */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <Zap size={15} color="#eab308" />
                    {(t as any).timerAdjust5Label}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>Shift</kbd>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>+</span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>↑↓</kbd>
                  </div>
                </div>

                {/* 4. Reset Timer */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <RotateCcw size={15} color="#a855f7" />
                    {(t as any).timerResetKeyLabel}
                  </span>
                  <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 8px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>R</kbd>
                </div>

                {/* 5. Exit Timer (Spans full row or stays neat) */}
                <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)", borderTop: "1px dashed rgba(255, 255, 255, 0.08)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <LogOut size={15} color="#f87171" />
                    {(t as any).timerExitLabel}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>ESC</kbd>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/</span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>{(t as any).badgeRightClick || "Sağ Tık"}</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "record" && (
          <div className="settings-card">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).recordNativeTitle}</span>
                <span className="setting-desc">{(t as any).recordNativeDesc}</span>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  className={`shortcut-badge customizable ${recordingType === "record" ? "recording" : ""}`}
                  onClick={() => setRecordingType(recordingType === "record" ? null : "record")}
                  title={t.shortcutChangeHint}
                  style={{
                    cursor: "pointer",
                    border: recordingType === "record" ? "1px solid var(--accent-cyan)" : "1px solid rgba(255, 255, 255, 0.1)",
                    background: recordingType === "record" ? "rgba(0, 242, 254, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    color: recordingType === "record" ? "var(--accent-cyan)" : "white",
                    fontWeight: 600,
                    animation: recordingType === "record" ? "pulse-border 1.5s infinite" : "none",
                    outline: "none",
                    minWidth: "100px",
                    textAlign: "center"
                  }}
                >
                  {recordingType === "record" ? t.shortcutPressKeys : formatShortcut(recordShortcut)}
                </button>
                <button
                  className="premium-button"
                  onClick={() => invoke("open_recorder_view")}
                  style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                >
                  <Video size={14} />
                  {(t as any).recordOpenBtn}
                </button>
              </div>
            </div>


            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).recordFpsLabel || "Kare Hızı (FPS)"}</span>
                <span className="setting-desc">{(t as any).recordFpsDesc || "Akıcılık ve performans dengesini ayarlayın."}</span>
              </div>
              <select
                className="premium-input"
                value={recordFps}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRecordFps(val);
                  localStorage.setItem("recordFps", val.toString());
                }}
                style={{ width: "120px" }}
              >
                <option value={30}>30 FPS</option>
                <option value={60}>60 FPS</option>
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).recordAudioLabel || "Sistem Sesini Kaydet"}</span>
                <span className="setting-desc">{(t as any).recordAudioDesc || "Video kaydına bilgisayarın dahili sesini de dahil edin."}</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={recordAudio}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRecordAudio(checked);
                    localStorage.setItem("recordAudio", checked.toString());
                  }}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).recordMicLabel || "Mikrofonu Kaydet"}</span>
                <span className="setting-desc">{(t as any).recordMicDesc || "Kendi sesinizi (mikrofon) video kaydına dahil edin."}</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={recordMic}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRecordMic(checked);
                    localStorage.setItem("recordMic", checked.toString());
                  }}
                />
                <span className="slider"></span>
              </label>
            </div>

            {recordMic && (
              <div className="setting-row" style={{ marginTop: "-8px", paddingTop: "0", borderTop: "none" }}>
                <div className="setting-info">
                  <span className="setting-label" style={{ color: "#fbbf24" }}>{(t as any).fixAudioDucking || "Sistem Sesi Kısılmasını Önle"}</span>
                  <span className="setting-desc">{(t as any).fixAudioDuckingDesc || "Mikrofon açıldığında Windows'un diğer sesleri (video/müzik) %80 kısmasını (Ducking) engeller."}</span>
                </div>
                <button
                  className="premium-button"
                  style={{ fontSize: "0.8rem", padding: "6px 12px", background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                  onClick={async () => {
                    try {
                      await invoke("disable_windows_audio_ducking");
                      setWarningMessage("Windows ayarı güncellendi! Etkin olması için varsa açık olan videoları veya ekran kaydediciyi yeniden başlatın.");
                      setTimeout(() => setWarningMessage(null), 5000);
                    } catch (err) {
                      console.error("Failed to update registry:", err);
                    }
                  }}
                >
                  {(t as any).fixAudioDuckingBtn || "Windows Ayarını Düzelt"}
                </button>
              </div>
            )}

            {/* Webcam Control Shortcuts */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="setting-info">
                <span className="setting-label">{(t as any).webcamControlsTitle || "Kamera Kontrolleri"}</span>
                <span className="setting-desc">{(t as any).webcamControlsDesc || "Ekran kaydı sırasında kamera penceresini yönetin."}</span>
              </div>

              <div className="responsive-shortcut-grid">
                {/* 1. Resize */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <ZoomIn size={15} color="#38bdf8" />
                    {(t as any).webcamResizeLabel || "Boyutlandır"}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>{(t as any).badgeWheel || "Tekerlek"}</kbd>
                  </div>
                </div>

                {/* 2. Move */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <Camera size={15} color="#10b981" />
                    {(t as any).webcamMoveLabel || "Sürükle"}
                  </span>
                  <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 8px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>{(t as any).badgeLeftClick || "Sol Tık"}</kbd>
                </div>

                {/* 3. Exit/Stop Recording */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)", gridColumn: "1 / -1" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                    <Square size={15} color="#ef4444" />
                    {(t as any).webcamExitLabel || "Çıkış (Kaydı Durdur)"}
                  </span>
                  <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 8px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>
                    {formatShortcut(recordShortcut) || "Ctrl+5"}
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "about" && (

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Shotera Info Card */}
            <div className="settings-card" style={{ gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <img src={logo} alt="Shotera Logo" style={{ width: "60px", height: "60px", objectFit: "contain" }} />
                  <div>
                    <h3 style={{ fontSize: "1.45rem", marginBottom: "4px", fontWeight: 800, color: "#ffffff" }}>Shotera Desktop</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{t.aboutSubtitleDesc}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{
                    fontSize: "0.85rem",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    background: "rgba(255,255,255,0.08)",
                    color: "var(--text-muted)",
                    fontWeight: 600
                  }}>
                    {t.appVersion}: {appVersion}
                  </span>
                </div>
              </div>

              <p style={{ lineHeight: "1.6", color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", margin: 0 }}>
                {t.aboutDesc}
              </p>

              {/* Updater Section */}
              <div style={{
                marginTop: "12px",
                paddingTop: "16px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: updateStatus === "checking" || updateStatus === "downloading" ? "var(--accent-cyan)" :
                        updateStatus === "available" ? "#f59e0b" :
                          updateStatus === "up-to-date" || updateStatus === "downloaded" ? "#10b981" :
                            updateStatus === "error" ? "#ef4444" : "rgba(255,255,255,0.2)",
                      boxShadow: updateStatus === "checking" || updateStatus === "downloading" ? "0 0 8px var(--accent-cyan)" :
                        updateStatus === "available" ? "0 0 8px #f59e0b" :
                          updateStatus === "up-to-date" || updateStatus === "downloaded" ? "0 0 8px #10b981" : "none",
                      animation: updateStatus === "checking" || updateStatus === "downloading" ? "pulse-border 1.5s infinite" : "none"
                    }} />
                    <span style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.85)" }}>
                      {updateStatus === "idle" && `${t.appVersion}: ${appVersion}`}
                      {updateStatus === "checking" && t.checkingUpdates}
                      {updateStatus === "up-to-date" && t.appUpToDate}
                      {updateStatus === "available" && `${t.updateAvailable} (v${updateVersion})`}
                      {updateStatus === "downloading" && `${t.installingUpdate} (%${downloadProgress})`}
                      {updateStatus === "downloaded" && t.updateSuccess}
                      {updateStatus === "error" && t.updateError}
                    </span>
                  </div>

                  {updateStatus === "available" ? (
                    <button
                      onClick={handleUpdateInstall}
                      className="action-btn"
                      style={{
                        padding: "8px 16px",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        border: "none",
                        borderRadius: "6px",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {((t as any).updaterInstallAndRelaunch || "Şimdi Kur ve Yeniden Başlat")}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateCheck()}
                      disabled={updateStatus === "checking" || updateStatus === "downloading" || updateStatus === "downloaded"}
                      className="action-btn"
                      style={{
                        padding: "8px 16px",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "6px",
                        color: "#fff",
                        fontWeight: 600,
                        cursor: "pointer",
                        opacity: (updateStatus === "checking" || updateStatus === "downloading" || updateStatus === "downloaded") ? 0.5 : 1,
                        transition: "all 0.2s ease"
                      }}
                    >
                      {t.checkForUpdates}
                    </button>
                  )}
                </div>

                {updateStatus === "available" && updateManifest?.body && (
                  <div style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    fontSize: "0.85rem",
                    color: "var(--text-muted)",
                    maxHeight: "100px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.5"
                  }}>
                    <strong style={{ color: "#fff", display: "block", marginBottom: "4px" }}>
                      {(t as any).whatsNew}
                    </strong>
                    {(() => {
                      const body = updateManifest.body;
                      if (body.includes("DE:") || body.includes("RU:") || body.includes("AZ:") || body.includes("TR:") || body.includes("EN:")) {
                        const parts = body.split("||");
                        for (const part of parts) {
                          if (lang === "de" && part.trim().startsWith("DE:")) return part.trim().substring(3).trim();
                          if (lang === "ru" && part.trim().startsWith("RU:")) return part.trim().substring(3).trim();
                          if (lang === "az" && part.trim().startsWith("AZ:")) return part.trim().substring(3).trim();
                          if (lang === "tr" && part.trim().startsWith("TR:")) return part.trim().substring(3).trim();
                          if (lang === "en" && part.trim().startsWith("EN:")) return part.trim().substring(3).trim();
                        }
                      }
                      return body;
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Developer Card */}
            <div className="settings-card" style={{
              background: "linear-gradient(135deg, rgba(31, 40, 51, 0.6) 0%, rgba(20, 26, 33, 0.8) 100%)",
              border: "1px solid rgba(0, 242, 254, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "24px",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{
                position: "absolute",
                top: "-50px",
                right: "-50px",
                width: "150px",
                height: "150px",
                background: "radial-gradient(circle, rgba(0, 242, 254, 0.08) 0%, transparent 70%)",
                pointerEvents: "none"
              }} />

              <img
                src={avatar}
                alt="Sahil Rzayev"
                style={{
                  width: "110px",
                  height: "110px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2.5px solid var(--accent-cyan)",
                  boxShadow: "0 0 20px rgba(0, 242, 254, 0.3)"
                }}
              />

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <h4 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>Sahil Rzayev</h4>
                </div>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "14px", fontWeight: 500 }}>
                  {t.devTitle}
                </p>

                <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                  <a
                    href="https://github.com/rzayevsahil"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "rgba(255,255,255,0.8)",
                      textDecoration: "none",
                      fontSize: "0.85rem",
                      background: "rgba(255,255,255,0.05)",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(0, 242, 254, 0.1)";
                      e.currentTarget.style.borderColor = "var(--accent-cyan)";
                      e.currentTarget.style.color = "var(--accent-cyan)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                    }}
                  >
                    <Github size={14} />
                    <span>GitHub</span>
                  </a>

                  <a
                    href="mailto:rzayevsahil200d@gmail.com"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "rgba(255,255,255,0.8)",
                      textDecoration: "none",
                      fontSize: "0.85rem",
                      background: "rgba(255,255,255,0.05)",
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.1)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(0, 242, 254, 0.1)";
                      e.currentTarget.style.borderColor = "var(--accent-cyan)";
                      e.currentTarget.style.color = "var(--accent-cyan)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                    }}
                  >
                    <Mail size={14} />
                    <span>Email</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ScreenRecorderModal
        isOpen={isRecorderModalOpen}
        onClose={() => setIsRecorderModalOpen(false)}
      />

      {warningMessage && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translate(-50%, 0)",
          background: "linear-gradient(135deg, #2a1b1b 0%, #1a0f0f 100%)",
          border: "1px solid rgba(255, 69, 58, 0.4)",
          borderRadius: "8px",
          padding: "12px 20px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.6), 0 0 15px rgba(255, 69, 58, 0.15)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          zIndex: 10000,
          animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          maxWidth: "90%",
          width: "360px"
        }}>
          <div style={{
            color: "#ff453a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}>
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 700,
              fontFamily: "var(--font-title)"
            }}>
              {t.invalidShortcut}
            </span>
            <span style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: "0.78rem",
              lineHeight: "1.4"
            }}>
              {warningMessage}
            </span>
          </div>
          <button
            onClick={() => setWarningMessage(null)}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: "1.1rem",
              padding: "0 4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#ffffff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}

export default SettingsWindow;
