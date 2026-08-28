import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Monitor, AppWindow, Video, X, Check, Square, Camera, Pause, Play, EyeOff } from "lucide-react";
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
    const [showControls, setShowControls] = useState(() => localStorage.getItem("showRecordControls") !== "false");

    const t = translations[getLanguage()];

    useEffect(() => {
        isRecordingRef.current = isRecording;
    }, [isRecording]);

    useEffect(() => {
        if (isOpen) {
            const savedWebcam = localStorage.getItem("recordWebcam") === "true";
            setUseWebcam(savedWebcam);
            useWebcamRef.current = savedWebcam;
            setIsPaused(false);
            isPausedRef.current = false;
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

    useEffect(() => {
        import("@tauri-apps/api/event").then(({ listen }) => {
            const unlistenOpened = listen("recorder-opened", () => {
                if (isOpen) {
                    loadSources();
                }
            });
            const unlistenShortcut = listen("recorder-shortcut-pressed", async () => {
                if (isRecordingRef.current && handleStopRecordingRef.current) {
                    await handleStopRecordingRef.current();
                } else {
                    // Replicate the X button close logic exactly to prevent transparent window artifacts
                    if (isStandalone) {
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
            return () => {
                unlistenOpened.then(f => f());
                unlistenShortcut.then(f => f());
                unlistenPause.then(f => f());
                unlistenWebcam.then(f => f());
            };
        });
    }, [isOpen, onClose]);

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
        const recordMic = localStorage.getItem("recordMic") === "true";
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
        } catch (error) {
            console.error("Failed to start recording:", error);
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
            console.error(error);
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
        } catch (error) {
            console.error("Failed to toggle webcam:", error);
        }
    };

    useEffect(() => {
        handleStopRecordingRef.current = handleStopRecording;
        handlePauseToggleRef.current = handlePauseToggle;
        handleWebcamToggleRef.current = handleWebcamToggle;
    }, [handleStopRecording, handlePauseToggle, handleWebcamToggle]);

    if (!isOpen) return null;

    if (isRecording && isStandalone) {
        return (
            <div className="compact-recorder-bar" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', background: 'rgba(20, 20, 20, 0.95)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                height: '100vh', boxSizing: 'border-box',
                borderRadius: '0'
            }} data-tauri-drag-region>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} data-tauri-drag-region>
                    <div className="recording-indicator" style={{ width: '14px', height: '14px', margin: 0, animation: isPaused ? 'none' : 'pulse-recording 1s infinite', background: isPaused ? 'gray' : 'red' }}></div>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }} data-tauri-drag-region>{isPaused ? 'Mola' : (t as any).modalRecording}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="secondary-button" onClick={handleWebcamToggle} style={{ padding: '8px 10px', fontSize: '0.85rem' }} title={(t as any).recordTooltipWebcam || "Kamerayı Aç/Kapat"}>
                        <Camera size={16} color={useWebcam ? "var(--accent-cyan)" : "#a1a1aa"} />
                    </button>
                    <button className="secondary-button" onClick={handlePauseToggle} style={{ padding: '8px 10px', fontSize: '0.85rem' }} title={isPaused ? "Devam Et" : "Duraklat"}>
                        {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                    </button>
                    <button className="premium-button stop-btn" onClick={handleStopRecording} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                        <Square size={14} fill="currentColor" /> {(t as any).modalStopRecording}
                    </button>
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
                            <div className="recording-indicator" style={{ background: isPaused ? 'gray' : 'red', animation: isPaused ? 'none' : 'pulse-recording 1s infinite' }}></div>
                            <h2>{isPaused ? 'Mola' : (t as any).modalRecording}</h2>
                            <p>{(t as any).modalHwAccel}</p>
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
                            }}
                            title={(t as any).recordTooltipBar || "Kayıt Çubuğunu Gizle/Göster"}
                            style={{
                                padding: '10px',
                                borderRadius: '8px',
                                background: showControls ? 'rgba(255, 255, 255, 0.05)' : 'rgba(239, 68, 68, 0.15)',
                                border: showControls ? '1px solid transparent' : '1px solid rgba(239, 68, 68, 0.5)',
                                color: showControls ? '#a1a1aa' : '#ef4444',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <EyeOff size={18} />
                        </button>
                        <button 
                            className="secondary-button"
                            onClick={() => {
                                const next = !useWebcam;
                                setUseWebcam(next);
                                localStorage.setItem("recordWebcam", next.toString());
                                invoke("toggle_webcam", { show: next }).catch(console.error);
                            }}
                            title={(t as any).recordTooltipWebcam || "Kamerayı Göster/Gizle"}
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
                        <button className="premium-button" onClick={handleStartRecording} disabled={!selectedId || loading} style={{ flex: 1, justifyContent: 'center' }}>
                            <Video size={16} /> {(t as any).modalStartRecording}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
