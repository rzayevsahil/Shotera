import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Settings, Camera, FolderOpen, Info, Github, Mail, AlertTriangle } from "lucide-react";
import logo from "../assets/logo.png";
import avatar from "../assets/developer_image.png";
import { translations, getLanguage, setLanguage, Language } from "../i18n";
import { listen } from "@tauri-apps/api/event";
import shutterSoundUrl from "../assets/shutter.mp3";
import { check as checkUpdate } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { enable, disable } from "@tauri-apps/plugin-autostart";
import { sendNotification, onAction } from "@tauri-apps/plugin-notification";
import { getCurrentWindow } from "@tauri-apps/api/window";
type ActiveTab = "general" | "capture" | "save" | "about";

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
  const [recordingType, setRecordingType] = useState<"region" | "fullscreen" | null>(null);
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
            body: lang === "tr" 
              ? `Yeni bir güncelleme mevcut (v${update.version})! Yüklemek için Ayarlar > Hakkında menüsünü ziyaret edin.` 
              : `A new update is available (v${update.version})! Visit Settings > About to install it.`
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
    let unlistenFn: any;
    onAction((notification) => {
      if (notification.id === 999) {
        setActiveTab("about");
        const win = getCurrentWindow();
        win.show().catch(console.error);
        win.setFocus().catch(console.error);
      }
    }).then((fn) => {
      unlistenFn = fn;
    }).catch(console.error);

    return () => {
      if (unlistenFn && typeof unlistenFn.unregister === 'function') {
        unlistenFn.unregister();
      }
    };
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

    localStorage.setItem("showNotifications", String(showNotifications));

    // Sync autostart
    if (startAtBoot) {
      enable().catch(err => console.error("Failed to enable autostart:", err));
    } else {
      disable().catch(err => console.error("Failed to disable autostart:", err));
    }
  }, [startAtBoot, startInTray, includeCursor, playAudio, savePath, fileFormat, imageQuality, regionShortcut, fullscreenShortcut, showNotifications]);

  // Sync keyboard shortcuts with Rust backend
  useEffect(() => {
    invoke("update_shortcuts", {
      regionShortcut: regionShortcut,
      fullscreenShortcut: fullscreenShortcut
    }).catch((e) => {
      console.error("Failed to sync shortcuts with Rust backend:", e);
    });
  }, [regionShortcut, fullscreenShortcut]);

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

      if (shortcutStr.toLowerCase() === "ctrl+c" || shortcutStr.toLowerCase() === "ctrl+s") {
        setWarningMessage(t.shortcutConflictMsg);
        setRecordingType(null);
        return;
      }

      if (recordingType === "region") {
        setRegionShortcut(shortcutStr);
        localStorage.setItem("regionShortcut", shortcutStr);
      } else {
        setFullscreenShortcut(shortcutStr);
        localStorage.setItem("fullscreenShortcut", shortcutStr);
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

      if (shortcutStr.toLowerCase() === "ctrl+c" || shortcutStr.toLowerCase() === "ctrl+s") {
        setWarningMessage(
          lang === "tr"
            ? "Ctrl+C ve Ctrl+S kısayolları kopyalama ve kaydetme işlemleri için ayrılmıştır. Lütfen başka bir kombinasyon seçin."
            : "Ctrl+C and Ctrl+S shortcuts are reserved for copy and save actions. Please select another combination."
        );
        setRecordingType(null);
        return;
      }

      if (recordingType === "region") {
        setRegionShortcut(shortcutStr);
        localStorage.setItem("regionShortcut", shortcutStr);
      } else {
        setFullscreenShortcut(shortcutStr);
        localStorage.setItem("fullscreenShortcut", shortcutStr);
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
      invoke("update_shortcuts", {
        regionShortcut: regShortcut,
        fullscreenShortcut: fsShortcut
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
            }} title={lang === "tr" ? "Yeni güncelleme var!" : "Update available!"} />
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
            {activeTab === "about" && t.aboutTitle}
          </h2>
          <p className="section-subtitle">
            {activeTab === "general" && t.generalSubtitle}
            {activeTab === "capture" && t.captureSubtitle}
            {activeTab === "save" && t.saveSubtitle}
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
                  onChange={(e) => setStartAtBoot(e.target.checked)}
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
                  {recordingType === "region" ? t.shortcutPressKeys : regionShortcut}
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
                  {recordingType === "fullscreen" ? t.shortcutPressKeys : fullscreenShortcut}
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
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "90px", textAlign: "center" }}>Ctrl + C</span>

                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{t.editorSave}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "90px", textAlign: "center" }}>Ctrl + S</span>

                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", justifySelf: "start" }}>{t.editorClose}</span>
                <span className="shortcut-badge" style={{ justifySelf: "start", minWidth: "90px", textAlign: "center" }}>ESC</span>
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
                      {lang === "tr" ? "Şimdi Kur ve Yeniden Başlat" : "Install & Relaunch"}
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
                      {lang === "tr" ? "Yenilikler:" : "What's New:"}
                    </strong>
                    {(() => {
                      const body = updateManifest.body;
                      if (body.includes("TR:") && body.includes("EN:")) {
                        const parts = body.split("||");
                        for (const part of parts) {
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
