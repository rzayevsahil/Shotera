import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Settings, Camera, FolderOpen, Info } from "lucide-react";
import logo from "../assets/logo.png";
import { translations, getLanguage, setLanguage, Language } from "../i18n";

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

  // Sync language with multi-window storage events
  useEffect(() => {
    const handleStorageChange = () => {
      setLang(getLanguage());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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
                <span className="setting-desc">{t.takeScreenshotDesc} <span style={{ color: "var(--accent-cyan)" }}>Print Screen</span> veya <span style={{ color: "var(--accent-cyan)" }}>Ctrl + Shift + S</span></span>
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
          </div>
        )}

        {activeTab === "save" && (
          <div className="settings-card">
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{t.defaultSaveDir}</span>
                <span className="setting-desc">{t.defaultSaveDirDesc}</span>
              </div>
              <input
                type="text"
                className="premium-input"
                value={savePath}
                onChange={(e) => setSavePath(e.target.value)}
              />
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
          <div className="settings-card" style={{ gap: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <img src={logo} alt="Shotera Logo" style={{ width: "64px", height: "64px", objectFit: "contain" }} />
              <div>
                <h3 style={{ fontSize: "1.45rem", marginBottom: "4px", fontWeight: 800, color: "#ffffff" }}>Shotera Desktop</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Cross-Platform Lightweight Screenshot Suite</p>
              </div>
            </div>

            <p style={{ lineHeight: "1.6", color: "rgba(255,255,255,0.7)" }}>
              {t.aboutDesc}
            </p>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "20px", display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>{t.developer}: </span>
                <span style={{ fontWeight: 500 }}>Antigravity Team</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>{t.license}: </span>
                <span style={{ fontWeight: 500 }}>MIT</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)" }}>{t.infrastructure}: </span>
                <span style={{ fontWeight: 500 }}>Tauri v2 + React</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default SettingsWindow;
