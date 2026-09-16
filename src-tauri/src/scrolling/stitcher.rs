use image::RgbaImage;

pub struct ImageStitcher {
    base_frame: Option<RgbaImage>,
    slices: Vec<RgbaImage>,
    total_height: u32,
    max_height: u32,
    consecutive_no_movement: u32,
}

impl ImageStitcher {
    pub fn new(max_height: u32) -> Self {
        Self {
            base_frame: None,
            slices: Vec::new(),
            total_height: 0,
            max_height,
            consecutive_no_movement: 0,
        }
    }

    /// Adds the very first frame.
    pub fn set_initial_frame(&mut self, frame: RgbaImage) {
        self.total_height = frame.height();
        self.base_frame = Some(frame);
        self.slices.clear();
        self.consecutive_no_movement = 0;
    }

    /// Appends the newly revealed content from curr_frame given the vertical shift dy.
    /// Returns true if appended successfully, or false if stopped (max height reached, no movement, etc.).
    pub fn append_frame(&mut self, curr_frame: &RgbaImage, dy: u32) -> bool {
        let base = match &self.base_frame {
            Some(b) => b,
            None => {
                self.set_initial_frame(curr_frame.clone());
                return true;
            }
        };

        let w = base.width();
        let h = base.height();

        if dy == 0 {
            self.consecutive_no_movement += 1;
            // If no movement 2 times in a row, signal completion
            return self.consecutive_no_movement < 2;
        }

        self.consecutive_no_movement = 0;

        // Ensure dy is valid
        let safe_dy = dy.min(h);
        if safe_dy == 0 {
            return false;
        }

        // Check if adding this slice would exceed max_height limit
        if self.total_height + safe_dy > self.max_height {
            eprintln!(
                "[ImageStitcher] Max height limit reached ({} > {})",
                self.total_height + safe_dy,
                self.max_height
            );
            return false;
        }

        // The newly revealed content is at the bottom of curr_frame: [h - safe_dy, h]
        let slice_y = h - safe_dy;
        let slice = image::imageops::crop_imm(curr_frame, 0, slice_y, w, safe_dy).to_image();

        self.total_height += safe_dy;
        self.slices.push(slice);

        true
    }

    /// Directly appends an exact slice (e.g. remaining viewport tail at the bottom of the window).
    pub fn append_exact_slice(&mut self, slice: RgbaImage) {
        let h = slice.height();
        let w = slice.width();
        if h == 0 || w == 0 {
            return;
        }
        if self.base_frame.is_none() {
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
        self.slices.push(slice);
    }

    pub fn current_height(&self) -> u32 {
        self.total_height
    }

    #[allow(dead_code)]
    pub fn slice_count(&self) -> usize {
        self.slices.len()
    }

    /// Assembles all slices into a single unified tall RgbaImage.
    pub fn finalize(self) -> Result<RgbaImage, String> {
        let base = self.base_frame.ok_or("No base frame to stitch")?;
        let w = base.width();
        let total_h = self.total_height;

        if w == 0 || total_h == 0 {
            return Err("Cannot stitch image with 0 dimensions".into());
        }

        if self.slices.is_empty() {
            return Ok(base);
        }

        let mut final_img = RgbaImage::new(w, total_h);

        // 1. Copy base frame to top
        image::imageops::replace(&mut final_img, &base, 0, 0);

        // 2. Sequentially copy each new slice downwards
        let mut curr_y = base.height() as i64;
        for slice in self.slices {
            let slice_h = slice.height() as i64;
            image::imageops::replace(&mut final_img, &slice, 0, curr_y);
            curr_y += slice_h;
        }

        let trimmed = Self::trim_trailing_blank_rows(&final_img);
        Ok(trimmed)
    }

    /// Detects and trims excessive trailing identical/blank background rows at the bottom of the stitched image.
    /// Leaves a comfortable 24px bottom margin below the content.
    pub fn trim_trailing_blank_rows(img: &RgbaImage) -> RgbaImage {
        let w = img.width();
        let h = img.height();

        if h <= 120 || w == 0 {
            return img.clone();
        }

        let stride = (w / 60).max(1);
        let sample_count = ((w + stride - 1) / stride) as f32;

        let mut blank_rows = 0u32;

        // Scan upwards from the bottom comparing row y with row y+1
        for y in (0..h - 1).rev() {
            let mut diff_sum: u32 = 0;
            let mut x = 0;
            while x < w {
                let p1 = img.get_pixel(x, y);
                let p2 = img.get_pixel(x, y + 1);

                diff_sum += (p1[0] as i32 - p2[0] as i32).unsigned_abs();
                diff_sum += (p1[1] as i32 - p2[1] as i32).unsigned_abs();
                diff_sum += (p1[2] as i32 - p2[2] as i32).unsigned_abs();

                x += stride;
            }

            let mad = (diff_sum as f32) / (sample_count * 3.0);
            if mad <= 2.5 {
                blank_rows += 1;
            } else {
                // Hit actual content changing vertically
                break;
            }
        }

        // If there are more than 36 trailing identical background rows, trim the excess
        // while preserving a clean 24px bottom margin.
        let margin = 24u32;
        if blank_rows > 36 + margin {
            let trim_amount = blank_rows - margin;
            let new_h = h.saturating_sub(trim_amount).max(100);
            if new_h < h {
                return image::imageops::crop_imm(img, 0, 0, w, new_h).to_image();
            }
        }

        img.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use image::Rgba;

    #[test]
    fn test_trim_trailing_blank_rows() {
        let w = 100;
        let h = 500;
        let mut img = RgbaImage::new(w, h);

        // Content from y = 0 to 200
        for y in 0..200 {
            for x in 0..w {
                let val = ((x + y) % 255) as u8;
                img.put_pixel(x, y, Rgba([val, val, val, 255]));
            }
        }

        // Trailing white background from y = 200 to 500 (300 blank rows)
        for y in 200..h {
            for x in 0..w {
                img.put_pixel(x, y, Rgba([255, 255, 255, 255]));
            }
        }

        let trimmed = ImageStitcher::trim_trailing_blank_rows(&img);
        assert!(trimmed.height() < h, "Image should be trimmed");
        assert_eq!(trimmed.height(), 225, "Should leave clean margin below content");
    }

    #[test]
    fn test_append_exact_slice() {
        let mut stitcher = ImageStitcher::new(2000);
        let mut base = RgbaImage::new(100, 300);
        for y in 0..300 {
            for x in 0..100 {
                let v = ((x * 3 + y * 7) % 250) as u8;
                base.put_pixel(x, y, Rgba([v, v, v, 255]));
            }
        }
        stitcher.set_initial_frame(base);
        assert_eq!(stitcher.current_height(), 300);

        let mut tail = RgbaImage::new(100, 110);
        for y in 0..110 {
            for x in 0..100 {
                let v = ((x * 5 + y * 11) % 250) as u8;
                tail.put_pixel(x, y, Rgba([v, v, v, 255]));
            }
        }
        stitcher.append_exact_slice(tail);
        assert_eq!(stitcher.current_height(), 410);

        let final_img = stitcher.finalize().unwrap();
        assert_eq!(final_img.height(), 410);
    }
}
