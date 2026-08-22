import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import SettingsWindow from "./components/SettingsWindow";
import ScreenshotCapture from "./components/ScreenshotCapture";
import PinnedImage from "./components/PinnedImage";
import BreakTimer from "./components/BreakTimer";
import ZoomCanvas from "./components/ZoomCanvas";
import LiveZoomCanvas from "./components/LiveZoomCanvas";
import ScreenRecorderModal from "./components/ScreenRecorderModal";
import WebcamOverlay from "./components/WebcamOverlay";
import "./App.css";

function StandaloneRecorder() {
  const [isOpen, setIsOpen] = useState(true);
  
  useEffect(() => {
    import("@tauri-apps/api/event").then(({ listen }) => {
      const unlistenOpened = listen("recorder-opened", () => setIsOpen(true));
      const unlistenClosed = listen("recorder-closed", () => setIsOpen(false));
      return () => {
        unlistenOpened.then(f => f());
        unlistenClosed.then(f => f());
      };
    });
  }, []);

  return <ScreenRecorderModal isOpen={isOpen} onClose={() => { setIsOpen(false); getCurrentWindow().hide(); }} isStandalone={true} />;
}


function App() {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    try {
      const win = getCurrentWindow();
      setLabel(win.label);

      if (win.label === "main") {
        const startInTray = localStorage.getItem("startInTray") !== "false"; // default is true
        invoke<boolean>("is_autostart_launch")
          .then((isAutostart) => {
            if (!isAutostart || !startInTray) {
              win.show();
              win.setFocus();
            }
          })
          .catch(() => {
            if (!startInTray) {
              win.show();
              win.setFocus();
            }
          });

        // Auto-sync and repair autostart Windows registry key on startup
        const startAtBootSetting = localStorage.getItem("startAtBoot") === "true";
        if (startAtBootSetting) {
          invoke("unblock_autostart_registry").catch(() => {});
        }
        isEnabled().then((enabled) => {
          invoke("write_log_entry", { level: "INFO", message: `Autostart setting state: saved=${startAtBootSetting}, registryEnabled=${enabled}` });
          if (startAtBootSetting && !enabled) {
            enable()
              .then(() => {
                invoke("unblock_autostart_registry").catch(() => {});
                invoke("write_log_entry", { level: "INFO", message: "Autostart Registry key repaired successfully on boot" });
              })
              .catch((err) => invoke("write_log_entry", { level: "ERROR", message: `Failed to enable autostart on launch: ${err}` }));
          } else if (!startAtBootSetting && enabled) {
            disable()
              .then(() => invoke("write_log_entry", { level: "INFO", message: "Autostart Registry key disabled successfully on boot" }))
              .catch((err) => invoke("write_log_entry", { level: "ERROR", message: `Failed to disable autostart on launch: ${err}` }));
          }
        }).catch((err) => {
          invoke("write_log_entry", { level: "ERROR", message: `Failed to check autostart status: ${err}` });
          if (startAtBootSetting) {
            enable().then(() => invoke("unblock_autostart_registry").catch(() => {})).catch(() => {});
          }
        });
      }
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


  if (label === "timer") {
    return <BreakTimer />;
  }

  if (label === "zoom") {
    return <ZoomCanvas />;
  }

  if (label === "live_zoom") {
    return <LiveZoomCanvas />;
  }

  if (label.startsWith("pinned_")) {
    return <PinnedImage />;
  }

  if (label === "recorder") {
    return <StandaloneRecorder />;
  }

  if (label === "webcam") {
    return <WebcamOverlay />;
  }

  return <SettingsWindow />;
}


export default App;
