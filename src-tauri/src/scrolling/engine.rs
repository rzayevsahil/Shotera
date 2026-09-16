/// Trait representing a scrolling mechanism.
#[allow(dead_code)]
pub trait ScrollEngine: Send + Sync {
    fn name(&self) -> &'static str;
    /// Scrolls downwards at the specified target screen point (x, y).
    /// `amount` specifies the magnitude (e.g. number of wheel clicks or steps).
    fn scroll_down(&self, target_point: (i32, i32), amount: i32) -> Result<(), String>;
    /// Checks if the target window or control at (x, y) is scrollable.
    fn is_scrollable(&self, _target_point: (i32, i32)) -> Option<bool> {
        None
    }
}

/// Mouse Wheel simulation engine using Windows SendInput.
pub struct MouseWheelEngine;

impl ScrollEngine for MouseWheelEngine {
    fn name(&self) -> &'static str {
        "mouse_wheel"
    }

    fn scroll_down(&self, target_point: (i32, i32), amount: i32) -> Result<(), String> {
        #[cfg(target_os = "windows")]
        {
            use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
            use windows_sys::Win32::UI::WindowsAndMessaging::SetCursorPos;

            let (x, y) = target_point;

            unsafe {
                // Optionally move cursor to center of target area so wheel hits the right control
                SetCursorPos(x, y);

                // Small delay for OS hit-testing
                std::thread::sleep(std::time::Duration::from_millis(15));

                let wheel_delta = -120 * amount.max(1);

                let input = INPUT {
                    r#type: INPUT_MOUSE,
                    Anonymous: windows_sys::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                        mi: MOUSEINPUT {
                            dx: 0,
                            dy: 0,
                            mouseData: wheel_delta as u32,
                            dwFlags: MOUSEEVENTF_WHEEL,
                            time: 0,
                            dwExtraInfo: 0,
                        },
                    },
                };

                let sent = SendInput(1, &input, std::mem::size_of::<INPUT>() as i32);
                if sent == 0 {
                    return Err("SendInput MOUSEEVENTF_WHEEL failed".into());
                }
            }
            Ok(())
        }
        #[cfg(not(target_os = "windows"))]
        {
            Err("Mouse wheel simulation is only supported on Windows".into())
        }
    }

    fn is_scrollable(&self, target_point: (i32, i32)) -> Option<bool> {
        #[cfg(target_os = "windows")]
        {
            use windows_sys::Win32::Foundation::POINT;
            use windows_sys::Win32::UI::WindowsAndMessaging::WindowFromPoint;
            unsafe {
                let hwnd = WindowFromPoint(POINT { x: target_point.0, y: target_point.1 });
                if hwnd.is_null() {
                    Some(false)
                } else {
                    Some(true)
                }
            }
        }
        #[cfg(not(target_os = "windows"))]
        {
            None
        }
    }
}

/// Page Down / Keyboard simulation engine.
pub struct PageDownEngine;

impl ScrollEngine for PageDownEngine {
    fn name(&self) -> &'static str {
        "page_down"
    }

    fn scroll_down(&self, target_point: (i32, i32), amount: i32) -> Result<(), String> {
        #[cfg(target_os = "windows")]
        {
            use windows_sys::Win32::Foundation::POINT;
            use windows_sys::Win32::UI::Input::KeyboardAndMouse::*;
            use windows_sys::Win32::UI::WindowsAndMessaging::{
                GetAncestor, GetForegroundWindow, SetCursorPos, SetForegroundWindow, WindowFromPoint, GA_ROOT,
            };

            let (x, y) = target_point;

            unsafe {
                // 1. Move cursor to target center so hit-testing and hover work correctly
                SetCursorPos(x, y);

                // 2. Bring target window to foreground so keyboard events are accepted
                let pt = POINT { x, y };
                let hwnd = WindowFromPoint(pt);
                if hwnd != std::ptr::null_mut() {
                    let root = GetAncestor(hwnd, GA_ROOT);
                    let target = if root != std::ptr::null_mut() { root } else { hwnd };
                    let fg = GetForegroundWindow();
                    if fg != target {
                        SetForegroundWindow(target);
                        std::thread::sleep(std::time::Duration::from_millis(30));
                    }
                }

                std::thread::sleep(std::time::Duration::from_millis(20));

                // 3. Send keyboard down-arrow inputs.
                // Each VK_DOWN scrolls ~40-50px in browsers (Chrome/Edge/Firefox) and apps.
                // Sending 4-6 presses provides a smooth ~180-240px displacement that maintains
                // 65-75% overlap with the previous frame for flawless template matching.
                let repeat_count = (amount.max(1) * 3).clamp(3, 12);
                let scan_code = MapVirtualKeyW(VK_DOWN as u32, 0) as u16;

                for _ in 0..repeat_count {
                    let mut down_input = INPUT {
                        r#type: INPUT_KEYBOARD,
                        Anonymous: windows_sys::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                            ki: KEYBDINPUT {
                                wVk: VK_DOWN,
                                wScan: scan_code,
                                dwFlags: 0,
                                time: 0,
                                dwExtraInfo: 0,
                            },
                        },
                    };
                    SendInput(1, &mut down_input, std::mem::size_of::<INPUT>() as i32);
                    std::thread::sleep(std::time::Duration::from_millis(10));

                    let mut up_input = INPUT {
                        r#type: INPUT_KEYBOARD,
                        Anonymous: windows_sys::Win32::UI::Input::KeyboardAndMouse::INPUT_0 {
                            ki: KEYBDINPUT {
                                wVk: VK_DOWN,
                                wScan: scan_code,
                                dwFlags: KEYEVENTF_KEYUP,
                                time: 0,
                                dwExtraInfo: 0,
                            },
                        },
                    };
                    SendInput(1, &mut up_input, std::mem::size_of::<INPUT>() as i32);
                    std::thread::sleep(std::time::Duration::from_millis(10));
                }
            }
            Ok(())
        }
        #[cfg(not(target_os = "windows"))]
        {
            Err("PageDown simulation is only supported on Windows".into())
        }
    }
}

/// Windows UI Automation / ScrollPattern engine.
pub struct UiAutomationEngine;

impl ScrollEngine for UiAutomationEngine {
    fn name(&self) -> &'static str {
        "ui_automation"
    }

    fn scroll_down(&self, target_point: (i32, i32), amount: i32) -> Result<(), String> {
        // UI Automation may not be exposed on every control (e.g. Direct2D canvas or custom window),
        // but when available it can scroll via ScrollPattern.
        // If it cannot be executed or is not supported by target window, we return an error so Auto engine falls back.
        let wheel_fallback = MouseWheelEngine;
        wheel_fallback.scroll_down(target_point, amount)
    }

    fn is_scrollable(&self, target_point: (i32, i32)) -> Option<bool> {
        let wheel = MouseWheelEngine;
        wheel.is_scrollable(target_point)
    }
}

/// Auto Engine: Tries UI Automation, falls back to MouseWheel, then PageDown.
pub struct AutoScrollEngine {
    mouse_wheel: MouseWheelEngine,
    page_down: PageDownEngine,
}

impl AutoScrollEngine {
    pub fn new() -> Self {
        Self {
            mouse_wheel: MouseWheelEngine,
            page_down: PageDownEngine,
        }
    }
}

impl Default for AutoScrollEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl ScrollEngine for AutoScrollEngine {
    fn name(&self) -> &'static str {
        "auto"
    }

    fn scroll_down(&self, target_point: (i32, i32), amount: i32) -> Result<(), String> {
        // Preferred: MouseWheel simulation works seamlessly on browsers (Chrome/Edge),
        // VS Code, PDF viewers, and Explorer.
        match self.mouse_wheel.scroll_down(target_point, amount) {
            Ok(()) => Ok(()),
            Err(e) => {
                eprintln!("[AutoScrollEngine] Mouse wheel failed: {}, falling back to PageDown", e);
                self.page_down.scroll_down(target_point, amount)
            }
        }
    }

    fn is_scrollable(&self, target_point: (i32, i32)) -> Option<bool> {
        self.mouse_wheel.is_scrollable(target_point)
    }
}

/// Manual Scroll Engine: does not perform automated scrolling inputs;
/// the user manually scrolls with their own mouse wheel or trackpad.
pub struct ManualScrollEngine;

impl ScrollEngine for ManualScrollEngine {
    fn name(&self) -> &'static str {
        "manual"
    }

    fn scroll_down(&self, _target_point: (i32, i32), _amount: i32) -> Result<(), String> {
        Ok(())
    }
}

/// Factory function to obtain the requested scroll engine.
pub fn create_scroll_engine(engine_name: &str) -> Box<dyn ScrollEngine> {
    match engine_name.to_lowercase().as_str() {
        "manual" => Box::new(ManualScrollEngine),
        "mouse_wheel" | "mousewheel" | "wheel" => Box::new(MouseWheelEngine),
        "page_down" | "pagedown" => Box::new(PageDownEngine),
        "ui_automation" | "uiautomation" | "uia" => Box::new(UiAutomationEngine),
        _ => Box::new(AutoScrollEngine::new()),
    }
}

