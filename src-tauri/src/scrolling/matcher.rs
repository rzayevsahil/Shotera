use image::RgbaImage;

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct OverlapResult {
    /// Pixels shifted vertically upwards (new content revealed at bottom)
    pub dy: u32,
    /// Matching confidence score (0.0 to 1.0)
    pub confidence: f32,
    /// True if content did not move at all (reached bottom or unscrollable)
    pub is_identical: bool,
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct MatchingConfig {
    /// Sensitivity preset: "high", "normal", "flexible"
    pub sensitivity: String,
    /// Maximum allowed mean absolute difference per pixel (0-255)
    pub max_mad_threshold: f32,
}

impl Default for MatchingConfig {
    fn default() -> Self {
        Self {
            sensitivity: "normal".into(),
            max_mad_threshold: 30.0,
        }
    }
}

pub trait OverlapMatcher: Send + Sync {
    fn find_vertical_overlap(
        &self,
        prev_frame: &RgbaImage,
        curr_frame: &RgbaImage,
        config: &MatchingConfig,
    ) -> Option<OverlapResult>;
}

/// Robust template matching with sticky header avoidance and scrollbar exclusion.
pub struct TemplateOverlapMatcher;

impl TemplateOverlapMatcher {
    pub fn new() -> Self {
        Self
    }

    /// Fast RGB to luminance calculation
    #[inline(always)]
    fn luminance(r: u8, g: u8, b: u8) -> u8 {
        ((r as u32 * 299 + g as u32 * 587 + b as u32 * 114) / 1000) as u8
    }

    /// Checks if two images are completely identical
    pub fn are_identical(prev: &RgbaImage, curr: &RgbaImage) -> bool {
        if prev.width() != curr.width() || prev.height() != curr.height() {
            return false;
        }
        let p_raw = prev.as_raw();
        let c_raw = curr.as_raw();
        p_raw == c_raw
    }
    /// Computes variance (texture richness) of a luminance slice
    fn calculate_variance(data: &[u8]) -> f32 {
        if data.len() < 2 {
            return 0.0;
        }
        let n = data.len() as f32;
        let mean = data.iter().map(|&v| v as f32).sum::<f32>() / n;
        let var_sum = data.iter().map(|&v| {
            let d = v as f32 - mean;
            d * d
        }).sum::<f32>();
        var_sum / n
    }
}

impl Default for TemplateOverlapMatcher {
    fn default() -> Self {
        Self::new()
    }
}

impl OverlapMatcher for TemplateOverlapMatcher {
    fn find_vertical_overlap(
        &self,
        prev_frame: &RgbaImage,
        curr_frame: &RgbaImage,
        config: &MatchingConfig,
    ) -> Option<OverlapResult> {
        let w = prev_frame.width();
        let h = prev_frame.height();

        if w < 20 || h < 20 || curr_frame.width() != w || curr_frame.height() != h {
            return None;
        }

        // 1. Check if frames are completely identical (page reached bottom or unscrollable)
        if Self::are_identical(prev_frame, curr_frame) {
            return Some(OverlapResult {
                dy: 0,
                confidence: 1.0,
                is_identical: true,
            });
        }

        // 2. Active content horizontal boundaries
        // Exclude left margin (15px) and right margin (32px) to ignore scrollbars / gutters
        let x_margin_left = 15.min(w / 4);
        let x_margin_right = 32.min(w / 4);
        let x_start = x_margin_left;
        let x_end = w.saturating_sub(x_margin_right);
        if x_end <= x_start {
            return None;
        }
        let active_w = (x_end - x_start) as usize;

        // 3. Precompute full luminance image for curr_frame
        let mut curr_lum = vec![0u8; h as usize * active_w];
        for cy in 0..h {
            let row_offset = cy as usize * active_w;
            for sx in 0..active_w {
                let px = x_start + sx as u32;
                let p = curr_frame.get_pixel(px, cy);
                curr_lum[row_offset + sx] = Self::luminance(p[0], p[1], p[2]);
            }
        }

        // 4. Strategic multi-strip definitions across prev_frame
        // Strip 0: Lower zone (75% to 88% of h) -> detects shifts up to 75% of h
        // Strip 1: Mid zone   (60% to 74% of h) -> detects shifts up to 60% of h
        // Strip 2: Upper-mid  (44% to 58% of h) -> detects shifts up to 44% of h
        let strip_specs = [
            (0.75f32, 0.13f32),
            (0.60f32, 0.14f32),
            (0.44f32, 0.14f32),
        ];

        let threshold = config.max_mad_threshold;
        let mut candidates: Vec<(u32, f32, f32, f32)> = Vec::new(); // (dy, raw_mad, confidence, variance)

        for &(pct_y, pct_h) in &strip_specs {
            let strip_y_start = (h as f32 * pct_y) as u32;
            let strip_h = (h as f32 * pct_h).max(20.0) as u32;
            let strip_y_end = (strip_y_start + strip_h).min(h);
            let actual_strip_h = (strip_y_end - strip_y_start) as usize;

            if actual_strip_h == 0 {
                continue;
            }

            // Extract reference strip luminance from prev_frame
            let mut ref_strip = vec![0u8; actual_strip_h * active_w];
            for sy in 0..actual_strip_h {
                let py = strip_y_start + sy as u32;
                let row_offset = sy * active_w;
                for sx in 0..active_w {
                    let px = x_start + sx as u32;
                    let p = prev_frame.get_pixel(px, py);
                    ref_strip[row_offset + sx] = Self::luminance(p[0], p[1], p[2]);
                }
            }

            // Check variance (texture richness)
            let variance = Self::calculate_variance(&ref_strip);
            // If strip is virtually flat / single solid background, skip to avoid ambiguous matches
            if variance < 5.0 {
                continue;
            }

            // Exhaustive 1-pixel linear scan downwards from strip_y_start to 0
            let max_search_y = strip_y_start;
            let mut best_cand_y = strip_y_start;
            let mut min_score = f32::MAX;
            let mut best_raw_mad = f32::MAX;

            let x_stride = 1;
            let samples_per_row = (active_w + x_stride - 1) / x_stride;
            let sample_count = (actual_strip_h * samples_per_row) as u64;
            if sample_count == 0 {
                continue;
            }

            for cand_y in (0..=max_search_y).rev() {
                let mut diff_sum: u64 = 0;
                for sy in 0..actual_strip_h {
                    let curr_row = (cand_y as usize + sy) * active_w;
                    let ref_row = sy * active_w;

                    let mut sx = 0;
                    while sx < active_w {
                        let c_val = curr_lum[curr_row + sx] as i32;
                        let r_val = ref_strip[ref_row + sx] as i32;
                        diff_sum += (c_val - r_val).unsigned_abs() as u64;
                        sx += x_stride;
                    }
                }

                let mad = diff_sum as f32 / sample_count as f32;
                let dy_cand = strip_y_start - cand_y;
                // Mild distance penalty (up to 10%) favoring smaller natural displacements over distant periodic rows
                let penalty = 1.0 + (dy_cand as f32 / (max_search_y as f32).max(1.0)) * 0.10;
                let score = mad * penalty;

                if score < min_score {
                    min_score = score;
                    best_raw_mad = mad;
                    best_cand_y = cand_y;
                }
            }

            let dy = strip_y_start - best_cand_y;

            // Strict or relaxed threshold acceptance
            if best_raw_mad <= threshold * 1.25 {
                let confidence = (1.0 - (best_raw_mad / (threshold * 1.25))).clamp(0.0, 1.0);
                candidates.push((dy, best_raw_mad, confidence, variance));
            }
        }

        if candidates.is_empty() {
            eprintln!("[Matcher] Multi-strip matching found no candidate below threshold {:.1}", threshold);
            return None;
        }

        // 5. Consensus voting & Best Candidate Selection
        // Check if multiple strips agree on dy (within 2 pixels)
        for i in 0..candidates.len() {
            for j in (i + 1)..candidates.len() {
                let dy_diff = (candidates[i].0 as i32 - candidates[j].0 as i32).abs();
                if dy_diff <= 2 {
                    let agreed_dy = candidates[i].0;
                    return Some(OverlapResult {
                        dy: agreed_dy,
                        confidence: 1.0,
                        is_identical: agreed_dy == 0,
                    });
                }
            }
        }

        // If no 2 strips exactly agree (e.g. only 1 textured strip or one had dynamic content):
        // Pick candidate with lowest raw_mad weighted by texture variance
        candidates.sort_by(|a, b| {
            let score_a = a.1 / (a.3.sqrt().max(1.0));
            let score_b = b.1 / (b.3.sqrt().max(1.0));
            score_a.partial_cmp(&score_b).unwrap_or(std::cmp::Ordering::Equal)
        });

        let best = &candidates[0];
        Some(OverlapResult {
            dy: best.0,
            confidence: best.2,
            is_identical: best.0 == 0,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::Rgba;

    #[test]
    fn test_identical_images() {
        let mut img = RgbaImage::new(200, 300);
        for x in 0..200 {
            for y in 0..300 {
                img.put_pixel(x, y, Rgba([(x % 255) as u8, (y % 255) as u8, 128, 255]));
            }
        }

        let matcher = TemplateOverlapMatcher::new();
        let res = matcher.find_vertical_overlap(&img, &img, &MatchingConfig::default());
        assert!(res.is_some());
        let r = res.unwrap();
        assert!(r.is_identical);
        assert_eq!(r.dy, 0);
    }

    #[test]
    fn test_scrolled_image_detection() {
        let w = 200;
        let h = 400;
        let scroll_amount = 80;

        // Frame 1: Synthetic document from y = 0 to 400
        let mut frame1 = RgbaImage::new(w, h);
        for y in 0..h {
            for x in 0..w {
                // Diagonal striped pattern so vertical position is distinct
                let val = ((x + y * 3) % 255) as u8;
                frame1.put_pixel(x, y, Rgba([val, val, val, 255]));
            }
        }

        // Frame 2: Content shifted up by scroll_amount (new content at bottom)
        let mut frame2 = RgbaImage::new(w, h);
        for y in 0..h {
            let src_y = y + scroll_amount;
            for x in 0..w {
                let val = ((x + src_y * 3) % 255) as u8;
                frame2.put_pixel(x, y, Rgba([val, val, val, 255]));
            }
        }

        let matcher = TemplateOverlapMatcher::new();
        let res = matcher.find_vertical_overlap(&frame1, &frame2, &MatchingConfig::default());
        assert!(res.is_some(), "Should find vertical overlap");
        let r = res.unwrap();
        assert_eq!(r.dy, scroll_amount, "Detected shift should match scroll_amount");
        assert!(r.confidence > 0.8, "Confidence should be high");
    }
}
