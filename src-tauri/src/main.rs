// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod test_win;

#[tokio::main]
async fn main() {
    if std::env::args().any(|arg| arg == "--run-test") {
        test_win::test().await;
        return;
    }
    tauri_app_lib::run();
}
