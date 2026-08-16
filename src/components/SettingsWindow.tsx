import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Settings, Camera, FolderOpen, Info, Github, Mail, AlertTriangle, ZoomIn, Play, Monitor, Timer, Volume2 } from "lucide-react";
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
type ActiveTab = "general" | "capture" | "save" | "zoom" | "timer" | "about";


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
  const [fileFormat, setFileFormat] = useState(() => localStorage.getItem("fileFormat") || "PNG");
  const [imageQuality, setImageQuality] = useState(() => Number(localStorage.getItem("imageQuality") || "100"));
  const [regionShortcut, setRegionShortcut] = useState(() => localStorage.getItem("regionShortcut") || "Ctrl+Shift+S");
  const [fullscreenShortcut, setFullscreenShortcut] = useState(() => localStorage.getItem("fullscreenShortcut") || "Ctrl+Shift+F");
  const [zoomShortcut, setZoomShortcut] = useState(() => localStorage.getItem("zoomShortcut") || "Ctrl+1");
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
  const [timerFontStyle, setTimerFontStyle] = useState<string>(() => localStorage.getItem("timerFontStyle") || "sans");
  const [timerSoundPreset, setTimerSoundPreset] = useState<string>(() => localStorage.getItem("timerSoundPreset") || "chime");
  const [recordingType, setRecordingType] = useState<"region" | "fullscreen" | "zoom" | "timer" | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

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
    localStorage.setItem("fileFormat", fileFormat);
    localStorage.setItem("imageQuality", String(imageQuality));
    localStorage.setItem("regionShortcut", regionShortcut);
    localStorage.setItem("fullscreenShortcut", fullscreenShortcut);
    localStorage.setItem("zoomShortcut", zoomShortcut);
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
  }, [startAtBoot, startInTray, includeCursor, playAudio, savePath, fileFormat, imageQuality, regionShortcut, fullscreenShortcut, zoomShortcut, timerShortcut, timerDefaultDuration, timerCountDirection, timerRingColor, timerBgStyle, timerFontStyle, timerSoundPreset, showNotifications, defaultBlurAmount]);

  // Sync keyboard shortcuts with Rust backend
  useEffect(() => {
    invoke("update_shortcuts", {
      regionShortcut: regionShortcut,
      fullscreenShortcut: fullscreenShortcut,
      zoomShortcut: zoomShortcut,
      timerShortcut: timerShortcut,
    }).catch((e) => {
      console.error("Failed to sync shortcuts with Rust backend:", e);
    });
  }, [regionShortcut, fullscreenShortcut, zoomShortcut, timerShortcut]);

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

      if (recordingType === "region") {
        setRegionShortcut(shortcutStr);
        localStorage.setItem("regionShortcut", shortcutStr);
      } else if (recordingType === "fullscreen") {
        setFullscreenShortcut(shortcutStr);
        localStorage.setItem("fullscreenShortcut", shortcutStr);
      } else if (recordingType === "zoom") {
        setZoomShortcut(shortcutStr);
        localStorage.setItem("zoomShortcut", shortcutStr);
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

      if (recordingType === "region") {
        setRegionShortcut(shortcutStr);
        localStorage.setItem("regionShortcut", shortcutStr);
      } else if (recordingType === "fullscreen") {
        setFullscreenShortcut(shortcutStr);
        localStorage.setItem("fullscreenShortcut", shortcutStr);
      } else if (recordingType === "zoom") {
        setZoomShortcut(shortcutStr);
        localStorage.setItem("zoomShortcut", shortcutStr);
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
      invoke("update_shortcuts", {
        regionShortcut: regShortcut,
        fullscreenShortcut: fsShortcut,
        zoomShortcut: zmShortcut,
        timerShortcut: tmShortcut,
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
            {activeTab === "timer" && (t as any).timerTitle}
            {activeTab === "about" && t.aboutTitle}
          </h2>
          <p className="section-subtitle">
            {activeTab === "general" && t.generalSubtitle}
            {activeTab === "capture" && t.captureSubtitle}
            {activeTab === "save" && t.saveSubtitle}
            {activeTab === "zoom" && (t as any).zoomSubtitle}
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

            <div className="setting-row" style={{ marginTop: "12px" }}>
              <div className="setting-info">
                <span className="setting-label">{t.takeScreenshot}</span>
                <span className="setting-desc">{t.takeScreenshotDesc} <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>{regionShortcut}</span></span>
              </div>
              <button className="premium-button" onClick={handleTakeScreenshot}>
                <Camera size={16} />
                {t.captureNow}
              </button>
            </div>
          </div>
        )}

        {activeTab === "capture" && (
          <div className="settings-card">
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
              </div>
            </div>

            <div className="setting-row" style={{ borderTop: "none", paddingTop: "16px" }}>
              <div className="setting-info">
                <span className="setting-label">{t.editorShortcuts}</span>
                <span className="setting-desc">{t.editorShortcutsDesc}</span>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "auto auto",
                columnGap: "16px",
                rowGap: "8px",
                alignItems: "center"
              }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{t.editorCopy}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "90px", textAlign: "center" }}>{ctrlKey} + C</span>

                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{t.editorSave}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "90px", textAlign: "center" }}>{ctrlKey} + S</span>

                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{t.editorClose}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "90px", textAlign: "center" }}>ESC</span>

                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{t.editorUndo}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "90px", textAlign: "center" }}>{ctrlKey} + Z</span>
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
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "10px",
                width: "100%",
                background: "rgba(255, 255, 255, 0.03)",
                padding: "16px",
                borderRadius: "10px",
                border: "1px solid var(--border-color)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)", fontWeight: 500 }}>{(t as any).drawModeColorChange}</span>
                  <span style={{ fontSize: "0.82rem", color: "var(--accent-cyan)", fontFamily: "monospace" }}>{(t as any).drawModeColorKeys}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed rgba(255, 255, 255, 0.08)", paddingTop: "8px" }}>
                  <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)", fontWeight: 500 }}>{(t as any).drawModeBoardModes}</span>
                  <span style={{ fontSize: "0.82rem", color: "#a855f7", fontFamily: "monospace" }}>{(t as any).drawModeBoardKeys}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed rgba(255, 255, 255, 0.08)", paddingTop: "8px" }}>
                  <span style={{ fontSize: "0.88rem", color: "var(--text-secondary)", fontWeight: 500 }}>{(t as any).drawModeShapes}</span>
                  <span style={{ fontSize: "0.82rem", color: "#10b981", fontFamily: "monospace" }}>{(t as any).drawModeShapeKeys}</span>
                </div>
              </div>
            </div>

            {/* Zoom Navigation & Exit Shortcuts Card */}
            <div className="setting-row" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px" }}>
              <div className="setting-info">
                <span className="setting-label">{(t as any).zoomNavShortcutsTitle}</span>
                <span className="setting-desc">{(t as any).zoomNavShortcutsDesc}</span>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "auto auto",
                columnGap: "16px",
                rowGap: "8px",
                alignItems: "center"
              }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{(t as any).zoomInKeyLabel}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "110px", textAlign: "center" }}>{(t as any).zoomInKeys}</span>

                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{(t as any).zoomDrawLockLabel}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "110px", textAlign: "center" }}>{(t as any).zoomDrawLockKeys}</span>

                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{(t as any).zoomUndoLabel}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "110px", textAlign: "center" }}>{(t as any).zoomUndoKeys}</span>

                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{(t as any).zoomExitLabel}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "110px", textAlign: "center" }}>{(t as any).zoomExitKeys}</span>
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
                  style={{ flex: 1, minWidth: 0, padding: "8px 12px" }}
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
            <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "18px", marginTop: "6px" }}>
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
                    timerBgStyle === "oled-black"
                      ? "#000000"
                      : timerBgStyle === "frosted-dark"
                      ? "rgba(15, 23, 42, 0.95)"
                      : timerBgStyle === "pomodoro-red"
                      ? "radial-gradient(circle at center, #450a0a 0%, #09090b 100%)"
                      : "radial-gradient(circle at center, #0f172a 0%, #020617 100%)",
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
                      fontWeight: 800,
                      color: "#ffffff",
                      fontFamily:
                        timerFontStyle === "heading"
                          ? "'Outfit', sans-serif"
                          : timerFontStyle === "mono"
                          ? "monospace"
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
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
                      width: "88px",
                      padding: "5px 8px",
                      fontSize: "0.82rem",
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
                  <option value="heading">{(t as any).timerFontHeading}</option>
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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
              </div>
            </div>

            {/* Break Timer Quick Shortcuts Card */}
            <div className="setting-row" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px" }}>
              <div className="setting-info">
                <span className="setting-label">{(t as any).timerShortcutsTitle}</span>
                <span className="setting-desc">{(t as any).timerShortcutsDesc}</span>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "auto auto",
                columnGap: "16px",
                rowGap: "8px",
                alignItems: "center"
              }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{(t as any).timerToggleLabel}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "110px", textAlign: "center" }}>{(t as any).timerToggleKeys}</span>

                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{(t as any).timerAdjust1Label}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "110px", textAlign: "center" }}>{(t as any).timerAdjust1Keys}</span>

                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{(t as any).timerAdjust5Label}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "110px", textAlign: "center" }}>{(t as any).timerAdjust5Keys}</span>

                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{(t as any).timerResetKeyLabel}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "110px", textAlign: "center" }}>{(t as any).timerResetKeys}</span>

                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{(t as any).timerExitLabel}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "110px", textAlign: "center" }}>{(t as any).timerExitKeys}</span>
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
