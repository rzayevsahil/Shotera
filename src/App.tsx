import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import SettingsWindow from "./components/SettingsWindow";
import ScreenshotCapture from "./components/ScreenshotCapture";
import PinnedImage from "./components/PinnedImage";
import "./App.css";

function App() {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    try {
      const win = getCurrentWindow();
      setLabel(win.label);
    } catch (e) {
      console.error("Failed to get window label, defaulting to main", e);
      setLabel("main");
    }

    // Sync initial system tray language preference on app startup
    const currentLang = localStorage.getItem("language") || (navigator.language.substring(0, 2).toLowerCase() === "tr" ? "tr" : "en");
    invoke("update_tray_language", { lang: currentLang }).catch((err) => console.error("Failed to update initial tray language:", err));
  }, []);

  if (!label) {
    return (
      <div style={{ background: "#0b0c10", width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8e9aaf" }}>
        Loading Shotera...
      </div>
    );
  }

  if (label === "screenshot") {
    return <ScreenshotCapture />;
  }

  if (label.startsWith("pinned_")) {
    return <PinnedImage />;
  }

  return <SettingsWindow />;
}

export default App;
