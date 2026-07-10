import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Settings, Camera, FolderOpen, Info, Github, Mail } from "lucide-react";
import logo from "../assets/logo.png";
import avatar from "../assets/developer_image.png";
import { translations, getLanguage, setLanguage, Language } from "../i18n";
import { listen } from "@tauri-apps/api/event";
import shutterSoundUrl from "../assets/shutter.mp3";

type ActiveTab = "general" | "capture" | "save" | "about";

function SettingsWindow() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("general");
  const [lang, setLang] = useState<Language>(getLanguage);

  // Settings state synced with localStorage
  const [startAtBoot, setStartAtBoot] = useState(() => localStorage.getItem("startAtBoot") === "true");
  const [startInTray, setStartInTray] = useState(() => localStorage.getItem("startInTray") !== "false"); // default true
  const [includeCursor, setIncludeCursor] = useState(() => localStorage.getItem("includeCursor") === "true");
  const [playAudio, setPlayAudio] = useState(() => localStorage.getItem("playAudio") !== "false"); // default true
  const [savePath, setSavePath] = useState(() => localStorage.getItem("savePath") || "Pictures/Shotera");
  const [fileFormat, setFileFormat] = useState(() => localStorage.getItem("fileFormat") || "PNG");
  const [imageQuality, setImageQuality] = useState(() => Number(localStorage.getItem("imageQuality") || "90"));

  // Sync settings with localStorage
  useEffect(() => {
    localStorage.setItem("startAtBoot", String(startAtBoot));
    localStorage.setItem("startInTray", String(startInTray));
    localStorage.setItem("includeCursor", String(includeCursor));
    localStorage.setItem("playAudio", String(playAudio));
    localStorage.setItem("savePath", savePath);
    localStorage.setItem("fileFormat", fileFormat);
    localStorage.setItem("imageQuality", String(imageQuality));
  }, [startAtBoot, startInTray, includeCursor, playAudio, savePath, fileFormat, imageQuality]);

  // Sync file format and quality settings with Rust backend
  useEffect(() => {
    invoke("update_save_settings", {
      fileFormat: fileFormat,
      imageQuality: imageQuality,
      includeCursor: includeCursor
    }).catch((e) => {
      console.error("Failed to sync save settings with Rust backend:", e);
    });
  }, [fileFormat, imageQuality, includeCursor]);

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
            >
              <Info className="nav-icon" />
              <span>{t.sidebarAbout}</span>
            </div>
          </nav>
        </div>

        <div className="sidebar-footer">
          v0.1.0 (Beta)
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
                <span className="setting-desc">{t.takeScreenshotDesc} <span style={{ color: "var(--accent-cyan)" }}>Print Screen</span> {lang === "tr" ? "veya" : "or"} <span style={{ color: "var(--accent-cyan)" }}>Ctrl + Shift + S</span></span>
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
              <div style={{ display: "flex", gap: "8px" }}>
                <span className="shortcut-badge">Print Screen</span>
                <span className="shortcut-badge">Ctrl + Shift + S</span>
              </div>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{t.globalFullscreenShortcut}</span>
                <span className="setting-desc">{t.globalFullscreenShortcutDesc}</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span className="shortcut-badge">Ctrl + Print Screen</span>
                <span className="shortcut-badge">Ctrl + Shift + F</span>
              </div>
            </div>

            <div className="setting-row" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", marginTop: "16px" }}>
              <div className="setting-info">
                <span className="setting-label">{t.editorShortcuts}</span>
                <span className="setting-desc">{t.editorShortcutsDesc}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{lang === "tr" ? "Kopyala:" : "Copy:"}</span>
                  <span className="shortcut-badge">Ctrl + C</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{lang === "tr" ? "Kaydet:" : "Save:"}</span>
                  <span className="shortcut-badge">Ctrl + S</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{lang === "tr" ? "Kapat:" : "Close:"}</span>
                  <span className="shortcut-badge">ESC</span>
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
              <div style={{ display: "flex", gap: "8px", width: "240px" }}>
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
                  title={lang === "tr" ? "Klasör Seç" : "Select Folder"}
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
                <option value="PNG">PNG ({lang === "tr" ? "Kayıpsız" : "Lossless"})</option>
                <option value="JPG">JPG ({lang === "tr" ? "Sıkıştırılmış" : "Compressed"})</option>
                <option value="WebP">WebP ({lang === "tr" ? "Modern Sıkıştırma" : "Modern Compression"})</option>
              </select>
            </div>

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
          </div>
        )}

        {activeTab === "about" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Shotera Info Card */}
            <div className="settings-card" style={{ gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <img src={logo} alt="Shotera Logo" style={{ width: "60px", height: "60px", objectFit: "contain" }} />
                <div>
                  <h3 style={{ fontSize: "1.45rem", marginBottom: "4px", fontWeight: 800, color: "#ffffff" }}>Shotera Desktop</h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{t.aboutSubtitleDesc}</p>
                </div>
              </div>

              <p style={{ lineHeight: "1.6", color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", margin: 0 }}>
                {t.aboutDesc}
              </p>
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
    </div>
  );
}

export default SettingsWindow;
