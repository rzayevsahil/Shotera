import { useState, useEffect, useRef } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Settings, Camera, FolderOpen, Info, Github, Mail, AlertTriangle, ZoomIn, Video, Play, Monitor, Timer, Volume2, Palette, LayoutTemplate, Shapes, Pencil, Undo2, LogOut, Clock, Zap, RotateCcw, Copy, Save, Square, Mic, Sparkles, Upload, Music, Trash2, Bell, FileAudio } from "lucide-react";
import logo from "../assets/logo.png";
import avatar from "../assets/developer_image.png";
import { translations, getLanguage, setLanguage, Language } from "../i18n";
import { playTimerSound } from "../utils/audio";
import { listen } from "@tauri-apps/api/event";
import shutterSoundUrl from "../assets/shutter.mp3";
import { check as checkUpdate } from "@tauri-apps/plugin-updater";
import { emit } from "@tauri-apps/api/event";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { sendNotification } from "@tauri-apps/plugin-notification";
import ScreenRecorderModal from "./ScreenRecorderModal";
import FeatureTour from "./FeatureTour";
type ActiveTab = "general" | "capture" | "save" | "zoom" | "live_zoom" | "timer" | "record" | "about";

function resolveImageSrc(src: string | null | undefined): string {
  if (!src) return "";
  const trimmed = src.trim();
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("http:") ||
    trimmed.startsWith("https:") ||
    trimmed.startsWith("asset:")
  ) {
    return trimmed;
  }
  try {
    return convertFileSrc(trimmed);
  } catch {
    return trimmed;
  }
}
const SYSTEM_FONTS = [
  "Arial", "Arial Black", "Bahnschrift", "Calibri", "Cambria", "Cambria Math",
  "Candara", "Comic Sans MS", "Consolas", "Constantia", "Corbel", "Courier New",
  "Ebrima", "Franklin Gothic Medium", "Gabriola", "Gadugi", "Georgia",
  "Impact", "Ink Free", "Javanese Text", "Leelawadee UI", "Lucida Console",
  "Lucida Sans Unicode", "Malgun Gothic", "Microsoft Himalaya", "Microsoft JhengHei",
  "Microsoft New Tai Lue", "Microsoft PhagsPa", "Microsoft Sans Serif",
  "Microsoft Tai Le", "Microsoft YaHei", "Microsoft Yi Baiti", "MingLiU-ExtB",
  "Mongolian Baiti", "MS Gothic", "MV Boli", "Myanmar Text", "Nirmala UI",
  "Palatino Linotype", "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Historic",
  "Segoe UI Symbol", "SimSun", "Sitka", "Sylfaen", "Symbol", "Tahoma",
  "Times New Roman", "Trebuchet MS", "Verdana", "Webdings", "Wingdings",
  "Helvetica", "Helvetica Neue", "Monaco", "Menlo", "Ubuntu", "Roboto", "Inter", "Outfit",
  "sans-serif", "serif", "monospace", "cursive", "fantasy"
].sort();

function FontSelect({ value, onChange, placeholder, searchPlaceholder }: { value: string, onChange: (val: string) => void, placeholder?: string, searchPlaceholder?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredFonts = SYSTEM_FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "240px" }}>
      <div
        className="premium-input"
        style={{
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          padding: "10px 12px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxSizing: "border-box",
          minWidth: "240px"
        }}
        onClick={() => { setIsOpen(!isOpen); setSearch(""); }}
      >
        <span style={{ fontFamily: value, overflow: "hidden", textOverflow: "ellipsis", fontSize: "0.9rem" }}>{value || placeholder}</span>
        <span style={{ fontSize: "10px", marginLeft: "8px", opacity: 0.6 }}>▼</span>
      </div>
      {isOpen && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "4px",
          background: "rgba(15, 23, 42, 0.98)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "6px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column"
        }}>
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder || "Font ara..."}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "none",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "10px 12px",
              color: "white",
              outline: "none",
              fontSize: "0.85rem",
              borderRadius: "6px 6px 0 0"
            }}
          />
          <div className="custom-scrollbar" style={{ maxHeight: "200px", overflowY: "auto", padding: "4px 0" }}>
            {filteredFonts.length > 0 ? filteredFonts.map(font => (
              <div
                key={font}
                onClick={() => {
                  onChange(font);
                  setIsOpen(false);
                }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontFamily: font,
                  background: value === font ? "rgba(56, 189, 248, 0.2)" : "transparent",
                  color: value === font ? "#38bdf8" : "white",
                  fontSize: "1rem"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.background = value === font ? "rgba(56, 189, 248, 0.2)" : "transparent"}
              >
                {font}
              </div>
            )) : (
              <div style={{ padding: "12px", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", textAlign: "center" }}>Bulunamadı</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function SettingsWindow() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("general");
  const [lang, setLang] = useState<Language>(getLanguage);
  const [appVersion, setAppVersion] = useState("v0.1.0");
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    getVersion().then(v => setAppVersion(`v${v}`)).catch(() => { });
    const tourCompleted = localStorage.getItem("shotera_tour_completed");
    if (tourCompleted !== "true") {
      const timer = setTimeout(() => setIsTourOpen(true), 600);
      return () => clearTimeout(timer);
    }
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
  const [pauseRecordShortcut, setPauseRecordShortcut] = useState(() => localStorage.getItem("pauseRecordShortcut") || "Ctrl+6");
  const [webcamShortcut, setWebcamShortcut] = useState(() => localStorage.getItem("webcamShortcut") || "Ctrl+7");
  const [micShortcut, setMicShortcut] = useState(() => localStorage.getItem("micShortcut") || "Ctrl+8");
  const [timerShortcut, setTimerShortcut] = useState(() => localStorage.getItem("timerShortcut") || "Ctrl+3");
  const [timerDefaultDuration, setTimerDefaultDuration] = useState<number>(() => Number(localStorage.getItem("timerDefaultDuration") || "600"));
  const [timerCountDirection, setTimerCountDirection] = useState<"down" | "up">(
    () => (localStorage.getItem("timerCountDirection") as "down" | "up") || "down"
  );
  const [timerShowElapsedAfterExpiration, setTimerShowElapsedAfterExpiration] = useState<boolean>(
    () => localStorage.getItem("timerShowElapsedAfterExpiration") === "true"
  );
  const [timerLockWorkstationOnStart, setTimerLockWorkstationOnStart] = useState<boolean>(
    () => localStorage.getItem("timerLockWorkstationOnStart") === "true"
  );
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
  const [timerSoundSource, setTimerSoundSource] = useState<"preset" | "custom">(() => {
    const savedSource = localStorage.getItem("timerSoundSource");
    if (savedSource === "custom" || savedSource === "preset") return savedSource as "preset" | "custom";
    const currentPreset = localStorage.getItem("timerSoundPreset") || "chime";
    return currentPreset === "custom" ? "custom" : "preset";
  });
  const [timerSoundRepeat, setTimerSoundRepeat] = useState<string>(() => localStorage.getItem("timerSoundRepeat") || "1");
  const [timerCustomAudioName, setTimerCustomAudioName] = useState<string>(
    () => localStorage.getItem("timerCustomAudioName") || ""
  );
  const [timerOpacity, setTimerOpacity] = useState<number>(() => Number(localStorage.getItem("timerOpacity") || "100"));
  const [timerPosition, setTimerPosition] = useState<string>(() => localStorage.getItem("timerPosition") || "top-right");
  const customAudioInputRef = useRef<HTMLInputElement | null>(null);

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      try {
        localStorage.setItem("timerCustomAudioData", result);
        localStorage.setItem("timerCustomAudioName", file.name);
        setTimerCustomAudioName(file.name);
        setTimerSoundPreset("custom");
        localStorage.setItem("timerSoundPreset", "custom");
        window.dispatchEvent(new Event("storage"));
        playTimerSound("custom");
      } catch (err) {
        console.error("Failed to save custom audio:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomAudio = () => {
    localStorage.removeItem("timerCustomAudioData");
    localStorage.removeItem("timerCustomAudioName");
    setTimerCustomAudioName("");
    if (timerSoundPreset === "custom") {
      setTimerSoundPreset("chime");
      localStorage.setItem("timerSoundPreset", "chime");
    }
    window.dispatchEvent(new Event("storage"));
  };

  const [timerBgMode, setTimerBgMode] = useState<"color" | "desktop" | "image">(
    () => (localStorage.getItem("timerBgMode") as "color" | "desktop" | "image") || "color"
  );
  const [timerBgCustomImage, setTimerBgCustomImage] = useState<string>(
    () => localStorage.getItem("timerBgCustomImage") || ""
  );
  const [timerBgCustomImageName, setTimerBgCustomImageName] = useState<string>(
    () => localStorage.getItem("timerBgCustomImageName") || ""
  );
  const [timerBgScale, setTimerBgScale] = useState<boolean>(
    () => localStorage.getItem("timerBgScale") !== "false"
  );
  const customTimerBgInputRef = useRef<HTMLInputElement | null>(null);

  const handleCustomTimerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      try {
        setTimerBgCustomImage(result);
        setTimerBgCustomImageName(file.name);
        setTimerBgMode("image");
        localStorage.setItem("timerBgCustomImage", result);
        localStorage.setItem("timerBgCustomImageName", file.name);
        localStorage.setItem("timerBgMode", "image");
        window.dispatchEvent(new Event("storage"));
        emit("timer-settings-updated").catch(() => {});
      } catch (err) {
        console.error("Failed to save custom background image:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectTimerImageTauri = async () => {
    try {
      const filePath = await invoke<string | null>("select_image");
      if (filePath) {
        const fileSrc = convertFileSrc(filePath);
        const fileName = filePath.split(/[/\\]/).pop() || "background.png";
        setTimerBgCustomImage(fileSrc);
        setTimerBgCustomImageName(fileName);
        setTimerBgMode("image");
        localStorage.setItem("timerBgCustomImage", filePath);
        localStorage.setItem("timerBgCustomImageName", fileName);
        localStorage.setItem("timerBgMode", "image");
        window.dispatchEvent(new Event("storage"));
        emit("timer-settings-updated").catch(() => {});
      }
    } catch (err) {
      console.error("Failed to select image:", err);
    }
  };

  const handleRemoveCustomTimerImage = () => {
    setTimerBgCustomImage("");
    setTimerBgCustomImageName("");
    setTimerBgMode("color");
    localStorage.removeItem("timerBgCustomImage");
    localStorage.removeItem("timerBgCustomImageName");
    localStorage.setItem("timerBgMode", "color");
    window.dispatchEvent(new Event("storage"));
    emit("timer-settings-updated").catch(() => {});
  };
  const [recordingType, setRecordingType] = useState<"region" | "fullscreen" | "zoom" | "live_zoom" | "record" | "pause_record" | "webcam" | "mic" | "timer" | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isRecorderModalOpen, setIsRecorderModalOpen] = useState(false);
  const [recordFps, setRecordFps] = useState<number>(() => Number(localStorage.getItem("recordFps") || "30"));
  const [recordAudio, setRecordAudio] = useState<boolean>(() => localStorage.getItem("recordAudio") !== "false");
  const [recordMic, setRecordMic] = useState<boolean>(() => localStorage.getItem("recordMic") === "true");
  const [recordWebcam, setRecordWebcam] = useState<boolean>(() => localStorage.getItem("recordWebcam") === "true");
  const [showRecordControls, setShowRecordControls] = useState<boolean>(() => localStorage.getItem("showRecordControls") !== "false");
  const [webcamPermissionMode, setWebcamPermissionMode] = useState<string>(() => localStorage.getItem("webcamPermissionMode") || "once");
  const [webcamBorderColor, setWebcamBorderColor] = useState<string>(() => localStorage.getItem("webcamBorderColor") || "#38bdf8");
  const [customWebcamBorderColor, setCustomWebcamBorderColor] = useState<string>(() => {
    const savedCustom = localStorage.getItem("customWebcamBorderColor");
    if (savedCustom) return savedCustom;
    const current = localStorage.getItem("webcamBorderColor") || "#38bdf8";
    return ["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].includes(current) ? "#06b6d4" : current;
  });
  const [webcamBorderAnimation, setWebcamBorderAnimation] = useState<string>(() => localStorage.getItem("webcamBorderAnimation") || "solid");

  const [webcamMode, setWebcamMode] = useState<string>(() => localStorage.getItem("webcamMode") || "camera");
  const [webcamImagePath, setWebcamImagePath] = useState<string>(() => localStorage.getItem("webcamImagePath") || "");

  // Webcam Text Settings
  const [webcamText, setWebcamText] = useState<string>(() => localStorage.getItem("webcamText") || "");
  const [webcamTextColor, setWebcamTextColor] = useState<string>(() => localStorage.getItem("webcamTextColor") || "#ffffff");
  const [customWebcamTextColor, setCustomWebcamTextColor] = useState<string>(() => {
    const savedCustom = localStorage.getItem("customWebcamTextColor");
    if (savedCustom) return savedCustom;
    const current = localStorage.getItem("webcamTextColor") || "#ffffff";
    return ["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].includes(current) ? "#ffffff" : current;
  });
  const [webcamTextFont, setWebcamTextFont] = useState<string>(() => localStorage.getItem("webcamTextFont") || "sans");
  const [webcamTextSize, setWebcamTextSize] = useState<number>(() => Number(localStorage.getItem("webcamTextSize") || "11"));
  const [webcamTextAnimation, setWebcamTextAnimation] = useState<string>(() => localStorage.getItem("webcamTextAnimation") || "solid");

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
    localStorage.setItem("pauseRecordShortcut", pauseRecordShortcut);
    localStorage.setItem("webcamShortcut", webcamShortcut);
    localStorage.setItem("timerShortcut", timerShortcut);
    localStorage.setItem("timerDefaultDuration", String(timerDefaultDuration));
    localStorage.setItem("timerCountDirection", timerCountDirection);
    localStorage.setItem("timerRingColor", timerRingColor);
    localStorage.setItem("timerBgStyle", timerBgStyle);
    localStorage.setItem("timerFontStyle", timerFontStyle);
    localStorage.setItem("timerSoundPreset", timerSoundPreset);
    localStorage.setItem("defaultBlurAmount", String(defaultBlurAmount));
    localStorage.setItem("showNotifications", String(showNotifications));

    localStorage.setItem("webcamText", webcamText);
    localStorage.setItem("webcamTextColor", webcamTextColor);
    localStorage.setItem("webcamTextFont", webcamTextFont);
    localStorage.setItem("webcamTextSize", webcamTextSize.toString());
    localStorage.setItem("webcamTextAnimation", webcamTextAnimation);
    localStorage.setItem("webcamMode", webcamMode);
    localStorage.setItem("webcamImagePath", webcamImagePath);
    localStorage.setItem("webcamBorderAnimation", webcamBorderAnimation);

    window.dispatchEvent(new Event("storage"));
  }, [startAtBoot, startInTray, includeCursor, playAudio, savePath, videoSavePath, fileFormat, imageQuality, regionShortcut, fullscreenShortcut, zoomShortcut, liveZoomShortcut, timerShortcut, timerDefaultDuration, timerCountDirection, timerRingColor, timerBgStyle, timerFontStyle, timerSoundPreset, showNotifications, defaultBlurAmount, pauseRecordShortcut, webcamShortcut, micShortcut, webcamText, webcamTextColor, webcamTextFont, webcamTextSize, webcamTextAnimation, webcamMode, webcamImagePath, webcamBorderAnimation]);

  // Sync keyboard shortcuts with Rust backend
  useEffect(() => {
    invoke("update_shortcuts", {
      regionShortcut: regionShortcut,
      fullscreenShortcut: fullscreenShortcut,
      zoomShortcut: zoomShortcut,
      timerShortcut: timerShortcut,
      liveZoomShortcut: liveZoomShortcut,
      recordShortcut: recordShortcut,
      pauseRecordShortcut: pauseRecordShortcut,
      webcamShortcut: webcamShortcut,
      micShortcut: micShortcut,
    }).catch((e) => {
      console.error("Failed to sync shortcuts with Rust backend:", e);
    });
  }, [regionShortcut, fullscreenShortcut, zoomShortcut, timerShortcut, liveZoomShortcut, recordShortcut, pauseRecordShortcut, webcamShortcut, micShortcut]);

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
        pause_record: pauseRecordShortcut,
        webcam: webcamShortcut,
        mic: micShortcut,
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
      } else if (recordingType === "pause_record") {
        setPauseRecordShortcut(shortcutStr);
        localStorage.setItem("pauseRecordShortcut", shortcutStr);
      } else if (recordingType === "webcam") {
        setWebcamShortcut(shortcutStr);
        localStorage.setItem("webcamShortcut", shortcutStr);
      } else if (recordingType === "mic") {
        setMicShortcut(shortcutStr);
        localStorage.setItem("micShortcut", shortcutStr);
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
        pause_record: pauseRecordShortcut,
        webcam: webcamShortcut,
        mic: micShortcut,
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
      } else if (recordingType === "pause_record") {
        setPauseRecordShortcut(shortcutStr);
        localStorage.setItem("pauseRecordShortcut", shortcutStr);
      } else if (recordingType === "webcam") {
        setWebcamShortcut(shortcutStr);
        localStorage.setItem("webcamShortcut", shortcutStr);
      } else if (recordingType === "mic") {
        setMicShortcut(shortcutStr);
        localStorage.setItem("micShortcut", shortcutStr);
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
      const pauseRecShortcut = localStorage.getItem("pauseRecordShortcut") || "Ctrl+6";
      const webShortcut = localStorage.getItem("webcamShortcut") || "Ctrl+7";
      const microphoneShortcut = localStorage.getItem("micShortcut") || "Ctrl+8";
      invoke("update_shortcuts", {
        regionShortcut: regShortcut,
        fullscreenShortcut: fsShortcut,
        zoomShortcut: zmShortcut,
        timerShortcut: tmShortcut,
        liveZoomShortcut: lzShortcut,
        recordShortcut: recShortcut,
        pauseRecordShortcut: pauseRecShortcut,
        webcamShortcut: webShortcut,
        micShortcut: microphoneShortcut,
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
      setRecordWebcam(localStorage.getItem("recordWebcam") === "true");
      setRecordMic(localStorage.getItem("recordMic") === "true");
      setShowRecordControls(localStorage.getItem("showRecordControls") !== "false");
    };

    window.addEventListener("storage", handleStorageChange);

    const unlistenForceSync = listen("force_storage_sync", () => {
      handleStorageChange();
    });

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      unlistenForceSync.then(f => f());
    };
  }, []);

  // Sync window title with current language
  useEffect(() => {
    try {
      const winTitle = lang === "tr" ? "Shotera - Ayarlar"
        : lang === "az" ? "Shotera - Tənzimləmələr"
          : lang === "de" ? "Shotera - Einstellungen"
            : lang === "ru" ? "Shotera - Настройки"
              : "Shotera - Settings";
      getCurrentWindow().setTitle(winTitle).catch(() => { });
    } catch (e) { }
  }, [lang]);

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
          <div className="brand" data-tour="brand-logo" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
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
              data-tour="nav-general"
              onClick={() => setActiveTab("general")}
            >
              <Settings className="nav-icon" />
              <span>{t.sidebarGeneral}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "capture" ? "active" : ""}`}
              data-tour="nav-capture"
              onClick={() => setActiveTab("capture")}
            >
              <Camera className="nav-icon" />
              <span>{t.sidebarCapture}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "save" ? "active" : ""}`}
              data-tour="nav-save"
              onClick={() => setActiveTab("save")}
            >
              <FolderOpen className="nav-icon" />
              <span>{t.sidebarSave}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "zoom" ? "active" : ""}`}
              data-tour="nav-zoom"
              onClick={() => setActiveTab("zoom")}
            >
              <ZoomIn className="nav-icon" />
              <span>{(t as any).sidebarZoom}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "timer" ? "active" : ""}`}
              data-tour="nav-timer"
              onClick={() => setActiveTab("timer")}
            >
              <Timer className="nav-icon" />
              <span>{(t as any).sidebarTimer}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "live_zoom" ? "active" : ""}`}
              data-tour="nav-live_zoom"
              onClick={() => setActiveTab("live_zoom")}
            >
              <Video className="nav-icon" />
              <span>{(t as any).sidebarLiveZoom}</span>
            </div>
            <div
              className={`nav-item ${activeTab === "record" ? "active" : ""}`}
              data-tour="nav-record"
              onClick={() => setActiveTab("record")}
            >
              <Play className="nav-icon" />
              <span>{(t as any).sidebarRecord}</span>
            </div>

            <div
              className={`nav-item ${activeTab === "about" ? "active" : ""}`}
              data-tour="nav-about"
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
            <div className="setting-row" data-tour="setting-autostart">
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

            <div className="setting-row" data-tour="setting-start-in-tray">
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

            <div className="setting-row" data-tour="setting-show-notifications">
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

            <div className="setting-row" data-tour="setting-language">
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

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).startTourBtn || "Uygulama Turunu Başlat"}</span>
                <span className="setting-desc">{(t as any).startTourDesc || "Shotera'nın ana özelliklerini interaktif adım adım tur ile keşfedin."}</span>
              </div>
              <button
                className="premium-button secondary"
                onClick={() => setIsTourOpen(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <Sparkles size={16} color="var(--accent-cyan)" />
                <span>{(t as any).startTourBtn || "Turu Başlat"}</span>
              </button>
            </div>

          </div>
        )}

        {activeTab === "capture" && (
          <div className="settings-card" data-tour="global-shortcut-card">
            <div className="setting-row" data-tour="shortcut-region">
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

            <div className="setting-row" data-tour="shortcut-fullscreen">
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

            <div className="setting-row" data-tour="setting-shutter">
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

            <div className="setting-row" data-tour="setting-include-cursor">
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

            <div className="setting-row" data-tour="setting-blur-amount">
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

            <div data-tour="setting-editor-shortcuts" style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "8px" }}>
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
            <div className="setting-row" data-tour="setting-save-folder">
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

            <div className="setting-row" data-tour="setting-video-save-folder">
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

            <div className="setting-row" data-tour="setting-format">
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
              <div className="setting-row" data-tour="setting-image-quality">
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
            <div className="setting-row" data-tour="shortcut-zoom">
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
            <div className="setting-row" data-tour="setting-zoom-draw" style={{ flexDirection: "column", alignItems: "flex-start", gap: "12px" }}>
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
            <div data-tour="setting-zoom-nav" style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "8px" }}>
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
            <div className="setting-row" data-tour="shortcut-live-zoom">
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
            <div className="setting-row" data-tour="setting-live-zoom-nav" style={{ flexDirection: "column", alignItems: "flex-start" }}>
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
                  <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>{formatShortcut(liveZoomShortcut)}</kbd>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "timer" && (
          <div className="settings-card">
            {/* Break Timer Row */}
            <div className="setting-row" data-tour="shortcut-timer">
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
            <div className="setting-row" data-tour="setting-timer-duration">
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
            <div className="setting-row" data-tour="setting-timer-direction">
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

            {/* Show Time Elapsed After Expiration Row */}
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).timerShowElapsedAfterExpiration}</span>
                <span className="setting-desc">{(t as any).timerShowElapsedAfterExpirationDesc}</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={timerShowElapsedAfterExpiration}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setTimerShowElapsedAfterExpiration(checked);
                    localStorage.setItem("timerShowElapsedAfterExpiration", String(checked));
                    window.dispatchEvent(new Event("storage"));
                  }}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Lock Workstation During Break Row */}
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">{(t as any).timerLockWorkstationOnStart}</span>
                <span className="setting-desc">{(t as any).timerLockWorkstationOnStartDesc}</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={timerLockWorkstationOnStart}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setTimerLockWorkstationOnStart(checked);
                    localStorage.setItem("timerLockWorkstationOnStart", String(checked));
                    window.dispatchEvent(new Event("storage"));
                  }}
                />
                <span className="slider"></span>
              </label>
            </div>

            {/* Theme & Ring Color Selection Section */}
            <div data-tour="setting-timer-theme">
              <div className="setting-info" style={{ marginBottom: "14px" }}>
                <span className="setting-label">{(t as any).timerThemeTitle}</span>
                <span className="setting-desc">{(t as any).timerThemeDesc}</span>
              </div>

              {/* Live Preview Box: Computer Monitor Simulation */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "10px 0",
                  marginBottom: "20px",
                  position: "relative"
                }}
              >
                {/* Monitor Screen Frame */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "380px",
                    height: "210px",
                    background: "#090d16",
                    border: "3px solid #334155",
                    borderRadius: "10px 10px 4px 4px",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 14px 36px rgba(0,0,0,0.6), inset 0 0 12px rgba(0,0,0,0.9)",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  {/* Monitor Header / Window Control Dots Bar */}
                  <div
                    style={{
                      height: "22px",
                      background: "rgba(255, 255, 255, 0.04)",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 10px",
                      gap: "6px",
                      zIndex: 6
                    }}
                  >
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444" }} />
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#eab308" }} />
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e" }} />

                    {/* Live Preview Badge */}
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        color: "rgba(255, 255, 255, 0.5)",
                        background: "rgba(0, 0, 0, 0.4)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        marginLeft: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.08)"
                      }}
                    >
                      {(t as any).timerLivePreview || "Canlı Önizleme"}
                    </span>

                    <span style={{ fontSize: "0.65rem", color: "#38bdf8", marginLeft: "auto", fontWeight: 700, letterSpacing: "0.5px" }}>
                      Shotera
                    </span>
                  </div>

                  {/* Desktop Wallpaper Display Area */}
                  <div
                    style={{
                      flex: 1,
                      position: "relative",
                      overflow: "hidden",
                      background:
                        timerBgMode === "image" && timerBgCustomImage
                          ? `linear-gradient(rgba(15, 23, 42, 0.25), rgba(15, 23, 42, 0.25)), url("${resolveImageSrc(timerBgCustomImage)}") center / ${timerBgScale ? "cover" : "contain"} no-repeat`
                          : timerBgMode === "desktop"
                          ? "linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), radial-gradient(circle at center, #1e293b 0%, #020617 100%)"
                          : (timerBgStyle === "custom" || (timerBgColor && timerBgStyle !== "oled-black" && timerBgStyle !== "frosted-dark" && timerBgStyle !== "pomodoro-red" && timerBgStyle !== "dark-slate"))
                          ? (timerBgColor.startsWith("#") ? `radial-gradient(circle at center, ${timerBgColor} 0%, #020617 100%)` : timerBgColor)
                          : timerBgStyle === "oled-black"
                            ? "#000000"
                            : timerBgStyle === "frosted-dark"
                              ? "rgba(15, 23, 42, 0.95)"
                              : timerBgStyle === "pomodoro-red"
                                ? "radial-gradient(circle at center, #450a0a 0%, #09090b 100%)"
                                : `radial-gradient(circle at center, ${timerBgColor || "#0f172a"} 0%, #020617 100%)`
                    }}
                  >
                    {/* Background Mesh Dots Grid */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px)",
                        backgroundSize: "14px 14px",
                        opacity: timerBgMode === "color" ? 0.6 : 0.2,
                        pointerEvents: "none"
                      }}
                    />

                    {/* Live Moving Mini Break Timer Ring & Clock Display */}
                    <div
                      style={{
                        position: "absolute",
                        width: "52px",
                        height: "52px",
                        borderRadius: "50%",
                        background: "rgba(15, 23, 42, 0.85)",
                        border: `2px solid ${timerRingColor || "#38bdf8"}`,
                        boxShadow: `0 0 16px ${timerRingColor || "#38bdf8"}aa, inset 0 0 8px ${timerRingColor || "#38bdf8"}40`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
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
                        transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        backdropFilter: "blur(6px)",
                        zIndex: 5,
                        margin: "6px",
                        textShadow: `0 0 12px ${timerRingColor || "#38bdf8"}80`,
                        ...(timerPosition === "top-left" ? { top: "6px", left: "6px" } :
                          timerPosition === "top-center" ? { top: "6px", left: "50%", transform: "translateX(-50%)" } :
                            timerPosition === "top-right" ? { top: "6px", right: "6px" } :
                              timerPosition === "center-left" ? { top: "50%", left: "6px", transform: "translateY(-50%)" } :
                                timerPosition === "center-right" ? { top: "50%", right: "6px", transform: "translateY(-50%)" } :
                                  timerPosition === "bottom-left" ? { bottom: "6px", left: "6px" } :
                                    timerPosition === "bottom-center" ? { bottom: "6px", left: "50%", transform: "translateX(-50%)" } :
                                      timerPosition === "bottom-right" ? { bottom: "6px", right: "6px" } :
                                        { top: "50%", left: "50%", transform: "translate(-50%, -50%)" })
                      }}
                    >
                      10:00
                    </div>
                  </div>

                  {/* Monitor Bottom Bezel with Power Indicator LED */}
                  <div style={{ height: "10px", background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                    <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 6px #38bdf8", position: "absolute", right: "10px" }} />
                  </div>
                </div>

                {/* Monitor Stand Neck */}
                <div style={{ width: "32px", height: "10px", background: "linear-gradient(to bottom, #334155, #1e293b)", borderLeft: "1px solid rgba(255, 255, 255, 0.1)", borderRight: "1px solid rgba(255, 255, 255, 0.1)" }} />

                {/* Monitor Stand Base */}
                <div style={{ width: "90px", height: "5px", background: "linear-gradient(to right, #1e293b, #475569, #1e293b)", borderRadius: "3px 3px 1px 1px", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }} />
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
                    title={(t as any).timerPickCustomColor || "Özel Renk Seç"}
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

              {/* Background Mode & Custom Image Section */}
              <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px", marginTop: "12px" }}>
                <div className="setting-info" style={{ marginBottom: "12px" }}>
                  <span className="setting-label">{(t as any).timerBgImageTitle || "Mola Ekranı Arka Plan Görseli"}</span>
                  <span className="setting-desc">{(t as any).timerBgImageDesc || "Mola ekranına düz renk yerine masaüstünüzün soluk görüntüsünü veya özel bir görsel ekleyin."}</span>
                </div>

                {/* Background Source Selector */}
                <div className="setting-row" style={{ borderBottom: "none", paddingBottom: "10px" }}>
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).timerBgModeLabel || "Arka Plan Kaynağı"}</span>
                  </div>
                  <select
                    className="premium-input"
                    value={timerBgMode}
                    onChange={(e) => {
                      const val = e.target.value as "color" | "desktop" | "image";
                      setTimerBgMode(val);
                      localStorage.setItem("timerBgMode", val);
                      window.dispatchEvent(new Event("storage"));
                      emit("timer-settings-updated").catch(() => {});
                    }}
                    style={{ width: "240px" }}
                  >
                    <option value="color">{(t as any).timerBgModeColor || "Düz Renk / Gradyan"}</option>
                    <option value="desktop">{(t as any).timerBgModeDesktop || "Soluk Masaüstü (Faded Desktop)"}</option>
                    <option value="image">{(t as any).timerBgModeImage || "Özel Görsel Dosyası"}</option>
                  </select>
                </div>

                {/* Option 1: Faded Desktop Description Box */}
                {timerBgMode === "desktop" && (
                  <div style={{ background: "rgba(255, 255, 255, 0.03)", borderRadius: "10px", padding: "12px 14px", marginBottom: "12px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, display: "block" }}>
                      💡 {(t as any).timerBgFadedDesktopDesc || "Sayacın arkasına mevcut masaüstünüzün soluk/karartılmış bir görüntüsünü koyar."}
                    </span>
                  </div>
                )}

                {/* Option 2: Custom Image Selector Card */}
                {timerBgMode === "image" && (
                  <div style={{ background: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", padding: "14px 16px", marginBottom: "12px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden", flex: "1 1 auto" }}>
                        <Camera size={18} color="#38bdf8" />
                        <span style={{ fontSize: "0.85rem", color: timerBgCustomImageName ? "#f8fafc" : "var(--text-secondary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "240px" }}>
                          {timerBgCustomImageName || ((t as any).timerBgNoImageSelected || "Henüz özel bir görsel seçilmedi")}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="file"
                          ref={customTimerBgInputRef}
                          accept="image/*"
                          onChange={handleCustomTimerImageUpload}
                          style={{ display: "none" }}
                        />
                        <button
                          className="premium-button"
                          onClick={() => {
                            if ((window as any).__TAURI_INTERNALS__) {
                              handleSelectTimerImageTauri();
                            } else {
                              customTimerBgInputRef.current?.click();
                            }
                          }}
                          style={{ padding: "6px 12px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                        >
                          <Upload size={14} />
                          {(t as any).timerBgSelectImageBtn || "Görsel Seç"}
                        </button>
                        {timerBgCustomImage && (
                          <button
                            className="premium-button"
                            onClick={handleRemoveCustomTimerImage}
                            style={{ padding: "6px 10px", fontSize: "0.8rem", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                            title={(t as any).timerBgRemoveImage || "Görseli Kaldır"}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", lineHeight: 1.4 }}>
                      {(t as any).timerBgImageFileDesc || "Bilgisayarınızdan özel bir görsel (şirket logosu, mola afişi vb.) seçip arka plan yapmanızı sağlar."}
                    </span>
                  </div>
                )}

                {/* Scale to Screen Checkbox Row */}
                {(timerBgMode === "desktop" || timerBgMode === "image") && (
                  <div className="setting-row" style={{ borderBottom: "none", paddingTop: "4px", paddingBottom: "8px" }}>
                    <div className="setting-info">
                      <span className="setting-label">{(t as any).timerBgScaleOption || "Scale to screen"}</span>
                      <span className="setting-desc">{(t as any).timerBgScaleDesc || "Seçilen görselin çözünürlüğü ne olursa olsun ekranı tam kaplayacak şekilde ölçeklenmesini sağlar."}</span>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={timerBgScale}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setTimerBgScale(checked);
                          localStorage.setItem("timerBgScale", String(checked));
                          window.dispatchEvent(new Event("storage"));
                          emit("timer-settings-updated").catch(() => {});
                        }}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                )}
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
                {/* Dual Choice Audio Source Switch */}
                <div className="setting-row" style={{ borderBottom: "none", paddingBottom: "12px" }}>
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).timerSoundSourceLabel || "Ses Kaynağı"}</span>
                    <span className="setting-desc">{(t as any).timerSoundDesc}</span>
                  </div>
                  <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.05)", padding: "3px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                    <button
                      onClick={() => {
                        setTimerSoundSource("preset");
                        localStorage.setItem("timerSoundSource", "preset");
                        const lastPreset = localStorage.getItem("lastTimerSoundPreset") || (timerSoundPreset === "custom" ? "chime" : timerSoundPreset);
                        setTimerSoundPreset(lastPreset);
                        localStorage.setItem("timerSoundPreset", lastPreset);
                        window.dispatchEvent(new Event("storage"));
                        playTimerSound(lastPreset);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 14px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        borderRadius: "7px",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        background: timerSoundSource === "preset" ? "var(--accent-color, #38bdf8)" : "transparent",
                        color: timerSoundSource === "preset" ? "#090d16" : "var(--text-secondary)",
                        boxShadow: timerSoundSource === "preset" ? "0 2px 8px rgba(56, 189, 248, 0.3)" : "none"
                      }}
                    >
                      <Bell size={15} color={timerSoundSource === "preset" ? "#090d16" : "#38bdf8"} />
                      {(t as any).timerSoundSourcePreset || "Hazır Melodiler"}
                    </button>
                    <button
                      onClick={() => {
                        setTimerSoundSource("custom");
                        localStorage.setItem("timerSoundSource", "custom");
                        if (timerSoundPreset !== "custom") {
                          localStorage.setItem("lastTimerSoundPreset", timerSoundPreset);
                        }
                        setTimerSoundPreset("custom");
                        localStorage.setItem("timerSoundPreset", "custom");
                        window.dispatchEvent(new Event("storage"));
                        playTimerSound("custom");
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 14px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        borderRadius: "7px",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        background: timerSoundSource === "custom" ? "var(--accent-color, #38bdf8)" : "transparent",
                        color: timerSoundSource === "custom" ? "#090d16" : "var(--text-secondary)",
                        boxShadow: timerSoundSource === "custom" ? "0 2px 8px rgba(56, 189, 248, 0.3)" : "none"
                      }}
                    >
                      <FileAudio size={15} color={timerSoundSource === "custom" ? "#090d16" : "#38bdf8"} />
                      {(t as any).timerSoundSourceCustom || "Özel Ses Dosyası"}
                    </button>
                  </div>
                </div>

                {/* Option A: System Sound Presets Dropdown */}
                {timerSoundSource === "preset" && (
                  <div className="setting-row" style={{ borderBottom: "none", paddingBottom: 0, marginTop: "4px" }}>
                    <div className="setting-info">
                      <span className="setting-label">{(t as any).timerSoundLabel || "Bitiş Zili Melodisi"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", flex: "1 1 50%" }}>
                      <select
                        className="premium-input"
                        value={timerSoundPreset === "custom" ? "chime" : timerSoundPreset}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTimerSoundPreset(val);
                          localStorage.setItem("timerSoundPreset", val);
                          localStorage.setItem("lastTimerSoundPreset", val);
                          window.dispatchEvent(new Event("storage"));
                          playTimerSound(val);
                        }}
                        style={{ width: "180px" }}
                      >
                        <option value="chime">{(t as any).timerSoundChime}</option>
                        <option value="digital">{(t as any).timerSoundDigital}</option>
                        <option value="bell">{(t as any).timerSoundBell}</option>
                        <option value="classic">{(t as any).timerSoundClassic}</option>
                      </select>
                      <button
                        className="premium-button"
                        onClick={() => playTimerSound(timerSoundPreset === "custom" ? "chime" : timerSoundPreset)}
                        style={{ padding: "6px 12px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                        title={(t as any).timerTestSoundHint || "Seçilen zil sesini test et"}
                      >
                        <Volume2 size={14} />
                        {(t as any).timerTestSound || "Sesi Dinle"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Option B: Custom Audio File Upload Card */}
                {timerSoundSource === "custom" && (
                  <div style={{ background: "rgba(255, 255, 255, 0.03)", borderRadius: "12px", padding: "14px 16px", marginTop: "4px", border: "1px solid rgba(255, 255, 255, 0.08)", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden", flex: "1 1 auto" }}>
                        <Music size={18} color="#38bdf8" />
                        <span style={{ fontSize: "0.85rem", color: timerCustomAudioName ? "#f8fafc" : "var(--text-secondary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "260px" }}>
                          {timerCustomAudioName || ((t as any).timerNoCustomSoundSelected || "Henüz özel ses dosyası seçilmedi")}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="file"
                          ref={customAudioInputRef}
                          accept="audio/*"
                          onChange={handleCustomAudioUpload}
                          style={{ display: "none" }}
                        />
                        <button
                          className="premium-button"
                          onClick={() => customAudioInputRef.current?.click()}
                          style={{ padding: "6px 12px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                        >
                          <Upload size={14} />
                          {(t as any).timerCustomSoundSelect || "Ses Dosyası Seç"}
                        </button>
                        {timerCustomAudioName && (
                          <button
                            className="premium-button"
                            onClick={handleRemoveCustomAudio}
                            style={{ padding: "6px 10px", fontSize: "0.8rem", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                            title="Özel sesi kaldır"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <button
                          className="premium-button"
                          onClick={() => playTimerSound("custom")}
                          style={{ padding: "6px 12px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                          title={(t as any).timerTestSoundHint || "Seçilen zil sesini test et"}
                        >
                          <Volume2 size={14} />
                          {(t as any).timerTestSound || "Sesi Dinle"}
                        </button>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", lineHeight: 1.4 }}>
                      {(t as any).timerCustomSoundDesc}
                    </span>
                  </div>
                )}

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

                {/* Timer Opacity Slider Row */}
                <div className="setting-row" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "14px", marginTop: "12px" }}>
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).timerOpacityLabel}</span>
                    <span className="setting-desc">{(t as any).timerOpacityDesc}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      step="5"
                      value={timerOpacity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTimerOpacity(val);
                        localStorage.setItem("timerOpacity", String(val));
                        window.dispatchEvent(new Event("storage"));
                      }}
                      style={{ width: "130px", accentColor: "#38bdf8", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "monospace", color: "#38bdf8", minWidth: "42px", textAlign: "right" }}>
                      {timerOpacity}%
                    </span>
                  </div>
                </div>

                {/* 9-Point Screen Grid Alignment Row */}
                <div className="setting-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "14px", marginTop: "12px" }}>
                  <div className="setting-info" style={{ width: "100%" }}>
                    <span className="setting-label">{(t as any).timerPositionLabel}</span>
                    <span className="setting-desc" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>
                      {(t as any).timerPositionDesc}
                    </span>
                  </div>

                  <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: "4px" }}>
                    {/* 3x3 Grid Selector Box */}
                    <div style={{
                      width: "100%",
                      maxWidth: "280px",
                      aspectRatio: "16 / 10",
                      background: "rgba(15, 23, 42, 0.6)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "12px",
                      padding: "10px",
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gridTemplateRows: "repeat(3, 1fr)",
                      gap: "8px",
                      boxShadow: "inset 0 0 20px rgba(0,0,0,0.4)"
                    }}>
                      {[
                        { id: "top-left", label: "Sol Üst" },
                        { id: "top-center", label: "Üst Orta" },
                        { id: "top-right", label: "Sağ Üst" },
                        { id: "center-left", label: "Sol Orta" },
                        { id: "center", label: "Tam Orta" },
                        { id: "center-right", label: "Sağ Orta" },
                        { id: "bottom-left", label: "Sol Alt" },
                        { id: "bottom-center", label: "Alt Orta" },
                        { id: "bottom-right", label: "Sağ Alt" }
                      ].map((pos) => {
                        const isActive = timerPosition === pos.id;
                        return (
                          <button
                            key={pos.id}
                            onClick={() => {
                              setTimerPosition(pos.id);
                              localStorage.setItem("timerPosition", pos.id);
                              window.dispatchEvent(new Event("storage"));
                            }}
                            title={pos.label}
                            style={{
                              borderRadius: "8px",
                              border: isActive ? "2px solid #38bdf8" : "1px dashed rgba(255, 255, 255, 0.15)",
                              background: isActive ? "rgba(56, 189, 248, 0.25)" : "rgba(255, 255, 255, 0.02)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.2s ease",
                              boxShadow: isActive ? "0 0 12px rgba(56, 189, 248, 0.4)" : "none"
                            }}
                          >
                            <div style={{
                              width: isActive ? "12px" : "6px",
                              height: isActive ? "12px" : "6px",
                              borderRadius: "50%",
                              background: isActive ? "#38bdf8" : "rgba(255, 255, 255, 0.3)",
                              boxShadow: isActive ? "0 0 8px #38bdf8" : "none",
                              transition: "all 0.2s ease"
                            }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Break Timer Quick Shortcuts Card */}
            <div data-tour="setting-timer-shortcuts" style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px", marginTop: "8px" }}>
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
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>Q</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "record" && (
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
            {/* SOL KOLON: Form elemanları, dropdown'lar, renk paleti ve yazı tipi ayarları */}
            <div style={{ flex: "1 1 0%", minWidth: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Kart 1: Kayıt ve Kısayol Ayarları */}
              <div className="settings-card">
                <div className="setting-row" data-tour="shortcut-record">
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

                <div className="setting-row" data-tour="shortcut-pause-record">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).shortcutPauseRecord || "Kaydı Duraklat/Devam Et Kısayolu"}</span>
                    <span className="setting-desc">{(t as any).shortcutPauseRecordDesc || "Aktif ekran kaydını duraklatmak veya devam ettirmek için kısayol."}</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                      className={`shortcut-badge customizable ${recordingType === "pause_record" ? "recording" : ""}`}
                      onClick={() => setRecordingType(recordingType === "pause_record" ? null : "pause_record")}
                      title={t.shortcutChangeHint}
                      style={{
                        cursor: "pointer",
                        border: recordingType === "pause_record" ? "1px solid var(--accent-cyan)" : "1px solid rgba(255, 255, 255, 0.1)",
                        background: recordingType === "pause_record" ? "rgba(0, 242, 254, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        color: recordingType === "pause_record" ? "var(--accent-cyan)" : "white",
                        fontWeight: 600,
                        animation: recordingType === "pause_record" ? "pulse-border 1.5s infinite" : "none",
                        outline: "none",
                        minWidth: "100px",
                        textAlign: "center"
                      }}
                    >
                      {recordingType === "pause_record" ? t.shortcutPressKeys : formatShortcut(pauseRecordShortcut)}
                    </button>
                  </div>
                </div>

                <div className="setting-row" data-tour="shortcut-webcam">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).shortcutWebcam || "Kamera Aç/Kapat Kısayolu"}</span>
                    <span className="setting-desc">{(t as any).shortcutWebcamDesc || "Kayıt sırasında kameranızı açıp kapatmak için kısayol."}</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                      className={`shortcut-badge customizable ${recordingType === "webcam" ? "recording" : ""}`}
                      onClick={() => setRecordingType(recordingType === "webcam" ? null : "webcam")}
                      title={t.shortcutChangeHint}
                      style={{
                        cursor: "pointer",
                        border: recordingType === "webcam" ? "1px solid var(--accent-cyan)" : "1px solid rgba(255, 255, 255, 0.1)",
                        background: recordingType === "webcam" ? "rgba(0, 242, 254, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        color: recordingType === "webcam" ? "var(--accent-cyan)" : "white",
                        fontWeight: 600,
                        animation: recordingType === "webcam" ? "pulse-border 1.5s infinite" : "none",
                        outline: "none",
                        minWidth: "100px",
                        textAlign: "center"
                      }}
                    >
                      {recordingType === "webcam" ? t.shortcutPressKeys : formatShortcut(webcamShortcut)}
                    </button>
                  </div>
                </div>

                <div className="setting-row" data-tour="shortcut-mic">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).shortcutMic || "Mikrofon Aç/Kapat Kısayolu"}</span>
                    <span className="setting-desc">{(t as any).shortcutMicDesc || "Kayıt sırasında mikrofonunuzu açıp kapatmak için kısayol."}</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                      className={`shortcut-badge customizable ${recordingType === "mic" ? "recording" : ""}`}
                      onClick={() => setRecordingType(recordingType === "mic" ? null : "mic")}
                      title={t.shortcutChangeHint}
                      style={{
                        cursor: "pointer",
                        border: recordingType === "mic" ? "1px solid var(--accent-cyan)" : "1px solid rgba(255, 255, 255, 0.1)",
                        background: recordingType === "mic" ? "rgba(0, 242, 254, 0.15)" : "rgba(255, 255, 255, 0.05)",
                        color: recordingType === "mic" ? "var(--accent-cyan)" : "white",
                        fontWeight: 600,
                        animation: recordingType === "mic" ? "pulse-border 1.5s infinite" : "none",
                        outline: "none",
                        minWidth: "100px",
                        textAlign: "center"
                      }}
                    >
                      {recordingType === "mic" ? t.shortcutPressKeys : formatShortcut(micShortcut)}
                    </button>
                  </div>
                </div>

                <div className="setting-row" data-tour="setting-record-fps">
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

                <div className="setting-row" data-tour="setting-record-audio">
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

                <div className="setting-row" data-tour="setting-record-mic">
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
                        window.dispatchEvent(new Event("storage"));
                        emit("force_storage_sync").catch(console.error);
                      }}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-row" data-tour="setting-record-webcam">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).recordWebcamLabel || "Kamerayı Kaydet"}</span>
                    <span className="setting-desc">{(t as any).recordWebcamDesc || "Ekran kaydı alırken kamera görüntünüzü de kaydedin."}</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={recordWebcam}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setRecordWebcam(checked);
                        localStorage.setItem("recordWebcam", checked.toString());
                        window.dispatchEvent(new Event("storage"));
                        emit("force_storage_sync").catch(console.error);
                      }}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-row" data-tour="setting-record-controls">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).showRecordControlsLabel || "Kayıt Kontrolcüsünü Göster"}</span>
                    <span className="setting-desc">{(t as any).showRecordControlsDesc || "Kayıt sırasında duraklatma ve durdurma çubuğunu ekranda gösterin."}</span>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={showRecordControls}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setShowRecordControls(checked);
                        localStorage.setItem("showRecordControls", checked.toString());
                        window.dispatchEvent(new Event("storage"));
                        emit("force_storage_sync").catch(console.error);
                      }}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-row" data-tour="setting-webcam-permission">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).webcamPermissionMode || "Kamera İzin Modu"}</span>
                    <span className="setting-desc">{(t as any).webcamPermissionModeDesc || "Kamera açılırken gösterilecek izin arayüzünün davranışını belirleyin."}</span>
                  </div>
                  <select
                    className="premium-input"
                    value={webcamPermissionMode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWebcamPermissionMode(val);
                      localStorage.setItem("webcamPermissionMode", val);
                      if (val === "always") {
                        localStorage.removeItem("webcamHasAllowed");
                      }
                      window.dispatchEvent(new Event("storage"));
                    }}
                    style={{ width: "180px" }}
                  >
                    <option value="once">{(t as any).webcamPermissionOnce || "Sadece İlk Seferde Sor"}</option>
                    <option value="always">{(t as any).webcamPermissionAlways || "Her Defasında Sor"}</option>
                  </select>
                </div>

                <div className="setting-row" data-tour="setting-audio-ducking" style={{ paddingTop: "12px", marginTop: "4px", borderTop: "1px dashed rgba(255, 255, 255, 0.08)" }}>
                  <div className="setting-info">
                    <span className="setting-label" style={{ color: "#fbbf24" }}>{(t as any).fixAudioDucking || "Sistem Sesi Kısılmasını Önle"}</span>
                    <span className="setting-desc">{(t as any).fixAudioDuckingDesc || "Mikrofon açıldığında Windows'un diğer sesleri (video/müzik) %80 kısmasını (Ducking) engeller."}</span>
                  </div>
                  <button
                    className="premium-button"
                    style={{ fontSize: "0.8rem", padding: "6px 14px", background: "linear-gradient(135deg, #f59e0b, #d97706)", whiteSpace: "nowrap" }}
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
              </div>

              {/* Kart 2: Kamera & Tasarım Özelleştirme */}
              <div className="settings-card">
                <div className="setting-info" style={{ marginBottom: "6px" }}>
                  <span className="setting-label" style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-cyan)" }}>
                    <Camera size={18} color="var(--accent-cyan)" />
                    {(t as any).webcamStyleSectionTitle || "Kamera & Tasarım Özelleştirme"}
                  </span>
                  <span className="setting-desc">{(t as any).webcamStyleSectionDesc || "Kamera çerçevesi, metin, renk paletleri ve animasyon tercihlerinizi ayarlayın."}</span>
                </div>

                {/* Webcam Mode */}
                <div className="setting-row" data-tour="setting-webcam-mode">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).webcamModeLabel || "Kamera Modu"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {webcamMode === "image" && (
                      <button
                        className="premium-button secondary"
                        style={{ padding: "6px 12px", fontSize: "0.8rem", gap: "6px", whiteSpace: "nowrap" }}
                        onClick={async () => {
                          try {
                            const path = await invoke<string | null>("select_image");
                            if (path) {
                              setWebcamImagePath(path);
                              localStorage.setItem("webcamImagePath", path);
                              window.dispatchEvent(new Event("storage"));
                            }
                          } catch (err) {
                            console.error("Görsel seçilemedi", err);
                          }
                        }}
                      >
                        <FolderOpen size={14} />
                        {(t as any).webcamImageSelect || "Görsel Seç"}
                      </button>
                    )}
                    <select
                      className="premium-input"
                      value={webcamMode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWebcamMode(val);
                        localStorage.setItem("webcamMode", val);
                        window.dispatchEvent(new Event("storage"));
                      }}
                      style={{ width: "240px", padding: "8px 12px" }}
                    >
                      <option value="camera">{(t as any).webcamModeCamera || "Canlı Kamera"}</option>
                      <option value="image">{(t as any).webcamModeImage || "Sabit Görsel"}</option>
                    </select>
                  </div>
                </div>

                {/* Webcam Border Color */}
                <div className="setting-row" data-tour="setting-webcam-border-color">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).webcamBorderColorLabel || "Kamera Çerçeve Rengi"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", flex: "1 1 50%" }}>
                    {["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          setWebcamBorderColor(color);
                          localStorage.setItem("webcamBorderColor", color);
                          window.dispatchEvent(new Event("storage"));
                        }}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: color,
                          border: webcamBorderColor === color ? "2px solid #ffffff" : "2px solid transparent",
                          cursor: "pointer",
                          boxShadow: webcamBorderColor === color ? `0 0 10px ${color}` : "none",
                          transition: "all 0.2s ease"
                        }}
                      />
                    ))}
                    <div
                      onClick={() => {
                        const isPreset = ["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].includes(webcamBorderColor);
                        if (isPreset) {
                          const activeCustom = customWebcamBorderColor || "#06b6d4";
                          setWebcamBorderColor(activeCustom);
                          localStorage.setItem("webcamBorderColor", activeCustom);
                          window.dispatchEvent(new Event("storage"));
                        }
                      }}
                      style={{
                        position: "relative",
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: ["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].includes(webcamBorderColor)
                          ? customWebcamBorderColor
                          : webcamBorderColor,
                        border: !["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].includes(webcamBorderColor)
                          ? "2px solid #ffffff"
                          : "2px solid transparent",
                        boxShadow: !["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].includes(webcamBorderColor)
                          ? `0 0 10px ${webcamBorderColor}`
                          : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      title={(t as any).webcamPickCustomColor || "Özel Renk Seç"}
                    >
                      <input
                        type="color"
                        value={customWebcamBorderColor.startsWith("#") && customWebcamBorderColor.length === 7 ? customWebcamBorderColor : "#06b6d4"}
                        onClick={() => {
                          const activeCustom = customWebcamBorderColor || "#06b6d4";
                          setWebcamBorderColor(activeCustom);
                          localStorage.setItem("webcamBorderColor", activeCustom);
                          window.dispatchEvent(new Event("storage"));
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomWebcamBorderColor(val);
                          setWebcamBorderColor(val);
                          localStorage.setItem("customWebcamBorderColor", val);
                          localStorage.setItem("webcamBorderColor", val);
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

                    <input
                      type="text"
                      className="premium-input"
                      value={webcamBorderColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWebcamBorderColor(val);
                        if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
                          if (!["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].includes(val)) {
                            setCustomWebcamBorderColor(val);
                            localStorage.setItem("customWebcamBorderColor", val);
                          }
                          localStorage.setItem("webcamBorderColor", val);
                          window.dispatchEvent(new Event("storage"));
                        }
                      }}
                      placeholder="#38BDF8"
                      style={{
                        width: "100px",
                        padding: "8px 10px",
                        fontSize: "0.9rem",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        textAlign: "center"
                      }}
                    />
                  </div>
                </div>

                {/* Webcam Border Animation */}
                <div className="setting-row" data-tour="setting-webcam-style">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).webcamBorderStyleLabel || "Çerçeve Stili"}</span>
                    <span className="setting-desc">{(t as any).webcamBorderStyleDesc || "Kamera çerçevesi için animasyon veya renk efekti seçin."}</span>
                  </div>
                  <select
                    className="premium-input"
                    value={webcamBorderAnimation}
                    onChange={(e) => {
                      setWebcamBorderAnimation(e.target.value);
                      localStorage.setItem("webcamBorderAnimation", e.target.value);
                      window.dispatchEvent(new Event("storage"));
                    }}
                    style={{ width: "240px" }}
                  >
                    <option value="solid">{(t as any).animSolid || "Sabit Renk"}</option>
                    <option value="pulse">{(t as any).animPulse || "Yanıp Sönen"}</option>
                    <option value="breathe">{(t as any).animBreathe || "Nefes Alan"}</option>
                    <option value="spin-rainbow">{(t as any).animSpinRainbow || "Gökkuşağı Dönüşü"}</option>
                    <option value="spin-ocean">{(t as any).animSpinOcean || "Okyanus Dalgası"}</option>
                    <option value="spin-fire">{(t as any).animSpinFire || "Ateş Çemberi"}</option>
                    <option value="spin-cyber">{(t as any).animSpinCyber || "Neon Siber"}</option>
                  </select>
                </div>

                {/* Webcam Text */}
                <div className="setting-row" data-tour="setting-webcam-text">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).webcamTextLabel || "Kamera Altı Yazısı"}</span>
                    <span className="setting-desc">{(t as any).webcamTextDesc || "Kameranın altında görünecek özel bir metin ekleyin (Kanal adı vb.)."}</span>
                  </div>
                  <input
                    type="text"
                    className="premium-input"
                    value={webcamText}
                    onChange={(e) => setWebcamText(e.target.value)}
                    placeholder="Örn: Shotera"
                    style={{ width: "240px", fontSize: "0.9rem" }}
                    maxLength={30}
                  />
                </div>

                {/* Webcam Font */}
                <div className="setting-row" data-tour="setting-webcam-font">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).webcamTextFontOnlyLabel || "Yazı Tipi"}</span>
                    <span className="setting-desc">{(t as any).webcamTextFontOnlyDesc || "Kamera altındaki metnin yazı tipini (font) seçin."}</span>
                  </div>
                  <div style={{ width: "240px" }}>
                    <FontSelect
                      value={webcamTextFont}
                      onChange={setWebcamTextFont}
                      placeholder={(t as any).webcamFontSelectPlaceholder || "Font seç..."}
                      searchPlaceholder={(t as any).webcamFontSearchPlaceholder || "Font ara..."}
                    />
                  </div>
                </div>

                {/* Webcam Font Size */}
                <div className="setting-row" data-tour="setting-webcam-font-size">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).webcamTextSizeLabel || "Yazı Boyutu"}</span>
                    <span className="setting-desc">{(t as any).webcamTextSizeDesc || "Kamera altındaki metnin boyutunu ayarlayın."}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "240px", justifyContent: "flex-end" }}>
                    <input
                      type="range"
                      min="8"
                      max="24"
                      value={webcamTextSize}
                      onChange={(e) => setWebcamTextSize(Number(e.target.value))}
                      style={{ flex: 1, accentColor: "var(--accent-cyan)", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: "monospace", minWidth: "32px", textAlign: "right", color: "var(--accent-cyan)" }}>{webcamTextSize}px</span>
                  </div>
                </div>

                {/* Webcam Text Color */}
                <div className="setting-row" data-tour="setting-webcam-text-color">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).webcamTextColorOnlyLabel || "Yazı Rengi"}</span>
                    <span className="setting-desc">{(t as any).webcamTextColorOnlyDesc || "Kamera yazısının rengini belirleyin."}</span>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      {["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setWebcamTextColor(color);
                            localStorage.setItem("webcamTextColor", color);
                            window.dispatchEvent(new Event("storage"));
                          }}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: color,
                            border: webcamTextColor === color ? "2px solid #ffffff" : "2px solid transparent",
                            cursor: "pointer",
                            boxShadow: webcamTextColor === color ? `0 0 10px ${color}` : "none",
                            transition: "all 0.2s ease"
                          }}
                        />
                      ))}

                      <div
                        onClick={() => {
                          const isPreset = ["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].includes(webcamTextColor);
                          if (isPreset) {
                            const activeCustom = customWebcamTextColor || "#ffffff";
                            setWebcamTextColor(activeCustom);
                            localStorage.setItem("webcamTextColor", activeCustom);
                            window.dispatchEvent(new Event("storage"));
                          }
                        }}
                        style={{
                          position: "relative",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: ["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].includes(webcamTextColor)
                            ? customWebcamTextColor
                            : webcamTextColor,
                          border: !["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].includes(webcamTextColor)
                            ? "2px solid #ffffff"
                            : "2px solid transparent",
                          boxShadow: !["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].includes(webcamTextColor)
                            ? `0 0 10px ${webcamTextColor}`
                            : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                        title={(t as any).webcamPickTextColor || "Yazı Rengi Seç"}
                      >
                        <input
                          type="color"
                          value={customWebcamTextColor.startsWith("#") && customWebcamTextColor.length === 7 ? customWebcamTextColor : "#ffffff"}
                          onClick={() => {
                            const activeCustom = customWebcamTextColor || "#ffffff";
                            setWebcamTextColor(activeCustom);
                            localStorage.setItem("webcamTextColor", activeCustom);
                            window.dispatchEvent(new Event("storage"));
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomWebcamTextColor(val);
                            setWebcamTextColor(val);
                            localStorage.setItem("customWebcamTextColor", val);
                            localStorage.setItem("webcamTextColor", val);
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
                        <span style={{ fontSize: "11px", color: "white", fontWeight: "bold", pointerEvents: "none", lineHeight: 1, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>+</span>
                      </div>
                    </div>

                    <input
                      type="text"
                      className="premium-input"
                      value={webcamTextColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWebcamTextColor(val);
                        if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
                          if (!["#38bdf8", "#ef4444", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#ffffff", "#f97316"].includes(val)) {
                            setCustomWebcamTextColor(val);
                            localStorage.setItem("customWebcamTextColor", val);
                          }
                          localStorage.setItem("webcamTextColor", val);
                          window.dispatchEvent(new Event("storage"));
                        }
                      }}
                      placeholder="#FFFFFF"
                      style={{
                        width: "100px",
                        padding: "8px 10px",
                        fontSize: "0.9rem",
                        fontFamily: "monospace",
                        textTransform: "uppercase",
                        textAlign: "center"
                      }}
                    />
                  </div>
                </div>

                {/* Webcam Text Animation */}
                <div className="setting-row" data-tour="setting-webcam-text-style">
                  <div className="setting-info">
                    <span className="setting-label">{(t as any).webcamTextStyleLabel || "Yazı Stili"}</span>
                    <span className="setting-desc">{(t as any).webcamTextStyleDesc || "Kamera yazısı için animasyon veya renk efekti seçin."}</span>
                  </div>
                  <select
                    className="premium-input"
                    value={webcamTextAnimation}
                    onChange={(e) => {
                      setWebcamTextAnimation(e.target.value);
                      localStorage.setItem("webcamTextAnimation", e.target.value);
                      window.dispatchEvent(new Event("storage"));
                    }}
                    style={{ width: "240px" }}
                  >
                    <option value="solid">{(t as any).animSolid || "Sabit Renk"}</option>
                    <option value="pulse">{(t as any).animPulse || "Yanıp Sönen"}</option>
                    <option value="breathe">{(t as any).animBreathe || "Nefes Alan"}</option>
                    <option value="spin-rainbow">{(t as any).animSpinRainbow || "Gökkuşağı Dönüşü"}</option>
                    <option value="spin-ocean">{(t as any).animSpinOcean || "Okyanus Dalgası"}</option>
                    <option value="spin-fire">{(t as any).animSpinFire || "Ateş Çemberi"}</option>
                    <option value="spin-cyber">{(t as any).animSpinCyber || "Neon Siber"}</option>
                  </select>
                </div>
              </div>

              {/* Kart 3: Kayıt İçi Kontroller ve Kısayollar Rehberi */}
              <div className="settings-card" data-tour="setting-record-shortcuts-card" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="setting-info">
                  <span className="setting-label">{(t as any).webcamControlsTitle || "Kayıt İçi Kontroller ve Kısayollar"}</span>
                  <span className="setting-desc">{(t as any).webcamControlsDesc || "Ekran kaydı sırasında kamera, mikrofon ve temel özellikleri yönetin."}</span>
                </div>

                <div className="responsive-shortcut-grid">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                      <ZoomIn size={15} color="#38bdf8" />
                      {(t as any).webcamResizeLabel || "Boyutlandır"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 6px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>{(t as any).badgeWheel || "Tekerlek"}</kbd>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                      <Camera size={15} color="#10b981" />
                      {(t as any).webcamMoveLabel || "Sürükle"}
                    </span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 8px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>{(t as any).badgeLeftClick || "Sol Tık"}</kbd>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)", gridColumn: "1 / -1" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                      <Square size={15} color="#ef4444" />
                      {(t as any).webcamExitLabel || "Çıkış (Kaydı Durdur)"}
                    </span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 8px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>
                      {formatShortcut(recordShortcut) || "Ctrl+5"}
                    </kbd>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)", gridColumn: "1 / -1" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                      <Play size={15} color="#eab308" />
                      {(t as any).shortcutPauseRecord || "Kaydı Duraklat/Devam Et Kısayolu"}
                    </span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 8px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>
                      {formatShortcut(pauseRecordShortcut) || "Ctrl+6"}
                    </kbd>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)", gridColumn: "1 / -1" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                      <Camera size={15} color="var(--accent-cyan)" />
                      {(t as any).shortcutWebcam || "Kamera Aç/Kapat Kısayolu"}
                    </span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 8px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>
                      {formatShortcut(webcamShortcut) || "Ctrl+7"}
                    </kbd>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.02)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)", gridColumn: "1 / -1" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
                      <Mic size={15} color="var(--accent-cyan)" />
                      {(t as any).shortcutMic || "Mikrofon Aç/Kapat Kısayolu"}
                    </span>
                    <kbd style={{ background: "rgba(255, 255, 255, 0.12)", border: "1px solid rgba(255, 255, 255, 0.25)", borderRadius: "4px", padding: "1px 8px", fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "#ffffff" }}>
                      {formatShortcut(micShortcut) || "Ctrl+8"}
                    </kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* SAĞ KOLON (Sabit Panel): Canlı Önizleme Alanı (Preview) */}
            <div
              style={{
                width: "320px",
                flex: "0 0 320px",
                position: "sticky",
                top: "0px",
                display: "flex",
                flexDirection: "column",
                gap: "16px"
              }}
            >
              <div className="settings-card" data-tour="setting-webcam-preview" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
                {/* Panel Başlığı */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkles size={16} color="var(--accent-cyan)" />
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>
                      {(t as any).webcamPreviewLabel || "Canlı Önizleme"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0, 242, 254, 0.1)", padding: "3px 8px", borderRadius: "12px", border: "1px solid rgba(0, 242, 254, 0.2)" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-cyan)", boxShadow: "0 0 6px var(--accent-cyan)", animation: "breathe-border 2s infinite" }} />
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent-cyan)", letterSpacing: "0.5px" }}>LIVE</span>
                  </div>
                </div>

                {/* Canlı Kamera / Logo Ekran Mockup'ı */}
                <div style={{
                  width: "100%",
                  height: "230px",
                  background: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  boxShadow: "inset 0 0 30px rgba(0,0,0,0.8)"
                }}>
                  {/* Ekran Ağı / Izgara Deseni */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                    opacity: 0.5,
                    pointerEvents: "none"
                  }} />

                  {/* Köşe Nişangah İşaretleri */}
                  <div style={{ position: "absolute", top: "10px", left: "10px", width: "10px", height: "10px", borderTop: "2px solid rgba(255,255,255,0.2)", borderLeft: "2px solid rgba(255,255,255,0.2)" }} />
                  <div style={{ position: "absolute", top: "10px", right: "10px", width: "10px", height: "10px", borderTop: "2px solid rgba(255,255,255,0.2)", borderRight: "2px solid rgba(255,255,255,0.2)" }} />
                  <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "10px", height: "10px", borderBottom: "2px solid rgba(255,255,255,0.2)", borderLeft: "2px solid rgba(255,255,255,0.2)" }} />
                  <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "10px", height: "10px", borderBottom: "2px solid rgba(255,255,255,0.2)", borderRight: "2px solid rgba(255,255,255,0.2)" }} />

                  {/* CSS Stilleri (Animasyonlar) */}
                  <style>
                    {`
                      @keyframes webcam-logo-gif {
                        0% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 5px rgba(56,189,248,0.3)); }
                        25% { transform: scale(1.05) translateY(-2px); filter: drop-shadow(0 0 10px rgba(56,189,248,0.6)); }
                        50% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 15px rgba(56,189,248,0.8)); }
                        75% { transform: scale(0.95) translateY(2px); filter: drop-shadow(0 0 10px rgba(56,189,248,0.6)); }
                        100% { transform: scale(1) translateY(0); filter: drop-shadow(0 0 5px rgba(56,189,248,0.3)); }
                      }
                      .webcam-border-bg {
                         position: absolute;
                         inset: 0;
                         border-radius: 50%;
                         transition: all 0.3s ease;
                      }
                      .webcam-border-solid { background: ${webcamBorderColor}; }
                      .webcam-border-pulse { background: ${webcamBorderColor}; animation: pulse-border 2s infinite ease-in-out; }
                      .webcam-border-breathe { background: ${webcamBorderColor}; animation: breathe-border 3s infinite ease-in-out; }
                      .webcam-border-spin-rainbow { background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red); animation: spin-border 3s linear infinite; }
                      .webcam-border-spin-ocean { background: conic-gradient(#0ea5e9, #38bdf8, #0284c7, #0ea5e9); animation: spin-border 3s linear infinite; }
                      .webcam-border-spin-fire { background: conic-gradient(#ef4444, #f97316, #eab308, #ef4444); animation: spin-border 2s linear infinite; }
                      .webcam-border-spin-cyber { background: conic-gradient(#ec4899, #a855f7, #06b6d4, #ec4899); animation: spin-border 2.5s linear infinite; }
                      
                      @keyframes spin-border { 100% { transform: rotate(360deg); } }
                      @keyframes pulse-border { 0%, 100% { box-shadow: 0 0 5px ${webcamBorderColor}; } 50% { box-shadow: 0 0 20px ${webcamBorderColor}; } }
                      @keyframes breathe-border { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                      
                      .webcam-text-anim-solid { color: ${webcamTextColor}; }
                      .webcam-text-anim-pulse { color: ${webcamTextColor}; animation: pulse-text 2s infinite ease-in-out; }
                      .webcam-text-anim-breathe { color: ${webcamTextColor}; animation: breathe-border 3s infinite ease-in-out; }
                      .webcam-text-anim-spin-rainbow { background: linear-gradient(90deg, red, yellow, lime, aqua, blue, magenta, red); background-size: 200% auto; color: transparent; -webkit-background-clip: text; animation: text-gradient-spin 3s linear infinite; }
                      .webcam-text-anim-spin-ocean { background: linear-gradient(90deg, #0ea5e9, #38bdf8, #0284c7, #0ea5e9); background-size: 200% auto; color: transparent; -webkit-background-clip: text; animation: text-gradient-spin 3s linear infinite; }
                      .webcam-text-anim-spin-fire { background: linear-gradient(90deg, #ef4444, #f97316, #eab308, #ef4444); background-size: 200% auto; color: transparent; -webkit-background-clip: text; animation: text-gradient-spin 2s linear infinite; }
                      .webcam-text-anim-spin-cyber { background: linear-gradient(90deg, #ec4899, #a855f7, #06b6d4, #ec4899); background-size: 200% auto; color: transparent; -webkit-background-clip: text; animation: text-gradient-spin 2.5s linear infinite; }
                      
                      @keyframes text-gradient-spin { to { background-position: 200% center; } }
                      @keyframes pulse-text { 0%, 100% { text-shadow: 0 0 2px ${webcamTextColor}; } 50% { text-shadow: 0 0 10px ${webcamTextColor}; } }
                    `}
                  </style>

                  {/* Önizleme İçeriği */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "10px",
                    zIndex: 2
                  }}>
                    <div style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      padding: "3px",
                      boxSizing: "border-box",
                      position: "relative",
                      boxShadow: webcamBorderAnimation === 'solid' ? `0 0 18px ${webcamBorderColor}50` : 'none',
                      transition: "all 0.3s ease"
                    }}>
                      <div className={`webcam-border-bg webcam-border-${webcamBorderAnimation}`} />
                      <div style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: "rgba(15, 23, 42, 0.95)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        position: "relative",
                        zIndex: 1
                      }}>
                        <img
                          src={webcamMode === "image" && webcamImagePath ? convertFileSrc(webcamImagePath) : logo}
                          alt="Webcam Preview Animated"
                          style={{
                            width: webcamMode === "image" && webcamImagePath ? "100%" : "55%",
                            height: webcamMode === "image" && webcamImagePath ? "100%" : "55%",
                            objectFit: webcamMode === "image" && webcamImagePath ? "cover" : "contain",
                            animation: webcamMode === "image" && webcamImagePath ? "none" : "webcam-logo-gif 3.5s infinite ease-in-out"
                          }}
                        />
                        <div style={{ position: "absolute", bottom: "6px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.65)", borderRadius: "50%", padding: "4px", display: "flex" }}>
                          <Camera size={12} color={webcamBorderColor} style={{ transition: "color 0.3s ease" }} />
                        </div>
                      </div>
                    </div>

                    {webcamText.trim() && (
                      <div style={{
                        background: "rgba(0,0,0,0.75)",
                        backdropFilter: "blur(4px)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        maxWidth: "180px",
                        display: "flex"
                      }}>
                        <span className={`webcam-text-anim-${webcamTextAnimation}`} style={{
                          fontFamily: webcamTextFont === "sans" ? "sans-serif" : webcamTextFont === "serif" ? "serif" : webcamTextFont === "monospace" ? "monospace" : webcamTextFont,
                          fontSize: `${webcamTextSize}px`,
                          fontWeight: "bold",
                          textShadow: webcamTextAnimation.startsWith("spin-") ? "none" : (webcamTextAnimation === "pulse" ? undefined : "0 1px 3px rgba(0,0,0,0.8)"),
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textAlign: "center",
                          display: "block",
                          width: "100%"
                        }}>
                          {webcamText}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Anlık Durum Rozetleri */}
                <div style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.025)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  padding: "10px 12px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  fontSize: "0.78rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)" }}>
                    <Video size={13} color="#38bdf8" />
                    <span>{recordFps} FPS</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: recordWebcam ? "#4ade80" : "var(--text-muted)" }}>
                    <Camera size={13} color={recordWebcam ? "#4ade80" : "#64748b"} />
                    <span>{recordWebcam ? "Kamera Kaydı" : "Kamera Kapalı"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: recordMic ? "#4ade80" : "var(--text-muted)" }}>
                    <Mic size={13} color={recordMic ? "#4ade80" : "#64748b"} />
                    <span>{recordMic ? "Mikrofon Kaydı" : "Mikrofon Kapalı"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: recordAudio ? "#4ade80" : "var(--text-muted)" }}>
                    <Volume2 size={13} color={recordAudio ? "#4ade80" : "#64748b"} />
                    <span>{recordAudio ? "Sistem Ses Kaydı" : "Ses Kapalı"}</span>
                  </div>
                </div>

                {/* Hızlı Aksiyon Butonu */}
                <button
                  className="premium-button"
                  onClick={() => invoke("open_recorder_view")}
                  style={{ width: "100%", justifyContent: "center", padding: "10px 14px", fontSize: "0.88rem" }}
                >
                  <Video size={15} />
                  {(t as any).recordOpenBtn || "Kayıt Modunu Aç"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "about" && (

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Shotera Info Card */}
            <div className="settings-card" data-tour="setting-about-info" style={{ gap: "20px" }}>
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
              <div
                data-tour="setting-update-check"
                style={{
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
            <div className="settings-card" data-tour="setting-developer-info" style={{
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

      <FeatureTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onSelectTab={(tab) => setActiveTab(tab as any)}
      />
    </div>
  );
}

export default SettingsWindow;
