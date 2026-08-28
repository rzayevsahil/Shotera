import { useState, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { allPausedTexts } from "../i18n";
import "./StatusOverlay.css";

export default function StatusOverlay() {
  const [text, setText] = useState("");
  const [visible, setVisible] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unlistenPromise = listen<string>("show-status", (event) => {
      if (event.payload) {
        setText(event.payload);
        setVisible(true);
        setAnimKey((prev) => prev + 1);
      }

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        setText("");
        invoke("hide_status_overlay").catch(console.error);
      }, 1000);
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (!visible || !text) {
    return null;
  }

  const isPaused = allPausedTexts.includes(text);

  return (
    <div className="status-overlay-container" data-tauri-drag-region>
      <div key={animKey} className={`status-overlay-pill ${isPaused ? "paused" : "resumed"}`} data-tauri-drag-region>
        <div className={`status-indicator-dot ${isPaused ? "paused" : "resumed"}`} />
        <span className="status-overlay-text">{text}</span>
      </div>
    </div>
  );
}
