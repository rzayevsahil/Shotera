import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Monitor, AppWindow, Video, X, Check, Square } from "lucide-react";
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

    useEffect(() => {
        if (isOpen) {
            loadSources();
        } else {
            setSources([]);
            setSelectedId(null);
        }
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

            await invoke("start_native_recording", { sourceId: selectedId });
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
                borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.5)', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.5), 0 0 15px rgba(239, 68, 68, 0.2)',
                height: '100vh', boxSizing: 'border-box' 
            }} data-tauri-drag-region>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} data-tauri-drag-region>
                    <div className="recording-indicator" style={{ width: '14px', height: '14px', margin: 0, animation: 'pulse-recording 1s infinite' }}></div>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }} data-tauri-drag-region>Recording...</span>
                </div>
                <button className="premium-button stop-btn" onClick={handleStopRecording} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                    <Square size={14} fill="currentColor" /> Stop
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
                    <h3>Select Source for Screen Recording</h3>
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
                            <h2>Recording in progress...</h2>
                            <p>Using native hardware acceleration (NVENC/QSV)</p>
                            <button className="premium-button stop-btn" onClick={handleStopRecording}>
                                <Square size={16} fill="currentColor" /> Stop Recording
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="loading-state">Loading sources...</div>
                    ) : (
                        <div className="sources-container">
                            {monitors.length > 0 && (
                                <div className="source-group">
                                    <h4><Monitor size={14} /> Monitors</h4>
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
                                </div>
                            )}

                            {windows.length > 0 && (
                                <div className="source-group">
                                    <h4><AppWindow size={14} /> Windows</h4>
                                    <div className="source-list">
                                        {windows.map(w => (
                                            <div 
                                                key={w.id} 
                                                className={`source-list-item ${selectedId === w.id ? "selected" : ""}`}
                                                onClick={() => setSelectedId(w.id)}
                                            >
                                                <AppWindow size={16} className="window-icon" />
                                                <span className="source-name">{w.name}</span>
                                                {selectedId === w.id && <Check size={14} className="check-icon" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!isRecording && (
                    <div className="recorder-modal-footer">
                        <button className="premium-button" onClick={handleStartRecording} disabled={!selectedId || loading}>
                            <Video size={16} /> Start Recording
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
