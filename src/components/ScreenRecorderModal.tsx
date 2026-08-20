import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Monitor, AppWindow, Video, X, Check, Square } from "lucide-react";
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
    const [activeTab, setActiveTab] = useState<"monitors" | "windows">("monitors");

    const t = translations[getLanguage()];

    useEffect(() => {
        if (isOpen) {
            loadSources();
        } else {
            setSources([]);
            setSelectedId(null);
        }
    }, [isOpen]);

    useEffect(() => {
        import("@tauri-apps/api/event").then(({ listen }) => {
            const unlisten = listen("recorder-opened", () => {
                if (isOpen) {
                    loadSources();
                }
            });
            return () => {
                unlisten.then(f => f());
            };
        });
    }, [isOpen]);

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

    const handleStartRecording = async () => {
        if (!selectedId) return;
        setIsRecording(true);
        try {
            console.log("Starting native recording for:", selectedId);

            if (isStandalone) {
                await invoke("resize_recorder_window", { compact: true }).catch(console.error);
            }

            const fps = Number(localStorage.getItem("recordFps")) || 30;
            const recordAudio = localStorage.getItem("recordAudio") !== "false";
            const recordMic = localStorage.getItem("recordMic") === "true";
            const videoSavePath = localStorage.getItem("videoSavePath") || "";
            await invoke("start_native_recording", { sourceId: selectedId, fps, recordAudio, recordMic, videoSavePath });
        } catch (error) {
            console.error("Failed to start recording:", error);
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
            setIsRecording(false);
            if (isStandalone) {
                await invoke("resize_recorder_window", { compact: false }).catch(console.error);
                await invoke("hide_recorder_window").catch(console.error);
            } else {
                onClose();
            }
        }
    };

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
                    <div className="recording-indicator" style={{ width: '14px', height: '14px', margin: 0, animation: 'pulse-recording 1s infinite' }}></div>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }} data-tauri-drag-region>{(t as any).modalRecording}</span>
                </div>
                <button className="premium-button stop-btn" onClick={handleStopRecording} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                    <Square size={14} fill="currentColor" /> {(t as any).modalStopRecording}
                </button>
            </div>
        );
    }

    const monitors = sources.filter(s => s.source_type === "monitor");
    const windows = sources.filter(s => s.source_type === "window");

    return (
        <div className={`recorder-modal-overlay ${isStandalone ? 'standalone' : ''}`}>
            <div className="recorder-modal">
                <div className="recorder-modal-header">
                    <h3>{(t as any).modalSelectSource}</h3>
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
                            <div className="recording-indicator"></div>
                            <h2>{(t as any).modalRecording}</h2>
                            <p>{(t as any).modalHwAccel}</p>
                            <button className="premium-button stop-btn" onClick={handleStopRecording}>
                                <Square size={16} fill="currentColor" /> {(t as any).modalStopRecording}
                            </button>
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
                    <div className="recorder-modal-footer">
                        <button className="premium-button" onClick={handleStartRecording} disabled={!selectedId || loading}>
                            <Video size={16} /> {(t as any).modalStartRecording}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
