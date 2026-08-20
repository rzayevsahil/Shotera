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
    break_timer_shortcut: Mutex<String>,
    zoom_shortcut: Mutex<String>,
    live_zoom_shortcut: Mutex<String>,
    record_shortcut: Mutex<String>,
    pinned_image: Mutex<Option<String>>,
    show_notifications: Mutex<bool>,
    recorder_stop_tx: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

#[derive(serde::Serialize)]
struct CaptureSource {
    id: String,
    name: String,
    source_type: String, // "monitor" or "window"
    thumbnail: Option<String>,
}

#[tauri::command]
fn get_capture_sources() -> Result<Vec<CaptureSource>, String> {
    let mut sources = Vec::new();
    
    // Monitors
    if let Ok(monitors) = xcap::Monitor::all() {
        for (i, m) in monitors.iter().enumerate() {
            let mut thumb = None;
            // Optionally capture a small thumbnail
            if let Ok(image) = m.capture_image() {
                // Resize for thumbnail to be fast
                let resized = image::imageops::thumbnail(&image, 320, 180);
                let mut png_bytes = std::io::Cursor::new(Vec::new());
                if resized.write_to(&mut png_bytes, image::ImageFormat::Png).is_ok() {
                    thumb = Some(base64::prelude::BASE64_STANDARD.encode(png_bytes.get_ref()));
                }
            }
            
            sources.push(CaptureSource {
                id: format!("monitor_{}", i),
                name: m.name().unwrap_or_else(|_| format!("Monitor {}", i + 1)),
                source_type: "monitor".to_string(),
                thumbnail: thumb,
            });
        }
    }
    
    // Windows
    if let Ok(windows) = xcap::Window::all() {
        for w in windows {
            if let Ok(title) = w.title() {
                // Ignore empty titles or basic system windows
                if !title.is_empty() && title != "Program Manager" && title != "Settings" && title != "Shotera" {
                    let mut thumb = None;
                    // Attempt to capture a thumbnail for the window
                    if let Ok(image) = w.capture_image() {
                        let resized = image::imageops::thumbnail(&image, 320, 180);
                        let mut png_bytes = std::io::Cursor::new(Vec::new());
                        if resized.write_to(&mut png_bytes, image::ImageFormat::Png).is_ok() {
                            thumb = Some(base64::prelude::BASE64_STANDARD.encode(png_bytes.get_ref()));
                        }
                    }

                    sources.push(CaptureSource {
                        id: format!("window_{}", w.id().unwrap_or(0)),
                        name: title,
                        source_type: "window".to_string(),
                        thumbnail: thumb,
                    });
                }
            }
        }
    }
    
    Ok(sources)
}

#[tauri::command]
async fn start_native_recording(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    source_id: String,
    fps: u32,
    record_audio: bool
) -> Result<String, String> {
    use win_native_media::{Pipeline, PipelineConfig, VideoConfig, RecordConfig, CaptureTarget};
    use chrono::Local;
    use tauri::Manager;

    println!("Starting native hardware-accelerated recording for source: {}, fps: {}, audio: {}", source_id, fps, record_audio);

    let mut target = CaptureTarget::Monitor(0);
    let mut target_width = 1920;
    let mut target_height = 1080;

    if source_id.starts_with("monitor_") {
        if let Ok(idx) = source_id.replace("monitor_", "").parse::<usize>() {
            target = CaptureTarget::Monitor(idx);
            if let Ok(monitors) = xcap::Monitor::all() {
                if let Some(m) = monitors.get(idx) {
                    target_width = m.width().unwrap_or(1920);
                    target_height = m.height().unwrap_or(1080);
                }
            }
        }
    } else if source_id.starts_with("window_") {
        if let Ok(hwnd) = source_id.replace("window_", "").parse::<isize>() {
            target = CaptureTarget::Window(hwnd);
            if let Ok(windows) = xcap::Window::all() {
                if let Some(w) = windows.iter().find(|w| w.id().unwrap_or(0) as isize == hwnd) {
                    target_width = w.width().unwrap_or(1920);
                    target_height = w.height().unwrap_or(1080);
                }
            }
        }
    }

    // Ensure dimensions are multiples of 16 (strict requirement for H264 hardware encoders to prevent macroblock corruption/tearing)
    target_width = target_width - (target_width % 16);
    target_height = target_height - (target_height % 16);

    let now = Local::now();
    let filename = now.format("Recording_%Y%m%d_%H%M%S.mp4").to_string();
    
    // Resolve output path (Videos folder)
    let mut path = app_handle.path().video_dir().unwrap_or_else(|_| std::path::PathBuf::from("C:\\"));
    path.push("Shotera");
    let _ = std::fs::create_dir_all(&path);
    path.push(&filename);

    let output_path_str = path.to_string_lossy().to_string();

    let config = PipelineConfig {
        capture_target: target,
        video: VideoConfig { 
            width: target_width, 
            height: target_height, 
            fps, 
            bitrate: if fps > 30 { 15_000_000 } else { 10_000_000 },
            keyframe_interval: 2,
        },
        record: Some(RecordConfig { output_path: path.clone().into() }),
        audio: if record_audio {
            Some(win_native_media::AudioConfig {
                bitrate: 192_000,
                loopback: true,
                microphone: false, // You can set this to true if microphone capture is also desired
            })
        } else {
            None
        },
        capture_cursor: true,
        stream: None,
    };

    let (tx, rx) = tokio::sync::oneshot::channel();
    
    tauri::async_runtime::spawn(async move {
        if let Ok(mut pipeline) = Pipeline::new(config) {
            if pipeline.start().await.is_ok() {
                let _ = rx.await; // wait for stop signal
                let _ = pipeline.stop().await;
            }
        }
    });

    if let Ok(mut stop_tx) = state.recorder_stop_tx.lock() {
        *stop_tx = Some(tx);
    }

    Ok(output_path_str)
}

#[tauri::command]
fn hide_recorder_window(app_handle: AppHandle) {
    if let Some(window) = app_handle.get_webview_window("recorder") {
        let _ = window.hide();
    }
}

#[tauri::command]
fn stop_native_recording(app_handle: AppHandle, state: State<'_, AppState>) -> Result<String, String> {
    println!("Stopping native hardware-accelerated recording.");
    
    if let Ok(mut stop_tx) = state.recorder_stop_tx.lock() {
        if let Some(tx) = stop_tx.take() {
            let _ = tx.send(());
        }
    }
    
    // Send notification
    let body = "Screen recording saved successfully!";
    show_app_notification(&state, "Shotera", body, None);

    Ok("Recording stopped and saved to MP4.".into())
}


#[tauri::command]
fn resize_recorder_window(app_handle: AppHandle, compact: bool) -> Result<(), String> {
    use tauri::Manager;
    if let Some(window) = app_handle.get_webview_window("recorder") {
        if compact {
            let _ = window.set_size(tauri::LogicalSize::new(280.0, 80.0));
            if let Ok(Some(monitor)) = window.current_monitor() {
                let size = monitor.size();
                let scale_factor = monitor.scale_factor();
                let x = (size.width as f64 - (300.0 * scale_factor)) as i32;
                let y = (size.height as f64 - (120.0 * scale_factor)) as i32;
                let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
            }
        } else {
            let _ = window.set_size(tauri::LogicalSize::new(620.0, 500.0));
            let _ = window.center();
        }
    }
    Ok(())
}

fn open_recorder_view(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("recorder") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
            return Ok(());
        }
    }

    if let Some(window) = app_handle.get_webview_window("recorder") {
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.emit("recorder-opened", ());
    } else {
        // Create the recorder window if it doesn't exist
        let builder = tauri::WebviewWindowBuilder::new(
            &app_handle,
            "recorder",
            tauri::WebviewUrl::App("index.html".into())
        )
        .title("Screen Recorder")
        .inner_size(620.0, 500.0)
        .resizable(false)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .center();
        
        builder.build().map_err(|e| e.to_string())?;
    }
    
    Ok(())
}

fn show_app_notification(state: &State<'_, AppState>, title: &str, body: &str, image_path: Option<&str>) {
    if let Ok(show) = state.show_notifications.lock() {
        if !*show {
            return;
        }
    }
    let mut notification = notify_rust::Notification::new();
    
    #[cfg(target_os = "windows")]
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

fn capture_screen_to_state(_app_handle: &AppHandle, state: &State<'_, AppState>) -> Result<(), String> {
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
    Ok(())
}

#[tauri::command]
fn save_zoom_snapshot(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    base64_data: String,
) -> Result<(), String> {
    let bytes = BASE64_STANDARD.decode(&base64_data).map_err(|e| e.to_string())?;
    let img = image::load_from_memory(&bytes).map_err(|e| e.to_string())?.to_rgba8();
    
    {
        let mut last_ss = state.last_screenshot.lock().map_err(|e| e.to_string())?;
        *last_ss = Some(img);
    }
    
    if let Some(window) = app_handle.get_webview_window("screenshot") {
        window.emit("screenshot-captured", ()).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Function to trigger screenshot and notify the screenshot window
fn trigger_screenshot(app_handle: &AppHandle, state: &State<'_, AppState>) -> Result<(), String> {
    if let Some(zoom_window) = app_handle.get_webview_window("zoom") {
        if zoom_window.is_visible().unwrap_or(false) {
            let _ = zoom_window.emit("request-zoom-snapshot", ());
            return Ok(());
        }
    }

    capture_screen_to_state(app_handle, state)?;
    // Notify the screenshot window to load the new image
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
    let body = match lang.as_str() {
        "de" => "Vollbild-Screenshot gespeichert und in die Zwischenablage kopiert!",
        "ru" => "Снимок экрана сохранен и скопирован в буфер обмена!",
        "az" => "Tam ekran şəkli yadda saxlanıldı və mübadilə buferinə kopyalandı!",
        "tr" => "Tam ekran görüntüsü kaydedildi ve panoya kopyalandı!",
        _ => "Full screenshot saved and copied to clipboard!",
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
        let body = match lang.as_str() {
            "de" => "Bild in die Cloud hochgeladen, Link kopiert!",
            "ru" => "Изображение загружено в облако, ссылка скопирована!",
            "az" => "Şəkil buluda yükləndi və link mübadilə buferinə kopyalandı!",
            "tr" => "Görsel buluta yüklendi ve link panoya kopyalandı!",
            _ => "Image uploaded to cloud and link copied to clipboard!",
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
    let body = match lang.as_str() {
        "az" => "Ekran şəkli mübadilə buferinə kopyalandı!",
        "tr" => "Ekran görüntüsü panoya kopyalandı!",
        _ => "Screenshot copied to clipboard!",
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
    let body = match lang.as_str() {
        "az" => "Ekran şəkli uğurla yadda saxlanıldı!",
        "tr" => "Ekran görüntüsü başarıyla kaydedildi!",
        _ => "Screenshot saved successfully!",
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

fn register_all_shortcuts_helper(
    app_handle: &AppHandle,
    reg_shortcut_str: &str,
    fs_shortcut_str: &str,
    timer_shortcut_str: &str,
    zoom_shortcut_str: &str,
    live_zoom_shortcut_str: &str,
    record_shortcut_str: &str,
) -> Result<(), String> {
    use std::str::FromStr;
    let _ = app_handle.global_shortcut().unregister_all();

    if let Ok(sc) = Shortcut::from_str(&reg_shortcut_str.to_lowercase()) {
        let _ = app_handle.global_shortcut().register(sc);
    }
    if let Ok(sc) = Shortcut::from_str(&fs_shortcut_str.to_lowercase()) {
        let _ = app_handle.global_shortcut().register(sc);
    }
    if let Ok(sc) = Shortcut::from_str(&timer_shortcut_str.to_lowercase()) {
        let _ = app_handle.global_shortcut().register(sc);
    }
    if let Ok(sc) = Shortcut::from_str(&zoom_shortcut_str.to_lowercase()) {
        let _ = app_handle.global_shortcut().register(sc);
    }
    if let Ok(sc) = Shortcut::from_str(&live_zoom_shortcut_str.to_lowercase()) {
        let _ = app_handle.global_shortcut().register(sc);
    }
    if let Ok(sc) = Shortcut::from_str(&record_shortcut_str.to_lowercase()) {
        let _ = app_handle.global_shortcut().register(sc);
    }
    Ok(())
}

#[tauri::command]
fn update_shortcuts(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    region_shortcut: String,
    fullscreen_shortcut: String,
    zoom_shortcut: Option<String>,
    timer_shortcut: Option<String>,
    live_zoom_shortcut: Option<String>,
    record_shortcut: Option<String>,
) -> Result<(), String> {
    let timer_str = timer_shortcut.unwrap_or_else(|| state.break_timer_shortcut.lock().unwrap().clone());
    let zoom_str = zoom_shortcut.unwrap_or_else(|| state.zoom_shortcut.lock().unwrap().clone());
    let live_zoom_str = live_zoom_shortcut.unwrap_or_else(|| state.live_zoom_shortcut.lock().unwrap().clone());
    let record_str = record_shortcut.unwrap_or_else(|| state.record_shortcut.lock().unwrap().clone());

    register_all_shortcuts_helper(
        &app_handle,
        &region_shortcut,
        &fullscreen_shortcut,
        &timer_str,
        &zoom_str,
        &live_zoom_str,
        &record_str,
    )?;

    if let Ok(mut reg_state) = state.region_shortcut.lock() {
        *reg_state = region_shortcut.to_lowercase();
    }
    if let Ok(mut fs_state) = state.fullscreen_shortcut.lock() {
        *fs_state = fullscreen_shortcut.to_lowercase();
    }
    if let Ok(mut timer_state) = state.break_timer_shortcut.lock() {
        *timer_state = timer_str.to_lowercase();
    }
    if let Ok(mut zoom_state) = state.zoom_shortcut.lock() {
        *zoom_state = zoom_str.to_lowercase();
    }
    if let Ok(mut live_zoom_state) = state.live_zoom_shortcut.lock() {
        *live_zoom_state = live_zoom_str.to_lowercase();
    }
    if let Ok(mut record_state) = state.record_shortcut.lock() {
        *record_state = record_str.to_lowercase();
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
        let (capture_label, settings_label, quit_label) = match lang.as_str() {
            "de" => ("Screenshot erstellen", "Einstellungen", "Beenden"),
            "ru" => ("Сделать снимок экрана", "Настройки", "Выход"),
            "az" => ("Ekran Şəkli Al", "Tənzimləmələr", "Çıxış"),
            "tr" => ("Ekran Görüntüsü Al", "Ayarlar", "Çıkış"),
            _ => ("Take Screenshot", "Settings", "Quit"),
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
    if let Some(zoom_window) = app_handle.get_webview_window("zoom") {
        if zoom_window.is_visible().unwrap_or(false) {
            let _ = zoom_window.set_focus();
        }
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
        
        let _ = window.set_fullscreen(true);
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
fn open_break_timer(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("timer") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
            return Ok(());
        }
        let _ = window.set_fullscreen(true);
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.emit("timer-opened", ());
    }
    Ok(())
}

#[derive(Clone, serde::Serialize)]
struct ZoomPayload {
    cursor_x: f32,
    cursor_y: f32,
    is_live: bool,
}

#[tauri::command]
fn open_zoom_view(app_handle: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("zoom") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
            return Ok(());
        }
    }

    capture_screen_to_state(&app_handle, &state)?;

    let monitors = xcap::Monitor::all().unwrap_or_default();
    let (cursor_x, cursor_y) = if !monitors.is_empty() {
        let monitor = &monitors[0];
        if let Some((cx, cy)) = get_cursor_position() {
            let mx = monitor.x().unwrap_or(0);
            let my = monitor.y().unwrap_or(0);
            let mw = monitor.width().unwrap_or(1920) as f32;
            let mh = monitor.height().unwrap_or(1080) as f32;
            (
                ((cx - mx) as f32 / mw).clamp(0.0, 1.0),
                ((cy - my) as f32 / mh).clamp(0.0, 1.0),
            )
        } else {
            (0.5, 0.5)
        }
    } else {
        (0.5, 0.5)
    };

    if let Some(window) = app_handle.get_webview_window("zoom") {
        let _ = window.emit("zoom-captured", ZoomPayload { cursor_x, cursor_y, is_live: false });
    }
    Ok(())
}

#[cfg(target_os = "windows")]
mod live_zoom {
    use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
    use std::thread;
    use std::time::Duration;
    use windows_sys::Win32::Foundation::POINT;
    use windows_sys::Win32::UI::HiDpi::{SetProcessDpiAwarenessContext, DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2};
    use windows_sys::Win32::UI::WindowsAndMessaging::{GetPhysicalCursorPos, GetSystemMetrics, SM_CXSCREEN, SM_CYSCREEN};

    #[link(name = "magnification")]
    extern "system" {
        pub fn MagInitialize() -> windows_sys::Win32::Foundation::BOOL;
        pub fn MagUninitialize() -> windows_sys::Win32::Foundation::BOOL;
        pub fn MagSetFullscreenTransform(magLevel: f32, xOffset: i32, yOffset: i32) -> windows_sys::Win32::Foundation::BOOL;
    }

    static LIVE_ZOOM_ACTIVE: AtomicBool = AtomicBool::new(false);
    static ZOOM_LEVEL_BITS: AtomicU32 = AtomicU32::new(2.0f32.to_bits());

    pub fn toggle_live_zoom() -> bool {
        if LIVE_ZOOM_ACTIVE.load(Ordering::SeqCst) {
            stop_live_zoom();
            false
        } else {
            start_live_zoom();
            true
        }
    }

    pub fn start_live_zoom() {
        if LIVE_ZOOM_ACTIVE.load(Ordering::SeqCst) {
            return;
        }
        LIVE_ZOOM_ACTIVE.store(true, Ordering::SeqCst);

        thread::spawn(|| {
            unsafe {
                SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);

                if MagInitialize() == 0 {
                    LIVE_ZOOM_ACTIVE.store(false, Ordering::SeqCst);
                    return;
                }
            }

            let (screen_w, screen_h) = unsafe {
                let w = GetSystemMetrics(SM_CXSCREEN);
                let h = GetSystemMetrics(SM_CYSCREEN);
                if w > 0 && h > 0 { (w as f32, h as f32) } else { (1920.0, 1080.0) }
            };

            while LIVE_ZOOM_ACTIVE.load(Ordering::SeqCst) {
                let mag = f32::from_bits(ZOOM_LEVEL_BITS.load(Ordering::SeqCst));
                let mut pt = POINT { x: 0, y: 0 };
                unsafe {
                    GetPhysicalCursorPos(&mut pt);
                }

                let view_w = screen_w / mag;
                let view_h = screen_h / mag;

                let max_x = screen_w - view_w;
                let max_y = screen_h - view_h;

                // Round offsets to whole integer pixel boundaries to prevent DWM subpixel blurring
                let x_offset = (pt.x as f32 - view_w / 2.0).clamp(0.0, max_x).round() as i32;
                let y_offset = (pt.y as f32 - view_h / 2.0).clamp(0.0, max_y).round() as i32;

                unsafe {
                    MagSetFullscreenTransform(mag, x_offset, y_offset);
                }

                thread::sleep(Duration::from_millis(16)); // ~60 FPS smooth real-time live desktop update
            }

            unsafe {
                MagSetFullscreenTransform(1.0, 0, 0);
                MagUninitialize();
            }
        });
    }

    pub fn stop_live_zoom() {
        LIVE_ZOOM_ACTIVE.store(false, Ordering::SeqCst);
    }
}

#[tauri::command]
fn open_live_zoom_view(app_handle: AppHandle, _state: State<'_, AppState>) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("zoom") {
        let _ = window.hide();
    }
    if let Some(window) = app_handle.get_webview_window("live_zoom") {
        let _ = window.hide();
    }

    #[cfg(target_os = "windows")]
    {
        live_zoom::toggle_live_zoom();
    }
    Ok(())
}

#[tauri::command]
fn show_zoom_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("zoom") {
        let _ = window.set_fullscreen(true);
        let _ = window.show();
        let _ = window.set_focus();
    }
    Ok(())
}

#[tauri::command]
fn hide_timer_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("timer") {
        let _ = window.hide();
    }
    Ok(())
}

#[tauri::command]
fn hide_zoom_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("zoom") {
        let _ = window.hide();
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
    let body = match lang.as_str() {
        "de" => "Screenshot erfolgreich gespeichert!",
        "ru" => "Снимок экрана успешно сохранен!",
        "az" => "Ekran şəkli uğurla yadda saxlanıldı!",
        "tr" => "Ekran görüntüsü başarıyla kaydedildi!",
        _ => "Screenshot saved successfully!",
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
    let body = match lang.as_str() {
        "de" => "Screenshot in die Zwischenablage kopiert!",
        "ru" => "Снимок экрана скопирован в буфер обмена!",
        "az" => "Ekran şəkli mübadilə buferinə kopyalandı!",
        "tr" => "Ekran görüntüsü panoya kopyalandı!",
        _ => "Screenshot copied to clipboard!",
    };
    show_app_notification(&state, "Shotera", body, Some(&temp_path.to_string_lossy()));

    Ok(temp_path.to_string_lossy().to_string())
}


fn log_app_event(app_handle: &AppHandle, level: &str, msg: &str) {
    if let Ok(mut log_dir) = app_handle.path().app_log_dir() {
        let _ = std::fs::create_dir_all(&log_dir);
        log_dir.push("shotera.log");
        let timestamp = chrono::Local::now().format("%Y-%m-%d %H:%M:%S");
        let log_entry = format!("[{}] [{}] {}\n", timestamp, level, msg);
        if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(&log_dir) {
            use std::io::Write;
            let _ = file.write_all(log_entry.as_bytes());
        }
    }
}

#[tauri::command]
fn get_log_file_path(app_handle: AppHandle) -> Result<String, String> {
    let mut log_dir = app_handle.path().app_log_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&log_dir).map_err(|e| e.to_string())?;
    log_dir.push("shotera.log");
    Ok(log_dir.to_string_lossy().to_string())
}

#[tauri::command]
fn write_log_entry(app_handle: AppHandle, level: String, message: String) {
    log_app_event(&app_handle, &level, &message);
}

#[tauri::command]
fn is_autostart_launch() -> bool {
    std::env::args().any(|arg| arg == "--autostart")
}

#[tauri::command]
fn unblock_autostart_registry(app_handle: AppHandle) {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        
        let output = Command::new("reg")
            .args(&["delete", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run", "/v", "Shotera", "/f"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        if let Ok(out) = output {
            if out.status.success() {
                log_app_event(&app_handle, "INFO", "Cleared Windows Task Manager StartupApproved override block for Shotera.");
            }
        }

        // Check if Shotera exists in HKCU Run registry
        let check_run = Command::new("reg")
            .args(&["query", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run", "/v", "Shotera"])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        if let Ok(out_check) = check_run {
            if out_check.status.success() {
                // Ensure executable path is wrapped in double quotes in HKCU Run registry
                if let Ok(exe_path) = std::env::current_exe() {
                    let exe_str = exe_path.to_string_lossy().to_string();
                    let formatted_val = format!("\"{}\" --autostart", exe_str);
                    
                    let output_run = Command::new("reg")
                        .args(&[
                            "add",
                            "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run",
                            "/v",
                            "Shotera",
                            "/t",
                            "REG_SZ",
                            "/d",
                            &formatted_val,
                            "/f",
                        ])
                        .creation_flags(CREATE_NO_WINDOW)
                        .output();

                    if let Ok(out_run) = output_run {
                        if out_run.status.success() {
                            log_app_event(&app_handle, "INFO", &format!("Ensured autostart Registry key double-quote formatting: {}", formatted_val));
                        }
                    }
                }
            }
        }
    }
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
            break_timer_shortcut: Mutex::new("ctrl+3".to_string()),
            zoom_shortcut: Mutex::new("ctrl+1".to_string()),
            live_zoom_shortcut: Mutex::new("ctrl+4".to_string()),
            record_shortcut: Mutex::new("ctrl+5".to_string()),
            pinned_image: Mutex::new(None),

            show_notifications: Mutex::new(true),
            recorder_stop_tx: Mutex::new(None),
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
            let handle = app.handle();
            log_app_event(handle, "INFO", "Shotera starting up...");
            unblock_autostart_registry(handle.clone());

            let is_autostart = std::env::args().any(|arg| arg == "--autostart");
            if is_autostart {
                log_app_event(handle, "INFO", "App launched in background via autostart flag (--autostart)");
            } else {
                log_app_event(handle, "INFO", "App launched manually by user");
            }

            // 1. Setup Global Shortcut Plugin
            let shortcut_plugin = tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app_handle_shortcut, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let state = app_handle_shortcut.state::<AppState>();
                        
                        let reg_shortcut_str = state.region_shortcut.lock().unwrap().clone();
                        let fs_shortcut_str = state.fullscreen_shortcut.lock().unwrap().clone();
                        let timer_shortcut_str = state.break_timer_shortcut.lock().unwrap().clone();
                        let zoom_shortcut_str = state.zoom_shortcut.lock().unwrap().clone();
                        let live_zoom_shortcut_str = state.live_zoom_shortcut.lock().unwrap().clone();
                        let record_shortcut_str = state.record_shortcut.lock().unwrap().clone();
                        
                        if let Ok(timer_sc) = timer_shortcut_str.parse::<Shortcut>() {
                            if shortcut == &timer_sc {
                                let _ = open_break_timer(app_handle_shortcut.clone());
                                return;
                            }
                        }

                        if let Ok(zoom_sc) = zoom_shortcut_str.parse::<Shortcut>() {
                            if shortcut == &zoom_sc {
                                let _ = open_zoom_view(app_handle_shortcut.clone(), state.clone());
                                return;
                            }
                        }

                        if let Ok(live_zoom_sc) = live_zoom_shortcut_str.parse::<Shortcut>() {
                            if shortcut == &live_zoom_sc {
                                let _ = open_live_zoom_view(app_handle_shortcut.clone(), state.clone());
                                return;
                            }
                        }

                        if let Ok(record_sc) = record_shortcut_str.parse::<Shortcut>() {
                            if shortcut == &record_sc {
                                let _ = open_recorder_view(app_handle_shortcut.clone());
                                return;
                            }
                        }

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

            // Register Region, Fullscreen, Zoom, and Break Timer Shortcuts using default values on initial startup
            use std::str::FromStr;
            let reg_shortcut = Shortcut::from_str("ctrl+shift+s").unwrap();
            let fs_shortcut = Shortcut::from_str("ctrl+shift+f").unwrap();
            let timer_shortcut = Shortcut::from_str("ctrl+3").unwrap();
            let zoom_shortcut = Shortcut::from_str("ctrl+1").unwrap();
            let live_zoom_shortcut = Shortcut::from_str("ctrl+4").unwrap();
            let record_shortcut = Shortcut::from_str("ctrl+5").unwrap();
            
            let _ = app.global_shortcut().register(reg_shortcut);
            let _ = app.global_shortcut().register(fs_shortcut);
            let _ = app.global_shortcut().register(timer_shortcut);
            let _ = app.global_shortcut().register(zoom_shortcut);
            let _ = app.global_shortcut().register(live_zoom_shortcut);
            let _ = app.global_shortcut().register(record_shortcut);

            // 2. Setup System Tray with retry mechanism for Windows Fast Startup
            let create_tray = |app_ref: &tauri::App| -> Result<tauri::tray::TrayIcon, tauri::Error> {
                let quit_i = MenuItem::with_id(app_ref, "quit", "Quit", true, None::<&str>)?;
                let settings_i = MenuItem::with_id(app_ref, "settings", "Settings", true, None::<&str>)?;
                let capture_i = MenuItem::with_id(app_ref, "capture", "Take Screenshot", true, None::<&str>)?;
                let timer_i = MenuItem::with_id(app_ref, "timer", "Break Timer (Ctrl+3)", true, None::<&str>)?;
                let zoom_i = MenuItem::with_id(app_ref, "zoom", "Screen Zoom (Ctrl+1)", true, None::<&str>)?;
                let live_zoom_i = MenuItem::with_id(app_ref, "live_zoom", "Live Zoom (Ctrl+4)", true, None::<&str>)?;
                let menu = Menu::with_items(app_ref, &[&capture_i, &zoom_i, &live_zoom_i, &timer_i, &settings_i, &quit_i])?;


                TrayIconBuilder::with_id("main-tray")
                    .menu(&menu)
                    .tooltip("Shotera")
                    .icon(app_ref.default_window_icon().cloned().unwrap())
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
                            "timer" => {
                                let _ = open_break_timer(app_handle_tray.clone());
                            }
                            "zoom" => {
                                let state = app_handle_tray.state::<AppState>();
                                let _ = open_zoom_view(app_handle_tray.clone(), state);
                            }
                            "live_zoom" => {
                                let state = app_handle_tray.state::<AppState>();
                                let _ = open_live_zoom_view(app_handle_tray.clone(), state);
                            }

                            _ => {}
                        }
                    })
                    .build(app_ref)
            };

            let mut tray_res = create_tray(app);
            if tray_res.is_err() {
                log_app_event(handle, "WARN", "System tray creation failed on first attempt, starting retry loop for Fast Startup...");
                for i in 1..=10 {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    tray_res = create_tray(app);
                    if tray_res.is_ok() {
                        log_app_event(handle, "INFO", &format!("System tray created successfully on retry attempt {}", i));
                        break;
                    }
                }
            } else {
                log_app_event(handle, "INFO", "System tray created successfully on first attempt.");
            }

            if let Err(ref err) = tray_res {
                log_app_event(handle, "ERROR", &format!("Failed to create system tray icon after 10 retries: {}", err));
            }

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
            open_break_timer,
            open_zoom_view,
            open_live_zoom_view,
            show_zoom_window,
            hide_timer_window,
            hide_zoom_window,
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
            close_pinned,
            get_log_file_path,
            write_log_entry,
            unblock_autostart_registry,
            is_autostart_launch,
            save_zoom_snapshot,
            get_capture_sources,
            start_native_recording,
            stop_native_recording,
            resize_recorder_window,
            hide_recorder_window
        ])

        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
