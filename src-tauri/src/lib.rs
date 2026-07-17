use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use base64::prelude::*;
use chrono::Local;
// use tauri_plugin_notification::NotificationExt;

struct AppState {
    last_screenshot: Mutex<Option<image::RgbaImage>>,
    language: Mutex<String>,
    file_format: Mutex<String>,
    image_quality: Mutex<u32>,
    include_cursor: Mutex<bool>,
    region_shortcut: Mutex<String>,
    fullscreen_shortcut: Mutex<String>,
    pinned_image: Mutex<Option<String>>,
    show_notifications: Mutex<bool>,
}

fn show_app_notification(state: &State<'_, AppState>, title: &str, body: &str, image_path: Option<&str>) {
    if let Ok(show) = state.show_notifications.lock() {
        if !*show {
            return;
        }
    }
    let mut notification = notify_rust::Notification::new();
    
    #[cfg(not(target_os = "macos"))]
    notification.app_id("com.sahil.shotera");

    notification
        .appname("Shotera")
        .summary(title)
        .body(body);
        
    if let Some(path) = image_path {
        // notify-rust uses image_path on Windows to show the large image in the notification
        notification.image_path(path);
    }
    
    let _ = notification.show();
}

const CURSOR_WIDTH: usize = 12;
const CURSOR_HEIGHT: usize = 19;
const CURSOR_BITMAP: [&str; 19] = [
    "B...........",
    "BB..........",
    "BWB.........",
    "BWWB........",
    "BWWWB.......",
    "BWWWWB......",
    "BWWWWWB.....",
    "BWWWWWWB....",
    "BWWWWWWWB...",
    "BWWWWWWWWB..",
    "BWWWWWWWWWB.",
    "BWWWWWWBBBBB",
    "BWWWBWWB....",
    "BWWB.BWWB...",
    "BWB..BWWB...",
    "BB....BWWB..",
    "......BWWB..",
    ".......BB...",
    "............",
];

#[cfg(target_os = "windows")]
fn get_cursor_position() -> Option<(i32, i32)> {
    use windows_sys::Win32::UI::WindowsAndMessaging::{GetCursorInfo, CURSORINFO, CURSOR_SHOWING};
    
    let mut cursor_info = CURSORINFO {
        cbSize: std::mem::size_of::<CURSORINFO>() as u32,
        flags: 0,
        hCursor: std::ptr::null_mut(),
        ptScreenPos: windows_sys::Win32::Foundation::POINT { x: 0, y: 0 },
    };
    
    unsafe {
        if GetCursorInfo(&mut cursor_info) != 0 && (cursor_info.flags & CURSOR_SHOWING) != 0 {
            Some((cursor_info.ptScreenPos.x, cursor_info.ptScreenPos.y))
        } else {
            None
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn get_cursor_position() -> Option<(i32, i32)> {
    None
}

fn draw_cursor(img: &mut image::RgbaImage, start_x: i32, start_y: i32) {
    let img_w = img.width() as i32;
    let img_h = img.height() as i32;
    
    for row in 0..CURSOR_HEIGHT {
        let chars = CURSOR_BITMAP[row].as_bytes();
        for col in 0..CURSOR_WIDTH {
            let px = start_x + col as i32;
            let py = start_y + row as i32;
            if px >= 0 && px < img_w && py >= 0 && py < img_h {
                let color_char = chars[col];
                if color_char == b'B' {
                    img.put_pixel(px as u32, py as u32, image::Rgba([0, 0, 0, 255]));
                } else if color_char == b'W' {
                    img.put_pixel(px as u32, py as u32, image::Rgba([255, 255, 255, 255]));
                }
            }
        }
    }
}

// Function to trigger screenshot and notify the screenshot window
fn trigger_screenshot(app_handle: &AppHandle, state: &State<'_, AppState>) -> Result<(), String> {
    // 1. Capture screen
    let monitors = xcap::Monitor::all().map_err(|e| e.to_string())?;
    if monitors.is_empty() {
        return Err("No monitors found".into());
    }
    // For MVP, capture the first/primary monitor
    let monitor = &monitors[0];
    let mut image = monitor.capture_image().map_err(|e| e.to_string())?;
    
    // Draw cursor if option is enabled
    let include_cursor = {
        let cursor_opt = state.include_cursor.lock().map_err(|e| e.to_string())?;
        *cursor_opt
    };
    
    if include_cursor {
        if let Some((cx, cy)) = get_cursor_position() {
            let mx = monitor.x().unwrap_or(0);
            let my = monitor.y().unwrap_or(0);
            let mw = monitor.width().unwrap_or(1920);
            let mh = monitor.height().unwrap_or(1080);
            
            let scale_x = image.width() as f32 / mw as f32;
            let scale_y = image.height() as f32 / mh as f32;
            let cx_pixel = ((cx - mx) as f32 * scale_x) as i32;
            let cy_pixel = ((cy - my) as f32 * scale_y) as i32;
            
            draw_cursor(&mut image, cx_pixel, cy_pixel);
        }
    }
    
    // Store in state
    let mut last_ss = state.last_screenshot.lock().map_err(|e| e.to_string())?;
    *last_ss = Some(image);
    
    // 2. Notify the screenshot window to load the new image
    if let Some(window) = app_handle.get_webview_window("screenshot") {
        // Emit event to tell frontend that a new screenshot is captured
        window.emit("screenshot-captured", ()).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

fn trigger_fullscreen_screenshot(app_handle: &AppHandle, state: &State<'_, AppState>) -> Result<(), String> {
    // 1. Capture screen
    let monitors = xcap::Monitor::all().map_err(|e| e.to_string())?;
    if monitors.is_empty() {
        return Err("No monitors found".into());
    }
    let monitor = &monitors[0];
    let mut image = monitor.capture_image().map_err(|e| e.to_string())?;
    
    // Draw cursor if option is enabled
    let include_cursor = {
        let cursor_opt = state.include_cursor.lock().map_err(|e| e.to_string())?;
        *cursor_opt
    };
    
    if include_cursor {
        if let Some((cx, cy)) = get_cursor_position() {
            let mx = monitor.x().unwrap_or(0);
            let my = monitor.y().unwrap_or(0);
            let mw = monitor.width().unwrap_or(1920);
            let mh = monitor.height().unwrap_or(1080);
            
            let scale_x = image.width() as f32 / mw as f32;
            let scale_y = image.height() as f32 / mh as f32;
            let cx_pixel = ((cx - mx) as f32 * scale_x) as i32;
            let cy_pixel = ((cy - my) as f32 * scale_y) as i32;
            
            draw_cursor(&mut image, cx_pixel, cy_pixel);
        }
    }
    
    // Store in state
    let mut last_ss = state.last_screenshot.lock().map_err(|e| e.to_string())?;
    *last_ss = Some(image.clone());
    drop(last_ss);

    // 2. Save to file (Pictures/Shotera)
    let format = {
        let fmt = state.file_format.lock().map_err(|e| e.to_string())?;
        fmt.clone()
    };
    let quality = {
        let qual = state.image_quality.lock().map_err(|e| e.to_string())?;
        *qual
    };

    let now = Local::now();
    let ext = match format.to_lowercase().as_str() {
        "jpg" | "jpeg" => "jpg",
        "webp" => "webp",
        _ => "png",
    };
    let filename = now.format(&format!("Screenshot_%Y%m%d_%H%M%S.{}", ext)).to_string();
    let mut path = app_handle.path().picture_dir().map_err(|e| e.to_string())?;
    path.push("Shotera");
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push(filename);

    match ext {
        "jpg" => {
            let file = std::fs::File::create(&path).map_err(|e| e.to_string())?;
            let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(file, quality as u8);
            encoder.encode_image(&image).map_err(|e| e.to_string())?;
        }
        _ => {
            image.save(&path).map_err(|e| e.to_string())?;
        }
    }
    
    // 3. Copy to clipboard
    let mut ctx = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    let width = image.width() as usize;
    let height = image.height() as usize;
    let bytes = image.into_raw();
    let img_data = arboard::ImageData {
        width,
        height,
        bytes: std::borrow::Cow::from(bytes),
    };
    ctx.set_image(img_data).map_err(|e| e.to_string())?;
    
    // 4. Send notification
    let lang = {
        let state_lang = state.language.lock().map_err(|e| e.to_string())?;
        state_lang.clone()
    };
    let body = if lang == "tr" {
        "Tam ekran görüntüsü kaydedildi ve panoya kopyalandı!"
    } else {
        "Full screenshot saved and copied to clipboard!"
    };
    show_app_notification(state, "Shotera", body, None);
    
    // 5. Emit event to frontend to play shutter sound
    let _ = app_handle.emit("fullscreen-captured", ());
    
    Ok(())
}

#[tauri::command]
fn trigger_fullscreen_capture_command(app_handle: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    trigger_fullscreen_screenshot(&app_handle, &state)
}

#[tauri::command]
async fn pin_image(
    app_handle: AppHandle, 
    state: State<'_, AppState>, 
    base64_str: String,
    width: f64,
    height: f64,
    x: f64,
    y: f64,
) -> Result<(), String> {
    // Save image to state
    {
        let mut pinned = state.pinned_image.lock().map_err(|e| e.to_string())?;
        *pinned = Some(base64_str);
    }
    
    // Generate a unique label for the window
    let timestamp = chrono::Local::now().timestamp_millis();
    let label = format!("pinned_{}", timestamp);

    // Create the pinned window
    let builder = tauri::WebviewWindowBuilder::new(
        &app_handle,
        label,
        tauri::WebviewUrl::App("index.html?pin=true".into())
    )
    .title("Pinned Image")
    .inner_size(width, height)
    .position(x, y)
    .decorations(false);
    #[cfg(not(target_os = "macos"))]
    let builder = builder.transparent(true);

    // On macOS, WebviewWindowBuilder doesn't have the transparent method directly exposed in the same way,
    // so we set the background color to transparent.
    #[cfg(target_os = "macos")]
    let builder = builder.background_color(tauri::utils::config::Color(0, 0, 0, 0));

    builder
        .always_on_top(true)
        .resizable(true)
        .skip_taskbar(true)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn upload_to_imgur(_app_handle: AppHandle, state: State<'_, AppState>, base64_str: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let mut form = reqwest::multipart::Form::new();
    form = form.text("image", base64_str);
    form = form.text("type", "base64");

    let res = client.post("https://api.imgur.com/3/image")
        .header("Authorization", "Client-ID 546c25a59c58ad7")
        .multipart(form)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    
    if let Some(link) = json["data"]["link"].as_str() {
        let mut ctx = arboard::Clipboard::new().map_err(|e| e.to_string())?;
        ctx.set_text(link.to_string()).map_err(|e| e.to_string())?;

        let lang = {
            let state_lang = state.language.lock().map_err(|e| e.to_string())?;
            state_lang.clone()
        };
        let body = if lang == "tr" {
            "Görsel buluta yüklendi ve link panoya kopyalandı!"
        } else {
            "Image uploaded to cloud and link copied to clipboard!"
        };
        show_app_notification(&state, "Shotera", body, None);

        Ok(link.to_string())
    } else {
        Err("Failed to upload image".into())
    }
}

#[tauri::command]
fn get_pinned_image(state: State<'_, AppState>) -> Result<String, String> {
    let pinned = state.pinned_image.lock().map_err(|e| e.to_string())?;
    pinned.clone().ok_or("No pinned image available".into())
}

#[tauri::command]
fn start_drag(window: tauri::Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
fn close_pinned(window: tauri::Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_last_screenshot(state: State<'_, AppState>) -> Result<String, String> {
    let last_ss = state.last_screenshot.lock().map_err(|e| e.to_string())?;
    let image = last_ss.as_ref().ok_or("No screenshot captured yet")?;
    
    // Encode to PNG bytes in memory (lossless, fast in optimized dependency builds)
    let mut png_bytes = std::io::Cursor::new(Vec::new());
    image.write_to(&mut png_bytes, image::ImageFormat::Png).map_err(|e| e.to_string())?;
    
    let base64_str = BASE64_STANDARD.encode(png_bytes.get_ref());
    Ok(base64_str)
}

#[tauri::command]
fn copy_to_clipboard(
    _app_handle: AppHandle,
    state: State<'_, AppState>,
    x: u32,
    y: u32,
    width: u32,
    height: u32,
) -> Result<(), String> {
    let last_ss = state.last_screenshot.lock().map_err(|e| e.to_string())?;
    let image = last_ss.as_ref().ok_or("No screenshot captured yet")?;
    
    let img_w = image.width();
    let img_h = image.height();
    
    let x = x.min(img_w);
    let y = y.min(img_h);
    let width = width.min(img_w - x);
    let height = height.min(img_h - y);
    
    if width == 0 || height == 0 {
        return Err("Selection area is too small".into());
    }
    
    let cropped = image::imageops::crop_imm(image, x, y, width, height).to_image();
    
    let mut ctx = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    let img_data = arboard::ImageData {
        width: cropped.width() as usize,
        height: cropped.height() as usize,
        bytes: std::borrow::Cow::from(cropped.into_raw()),
    };
    ctx.set_image(img_data).map_err(|e| e.to_string())?;
    
    // Send notification
    let lang = {
        let state_lang = state.language.lock().map_err(|e| e.to_string())?;
        state_lang.clone()
    };
    let body = if lang == "tr" {
        "Ekran görüntüsü panoya kopyalandı!"
    } else {
        "Screenshot copied to clipboard!"
    };
    show_app_notification(&state, "Shotera", body, None);
    
    Ok(())
}

#[tauri::command]
fn save_to_file(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    x: u32,
    y: u32,
    width: u32,
    height: u32,
) -> Result<String, String> {
    let last_ss = state.last_screenshot.lock().map_err(|e| e.to_string())?;
    let image = last_ss.as_ref().ok_or("No screenshot captured yet")?;
    
    let img_w = image.width();
    let img_h = image.height();
    
    let x = x.min(img_w);
    let y = y.min(img_h);
    let width = width.min(img_w - x);
    let height = height.min(img_h - y);
    
    if width == 0 || height == 0 {
        return Err("Selection area is too small".into());
    }
    
    let cropped = image::imageops::crop_imm(image, x, y, width, height).to_image();
    
    // Generate filename: Screenshot_YYYYMMDD_HHMMSS.png
    let now = Local::now();
    let filename = now.format("Screenshot_%Y%m%d_%H%M%S.png").to_string();
    
    // Resolve output path (Pictures folder)
    let mut path = app_handle.path().picture_dir().map_err(|e| e.to_string())?;
    path.push("Shotera");
    
    // Ensure directory exists
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    
    path.push(filename);
    
    // Save image
    cropped.save(&path).map_err(|e| e.to_string())?;
    
    // Send notification
    let lang = {
        let state_lang = state.language.lock().map_err(|e| e.to_string())?;
        state_lang.clone()
    };
    let body = if lang == "tr" {
        "Ekran görüntüsü başarıyla kaydedildi!"
    } else {
        "Screenshot saved successfully!"
    };
    show_app_notification(&state, "Shotera", body, None);
    
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn update_save_settings(
    state: State<'_, AppState>,
    file_format: String,
    image_quality: u32,
    include_cursor: bool,
) {
    if let Ok(mut format) = state.file_format.lock() {
        *format = file_format;
    }
    if let Ok(mut qual) = state.image_quality.lock() {
        *qual = image_quality;
    }
    if let Ok(mut cursor) = state.include_cursor.lock() {
        *cursor = include_cursor;
    }
}

#[tauri::command]
fn update_notification_setting(state: State<'_, AppState>, show: bool) {
    if let Ok(mut show_state) = state.show_notifications.lock() {
        *show_state = show;
    }
}

#[tauri::command]
fn update_shortcuts(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    region_shortcut: String,
    fullscreen_shortcut: String,
) -> Result<(), String> {
    use std::str::FromStr;

    // 1. Validate shortcut format by parsing
    let reg_shortcut = Shortcut::from_str(&region_shortcut.to_lowercase())
        .map_err(|e| format!("Invalid region shortcut: {}", e))?;
    let fs_shortcut = Shortcut::from_str(&fullscreen_shortcut.to_lowercase())
        .map_err(|e| format!("Invalid fullscreen shortcut: {}", e))?;

    // 2. Unregister ALL old shortcuts first
    let _ = app_handle.global_shortcut().unregister_all();

    // 3. Register the new customizable ones
    app_handle.global_shortcut().register(reg_shortcut)
        .map_err(|e| format!("Failed to register region shortcut: {}", e))?;
    app_handle.global_shortcut().register(fs_shortcut)
        .map_err(|e| format!("Failed to register fullscreen shortcut: {}", e))?;

    // 4. Update the state
    if let Ok(mut reg_state) = state.region_shortcut.lock() {
        *reg_state = region_shortcut.to_lowercase();
    }
    if let Ok(mut fs_state) = state.fullscreen_shortcut.lock() {
        *fs_state = fullscreen_shortcut.to_lowercase();
    }

    Ok(())
}

#[tauri::command]
fn unregister_global_shortcuts(app_handle: AppHandle) -> Result<(), String> {
    let _ = app_handle.global_shortcut().unregister_all();
    Ok(())
}

#[tauri::command]
fn update_tray_language(app_handle: AppHandle, state: State<'_, AppState>, lang: String) {
    if let Ok(mut state_lang) = state.language.lock() {
        *state_lang = lang.clone();
    }
    if let Some(tray) = app_handle.tray_by_id("main-tray") {
        let (capture_label, settings_label, quit_label) = if lang == "tr" {
            ("Ekran Görüntüsü Al", "Ayarlar", "Çıkış")
        } else {
            ("Take Screenshot", "Settings", "Quit")
        };
        
        if let Ok(quit_i) = MenuItem::with_id(&app_handle, "quit", quit_label, true, None::<&str>) {
            if let Ok(settings_i) = MenuItem::with_id(&app_handle, "settings", settings_label, true, None::<&str>) {
                if let Ok(capture_i) = MenuItem::with_id(&app_handle, "capture", capture_label, true, None::<&str>) {
                    if let Ok(menu) = Menu::with_items(&app_handle, &[&capture_i, &settings_i, &quit_i]) {
                        let _ = tray.set_menu(Some(menu));
                    }
                }
            }
        }
    }
}

#[tauri::command]
fn select_folder() -> Option<String> {
    rfd::FileDialog::new()
        .pick_folder()
        .map(|p| p.to_string_lossy().to_string())
}

#[tauri::command]
fn hide_screenshot_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("screenshot") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn show_screenshot_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("screenshot") {
        // Disable window show/hide transitions (animations) on Windows
        #[cfg(target_os = "windows")]
        unsafe {
            use windows_sys::Win32::Graphics::Dwm::*;
            if let Ok(hwnd) = window.hwnd() {
                let value: i32 = 1; // TRUE to force-disable transitions
                let _ = DwmSetWindowAttribute(
                    hwnd.0 as _,
                    DWMWA_TRANSITIONS_FORCEDISABLED as u32,
                    &value as *const i32 as *const _,
                    std::mem::size_of::<i32>() as u32,
                );
            }
        }
        
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn show_settings_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn trigger_capture_command(app_handle: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    trigger_screenshot(&app_handle, &state)
}

#[tauri::command]
fn save_base64_image(
    app_handle: AppHandle, 
    state: State<'_, AppState>, 
    base64_str: String,
    format: String,
) -> Result<String, String> {
    use base64::prelude::*;
    let bytes = BASE64_STANDARD.decode(base64_str).map_err(|e| e.to_string())?;
    
    let now = Local::now();
    let ext = match format.to_lowercase().as_str() {
        "jpg" | "jpeg" => "jpg",
        "webp" => "webp",
        _ => "png",
    };
    let filename = now.format(&format!("Screenshot_%Y%m%d_%H%M%S.{}", ext)).to_string();
    
    let mut path = app_handle.path().picture_dir().map_err(|e| e.to_string())?;
    path.push("Shotera");
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push(filename);
    
    std::fs::write(&path, bytes).map_err(|e| e.to_string())?;

    let lang = {
        let state_lang = state.language.lock().map_err(|e| e.to_string())?;
        state_lang.clone()
    };
    let body = if lang == "tr" {
        "Ekran görüntüsü başarıyla kaydedildi!"
    } else {
        "Screenshot saved successfully!"
    };
    show_app_notification(&state, "Shotera", body, Some(&path.to_string_lossy()));

    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn copy_base64_image_to_clipboard(_app_handle: AppHandle, state: State<'_, AppState>, base64_str: String) -> Result<String, String> {
    use base64::prelude::*;
    let bytes = BASE64_STANDARD.decode(base64_str).map_err(|e| e.to_string())?;
    
    let img = image::load_from_memory_with_format(&bytes, image::ImageFormat::Png)
        .map_err(|e| e.to_string())?
        .to_rgba8();
    
    let mut ctx = arboard::Clipboard::new().map_err(|e| e.to_string())?;
    let img_data = arboard::ImageData {
        width: img.width() as usize,
        height: img.height() as usize,
        bytes: std::borrow::Cow::from(img.into_raw()),
    };
    ctx.set_image(img_data).map_err(|e| e.to_string())?;

    let temp_dir = std::env::temp_dir();
    let temp_path = temp_dir.join(format!("shotera_clipboard_preview_{}.png", chrono::Local::now().format("%Y%m%d%H%M%S")));
    let mut file = std::fs::File::create(&temp_path).map_err(|e| e.to_string())?;
    std::io::Write::write_all(&mut file, &bytes).map_err(|e| e.to_string())?;

    let lang = {
        let state_lang = state.language.lock().map_err(|e| e.to_string())?;
        state_lang.clone()
    };
    let body = if lang == "tr" {
        "Ekran görüntüsü panoya kopyalandı!"
    } else {
        "Screenshot copied to clipboard!"
    };
    show_app_notification(&state, "Shotera", body, Some(&temp_path.to_string_lossy()));

    Ok(temp_path.to_string_lossy().to_string())
}


#[cfg(target_os = "windows")]
fn set_app_user_model_id() {
    use windows_sys::Win32::UI::Shell::SetCurrentProcessExplicitAppUserModelID;
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    let app_id = OsStr::new("com.sahil.shotera")
        .encode_wide()
        .chain(Some(0))
        .collect::<Vec<u16>>();
    
    unsafe {
        SetCurrentProcessExplicitAppUserModelID(app_id.as_ptr());
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "windows")]
    set_app_user_model_id();

    tauri::Builder::default()
        .manage(AppState {
            last_screenshot: Mutex::new(None),
            language: Mutex::new("tr".to_string()),
            file_format: Mutex::new("PNG".to_string()),
            image_quality: Mutex::new(100),
            include_cursor: Mutex::new(false),
            region_shortcut: Mutex::new("ctrl+shift+s".to_string()),
            fullscreen_shortcut: Mutex::new("ctrl+shift+f".to_string()),
            pinned_image: Mutex::new(None),
            show_notifications: Mutex::new(true),
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--autostart"])))
        .setup(|app| {
            // 1. Setup Global Shortcut Plugin
            let shortcut_plugin = tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app_handle_shortcut, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let state = app_handle_shortcut.state::<AppState>();
                        
                        let reg_shortcut_str = state.region_shortcut.lock().unwrap().clone();
                        let fs_shortcut_str = state.fullscreen_shortcut.lock().unwrap().clone();
                        
                        let matches_fs = if let Ok(fs_shortcut) = fs_shortcut_str.parse::<Shortcut>() {
                            shortcut == &fs_shortcut
                        } else {
                            false
                        };

                        if matches_fs {
                            let _ = trigger_fullscreen_screenshot(app_handle_shortcut, &state);
                            return;
                        }

                        let matches_reg = if let Ok(reg_shortcut) = reg_shortcut_str.parse::<Shortcut>() {
                            shortcut == &reg_shortcut
                        } else {
                            false
                        };

                        if matches_reg {
                            let _ = trigger_screenshot(app_handle_shortcut, &state);
                            return;
                        }
                    }
                })
                .build();
            app.handle().plugin(shortcut_plugin)?;

            // Register Region and Fullscreen Shortcuts using default values on initial startup
            use std::str::FromStr;
            let reg_shortcut = Shortcut::from_str("ctrl+shift+s").unwrap();
            let fs_shortcut = Shortcut::from_str("ctrl+shift+f").unwrap();
            
            let _ = app.global_shortcut().register(reg_shortcut);
            let _ = app.global_shortcut().register(fs_shortcut);

            // 2. Setup System Tray
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let settings_i = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
            let capture_i = MenuItem::with_id(app, "capture", "Take Screenshot", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&capture_i, &settings_i, &quit_i])?;

            let _tray = TrayIconBuilder::with_id("main-tray")
                .menu(&menu)
                .tooltip("Shotera")
                .icon(app.default_window_icon().cloned().unwrap())
                .on_menu_event(move |app_handle_tray, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            app_handle_tray.exit(0);
                        }
                        "settings" => {
                            if let Some(window) = app_handle_tray.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "capture" => {
                            let app_handle_clone = app_handle_tray.clone();
                            std::thread::spawn(move || {
                                std::thread::sleep(std::time::Duration::from_millis(300));
                                let state = app_handle_clone.state::<AppState>();
                                let _ = trigger_screenshot(&app_handle_clone, &state);
                            });
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            // 3. Prevent close on main settings window, hide instead
            if let Some(window) = app.get_webview_window("main") {
                let window_ = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_.hide();
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_last_screenshot,
            copy_to_clipboard,
            save_to_file,
            hide_screenshot_window,
            show_screenshot_window,
            show_settings_window,
            trigger_capture_command,
            trigger_fullscreen_capture_command,
            save_base64_image,
            copy_base64_image_to_clipboard,
            update_tray_language,
            update_save_settings,
            update_notification_setting,
            select_folder,
            update_shortcuts,
            unregister_global_shortcuts,
            pin_image,
            get_pinned_image,
            upload_to_imgur,
            start_drag,
            close_pinned
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
