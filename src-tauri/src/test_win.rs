use win_native_media::{Pipeline, PipelineConfig, VideoConfig, RecordConfig, CaptureTarget, AudioConfig, StreamConfig};

pub async fn test() {
    let config = PipelineConfig {
        capture_target: CaptureTarget::Monitor(0),
        video: VideoConfig { 
            width: 1920, 
            height: 1080, 
            fps: 60, 
            bitrate: 5_000_000,
            keyframe_interval: 2,
        },
        record: Some(RecordConfig { output_path: "capture.mp4".into() }),
        audio: None, // Or AudioConfig { .. }
        capture_cursor: true,
        stream: None,
    };
    
    let mut pipeline = Pipeline::new(config).expect("create pipeline");
    
    let pipeline_mtx = std::sync::Arc::new(std::sync::Mutex::new(pipeline));
    
    let pm2 = pipeline_mtx.clone();
    std::thread::spawn(move || {
        let mut p = pm2.lock().unwrap();
        // Just checking if it can be sent to thread
    });
}
