use serde::Serialize;
use base64::{Engine as _, engine::general_purpose};
use image::ImageFormat;
use std::io::Cursor;
#[derive(Serialize)]
pub struct WindowInfo {
    pub id: u32,
    pub title: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub is_minimized: bool,
}

#[tauri::command]
pub fn fetch_all_windows() -> Vec<WindowInfo> {
    let mut result = Vec::new();
    if let Ok(windows) = xcap::Window::all() {
        for w in windows {
            if let Ok(title) = w.title() {
                if !title.is_empty() && title != "Program Manager" && title != "Settings" && title != "Shotera" {
                    result.push(WindowInfo {
                        id: w.id().unwrap_or(0),
                        title: title.clone(),
                        x: w.x().unwrap_or(0),
                        y: w.y().unwrap_or(0),
                        width: w.width().unwrap_or(0),
                        height: w.height().unwrap_or(0),
                        is_minimized: w.is_minimized().unwrap_or(false),
                    });
                }
            }
        }
    }
    result
}

#[tauri::command]
pub fn capture_window(id: u32) -> Result<String, String> {
    let windows = xcap::Window::all().map_err(|e| e.to_string())?;
    for w in windows {
        if w.id().unwrap_or(0) == id {
            let image = w.capture_image().map_err(|e| e.to_string())?;
            let mut cursor = Cursor::new(Vec::new());
            image.write_to(&mut cursor, ImageFormat::Png).map_err(|e| e.to_string())?;
            let base64_str = general_purpose::STANDARD.encode(cursor.into_inner());
            return Ok(base64_str);
        }
    }
    Err("Window not found".to_string())
}
