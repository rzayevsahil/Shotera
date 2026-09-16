import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Check, Square } from "lucide-react";
import { translations, getLanguage } from "../i18n";
import "./ScrollingHud.css";

interface ScrollingProgress {
  current_step: number;
  max_steps: number;
  current_height: number;
  status: string; // "scrolling", "completed", "cancelled"
  is_manual?: boolean;
}

export default function ScrollingHud() {
  const [progress, setProgress] = useState<ScrollingProgress>({
    current_step: 1,
    max_steps: 30,
    current_height: 0,
    status: "scrolling",
    is_manual: false,
  });
  const [visible, setVisible] = useState(false);

  const lang = getLanguage();
  const t = translations[lang];

  useEffect(() => {
    const unlistenProgress = listen<ScrollingProgress>("scrolling-progress", (event) => {
      if (event.payload) {
        setProgress(event.payload);
        setVisible(true);
      }
    });

    const unlistenCompleted = listen<number>("scrolling-completed", (event) => {
      setProgress((prev) => ({
        ...prev,
        current_height: event.payload || prev.current_height,
        status: "completed",
      }));
      // Auto-hide after 1.2s
      setTimeout(() => {
        setVisible(false);
        getCurrentWindow().hide().catch(console.error);
      }, 1200);
    });

    const unlistenCancelled = listen("scrolling-cancelled", () => {
      setVisible(false);
      getCurrentWindow().hide().catch(console.error);
    });

    const unlistenError = listen<string>("scrolling-error", (e) => {
      console.error("Scrolling error event:", e.payload);
      setVisible(false);
      getCurrentWindow().hide().catch(console.error);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        invoke("cancel_scrolling_capture").catch(console.error);
      } else if (e.key === "Enter") {
        invoke("stop_scrolling_capture").catch(console.error);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      unlistenProgress.then((f) => f());
      unlistenCompleted.then((f) => f());
      unlistenCancelled.then((f) => f());
      unlistenError.then((f) => f());
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleStop = async () => {
    try {
      await invoke("stop_scrolling_capture");
    } catch (err) {
      console.error("Failed to stop scrolling:", err);
    }
  };

  if (!visible) {
    return null;
  }

  const isCompleted = progress.status === "completed";
  const isManual = Boolean(progress.is_manual);

  return (
    <div className="scrolling-hud-container" data-tauri-drag-region>
      <div className={`scrolling-hud-pill ${isCompleted ? "completed" : ""}`} data-tauri-drag-region>
        <div className="scrolling-hud-indicator">
          {!isCompleted && <div className="scrolling-hud-pulse" />}
          <div className={`scrolling-hud-dot ${isCompleted ? "completed" : ""}`} />
        </div>

        <div className="scrolling-hud-content">
          <div className="scrolling-hud-title">
            {isCompleted ? (
              <>
                <Check size={14} color="#22c55e" />
                {(t as any).scrollingStatusCompleted || "Scrolling completed"}
              </>
            ) : isManual ? (
              <>
                <span>{(t as any).scrollMethodManual || "Manuel Kaydırma"}</span>
                {progress.current_step > 1 && (
                  <span className="scrolling-hud-badge">
                    {progress.current_step} kare
                  </span>
                )}
              </>
            ) : (
              <>
                {(t as any).scrollingCapture || "Kaydırmalı Ekran"}
                <span className="scrolling-hud-badge">
                  {progress.current_step} / {progress.max_steps}
                </span>
              </>
            )}
          </div>
          {!isCompleted && (
            <div className="scrolling-hud-meta">
              <span>
                {progress.current_height > 0
                  ? `${progress.current_height} px`
                  : isManual
                  ? ((t as any).scrollingManualStatus || "Sayfayı fare tekeriyle kaydırın...")
                  : ((t as any).scrollingStatusActive || "Kaydırılıyor...")}
              </span>
              <span className="scrolling-hud-esc">
                {isManual ? "Enter: Bitir • ESC: İptal" : ((t as any).scrollingEscHint || "ESC: İptal")}
              </span>
            </div>
          )}
        </div>

        {!isCompleted && (
          <div className="scrolling-hud-actions">
            <button
              className={`scrolling-hud-btn-stop ${isManual ? "btn-finish" : ""}`}
              onClick={handleStop}
              title={isManual ? "Kaydırmayı tamamla ve kaydet (Enter)" : ((t as any).scrollingBtnStop || "Bitir")}
            >
              {isManual ? (
                <>
                  <Check size={12} />
                  <span>Bitir</span>
                </>
              ) : (
                <>
                  <Square size={10} fill="currentColor" />
                  <span>{(t as any).scrollingBtnStop || "Bitir"}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

