use image::RgbaImage;

#[derive(Debug, Clone)]
pub struct SeamResult {
    /// Optimal seam position index in the overlap region: k in [0, overlap_h)
    /// corresponding to row (dy + k) in prev_frame and row (k) in curr_frame.
    pub seam_k: u32,
    /// Motion energy at the chosen seam row (0.0 = completely static, > 15.0 = active motion)
    pub motion_energy: f32,
    /// Stitch confidence score from 0.0 to 1.0
    pub confidence: f32,
    /// Detected sticky header height in pixels (0 if none detected)
    pub sticky_header_height: u32,
    /// Vertical intervals in the overlap region containing moving content (marquees, carousels, videos)
    pub moving_zones: Vec<(u32, u32)>,
}

pub struct SeamFinder;

impl SeamFinder {
    #[inline(always)]
    fn luminance(r: u8, g: u8, b: u8) -> u8 {
        ((r as u32 * 299 + g as u32 * 587 + b as u32 * 114) / 1000) as u8
    }

    /// Detects fixed / sticky navigation headers at the top of the viewport.
    /// In a sticky header, curr_frame(x, y) is nearly identical to prev_frame(x, y) at row y,
    /// even though the document body has scrolled vertically by dy > 0.
    pub fn detect_sticky_header(prev: &RgbaImage, curr: &RgbaImage, dy: u32) -> u32 {
        let w = prev.width();
        let h = prev.height();

        if dy < 15 || w < 40 || h < 40 {
            return 0;
        }

        let max_check_h = (h / 4).min(180);
        let x_start = 20.min(w / 4);
        let x_end = w.saturating_sub(35.min(w / 4));
        if x_end <= x_start {
            return 0;
        }
        let active_w = (x_end - x_start) as f32;

        let mut sticky_h = 0u32;
        let mut consecutive_static = 0u32;

        for y in 0..max_check_h {
            let mut diff_sum: u64 = 0;
            for x in x_start..x_end {
                let p1 = prev.get_pixel(x, y);
                let p2 = curr.get_pixel(x, y);
                let lum1 = Self::luminance(p1[0], p1[1], p1[2]) as i32;
                let lum2 = Self::luminance(p2[0], p2[1], p2[2]) as i32;
                diff_sum += (lum1 - lum2).unsigned_abs() as u64;
            }

            let mad = diff_sum as f32 / active_w;
            // If row y has virtually identical pixels between prev and curr at the same y coordinate
            if mad <= 8.0 {
                consecutive_static += 1;
                if consecutive_static >= 12 {
                    sticky_h = y + 1;
                }
            } else {
                if consecutive_static >= 16 {
                    // Reached end of sticky navbar
                    break;
                }
                consecutive_static = 0;
            }
        }

        sticky_h
    }

    /// Calculates a 1D vertical motion energy profile E(k) across the vertical overlap region.
    /// For each row k in [0, overlap_h), computes the mean absolute difference between
    /// prev_frame at (dy + k) and curr_frame at (k).
    pub fn calculate_motion_profile(
        prev: &RgbaImage,
        curr: &RgbaImage,
        dy: u32,
    ) -> (Vec<f32>, u32) {
        let w = prev.width();
        let h = prev.height();

        if dy >= h || w < 20 {
            return (Vec::new(), 0);
        }

        let overlap_h = h - dy;
        let x_start = 15.min(w / 4);
        let x_end = w.saturating_sub(32.min(w / 4));
        if x_end <= x_start {
            return (Vec::new(), overlap_h);
        }
        let active_w = (x_end - x_start) as f32;

        let mut profile = Vec::with_capacity(overlap_h as usize);

        for k in 0..overlap_h {
            let y_prev = dy + k;
            let y_curr = k;

            let mut diff_sum: u64 = 0;
            for x in x_start..x_end {
                let p_prev = prev.get_pixel(x, y_prev);
                let p_curr = curr.get_pixel(x, y_curr);

                let lum_prev = Self::luminance(p_prev[0], p_prev[1], p_prev[2]) as i32;
                let lum_curr = Self::luminance(p_curr[0], p_curr[1], p_curr[2]) as i32;
                diff_sum += (lum_curr - lum_prev).unsigned_abs() as u64;
            }

            let mad = diff_sum as f32 / active_w;
            profile.push(mad);
        }

        (profile, overlap_h)
    }

    /// Detects vertical intervals in the overlap region that contain active moving content
    /// (e.g. horizontal marquees, carousels, animated cards, GIFs, videos).
    pub fn detect_motion_zones(profile: &[f32], motion_threshold: f32) -> Vec<(u32, u32)> {
        let mut zones = Vec::new();
        let mut in_zone = false;
        let mut zone_start = 0u32;

        for (k, &energy) in profile.iter().enumerate() {
            if energy >= motion_threshold {
                if !in_zone {
                    in_zone = true;
                    zone_start = k as u32;
                }
            } else if in_zone {
                in_zone = false;
                let zone_end = k as u32;
                // Only consider zones that span at least 8 pixels
                if zone_end - zone_start >= 8 {
                    zones.push((zone_start, zone_end));
                }
            }
        }

        if in_zone {
            let zone_end = profile.len() as u32;
            if zone_end - zone_start >= 8 {
                zones.push((zone_start, zone_end));
            }
        }

        // Merge zones that are close to each other (gap <= 16 pixels)
        let mut merged: Vec<(u32, u32)> = Vec::new();
        for zone in zones {
            if let Some(last) = merged.last_mut() {
                if zone.0 <= last.1 + 16 {
                    last.1 = last.1.max(zone.1);
                    continue;
                }
            }
            merged.push(zone);
        }

        merged
    }

    /// Finds the optimal seam line k_seam in the overlap region [0, overlap_h).
    /// Enforces sticky header exclusion, avoids cutting through moving zones,
    /// and minimizes motion difference energy and visual gradient discontinuity.
    pub fn find_optimal_seam(
        prev: &RgbaImage,
        curr: &RgbaImage,
        dy: u32,
    ) -> SeamResult {
        let _h = prev.height();
        let sticky_h = Self::detect_sticky_header(prev, curr, dy);
        let (profile, overlap_h) = Self::calculate_motion_profile(prev, curr, dy);

        if profile.is_empty() || overlap_h == 0 {
            return SeamResult {
                seam_k: 0,
                motion_energy: 0.0,
                confidence: 0.5,
                sticky_header_height: sticky_h,
                moving_zones: Vec::new(),
            };
        }

        let motion_threshold = 14.0;
        let moving_zones = Self::detect_motion_zones(&profile, motion_threshold);

        // Safe boundaries for seam selection:
        // Must be below sticky header, and keep safety margin from boundaries
        let margin = 12u32.min(overlap_h / 8);
        let min_k = (sticky_h + margin).min(overlap_h.saturating_sub(1));
        let max_k = overlap_h.saturating_sub(margin).max(min_k);

        let search_range = min_k..=max_k;

        let mut best_k = if search_range.is_empty() { 0 } else { *search_range.start() };
        let mut min_score = f32::MAX;
        let mut best_energy = 0.0f32;

        let center_k = (min_k + max_k) as f32 / 2.0;

        for k in search_range {
            let energy = profile[k as usize];

            // 1. Check if k is inside any detected motion zone (marquee / carousel / video)
            let mut inside_motion_zone = false;
            for &(z_start, z_end) in &moving_zones {
                // Buffer by 6 pixels around moving content
                let buf_start = z_start.saturating_sub(6);
                let buf_end = (z_end + 6).min(overlap_h);
                if k >= buf_start && k <= buf_end {
                    inside_motion_zone = true;
                    break;
                }
            }

            // Large penalty if cutting directly through active moving content
            let motion_penalty = if inside_motion_zone { 120.0 } else { 0.0 };

            // 2. Mild center preference: slightly favor seams near the middle of overlap
            // rather than right up against the top/bottom boundary
            let dist_from_center = (k as f32 - center_k).abs();
            let center_penalty = (dist_from_center / overlap_h as f32) * 3.0;

            // Total composite seam score
            let score = energy + motion_penalty + center_penalty;

            if score < min_score {
                min_score = score;
                best_k = k;
                best_energy = energy;
            }
        }

        // Calculate stitch confidence score:
        // High confidence when motion_energy is near 0.0 and outside motion zones
        let mut confidence = (1.0 - (best_energy / 25.0)).clamp(0.1, 1.0);
        if moving_zones.iter().any(|&(s, e)| best_k >= s && best_k <= e) {
            // Seam was forced through moving content because no static row existed
            confidence *= 0.6;
        }

        SeamResult {
            seam_k: best_k,
            motion_energy: best_energy,
            confidence,
            sticky_header_height: sticky_h,
            moving_zones,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::Rgba;

    #[test]
    fn test_sticky_header_detection() {
        let w = 200;
        let h = 400;
        let dy = 80;
        let sticky_h = 50;

        let mut prev = RgbaImage::new(w, h);
        let mut curr = RgbaImage::new(w, h);

        // Sticky header rows 0..50 are identical
        for y in 0..sticky_h {
            for x in 0..w {
                let px = Rgba([50, 50, 50, 255]);
                prev.put_pixel(x, y, px);
                curr.put_pixel(x, y, px);
            }
        }

        // Body content scrolled by dy
        for y in sticky_h..h {
            for x in 0..w {
                let val_prev = ((x + y * 2) % 255) as u8;
                prev.put_pixel(x, y, Rgba([val_prev, val_prev, val_prev, 255]));

                let src_y = y + dy;
                let val_curr = ((x + src_y * 2) % 255) as u8;
                curr.put_pixel(x, y, Rgba([val_curr, val_curr, val_curr, 255]));
            }
        }

        let detected = SeamFinder::detect_sticky_header(&prev, &curr, dy);
        assert!(detected >= 48 && detected <= 52, "Sticky header height should be ~50px, got {}", detected);
    }

    #[test]
    fn test_horizontal_marquee_seam_avoidance() {
        let w = 300;
        let h = 600;
        let dy = 200;
        let _overlap_h = h - dy; // 400

        let mut prev = RgbaImage::new(w, h);
        let mut curr = RgbaImage::new(w, h);

        // Vertical scroll background
        for y in 0..h {
            for x in 0..w {
                let p = ((x * 2 + y * 3) % 250) as u8;
                prev.put_pixel(x, y, Rgba([p, p, p, 255]));
            }
        }
        for y in 0..h {
            let src_y = y + dy;
            for x in 0..w {
                let p = ((x * 2 + src_y * 3) % 250) as u8;
                curr.put_pixel(x, y, Rgba([p, p, p, 255]));
            }
        }

        // Introduce a moving horizontal marquee card spanning k in [150..250] in overlap
        // In prev_frame, at (dy + k) = (200 + k)
        // In curr_frame, at k
        for k in 150..250 {
            let y_prev = dy + k;
            let y_curr = k;
            for x in 0..w {
                // Card shifted horizontally by 40 pixels
                let c_prev = ((x * 5) % 250) as u8;
                let c_curr = (((x + 40) * 5) % 250) as u8;
                prev.put_pixel(x, y_prev, Rgba([c_prev, 0, 0, 255]));
                curr.put_pixel(x, y_curr, Rgba([c_curr, 0, 0, 255]));
            }
        }

        let res = SeamFinder::find_optimal_seam(&prev, &curr, dy);

        // Optimal seam must NOT be placed inside the horizontal marquee [150..250]
        assert!(
            res.seam_k < 145 || res.seam_k > 255,
            "Seam k={} must be outside the moving marquee zone [150..250]",
            res.seam_k
        );
        assert!(!res.moving_zones.is_empty(), "Moving zone should be detected");
    }

    #[test]
    fn test_carousel_and_animated_cards() {
        let w = 300;
        let h = 600;
        let dy = 180;

        let mut prev = RgbaImage::new(w, h);
        let mut curr = RgbaImage::new(w, h);

        // Baseline vertical content
        for y in 0..h {
            for x in 0..w {
                let p = ((x + y * 2) % 255) as u8;
                prev.put_pixel(x, y, Rgba([p, p, p, 255]));
                let src_y = y + dy;
                let p_curr = ((x + src_y * 2) % 255) as u8;
                curr.put_pixel(x, y, Rgba([p_curr, p_curr, p_curr, 255]));
            }
        }

        // Two animated cards with a static gap between them:
        // Card 1: k in [60..140]
        // Static gap: k in [141..220]
        // Card 2: k in [221..300]
        for k in 60..140 {
            let yp = dy + k;
            for x in 0..w {
                prev.put_pixel(x, yp, Rgba([200, 0, 0, 255]));
                curr.put_pixel(x, k, Rgba([0, 200, 0, 255])); // completely different in curr
            }
        }
        for k in 221..300 {
            let yp = dy + k;
            for x in 0..w {
                prev.put_pixel(x, yp, Rgba([0, 0, 200, 255]));
                curr.put_pixel(x, k, Rgba([200, 200, 0, 255]));
            }
        }

        let res = SeamFinder::find_optimal_seam(&prev, &curr, dy);

        // Seam must pick either the static gap [141..220] or outside the cards, avoiding both Card 1 and Card 2
        let inside_card1 = res.seam_k >= 55 && res.seam_k <= 145;
        let inside_card2 = res.seam_k >= 215 && res.seam_k <= 305;
        assert!(
            !inside_card1 && !inside_card2,
            "Seam k={} should be in static gap or boundary, not inside moving cards",
            res.seam_k
        );
    }

    #[test]
    fn test_video_gif_fallback_min_discontinuity() {
        let w = 200;
        let h = 400;
        let dy = 150;
        let overlap_h = h - dy;

        let mut prev = RgbaImage::new(w, h);
        let mut curr = RgbaImage::new(w, h);

        // Entire overlap region has noise/video changes, but one specific row has minimal difference
        let optimal_row = 100u32;
        for k in 0..overlap_h {
            let yp = dy + k;
            for x in 0..w {
                if k == optimal_row {
                    // Match closely at optimal_row
                    let p = ((x * 3) % 255) as u8;
                    prev.put_pixel(x, yp, Rgba([p, p, p, 255]));
                    curr.put_pixel(x, k, Rgba([p, p, p, 255]));
                } else {
                    // Constant video noise everywhere else
                    prev.put_pixel(x, yp, Rgba([220, 220, 220, 255]));
                    curr.put_pixel(x, k, Rgba([50, 50, 50, 255]));
                }
            }
        }

        let res = SeamFinder::find_optimal_seam(&prev, &curr, dy);
        assert_eq!(
            res.seam_k, optimal_row,
            "Should select the row with minimal visual discontinuity (got {}, expected {})",
            res.seam_k, optimal_row
        );
    }
}
