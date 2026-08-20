use win_native_media::{Pipeline, PipelineConfig, VideoConfig, RecordConfig, CaptureTarget};

pub async fn test() {
    let config = PipelineConfig {
        capture_target: CaptureTarget::Monitor(0),
        video: VideoConfig { width: 1920, height: 1080, fps: 30, bitrate: 5_000_000 },
        record: Some(RecordConfig { output_path: "capture.mp4".into() }),
    };
    
    let mut pipeline = Pipeline::new(config).expect("create pipeline");
    pipeline.start().await.expect("start");
}
