use image::RgbaImage;

#[derive(Clone)]
pub struct FrameSlice {
    pub frame: RgbaImage,
    pub start_y: u32,
    pub end_y: u32,
}

pub struct ImageStitcher {
    slices: Vec<FrameSlice>,
    total_height: u32,
    max_height: u32,
    consecutive_no_movement: u32,
}

impl ImageStitcher {
    pub fn new(max_height: u32) -> Self {
        Self {
            slices: Vec::new(),
            total_height: 0,
            max_height,
            consecutive_no_movement: 0,
        }
    }

    /// Adds the very first frame to start the stitching session.
    pub fn set_initial_frame(&mut self, frame: RgbaImage) {
        let h = frame.height();
        self.slices.clear();
        self.slices.push(FrameSlice {
            frame,
            start_y: 0,
            end_y: h,
        });
        self.total_height = h;
        self.consecutive_no_movement = 0;
    }

    /// Appends curr_frame using a motion-aware dynamic seam k_seam.
    ///
    /// - In the previous frame, the seam line cuts at (dy + k_seam).
    /// - In curr_frame, the new slice begins at k_seam and extends down to h.
    /// - The net height added to the canvas is mathematically guaranteed to equal dy.
    pub fn append_frame_with_seam(
        &mut self,
        curr_frame: &RgbaImage,
        dy: u32,
        seam_k: u32,
    ) -> bool {
        if self.slices.is_empty() {
            self.set_initial_frame(curr_frame.clone());
            return true;
        }

        let h = curr_frame.height();
        if dy == 0 {
            self.consecutive_no_movement += 1;
            return self.consecutive_no_movement < 3;
        }

        self.consecutive_no_movement = 0;
        let safe_dy = dy.min(h);
        if safe_dy == 0 {
            return false;
        }

        if self.total_height + safe_dy > self.max_height {
            eprintln!(
                "[ImageStitcher] Max height limit reached ({} > {})",
                self.total_height + safe_dy,
                self.max_height
            );
            return false;
        }

        let overlap_h = h.saturating_sub(safe_dy);
        let safe_seam_k = seam_k.min(overlap_h);

        // Update the previous slice's end_y to cut at (safe_dy + safe_seam_k)
        if let Some(last_slice) = self.slices.last_mut() {
            let seam_cut_y = (safe_dy + safe_seam_k).clamp(last_slice.start_y, last_slice.frame.height());
            // Adjust total_height according to the truncation of the previous slice
            let prev_slice_h = last_slice.end_y - last_slice.start_y;
            let new_slice_h = seam_cut_y - last_slice.start_y;
            self.total_height = self.total_height.saturating_sub(prev_slice_h).saturating_add(new_slice_h);
            last_slice.end_y = seam_cut_y;
        }

        // Push new slice from curr_frame starting at safe_seam_k down to h
        let new_slice_h = h.saturating_sub(safe_seam_k);
        self.slices.push(FrameSlice {
            frame: curr_frame.clone(),
            start_y: safe_seam_k,
            end_y: h,
        });

        self.total_height += new_slice_h;
        true
    }

    /// Legacy fixed-seam append fallback for compatibility
    #[allow(dead_code)]
    pub fn append_frame(&mut self, curr_frame: &RgbaImage, dy: u32) -> bool {
        let h = curr_frame.height();
        let overlap_h = h.saturating_sub(dy);
        self.append_frame_with_seam(curr_frame, dy, overlap_h)
    }

    /// Directly appends an exact slice (e.g. remaining viewport tail at the bottom of the window).
    pub fn append_exact_slice(&mut self, slice: RgbaImage) {
        let h = slice.height();
        let w = slice.width();
        if h == 0 || w == 0 {
            return;
        }
        if self.slices.is_empty() {
            self.set_initial_frame(slice);
            return;
        }
        if self.total_height + h > self.max_height {
            eprintln!(
                "[ImageStitcher] Max height limit reached for exact slice ({} > {})",
                self.total_height + h,
                self.max_height
            );
            return;
        }
        self.total_height += h;
        self.slices.push(FrameSlice {
            frame: slice,
            start_y: 0,
            end_y: h,
        });
    }

    pub fn current_height(&self) -> u32 {
        self.total_height
    }

    #[allow(dead_code)]
    pub fn slice_count(&self) -> usize {
        self.slices.len()
    }

    /// Returns references to all preserved raw frames for inspection / debugging.
    #[allow(dead_code)]
    pub fn raw_frames(&self) -> Vec<&RgbaImage> {
        self.slices.iter().map(|s| &s.frame).collect()
    }

    /// Assembles all slices into a single unified tall RgbaImage with zero visual tearing.
    pub fn finalize(self) -> Result<RgbaImage, String> {
        if self.slices.is_empty() {
            return Err("No slices to stitch".into());
        }

        let w = self.slices[0].frame.width();
        let total_h = self.total_height;

        if w == 0 || total_h == 0 {
            return Err("Cannot stitch image with 0 dimensions".into());
        }

        let mut final_img = RgbaImage::new(w, total_h);
        let mut curr_dest_y = 0u32;

        for slice in self.slices {
            let slice_h = slice.end_y.saturating_sub(slice.start_y);
            if slice_h == 0 {
                continue;
            }

            // Copy rows [start_y .. end_y] of slice.frame into final_img at curr_dest_y
            for sy in 0..slice_h {
                let src_y = slice.start_y + sy;
                let dest_y = curr_dest_y + sy;
                if dest_y >= total_h || src_y >= slice.frame.height() {
                    break;
                }

                for x in 0..w {
                    let pixel = slice.frame.get_pixel(x, src_y);
                    final_img.put_pixel(x, dest_y, *pixel);
                }
            }

            curr_dest_y += slice_h;
        }

        let trimmed = Self::trim_trailing_blank_rows(&final_img);
        Ok(trimmed)
    }

    /// Trims uniform blank rows (e.g. trailing white or solid black padding) from the bottom edge.
    fn trim_trailing_blank_rows(img: &RgbaImage) -> RgbaImage {
        let (w, h) = (img.width(), img.height());
        if h < 20 || w < 20 {
            return img.clone();
        }

        let sample_row = h - 1;
        let p0 = img.get_pixel(w / 2, sample_row);
        let is_white = p0[0] > 248 && p0[1] > 248 && p0[2] > 248;
        let is_black = p0[0] < 8 && p0[1] < 8 && p0[2] < 8;

        if !is_white && !is_black {
            return img.clone();
        }

        let target_lum = if is_white { 255u8 } else { 0u8 };
        let mut blank_rows = 0u32;
        let max_trim = (h / 3).min(400);

        for y in (0..h).rev() {
            let mut row_is_blank = true;
            for x in (0..w).step_by(8) {
                let p = img.get_pixel(x, y);
                let diff = (p[0] as i32 - target_lum as i32).unsigned_abs();
                if diff > 5 {
                    row_is_blank = false;
                    break;
                }
            }

            if row_is_blank {
                blank_rows += 1;
                if blank_rows >= max_trim {
                    break;
                }
            } else {
                break;
            }
        }

        if blank_rows > 8 && blank_rows < h {
            let new_h = h - blank_rows;
            image::imageops::crop_imm(img, 0, 0, w, new_h).to_image()
        } else {
            img.clone()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::Rgba;

    #[test]
    fn test_dynamic_seam_stitching_continuity() {
        let w = 200;
        let h = 500;
        let dy1 = 200;
        let dy2 = 180;

        // Frame 1: absolute y in [0..500]
        let mut f1 = RgbaImage::new(w, h);
        for y in 0..h {
            for x in 0..w {
                let val = (y % 256) as u8;
                f1.put_pixel(x, y, Rgba([val, val, val, 255]));
            }
        }

        // Frame 2: absolute y in [200..700]
        let mut f2 = RgbaImage::new(w, h);
        for y in 0..h {
            let abs_y = y + dy1;
            for x in 0..w {
                let val = (abs_y % 256) as u8;
                f2.put_pixel(x, y, Rgba([val, val, val, 255]));
            }
        }

        // Frame 3: absolute y in [380..880]
        let mut f3 = RgbaImage::new(w, h);
        for y in 0..h {
            let abs_y = y + dy1 + dy2;
            for x in 0..w {
                let val = (abs_y % 256) as u8;
                f3.put_pixel(x, y, Rgba([val, val, val, 255]));
            }
        }

        let mut stitcher = ImageStitcher::new(32_000);
        stitcher.set_initial_frame(f1);

        // Seam 1: dynamic seam at k = 120
        stitcher.append_frame_with_seam(&f2, dy1, 120);

        // Seam 2: dynamic seam at k = 200
        stitcher.append_frame_with_seam(&f3, dy2, 200);

        assert_eq!(stitcher.current_height(), h + dy1 + dy2);

        let final_img = stitcher.finalize().expect("Finalize should succeed");
        assert_eq!(final_img.height(), h + dy1 + dy2);

        // Verify continuity: each row y in final_img should match (y % 256)
        for y in 0..final_img.height() {
            let p = final_img.get_pixel(50, y);
            let expected = (y % 256) as u8;
            assert_eq!(
                p[0], expected,
                "Row {} has value {}, expected continuous value {}",
                y, p[0], expected
            );
        }
    }
}
