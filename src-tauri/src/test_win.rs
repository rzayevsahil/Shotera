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
        audio: Some(AudioConfig {
            bitrate: 192_000,
            loopback: true,
            microphone: false,
        }),
        capture_cursor: true,
        stream: None,
    };
    
    let mut pipeline = Pipeline::new(config).expect("create pipeline");
    pipeline.start().await.expect("start pipeline");
    println!("Recording for 3 seconds...");
    tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
    pipeline.stop().await.expect("stop pipeline");
    println!("Recording stopped and saved to capture.mp4");
}
