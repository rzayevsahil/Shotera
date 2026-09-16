use image::RgbaImage;

/// Captures a specific rectangle of the screen (in physical pixels).
/// Uses high-performance Windows GDI BitBlt for sub-millisecond captures,
/// with fallback to xcap if GDI encounters issues.
pub fn capture_screen_rect(x: i32, y: i32, width: u32, height: u32) -> Result<RgbaImage, String> {
    if width == 0 || height == 0 {
        return Err("Width and height must be greater than zero".into());
    }

    #[cfg(target_os = "windows")]
    {
        match capture_gdi_rect(x, y, width, height) {
            Ok(img) => return Ok(img),
            Err(e) => {
                // If GDI fails, fallback to xcap
                eprintln!("[ScrollingCapture] GDI capture failed: {}, trying xcap fallback", e);
            }
        }
    }

    capture_xcap_rect(x, y, width, height)
}

#[cfg(target_os = "windows")]
fn capture_gdi_rect(x: i32, y: i32, width: u32, height: u32) -> Result<RgbaImage, String> {
    use std::ptr::null_mut;
    use windows_sys::Win32::Graphics::Gdi::*;

    unsafe {
        let hdc_screen = GetDC(null_mut());
        if hdc_screen.is_null() {
            return Err("Failed to get screen DC".into());
        }

        let hdc_mem = CreateCompatibleDC(hdc_screen);
        if hdc_mem.is_null() {
            ReleaseDC(null_mut(), hdc_screen);
            return Err("Failed to create compatible DC".into());
        }

        let hbitmap = CreateCompatibleBitmap(hdc_screen, width as i32, height as i32);
        if hbitmap.is_null() {
            DeleteDC(hdc_mem);
            ReleaseDC(null_mut(), hdc_screen);
            return Err("Failed to create compatible bitmap".into());
        }

        let old_obj = SelectObject(hdc_mem, hbitmap);

        // SRCCOPY | CAPTUREBLT is mandatory on Windows 10/11 with DWM desktop composition
        // to capture hardware-accelerated surfaces (Chrome, Edge, Electron, etc.).
        let rop = SRCCOPY | CAPTUREBLT;
        let blt_res = BitBlt(hdc_mem, 0, 0, width as i32, height as i32, hdc_screen, x, y, rop);

        if blt_res == 0 {
            SelectObject(hdc_mem, old_obj);
            DeleteObject(hbitmap);
            DeleteDC(hdc_mem);
            ReleaseDC(null_mut(), hdc_screen);
            return Err("BitBlt failed".into());
        }

        let mut bi = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: width as i32,
                biHeight: -(height as i32), // Top-down DIB
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB,
                biSizeImage: (width * height * 4) as u32,
                biXPelsPerMeter: 0,
                biYPelsPerMeter: 0,
                biClrUsed: 0,
                biClrImportant: 0,
            },
            bmiColors: [RGBQUAD { rgbBlue: 0, rgbGreen: 0, rgbRed: 0, rgbReserved: 0 }],
        };

        let mut bgra_data = vec![0u8; (width * height * 4) as usize];
        let dib_res = GetDIBits(
            hdc_mem,
            hbitmap,
            0,
            height,
            bgra_data.as_mut_ptr() as _,
            &mut bi,
            DIB_RGB_COLORS,
        );

        // Cleanup GDI objects
        SelectObject(hdc_mem, old_obj);
        DeleteObject(hbitmap);
        DeleteDC(hdc_mem);
        ReleaseDC(null_mut(), hdc_screen);

        if dib_res == 0 {
            return Err("GetDIBits failed".into());
        }

        // Convert BGRA to RGBA in-place
        for chunk in bgra_data.chunks_exact_mut(4) {
            let b = chunk[0];
            let r = chunk[2];
            chunk[0] = r;
            chunk[2] = b;
            chunk[3] = 255; // Ensure full opacity
        }

        RgbaImage::from_raw(width, height, bgra_data)
            .ok_or_else(|| "Failed to construct RgbaImage from raw bytes".into())
    }
}

fn capture_xcap_rect(x: i32, y: i32, width: u32, height: u32) -> Result<RgbaImage, String> {
    let monitors = xcap::Monitor::all().map_err(|e| e.to_string())?;
    if monitors.is_empty() {
        return Err("No monitors found for capture".into());
    }

    // Find monitor that contains the top-left of the rectangle
    let mut target_monitor = &monitors[0];
    for m in &monitors {
        let mx = m.x().unwrap_or(0);
        let my = m.y().unwrap_or(0);
        let mw = m.width().unwrap_or(1920) as i32;
        let mh = m.height().unwrap_or(1080) as i32;
        if x >= mx && x < mx + mw && y >= my && y < my + mh {
            target_monitor = m;
            break;
        }
    }

    let full_image = target_monitor.capture_image().map_err(|e| e.to_string())?;
    let mx = target_monitor.x().unwrap_or(0);
    let my = target_monitor.y().unwrap_or(0);

    let local_x = (x - mx).max(0) as u32;
    let local_y = (y - my).max(0) as u32;
    let safe_w = width.min(full_image.width().saturating_sub(local_x));
    let safe_h = height.min(full_image.height().saturating_sub(local_y));

    if safe_w == 0 || safe_h == 0 {
        return Err("Cropped area is out of monitor bounds".into());
    }

    let cropped = image::imageops::crop_imm(&full_image, local_x, local_y, safe_w, safe_h).to_image();
    Ok(cropped)
}
