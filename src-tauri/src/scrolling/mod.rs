pub mod capture;
pub mod engine;
pub mod matcher;
pub mod seam;
pub mod stitcher;

use matcher::OverlapMatcher;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};
use serde::{Deserialize, Serialize};
use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrollingSettings {
    #[serde(default = "default_scroll_method", alias = "scrollMethod")]
    pub scroll_method: String,       // "auto", "mouse_wheel", "page_down", "ui_automation"
    #[serde(default = "default_scroll_delay", alias = "scrollDelayMs", alias = "scrollDelay")]
    pub scroll_delay_ms: u64,        // 100 - 1000 ms
    #[serde(default = "default_scroll_amount", alias = "scrollAmount")]
    pub scroll_amount: i32,          // 1 - 5 notches
    #[serde(default = "default_max_scroll_count", alias = "maxScrollCount", alias = "maxSteps")]
    pub max_scroll_count: u32,       // 5 - 300
    #[serde(default = "default_overlap_sensitivity", alias = "overlapSensitivity")]
    pub overlap_sensitivity: String, // "normal", "high", "flexible"
    #[serde(default = "default_stop_on_no_movement", alias = "stopOnNoMovement")]
    pub stop_on_no_movement: bool,   // true
}

fn default_scroll_method() -> String { "auto".into() }
fn default_scroll_delay() -> u64 { 350 }
fn default_scroll_amount() -> i32 { 2 }
fn default_max_scroll_count() -> u32 { 60 }
fn default_overlap_sensitivity() -> String { "normal".into() }
fn default_stop_on_no_movement() -> bool { true }

impl Default for ScrollingSettings {
    fn default() -> Self {
        Self {
            scroll_method: default_scroll_method(),
            scroll_delay_ms: default_scroll_delay(),
            scroll_amount: default_scroll_amount(),
            max_scroll_count: default_max_scroll_count(),
            overlap_sensitivity: default_overlap_sensitivity(),
            stop_on_no_movement: default_stop_on_no_movement(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenRect {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub scale_factor: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct ScrollingProgressPayload {
    pub current_step: u32,
    pub max_steps: u32,
    pub current_height: u32,
    pub status: String, // "scrolling", "completed", "cancelled", "stopped"
    pub is_manual: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confidence: Option<f32>,
}

pub struct ScrollingManager {
    is_running: Arc<AtomicBool>,
    is_cancelled: Arc<AtomicBool>,
}

impl ScrollingManager {
    pub fn new() -> Self {
        Self {
            is_running: Arc::new(AtomicBool::new(false)),
            is_cancelled: Arc::new(AtomicBool::new(false)),
        }
    }

    pub fn is_active(&self) -> bool {
        self.is_running.load(Ordering::SeqCst)
    }

    pub fn stop(&self) {
        self.is_running.store(false, Ordering::SeqCst);
    }

    pub fn cancel(&self) {
        self.is_cancelled.store(true, Ordering::SeqCst);
        self.is_running.store(false, Ordering::SeqCst);
    }
}

impl Default for ScrollingManager {
    fn default() -> Self {
        Self::new()
    }
}

use std::sync::OnceLock;

static CURRENT_SESSION: OnceLock<ScrollingManager> = OnceLock::new();

pub fn get_session() -> &'static ScrollingManager {
    CURRENT_SESSION.get_or_init(ScrollingManager::new)
}

#[cfg(target_os = "windows")]
fn is_esc_pressed() -> bool {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
    unsafe {
        (GetAsyncKeyState(VK_ESCAPE as i32) as u16 & 0x8000) != 0
    }
}

#[cfg(target_os = "windows")]
fn is_finish_key_pressed() -> bool {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
    unsafe {
        let space = (GetAsyncKeyState(VK_SPACE as i32) as u16 & 0x8000) != 0;
        let enter = (GetAsyncKeyState(VK_RETURN as i32) as u16 & 0x8000) != 0;
        space || enter
    }
}

#[cfg(not(target_os = "windows"))]
fn is_esc_pressed() -> bool {
    false
}

#[cfg(not(target_os = "windows"))]
fn is_finish_key_pressed() -> bool {
    false
}

/// Computes the bottom coordinate (in physical screen pixels) of the target application viewport/window,
/// clamped to the monitor work area (which excludes the Windows taskbar).
#[cfg(target_os = "windows")]
fn get_viewport_bottom(target_x: i32, target_y: i32, sel_bottom: i32) -> i32 {
    use windows_sys::Win32::Foundation::{HWND, POINT, RECT};
    use windows_sys::Win32::Graphics::Dwm::{DwmGetWindowAttribute, DWMWA_EXTENDED_FRAME_BOUNDS};
    use windows_sys::Win32::Graphics::Gdi::{GetMonitorInfoW, MonitorFromPoint, MONITORINFO, MONITOR_DEFAULTTONEAREST};
    use windows_sys::Win32::UI::WindowsAndMessaging::{GetAncestor, GetWindowRect, WindowFromPoint, GA_ROOT};

    unsafe {
        let pt = POINT { x: target_x, y: target_y };

        // 1. Get monitor work area (excludes Windows taskbar)
        let hmon = MonitorFromPoint(pt, MONITOR_DEFAULTTONEAREST);
        let mut minfo: MONITORINFO = std::mem::zeroed();
        minfo.cbSize = std::mem::size_of::<MONITORINFO>() as u32;
        let work_bottom = if GetMonitorInfoW(hmon, &mut minfo) != 0 {
            minfo.rcWork.bottom
        } else {
            sel_bottom
        };

        // 2. Get window under target point
        let hwnd: HWND = WindowFromPoint(pt);
        if hwnd != std::ptr::null_mut() {
            let root_hwnd = GetAncestor(hwnd, GA_ROOT);
            let target_hwnd = if root_hwnd != std::ptr::null_mut() { root_hwnd } else { hwnd };

            let mut wrect: RECT = std::mem::zeroed();
            let dwm_res = DwmGetWindowAttribute(
                target_hwnd,
                DWMWA_EXTENDED_FRAME_BOUNDS as u32,
                &mut wrect as *mut _ as _,
                std::mem::size_of::<RECT>() as u32,
            );

            let win_rect_valid = if dwm_res == 0 {
                true
            } else {
                GetWindowRect(target_hwnd, &mut wrect) != 0
            };

            if win_rect_valid {
                let win_bottom = wrect.bottom.min(work_bottom);
                if win_bottom > sel_bottom {
                    return win_bottom;
                }
            }
        }

        if work_bottom > sel_bottom {
            work_bottom
        } else {
            sel_bottom
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn get_viewport_bottom(_target_x: i32, _target_y: i32, sel_bottom: i32) -> i32 {
    sel_bottom
}

pub fn show_scrolling_hud_if_safe(app_handle: &AppHandle, phys_x: i32, phys_y: i32, phys_w: u32, phys_h: u32) {
    if let Some(window) = app_handle.get_webview_window("scrolling_hud") {
        let monitor = app_handle
            .monitor_from_point(phys_x as f64, phys_y as f64)
            .ok()
            .flatten()
            .or_else(|| app_handle.primary_monitor().ok().flatten());

        if let Some(monitor) = monitor {
            let mon_pos = monitor.position();
            let mon_size = monitor.size();
            let scale_factor = monitor.scale_factor();

            let mon_x = mon_pos.x;
            let mon_y = mon_pos.y;
            let mon_w = mon_size.width as i32;
            let mon_h = mon_size.height as i32;

            let hud_w = (320.0 * scale_factor).round() as i32;
            let hud_h = (72.0 * scale_factor).round() as i32;

            let sel_left = phys_x;
            let sel_right = phys_x + phys_w as i32;
            let sel_top = phys_y;
            let sel_bottom = phys_y + phys_h as i32;

            let safe_margin = 16;
            let mut outside_pos: Option<(i32, i32)> = None;

            // 1. Above selection on monitor (e.g. browser tab bar / window titlebar)
            if sel_top - mon_y >= hud_h + 8 {
                let x = ((sel_left + sel_right - hud_w) / 2).clamp(mon_x + 12, mon_x + mon_w - hud_w - 12);
                let y = (sel_top - hud_h - 6).max(mon_y + 8);
                outside_pos = Some((x, y));
            }
            // 2. Right side of selection on monitor
            else if (mon_x + mon_w) - sel_right >= hud_w + safe_margin {
                let x = sel_right + safe_margin / 2;
                let y = (sel_top + (phys_h as i32 - hud_h) / 2).clamp(mon_y + 12, mon_y + mon_h - hud_h - 12);
                outside_pos = Some((x, y));
            }
            // 3. Left side of selection on monitor
            else if sel_left - mon_x >= hud_w + safe_margin {
                let x = sel_left - hud_w - safe_margin / 2;
                let y = (sel_top + (phys_h as i32 - hud_h) / 2).clamp(mon_y + 12, mon_y + mon_h - hud_h - 12);
                outside_pos = Some((x, y));
            }
            // 4. Below selection: place at the very bottom edge of the monitor (over the taskbar, not in webpage)
            else if (mon_y + mon_h) - sel_bottom >= hud_h + 8 {
                let x = ((sel_left + sel_right - hud_w) / 2).clamp(mon_x + 12, mon_x + mon_w - hud_w - 12);
                let y = mon_y + mon_h - hud_h - 6;
                outside_pos = Some((x, y));
            }

            // 5. Multi-monitor fallback: place on another monitor if current monitor is covered
            if outside_pos.is_none() {
                if let Ok(monitors) = app_handle.available_monitors() {
                    for other_mon in monitors {
                        let op = other_mon.position();
                        if op.x != mon_x || op.y != mon_y {
                            let ox = op.x + 32;
                            let oy = op.y + 32;
                            outside_pos = Some((ox, oy));
                            break;
                        }
                    }
                }
            }

            if let Some((x, y)) = outside_pos {
                let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
                #[cfg(target_os = "windows")]
                {
                    if let Ok(hwnd) = window.hwnd() {
                        unsafe {
                            use windows_sys::Win32::UI::WindowsAndMessaging::*;
                            // Exclude HUD from screenshot capture
                            SetWindowDisplayAffinity(
                                hwnd.0 as _,
                                WDA_EXCLUDEFROMCAPTURE,
                            );
                            // Add WS_EX_NOACTIVATE so HUD never steals keyboard focus from target app
                            let ex_style = GetWindowLongPtrW(hwnd.0 as _, GWL_EXSTYLE);
                            SetWindowLongPtrW(hwnd.0 as _, GWL_EXSTYLE, ex_style | WS_EX_NOACTIVATE as isize);
                            ShowWindow(hwnd.0 as _, SW_SHOWNOACTIVATE);
                            SetWindowPos(
                                hwnd.0 as _,
                                HWND_TOPMOST,
                                x,
                                y,
                                0,
                                0,
                                SWP_NOSIZE | SWP_NOACTIVATE | SWP_SHOWWINDOW,
                            );
                        }
                    }
                }
                #[cfg(not(target_os = "windows"))]
                {
                    let _ = window.show();
                    let _ = window.set_always_on_top(true);
                }
                return;
            }
        }

        // If selection covers 100% of all monitors, hide HUD during capture so it's never captured!
        let _ = window.hide();
    }
}

pub fn hide_scrolling_hud(app_handle: &AppHandle) {
    if let Some(window) = app_handle.get_webview_window("scrolling_hud") {
        let _ = window.hide();
    }
}

/// Starts the asynchronous scrolling screenshot capture workflow.
#[tauri::command]
pub async fn start_scrolling_capture(
    app_handle: AppHandle,
    rect: ScreenRect,
    settings: Option<ScrollingSettings>,
) -> Result<(), String> {
    // Resolve effective settings: prefer valid passed settings, fallback to shared AppState
    let state = app_handle.state::<AppState>();
    let cfg = match settings {
        Some(s) if s.max_scroll_count > 0 => {
            if let Ok(mut state_s) = state.scrolling_settings.lock() {
                *state_s = s.clone();
            }
            s
        }
        _ => {
            state
                .scrolling_settings
                .lock()
                .map(|s| s.clone())
                .unwrap_or_default()
        }
    };

    println!(
        "[Scrolling] Starting capture: method={}, delay={}ms, amount={}, max_steps={}, sensitivity={}, stop_on_no_movement={}",
        cfg.scroll_method, cfg.scroll_delay_ms, cfg.scroll_amount, cfg.max_scroll_count, cfg.overlap_sensitivity, cfg.stop_on_no_movement
    );

    let session = get_session();
    if session.is_active() {
        session.cancel();
        tokio::time::sleep(std::time::Duration::from_millis(80)).await;
    }

    session.is_running.store(true, Ordering::SeqCst);
    session.is_cancelled.store(false, Ordering::SeqCst);

    // Convert logical coordinates from frontend to physical screen pixels
    let scale = if rect.scale_factor > 0.0 { rect.scale_factor } else { 1.0 };
    let phys_x = (rect.x as f64 * scale).round() as i32;
    let phys_y = (rect.y as f64 * scale).round() as i32;
    let phys_w = (rect.width as f64 * scale).round() as u32;
    let phys_h = (rect.height as f64 * scale).round() as u32;

    if phys_w < 20 || phys_h < 20 {
        session.is_running.store(false, Ordering::SeqCst);
        return Err("Selected area is too small for scrolling capture".into());
    }

    // Hide the selection overlay window so the target application is fully visible and interactive
    if let Some(ss_win) = app_handle.get_webview_window("screenshot") {
        let _ = ss_win.hide();
    }

    show_scrolling_hud_if_safe(&app_handle, phys_x, phys_y, phys_w, phys_h);

    // Brief pause to allow OS compositor (DWM) to flush the hidden overlay
    tokio::time::sleep(std::time::Duration::from_millis(80)).await;

    let app_handle_clone = app_handle.clone();
    let is_running_flag = session.is_running.clone();
    let is_cancelled_flag = session.is_cancelled.clone();

    // Spawn async background task for capture loop
    tauri::async_runtime::spawn(async move {
        let target_center_x = phys_x + (phys_w / 2) as i32;
        let target_center_y = phys_y + (phys_h / 2) as i32;

        let scroll_engine = engine::create_scroll_engine(&cfg.scroll_method);
        let matcher = matcher::TemplateOverlapMatcher::new();
        let match_config = matcher::MatchingConfig {
            sensitivity: cfg.overlap_sensitivity.clone(),
            max_mad_threshold: match cfg.overlap_sensitivity.as_str() {
                "high" => 18.0,
                "flexible" => 45.0,
                _ => 32.0,
            },
        };

        // Max height protection: 32,000 pixels
        let mut stitcher = stitcher::ImageStitcher::new(32_000);

        let is_manual = cfg.scroll_method.eq_ignore_ascii_case("manual");
        let max_steps = if is_manual { cfg.max_scroll_count.max(250) } else { cfg.max_scroll_count };

        // 1. Capture initial frame
        let initial_frame = match capture::capture_screen_rect(phys_x, phys_y, phys_w, phys_h) {
            Ok(img) => img,
            Err(e) => {
                is_running_flag.store(false, Ordering::SeqCst);
                let _ = app_handle_clone.emit("scrolling-error", e);
                return;
            }
        };

        stitcher.set_initial_frame(initial_frame.clone());

        let _ = app_handle_clone.emit(
            "scrolling-progress",
            ScrollingProgressPayload {
                current_step: 1,
                max_steps,
                current_height: stitcher.current_height(),
                status: "scrolling".into(),
                is_manual,
                confidence: Some(1.0),
            },
        );

        let mut prev_frame = initial_frame.clone();
        let mut step = 1;

        if is_manual {
            // MANUAL SCROLLING MODE:
            // Shotera does not automate window scrolling.
            // The user manually scrolls using mouse wheel or touchpad.
            // We detect motion and wait for the frame to STABILIZE before appending.
            // This completely eliminates mid-animation tearing, motion blur, and horizontal seam lines.

            let mut prev_stabilized_frame = initial_frame.clone();
            let mut last_sample = initial_frame.clone();
            let mut consecutive_stable_count = 0u32;
            let mut motion_active = false;
            let mut last_stitch_time = std::time::Instant::now();

            while step <= max_steps && is_running_flag.load(Ordering::SeqCst) {
                // Check ESC key -> cancel and discard
                if is_esc_pressed() || is_cancelled_flag.load(Ordering::SeqCst) {
                    is_cancelled_flag.store(true, Ordering::SeqCst);
                    is_running_flag.store(false, Ordering::SeqCst);
                    break;
                }

                // Check Enter / Space key -> finish capture and save
                if is_finish_key_pressed() {
                    is_running_flag.store(false, Ordering::SeqCst);
                    break;
                }

                tokio::time::sleep(std::time::Duration::from_millis(60)).await;

                if !is_running_flag.load(Ordering::SeqCst) {
                    break;
                }

                let curr_frame = match capture::capture_screen_rect(phys_x, phys_y, phys_w, phys_h) {
                    Ok(img) => img,
                    Err(_) => continue,
                };

                // Check if current frame changed compared to last sample (60ms ago)
                let is_moving = !matcher::TemplateOverlapMatcher::are_identical(&last_sample, &curr_frame);
                last_sample = curr_frame.clone();

                if is_moving {
                    motion_active = true;
                    consecutive_stable_count = 0;

                    // Safety valve: If user has been scrolling continuously for > 350ms without pausing,
                    // check displacement. If dy is large enough (> 35% of h), commit a slice
                    // so we don't lose overlap.
                    if last_stitch_time.elapsed().as_millis() > 350 {
                        if let Some(overlap) = matcher.find_vertical_overlap(&prev_stabilized_frame, &curr_frame, &match_config) {
                            if !overlap.is_identical && overlap.dy >= (phys_h as f32 * 0.35) as u32 {
                                let seam_res = seam::SeamFinder::find_optimal_seam(&prev_stabilized_frame, &curr_frame, overlap.dy);
                                let appended = stitcher.append_frame_with_seam(&curr_frame, overlap.dy, seam_res.seam_k);
                                if appended {
                                    step += 1;
                                    prev_stabilized_frame = curr_frame.clone();
                                    last_stitch_time = std::time::Instant::now();
                                    let _ = app_handle_clone.emit(
                                        "scrolling-progress",
                                        ScrollingProgressPayload {
                                            current_step: step,
                                            max_steps,
                                            current_height: stitcher.current_height(),
                                            status: "scrolling".into(),
                                            is_manual: true,
                                            confidence: Some(seam_res.confidence),
                                        },
                                    );
                                }
                            }
                        }
                    }
                } else {
                    // Frame was identical to last sample (no motion for 60ms)
                    consecutive_stable_count += 1;

                    // When stable for 2 consecutive checks (>= 120ms of no movement) after motion:
                    if motion_active && consecutive_stable_count >= 2 {
                        motion_active = false;
                        consecutive_stable_count = 0;

                        // The screen has completely settled and is 100% stationary and sharp!
                        if let Some(overlap) = matcher.find_vertical_overlap(&prev_stabilized_frame, &curr_frame, &match_config) {
                            if !overlap.is_identical && overlap.dy >= 2 {
                                let seam_res = seam::SeamFinder::find_optimal_seam(&prev_stabilized_frame, &curr_frame, overlap.dy);
                                let appended = stitcher.append_frame_with_seam(&curr_frame, overlap.dy, seam_res.seam_k);
                                if !appended {
                                    break;
                                }
                                step += 1;
                                prev_stabilized_frame = curr_frame.clone();
                                last_stitch_time = std::time::Instant::now();

                                let _ = app_handle_clone.emit(
                                    "scrolling-progress",
                                    ScrollingProgressPayload {
                                        current_step: step,
                                        max_steps,
                                        current_height: stitcher.current_height(),
                                        status: "scrolling".into(),
                                        is_manual: true,
                                        confidence: Some(seam_res.confidence),
                                    },
                                );
                            }
                        }
                    }
                }
            }

            // On manual finish (Enter/Space pressed or button clicked):
            // Check if there is any uncommitted movement in the settled frame
            if let Ok(final_frame) = capture::capture_screen_rect(phys_x, phys_y, phys_w, phys_h) {
                if let Some(overlap) = matcher.find_vertical_overlap(&prev_stabilized_frame, &final_frame, &match_config) {
                    if !overlap.is_identical && overlap.dy >= 2 {
                        let seam_res = seam::SeamFinder::find_optimal_seam(&prev_stabilized_frame, &final_frame, overlap.dy);
                        stitcher.append_frame_with_seam(&final_frame, overlap.dy, seam_res.seam_k);
                    }
                }
            }
        } else {
            // AUTOMATED SCROLLING MODE:
            let mut consecutive_no_movement = 0u32;
            let mut consecutive_match_failures = 0u32;
            let mut cursor_cycle = 0u32;
            let mut current_confidence = 1.0f32;

            while step <= max_steps && is_running_flag.load(Ordering::SeqCst) {
                // Check ESC key -> cancel
                if is_esc_pressed() || is_cancelled_flag.load(Ordering::SeqCst) {
                    is_cancelled_flag.store(true, Ordering::SeqCst);
                    is_running_flag.store(false, Ordering::SeqCst);
                    break;
                }

                // Check Enter / Space key -> finish early and keep
                if is_finish_key_pressed() {
                    is_running_flag.store(false, Ordering::SeqCst);
                    break;
                }

                // Dynamic cursor position to avoid center hover traps (video embeds, iframes, dropdowns)
                let current_target_x = match cursor_cycle % 3 {
                    0 => phys_x + (phys_w as f64 * 0.35).round() as i32, // Safe content gutter / main text column
                    1 => phys_x + (phys_w as f64 * 0.50).round() as i32, // Center
                    _ => phys_x + (phys_w as f64 * 0.25).round() as i32, // Left column
                };
                let current_target_y = phys_y + (phys_h as f64 * 0.50).round() as i32;

                // Perform scroll action on target window
                if let Err(e) = scroll_engine.scroll_down((current_target_x, current_target_y), cfg.scroll_amount) {
                    eprintln!("[Scrolling] Scroll engine error: {}", e);
                }

                // If previous step was stalled, send an additional Down Arrow keyboard pulse
                // to break out of any iframe / widget hover trap
                if consecutive_no_movement > 0 {
                    #[cfg(target_os = "windows")]
                    {
                        use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
                        unsafe {
                            let scan_code = MapVirtualKeyW(VK_DOWN as u32, 0) as u16;
                            for _ in 0..4 {
                                let mut down = INPUT {
                                    r#type: INPUT_KEYBOARD,
                                    Anonymous: windows_sys::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                                        ki: KEYBDINPUT { wVk: VK_DOWN, wScan: scan_code, dwFlags: 0, time: 0, dwExtraInfo: 0 },
                                    },
                                };
                                SendInput(1, &mut down, std::mem::size_of::<INPUT>() as i32);
                                std::thread::sleep(std::time::Duration::from_millis(10));
                                let mut up = INPUT {
                                    r#type: INPUT_KEYBOARD,
                                    Anonymous: windows_sys::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                                        ki: KEYBDINPUT { wVk: VK_DOWN, wScan: scan_code, dwFlags: KEYEVENTF_KEYUP, time: 0, dwExtraInfo: 0 },
                                    },
                                };
                                SendInput(1, &mut up, std::mem::size_of::<INPUT>() as i32);
                                std::thread::sleep(std::time::Duration::from_millis(10));
                            }
                        }
                    }
                }

                // Wait for scroll animation / DOM repaint / lazy load
                // If previous step showed no movement, wait extra time for lazy loading / network requests
                let base_delay = cfg.scroll_delay_ms.clamp(100, 1500);
                let delay = if consecutive_no_movement > 0 {
                    (base_delay + 300).min(1500)
                } else {
                    base_delay
                };

                let check_interval = 40;
                let mut elapsed = 0;
                while elapsed < delay {
                    tokio::time::sleep(std::time::Duration::from_millis(check_interval)).await;
                    elapsed += check_interval;
                    if is_esc_pressed() || is_cancelled_flag.load(Ordering::SeqCst) {
                        is_cancelled_flag.store(true, Ordering::SeqCst);
                        is_running_flag.store(false, Ordering::SeqCst);
                        break;
                    }
                    if is_finish_key_pressed() {
                        is_running_flag.store(false, Ordering::SeqCst);
                        break;
                    }
                    if !is_running_flag.load(Ordering::SeqCst) {
                        break;
                    }
                }

                if !is_running_flag.load(Ordering::SeqCst) {
                    break;
                }

                // Capture new frame
                let mut curr_frame = match capture::capture_screen_rect(phys_x, phys_y, phys_w, phys_h) {
                    Ok(img) => img,
                    Err(e) => {
                        eprintln!("[Scrolling] Capture error at step {}: {}", step, e);
                        break;
                    }
                };

                // Detect overlap between previous frame and current frame
                let mut matched_overlap = matcher.find_vertical_overlap(&prev_frame, &curr_frame, &match_config);
                if matched_overlap.is_none() {
                    // Give page extra time to finish rendering/scrolling animation and retry
                    tokio::time::sleep(std::time::Duration::from_millis(200)).await;
                    if let Ok(retry_frame) = capture::capture_screen_rect(phys_x, phys_y, phys_w, phys_h) {
                        curr_frame = retry_frame;
                        let flex_config = matcher::MatchingConfig {
                            sensitivity: "flexible".into(),
                            max_mad_threshold: 45.0,
                        };
                        matched_overlap = matcher.find_vertical_overlap(&prev_frame, &curr_frame, &flex_config);
                    }
                }

                if let Some(overlap) = matched_overlap {
                    consecutive_match_failures = 0;
                    if overlap.is_identical || overlap.dy == 0 {
                        consecutive_no_movement += 1;
                        cursor_cycle += 1;
                        println!(
                            "[Scrolling] Step {}: zero movement detected (consecutive: {}/3)",
                            step, consecutive_no_movement
                        );
                        if consecutive_no_movement >= 3 {
                            if cfg.stop_on_no_movement {
                                println!("[Scrolling] Content reached bottom at step {}", step);
                                break;
                            }
                        }
                        // Continue loop to retry with nudged cursor and keyboard pulse
                        continue;
                    } else {
                        consecutive_no_movement = 0;
                        let seam_res = seam::SeamFinder::find_optimal_seam(&prev_frame, &curr_frame, overlap.dy);
                        current_confidence = seam_res.confidence;
                        println!(
                            "[Scrolling] Step {}: dy={}, seam_k={}, motion={:.1}, conf={:.2}, sticky_h={}, moving_zones={:?}",
                            step, overlap.dy, seam_res.seam_k, seam_res.motion_energy, seam_res.confidence, seam_res.sticky_header_height, seam_res.moving_zones
                        );
                        let appended = stitcher.append_frame_with_seam(&curr_frame, overlap.dy, seam_res.seam_k);
                        if !appended {
                            println!("[Scrolling] Stitcher stopped appending at step {}", step);
                            break;
                        }
                    }
                } else {
                    consecutive_match_failures += 1;
                    cursor_cycle += 1;
                    println!(
                        "[Scrolling] Match failed at step {} (consecutive: {}/3)",
                        step, consecutive_match_failures
                    );
                    if consecutive_match_failures >= 3 {
                        println!("[Scrolling] Stopping after 3 consecutive match failures at step {}", step);
                        break;
                    }
                    // For a single temporary glitch, skip to next step and continue
                    continue;
                }

                step += 1;
                prev_frame = curr_frame;

                let _ = app_handle_clone.emit(
                    "scrolling-progress",
                    ScrollingProgressPayload {
                        current_step: step,
                        max_steps,
                        current_height: stitcher.current_height(),
                        status: "scrolling".into(),
                        is_manual: false,
                        confidence: Some(current_confidence),
                    },
                );
            }
        }

        // Finalize session
        let was_cancelled = is_cancelled_flag.load(Ordering::SeqCst);
        is_running_flag.store(false, Ordering::SeqCst);

        if was_cancelled {
            hide_scrolling_hud(&app_handle_clone);
            let _ = app_handle_clone.emit("scrolling-cancelled", ());
            return;
        }

        // 1. Immediately hide the HUD before capturing the remaining viewport tail,
        // so the HUD pill can never appear in the final screenshot!
        hide_scrolling_hud(&app_handle_clone);
        // Wait 60ms to allow Windows DWM compositor to flush the hidden HUD from screen
        tokio::time::sleep(std::time::Duration::from_millis(60)).await;

        // 2. Capture remaining content at the bottom of the viewport that couldn't be scrolled up
        // (e.g. difference between viewport height and user selection box height).
        let sel_bottom = phys_y + phys_h as i32;
        let viewport_bottom = get_viewport_bottom(target_center_x, target_center_y, sel_bottom);
        if viewport_bottom > sel_bottom {
            let remaining_h = (viewport_bottom - sel_bottom) as u32;
            let safe_remaining_h = remaining_h.min(1200);
            if safe_remaining_h > 0 {
                if let Ok(extra_slice) = capture::capture_screen_rect(phys_x, sel_bottom, phys_w, safe_remaining_h) {
                    stitcher.append_exact_slice(extra_slice);
                }
            }
        }

        match stitcher.finalize() {
            Ok(final_image) => {
                let final_h = final_image.height();
                {
                    let state = app_handle_clone.state::<AppState>();
                    if let Ok(mut last_ss) = state.last_screenshot.lock() {
                        *last_ss = Some(final_image);
                    };
                }

                let _ = app_handle_clone.emit(
                    "scrolling-progress",
                    ScrollingProgressPayload {
                        current_step: step,
                        max_steps,
                        current_height: final_h,
                        status: "completed".into(),
                        is_manual,
                        confidence: Some(1.0),
                    },
                );

                let _ = app_handle_clone.emit("scrolling-completed", final_h);

                // Hide HUD and reopen the screenshot editor window with the newly stitched image
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                hide_scrolling_hud(&app_handle_clone);
                if let Some(ss_win) = app_handle_clone.get_webview_window("screenshot") {
                    let _ = ss_win.emit("screenshot-captured", ());
                    let _ = ss_win.show();
                    let _ = ss_win.set_focus();
                }
            }
            Err(e) => {
                hide_scrolling_hud(&app_handle_clone);
                let _ = app_handle_clone.emit("scrolling-error", e);
            }
        }
    });

    Ok(())
}

/// Stops active scrolling and finalizes whatever has been captured so far.
#[tauri::command]
pub fn stop_scrolling_capture() -> Result<(), String> {
    get_session().stop();
    Ok(())
}

/// Cancels active scrolling without saving.
#[tauri::command]
pub fn cancel_scrolling_capture() -> Result<(), String> {
    get_session().cancel();
    Ok(())
}
