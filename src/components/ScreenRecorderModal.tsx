import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { Monitor, AppWindow, Video, X, Check, Square, Camera, Pause, Play, Eye, EyeOff, Mic, MicOff } from "lucide-react";
import { translations, getLanguage } from "../i18n";
import "./ScreenRecorderModal.css";

interface CaptureSource {
    id: string;
    name: string;
    source_type: "monitor" | "window";
    thumbnail: string | null;
}

interface ScreenRecorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    isStandalone?: boolean;
}

export default function ScreenRecorderModal({ isOpen, onClose, isStandalone }: ScreenRecorderModalProps) {
    const [sources, setSources] = useState<CaptureSource[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const isRecordingRef = useRef(false);
    const [activeTab, setActiveTab] = useState<"monitors" | "windows">("monitors");
    const [useWebcam, setUseWebcam] = useState(false);
    const useWebcamRef = useRef(false);
    const [isPaused, setIsPaused] = useState(false);
    const isPausedRef = useRef(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const isMicMutedRef = useRef(false);
    const [showControls, setShowControls] = useState(() => localStorage.getItem("showRecordControls") !== "false");
    const [recordingDuration, setRecordingDuration] = useState(0);
    const isOpenRef = useRef(isOpen);

    const t = translations[getLanguage()];

    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    useEffect(() => {
        let interval: number | null = null;
        if (isRecording && !isPaused) {
            interval = window.setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } else if (!isRecording) {
            setRecordingDuration(0);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRecording, isPaused]);

    const formatDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    useEffect(() => {
        if (isOpen) {
            const savedWebcam = localStorage.getItem("recordWebcam") === "true";
            const savedMic = localStorage.getItem("recordMic") === "true";
            setUseWebcam(savedWebcam);
            useWebcamRef.current = savedWebcam;
            setIsPaused(false);
            isPausedRef.current = false;
            setIsMicMuted(!savedMic);
            isMicMutedRef.current = !savedMic;
            if (savedWebcam) {
                invoke("toggle_webcam", { show: true }).catch(console.error);
            }
            loadSources();
        } else {
            setSources([]);
            setSelectedId(null);
            if (!isRecordingRef.current) {
                invoke("toggle_webcam", { show: false }).catch(console.error);
            }
        }
    }, [isOpen]);

    // Use a ref to always have the latest handleStopRecording function inside the event listener
    const handleStopRecordingRef = useRef<(() => Promise<void>) | null>(null);
    const handlePauseToggleRef = useRef<(() => Promise<void>) | null>(null);
    const handleWebcamToggleRef = useRef<(() => Promise<void>) | null>(null);
    const handleMicToggleRef = useRef<(() => Promise<void>) | null>(null);

    useEffect(() => {
        import("@tauri-apps/api/event").then(({ listen }) => {
            const unlistenOpened = listen("recorder-opened", () => {
                if (isOpen) {
                    loadSources();
                    if (useWebcamRef.current) {
                        invoke("toggle_webcam", { show: true }).catch(console.error);
                    }
                }
            });
            const unlistenShortcut = listen("recorder-shortcut-pressed", async () => {
                if (isRecordingRef.current && handleStopRecordingRef.current) {
                    await handleStopRecordingRef.current();
                } else {
                    // Replicate the X button close logic exactly to prevent transparent window artifacts
                    if (isStandalone) {
                        if (useWebcamRef.current) {
                            invoke("toggle_webcam", { show: false }).catch(console.error);
                        }
                        invoke("hide_recorder_window").catch(console.error);
                    } else {
                        onClose();
                    }
                }
            });
            const unlistenPause = listen("toggle-pause-recording", async () => {
                if (isRecordingRef.current && handlePauseToggleRef.current) {
                    await handlePauseToggleRef.current();
                }
            });
            const unlistenWebcam = listen("toggle-webcam-shortcut", async () => {
                if (isRecordingRef.current && handleWebcamToggleRef.current) {
                    await handleWebcamToggleRef.current();
                }
            });
            const unlistenMic = listen("toggle-mic-shortcut", async () => {
                if (isRecordingRef.current && handleMicToggleRef.current) {
                    await handleMicToggleRef.current();
                }
            });

            return () => {
                unlistenOpened.then(f => f());
                unlistenShortcut.then(f => f());
                unlistenPause.then(f => f());
                unlistenWebcam.then(f => f());
                unlistenMic.then(f => f());
            };
        });
    }, [isOpen, onClose]);

    useEffect(() => {
        const handleStorageChange = () => {
            const savedMic = localStorage.getItem("recordMic") === "true";
            const newMicMuted = !savedMic;
            if (isMicMutedRef.current !== newMicMuted) {
                setIsMicMuted(newMicMuted);
                isMicMutedRef.current = newMicMuted;
                const checkAndToggleMic = async () => {
                    let shouldToggle = isOpenRef.current || isRecordingRef.current;
                    if (isStandalone) {
                        try {
                            const { getCurrentWindow } = await import("@tauri-apps/api/window");
                            const visible = await getCurrentWindow().isVisible();
                            shouldToggle = visible || isRecordingRef.current;
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    if (shouldToggle) {
                        invoke("toggle_mic", { muted: newMicMuted }).catch(console.error);
                    }
                };
                checkAndToggleMic();
            }

            const savedWebcam = localStorage.getItem("recordWebcam") === "true";
            if (useWebcamRef.current !== savedWebcam) {
                setUseWebcam(savedWebcam);
                useWebcamRef.current = savedWebcam;
                const checkAndToggleWebcam = async () => {
                    let shouldToggle = isOpenRef.current || isRecordingRef.current;
                    if (isStandalone) {
                        try {
                            const { getCurrentWindow } = await import("@tauri-apps/api/window");
                            const visible = await getCurrentWindow().isVisible();
                            shouldToggle = visible || isRecordingRef.current;
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    if (shouldToggle) {
                        invoke("toggle_webcam", { show: savedWebcam }).catch(console.error);
                    }
                };
                checkAndToggleWebcam();
            }

            const savedShowControls = localStorage.getItem("showRecordControls") !== "false";
            setShowControls(savedShowControls);
        };
        window.addEventListener("storage", handleStorageChange);

        const unlistenForceSync = listen("force_storage_sync", () => {
            // Small delay to ensure WebView2 localStorage cache is synced across windows
            setTimeout(() => {
                handleStorageChange();
            }, 50);
        });

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            unlistenForceSync.then(f => f());
        };
    }, []);

    const loadSources = async () => {
        setLoading(true);
        try {
            const fetched = await invoke<CaptureSource[]>("get_capture_sources");
            setSources(fetched);
            if (fetched.length > 0) {
                setSelectedId(fetched[0].id);
            }
        } catch (error) {
            console.error("Failed to load capture sources", error);
        } finally {
            setLoading(false);
        }
    };

    // Workaround for Windows WASAPI Loopback Silence Deadlock
    // If no audio is playing, WASAPI stops sending packets, which deadlocks the recording engine when stopping.
    const audioKeepAliveRef = useRef<{ ctx: AudioContext, osc: OscillatorNode } | null>(null);

    const startAudioKeepAlive = () => {
        try {
            const ctx = new window.AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            gain.gain.value = 0.0001; // virtually silent
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            audioKeepAliveRef.current = { ctx, osc };
        } catch (e) {
            console.error("Failed to start audio keep-alive", e);
        }
    };

    const stopAudioKeepAlive = () => {
        if (audioKeepAliveRef.current) {
            try {
                audioKeepAliveRef.current.osc.stop();
                audioKeepAliveRef.current.ctx.close();
            } catch (e) {
                console.error("Failed to stop audio keep-alive", e);
            }
            audioKeepAliveRef.current = null;
        }
    };

    const handleStartRecording = async () => {
        if (!selectedId) return;

        const fps = Number(localStorage.getItem("recordFps")) || 30;
        const recordAudio = localStorage.getItem("recordAudio") !== "false";
        // ALWAYS pass true so the mic track is created and can be unmuted mid-recording
        const recordMic = true;
        const videoSavePath = localStorage.getItem("videoSavePath") || "";

        if (recordAudio) {
            startAudioKeepAlive();
        }

        setIsRecording(true);
        try {
            console.log("Starting native recording for:", selectedId);

            if (isStandalone) {
                if (showControls) {
                    await invoke("resize_recorder_window", { compact: true }).catch(console.error);
                } else {
                    await invoke("hide_recorder_window").catch(console.error);
                }
            }

            await invoke("start_native_recording", { sourceId: selectedId, fps, recordAudio, recordMic, videoSavePath });

            // If the user selected to start with mic muted, apply it immediately
            if (isMicMuted) {
                await invoke("toggle_mic", { muted: true }).catch(console.error);
            } else {
                await invoke("toggle_mic", { muted: false }).catch(console.error);
            }
        } catch (error) {
            console.error("Failed to start recording:", error);
            alert("Kayıt başlatılamadı:\n\n" + error);
            stopAudioKeepAlive();
            setIsRecording(false);
            if (isStandalone) {
                await invoke("resize_recorder_window", { compact: false }).catch(console.error);
            }
        }
    };

    const handleStopRecording = async () => {
        try {
            await invoke("stop_native_recording");
            console.log("Stopping native recording");
        } catch (error) {
            console.error("Failed to stop recording cleanly:", error);
            alert("Kayıt sonlandırılırken hata oluştu:\n\n" + error);
        } finally {
            stopAudioKeepAlive();
            setIsRecording(false);
            if (useWebcam) {
                invoke("toggle_webcam", { show: false }).catch(console.error);
            }
            if (isStandalone) {
                await invoke("hide_recorder_window").catch(console.error);
                setTimeout(() => {
                    invoke("resize_recorder_window", { compact: false }).catch(console.error);
                }, 300);
            } else {
                onClose();
            }
        }
    };

    const lastPauseToggleRef = useRef<number>(0);
    const lastWebcamToggleRef = useRef<number>(0);
    const lastMicToggleRef = useRef<number>(0);

    const handlePauseToggle = async () => {
        if (!isRecording) return;
        const now = Date.now();
        if (now - lastPauseToggleRef.current < 500) return;
        lastPauseToggleRef.current = now;

        try {
            const nextPaused = !isPausedRef.current;
            if (nextPaused) {
                await invoke("pause_native_recording");
            } else {
                await invoke("resume_native_recording");
            }
            setIsPaused(nextPaused);
            isPausedRef.current = nextPaused;
        } catch (error) {
            console.error("Failed to toggle pause:", error);
        }
    };

    const handleWebcamToggle = async () => {
        if (!isRecording) return;
        const now = Date.now();
        if (now - lastWebcamToggleRef.current < 500) return;
        lastWebcamToggleRef.current = now;

        try {
            const nextWebcam = !useWebcamRef.current;
            await invoke("toggle_webcam", { show: nextWebcam });
            setUseWebcam(nextWebcam);
            useWebcamRef.current = nextWebcam;

            // Sync with Settings window by updating localStorage
            localStorage.setItem("recordWebcam", nextWebcam.toString());
            window.dispatchEvent(new Event("storage"));
            emit("force_storage_sync").catch(console.error);
        } catch (error) {
            console.error("Failed to toggle webcam:", error);
        }
    };

    const handleMicToggle = async () => {
        if (!isRecording) return;
        const now = Date.now();
        if (now - lastMicToggleRef.current < 500) return;
        lastMicToggleRef.current = now;

        try {
            const nextMuted = !isMicMutedRef.current;
            await invoke("toggle_mic", { muted: nextMuted });
            setIsMicMuted(nextMuted);
            isMicMutedRef.current = nextMuted;

            // Sync with Settings window by updating localStorage
            localStorage.setItem("recordMic", (!nextMuted).toString());
            window.dispatchEvent(new Event("storage"));
            emit("force_storage_sync").catch(console.error);
        } catch (error) {
            console.error("Failed to toggle mic:", error);
        }
    };

    useEffect(() => {
        handleStopRecordingRef.current = handleStopRecording;
        handlePauseToggleRef.current = handlePauseToggle;
        handleWebcamToggleRef.current = handleWebcamToggle;
        handleMicToggleRef.current = handleMicToggle;
    }, [handleStopRecording, handlePauseToggle, handleWebcamToggle, handleMicToggle]);

    if (!isOpen) return null;

    if (isRecording) {
        return (
            <div
                style={{
                    width: "100vw",
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                    overflow: "visible"
                }}
                data-tauri-drag-region
            >
                <div
                    className="compact-recorder-bar"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "rgba(15, 23, 42, 0.88)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid rgba(255, 255, 255, 0.18)",
                        borderRadius: "30px",
                        padding: "6px 14px",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 242, 254, 0.15)",
                        boxSizing: "border-box"
                    }}
                    data-tauri-drag-region
                >
                    {/* Canlı Kayıt Noktası & Sayaç */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }} data-tauri-drag-region>
                        <div
                            style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                background: isPaused ? "#eab308" : "#ef4444",
                                boxShadow: isPaused ? "0 0 8px #eab308" : "0 0 8px #ef4444",
                                animation: isPaused ? "none" : "pulse-recording 1.5s infinite",
                                flexShrink: 0,
                                marginTop: "-1px"
                            }}
                        />
                        {isPaused && (
                            <span style={{ color: "#eab308", fontWeight: 600, fontSize: "0.75rem", lineHeight: 1 }} data-tauri-drag-region>
                                {(t as any).modalPaused || "Mola"}
                            </span>
                        )}
                        <span
                            style={{
                                fontFamily: "monospace",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                color: "#ffffff",
                                letterSpacing: "0.5px",
                                lineHeight: 1
                            }}
                            data-tauri-drag-region
                        >
                            {formatDuration(recordingDuration)}
                        </span>
                    </div>

                    {/* Dikey Ayrıştırıcı */}
                    <div style={{ width: "1px", height: "14px", background: "rgba(255, 255, 255, 0.15)" }} />

                    {/* 4 Adet Aksiyon Butonu */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {/* 1. Duraklat / Devam Et */}
                        <button
                            className="compact-bar-btn btn-pause"
                            onClick={handlePauseToggle}
                            data-tooltip={isPaused ? ((t as any).recordTooltipResume || "Devam Et") : ((t as any).recordTooltipPause || "Duraklat")}
                        >
                            {isPaused ? <Play size={11} color="#eab308" fill="#eab308" /> : <Pause size={11} color="#eab308" fill="#eab308" />}
                        </button>

                        {/* 2. Kaydı Durdur */}
                        <button
                            className="compact-bar-btn stop-btn"
                            onClick={handleStopRecording}
                            data-tooltip={(t as any).modalStopRecording || "Kaydı Durdur"}
                        >
                            <Square size={10} color="#ef4444" fill="#ef4444" />
                        </button>

                        {/* 3. Kamera */}
                        <button
                            className={`compact-bar-btn ${useWebcam ? 'btn-webcam-active' : 'btn-webcam-inactive'}`}
                            onClick={handleWebcamToggle}
                            data-tooltip={useWebcam ? ((t as any).recordTooltipWebcamHide || "Kamerayı Kapat") : ((t as any).recordTooltipWebcamShow || "Kamerayı Aç")}
                        >
                            <Camera size={11} color={useWebcam ? "#38bdf8" : "#64748b"} />
                        </button>

                        {/* 4. Mikrofon */}
                        <button
                            className={`compact-bar-btn ${!isMicMuted ? 'btn-mic-active' : 'btn-mic-muted'}`}
                            onClick={handleMicToggle}
                            data-tooltip={!isMicMuted ? ((t as any).recordTooltipMicHide || "Mikrofonu Kapat") : ((t as any).recordTooltipMicShow || "Mikrofonu Aç")}
                        >
                            {isMicMuted ? <MicOff size={11} color="#ef4444" /> : <Mic size={11} color="#4ade80" />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const monitors = sources.filter(s => s.source_type === "monitor");
    const windows = sources.filter(s => s.source_type === "window");

    return (
        <div className={`recorder-modal-overlay ${isStandalone ? 'standalone' : ''}`}>
            <div className="recorder-modal">
                <div className="recorder-modal-header" data-tauri-drag-region>
                    <h3 data-tauri-drag-region>{(t as any).modalSelectSource}</h3>
                    <button className="close-btn" onClick={() => {
                        if (isStandalone) {
                            if (useWebcamRef.current) {
                                invoke("toggle_webcam", { show: false }).catch(console.error);
                            }
                            invoke("hide_recorder_window").catch(console.error);
                        } else {
                            onClose();
                        }
                    }} disabled={isRecording}>
                        <X size={18} />
                    </button>
                </div>

                <div className="recorder-modal-content">
                    {isRecording ? (
                        <div className="recording-active-state">
                            <div className="recording-indicator" style={{ background: isPaused ? '#eab308' : '#ef4444', boxShadow: isPaused ? '0 0 12px #eab308' : '0 0 12px rgba(239, 68, 68, 0.6)', animation: isPaused ? 'none' : 'pulse-recording 1.5s infinite' }}></div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <h2 style={{ margin: 0, color: isPaused ? '#eab308' : '#ffffff' }}>{isPaused ? 'Mola' : (t as any).modalRecording}</h2>
                                <span style={{ color: '#a1a1aa', fontSize: '1.4rem', fontFamily: 'monospace', fontWeight: 600, letterSpacing: '1px' }}>{formatDuration(recordingDuration)}</span>
                            </div>
                            <p style={{ marginTop: '8px' }}>{(t as any).modalHwAccel}</p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
                                <button className="secondary-button" onClick={handlePauseToggle} style={{ padding: '8px 20px' }}>
                                    {isPaused ? <><Play size={16} fill="currentColor" /> Devam Et</> : <><Pause size={16} fill="currentColor" /> Duraklat</>}
                                </button>
                                <button className="premium-button stop-btn" onClick={handleStopRecording}>
                                    <Square size={16} fill="currentColor" /> {(t as any).modalStopRecording}
                                </button>
                            </div>
                        </div>
                    ) : loading ? (
                        <div className="loading-state">{(t as any).modalLoading}</div>
                    ) : (
                        <div className="sources-container">
                            <div className="source-tabs" style={{ display: "flex", gap: "10px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "10px" }}>
                                <button
                                    className={`source-tab ${activeTab === "monitors" ? "active" : ""}`}
                                    onClick={() => setActiveTab("monitors")}
                                    style={{ background: activeTab === "monitors" ? "rgba(0, 242, 254, 0.15)" : "transparent", border: activeTab === "monitors" ? "1px solid var(--accent-cyan)" : "1px solid transparent", color: activeTab === "monitors" ? "var(--accent-cyan)" : "#a1a1aa", padding: "6px 12px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: 500 }}
                                >
                                    <Monitor size={14} /> {(t as any).modalMonitors}
                                </button>
                                <button
                                    className={`source-tab ${activeTab === "windows" ? "active" : ""}`}
                                    onClick={() => setActiveTab("windows")}
                                    style={{ background: activeTab === "windows" ? "rgba(0, 242, 254, 0.15)" : "transparent", border: activeTab === "windows" ? "1px solid var(--accent-cyan)" : "1px solid transparent", color: activeTab === "windows" ? "var(--accent-cyan)" : "#a1a1aa", padding: "6px 12px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontWeight: 500 }}
                                >
                                    <AppWindow size={14} /> {(t as any).modalWindows}
                                </button>
                            </div>

                            {activeTab === "monitors" && monitors.length > 0 && (
                                <div className="source-grid">
                                    {monitors.map(m => (
                                        <div
                                            key={m.id}
                                            className={`source-card ${selectedId === m.id ? "selected" : ""}`}
                                            onClick={() => setSelectedId(m.id)}
                                        >
                                            <div className="source-preview">
                                                {m.thumbnail ? (
                                                    <img src={`data:image/png;base64,${m.thumbnail}`} alt={m.name} />
                                                ) : (
                                                    <div className="placeholder"><Monitor size={24} /></div>
                                                )}
                                            </div>
                                            <div className="source-name" title={m.name}>{m.name}</div>
                                            {selectedId === m.id && <div className="selected-badge"><Check size={12} /></div>}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === "windows" && windows.length > 0 && (
                                <div className="source-grid">
                                    {windows.map(w => (
                                        <div
                                            key={w.id}
                                            className={`source-card ${selectedId === w.id ? "selected" : ""}`}
                                            onClick={() => setSelectedId(w.id)}
                                        >
                                            <div className="source-preview">
                                                {w.thumbnail ? (
                                                    <img src={`data:image/png;base64,${w.thumbnail}`} alt={w.name} />
                                                ) : (
                                                    <div className="placeholder"><AppWindow size={24} /></div>
                                                )}
                                            </div>
                                            <div className="source-name" title={w.name}>{w.name}</div>
                                            {selectedId === w.id && <div className="selected-badge"><Check size={12} /></div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!isRecording && (
                    <div className="recorder-modal-footer" style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button
                            className="secondary-button"
                            onClick={() => {
                                const next = !showControls;
                                setShowControls(next);
                                localStorage.setItem("showRecordControls", next.toString());
                                window.dispatchEvent(new Event("storage"));
                                emit("force_storage_sync").catch(console.error);
                            }}
                            title={showControls ? ((t as any).recordTooltipBarHide || "Kayıt Çubuğunu Gizle") : ((t as any).recordTooltipBarShow || "Kayıt Çubuğunu Göster")}
                            style={{
                                padding: '10px',
                                borderRadius: '8px',
                                background: showControls ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                border: showControls ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                                color: showControls ? 'var(--accent-cyan)' : '#ef4444',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {showControls ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button
                            className="secondary-button"
                            onClick={() => {
                                const next = !useWebcam;
                                setUseWebcam(next);
                                useWebcamRef.current = next;
                                localStorage.setItem("recordWebcam", next.toString());
                                window.dispatchEvent(new Event("storage"));
                                emit("force_storage_sync").catch(console.error);
                                invoke("toggle_webcam", { show: next }).catch(console.error);
                            }}
                            title={useWebcam ? ((t as any).recordTooltipWebcamHide || "Kamerayı Kapat") : ((t as any).recordTooltipWebcamShow || "Kamerayı Aç")}
                            style={{
                                padding: '10px',
                                borderRadius: '8px',
                                background: useWebcam ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                border: useWebcam ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                                color: useWebcam ? 'var(--accent-cyan)' : '#a1a1aa',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Camera size={18} />
                        </button>
                        <button
                            className="secondary-button"
                            onClick={() => {
                                const next = !isMicMuted;
                                setIsMicMuted(next);
                                isMicMutedRef.current = next;
                                localStorage.setItem("recordMic", (!next).toString());
                                window.dispatchEvent(new Event("storage"));
                                emit("force_storage_sync").catch(console.error);
                            }}
                            title={!isMicMuted ? ((t as any).recordTooltipMicHide || "Mikrofonu Kapat") : ((t as any).recordTooltipMicShow || "Mikrofonu Aç")}
                            style={{
                                padding: '10px',
                                borderRadius: '8px',
                                background: !isMicMuted ? 'rgba(56, 189, 248, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                border: !isMicMuted ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                                color: !isMicMuted ? 'var(--accent-cyan)' : '#ef4444',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {!isMicMuted ? <Mic size={18} /> : <MicOff size={18} />}
                        </button>
                        <button className="premium-button" onClick={handleStartRecording} disabled={!selectedId || loading} style={{ flex: 1, justifyContent: 'center' }}>
                            <Video size={16} /> {(t as any).modalStartRecording}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
