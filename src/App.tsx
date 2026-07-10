import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import SettingsWindow from "./components/SettingsWindow";
import ScreenshotCapture from "./components/ScreenshotCapture";
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
  }, []);

  if (!label) {
    return (
      <div style={{ background: "#0b0c10", width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8e9aaf" }}>
        Loading CrossShot...
      </div>
    );
  }

  if (label === "screenshot") {
    return <ScreenshotCapture />;
  }

  return <SettingsWindow />;
}

export default App;
