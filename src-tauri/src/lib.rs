use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use base64::prelude::*;
use chrono::Local;

struct AppState {
    last_screenshot: Mutex<Option<image::RgbaImage>>,
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
    let image = monitor.capture_image().map_err(|e| e.to_string())?;
    
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
    let image = monitor.capture_image().map_err(|e| e.to_string())?;
    
    // Store in state
    let mut last_ss = state.last_screenshot.lock().map_err(|e| e.to_string())?;
    *last_ss = Some(image.clone());
    drop(last_ss);

    // 2. Save to file (Pictures/Shotera)
    let now = Local::now();
    let filename = now.format("Screenshot_%Y%m%d_%H%M%S.png").to_string();
    let mut path = app_handle.path().picture_dir().map_err(|e| e.to_string())?;
    path.push("Shotera");
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push(filename);
    image.save(&path).map_err(|e| e.to_string())?;
    
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
    
    Ok(())
}

#[tauri::command]
fn trigger_fullscreen_capture_command(app_handle: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    trigger_fullscreen_screenshot(&app_handle, &state)
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
    
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn update_tray_language(app_handle: AppHandle, lang: String) {
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
fn trigger_capture_command(app_handle: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    trigger_screenshot(&app_handle, &state)
}

#[tauri::command]
fn save_base64_image(app_handle: AppHandle, base64_str: String) -> Result<String, String> {
    use base64::prelude::*;
    let bytes = BASE64_STANDARD.decode(base64_str).map_err(|e| e.to_string())?;
    
    let now = Local::now();
    let filename = now.format("Screenshot_%Y%m%d_%H%M%S.png").to_string();
    
    let mut path = app_handle.path().picture_dir().map_err(|e| e.to_string())?;
    path.push("Shotera");
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push(filename);
    
    std::fs::write(&path, bytes).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
fn copy_base64_image_to_clipboard(base64_str: String) -> Result<(), String> {
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
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            last_screenshot: Mutex::new(None),
        })
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 1. Setup Global Shortcut Plugin
            let shortcut_plugin = tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app_handle_shortcut, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let state = app_handle_shortcut.state::<AppState>();
                        
                        if shortcut.matches(Modifiers::CONTROL, Code::PrintScreen)
                            || shortcut.matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::KeyF)
                        {
                            let _ = trigger_fullscreen_screenshot(app_handle_shortcut, &state);
                        } else {
                            let _ = trigger_screenshot(app_handle_shortcut, &state);
                        }
                    }
                })
                .build();
            app.handle().plugin(shortcut_plugin)?;

            // Register Region Shortcuts: PrintScreen and Ctrl+Shift+S
            let printscreen_shortcut = Shortcut::new(None, Code::PrintScreen);
            let ctrl_shift_s_shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyS);
            
            // Register Fullscreen Shortcuts: Ctrl+PrintScreen and Ctrl+Shift+F
            let fs_printscreen_shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::PrintScreen);
            let fs_ctrl_shift_f_shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyF);
            
            let _ = app.global_shortcut().register(printscreen_shortcut);
            let _ = app.global_shortcut().register(ctrl_shift_s_shortcut);
            let _ = app.global_shortcut().register(fs_printscreen_shortcut);
            let _ = app.global_shortcut().register(fs_ctrl_shift_f_shortcut);

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
                            let state = app_handle_tray.state::<AppState>();
                            let _ = trigger_screenshot(app_handle_tray, &state);
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
            trigger_capture_command,
            trigger_fullscreen_capture_command,
            save_base64_image,
            copy_base64_image_to_clipboard,
            update_tray_language
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
