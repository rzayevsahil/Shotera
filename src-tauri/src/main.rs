// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod test_win;

#[tokio::main]
async fn main() {
    // Automatically grant media permissions (like camera/microphone) in WebView2
    // This suppresses the "localhost wants to use your camera" prompt on Windows.
    #[cfg(target_os = "windows")]
    std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--use-fake-ui-for-media-stream");
    if std::env::args().any(|arg| arg == "--run-test") {
        test_win::test().await;
        return;
    }
    tauri_app_lib::run();
}
