//! Mix two PCM16 sources (loopback + mic) into one stream for the RTMP path.
//!
//! v1 mixing is deliberately simple: align channel count, sum sample-by-sample,
//! and clip. It assumes both sources share a sample rate (true when both use the
//! default 48 kHz device mix format); if they differ, callers should resample
//! first — not handled here to keep v1 lean.
//!
//! ponytail: sum+clip mixer, no gain/limiter; add a soft limiter if summed
//! peaks clip audibly.

/// Mix two interleaved PCM16 buffers of the same channel count into one.
/// If lengths differ (sources rarely deliver identical frame counts), the
/// shorter is treated as zero-padded — the extra tail of the longer passes
/// through unmixed. Returns interleaved PCM16 bytes.
pub fn mix_pcm16(a: &[u8], a_vol: f32, b: &[u8], b_vol: f32) -> Vec<u8> {
    let sa = as_i16(a);
    let sb = as_i16(b);
    let n = sa.len().max(sb.len());
    let mut out = Vec::with_capacity(n * 2);
    for i in 0..n {
        let x = *sa.get(i).unwrap_or(&0) as f32 * a_vol;
        let y = *sb.get(i).unwrap_or(&0) as f32 * b_vol;
        let s = (x + y).round() as i32;
        let s = s.clamp(i16::MIN as i32, i16::MAX as i32) as i16;
        out.extend_from_slice(&s.to_le_bytes());
    }
    out
}

pub fn scale_pcm16(a: &[u8], vol: f32) -> Vec<u8> {
    if (vol - 1.0).abs() < 0.01 {
        return a.to_vec();
    }
    let sa = as_i16(a);
    let mut out = Vec::with_capacity(sa.len() * 2);
    for s in sa {
        let v = (s as f32 * vol).round() as i32;
        let v = v.clamp(i16::MIN as i32, i16::MAX as i32) as i16;
        out.extend_from_slice(&v.to_le_bytes());
    }
    out
}

fn as_i16(bytes: &[u8]) -> Vec<i16> {
    bytes
        .chunks_exact(2)
        .map(|c| i16::from_le_bytes([c[0], c[1]]))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sums_and_clips() {
        // 20000 + 20000 = 40000 -> clip to 32767; -20000 + -20000 -> -32768.
        let a = [20000i16, -20000].iter().flat_map(|s| s.to_le_bytes()).collect::<Vec<_>>();
        let b = a.clone();
        let mixed = as_i16(&mix_pcm16(&a, 1.0, &b, 1.0));
        assert_eq!(mixed[0], 32767);
        assert_eq!(mixed[1], -32768);
    }

    #[test]
    fn zero_pads_shorter_source() {
        let a = [1000i16, 2000].iter().flat_map(|s| s.to_le_bytes()).collect::<Vec<_>>();
        let b = [500i16].iter().flat_map(|s| s.to_le_bytes()).collect::<Vec<_>>();
        let mixed = as_i16(&mix_pcm16(&a, 1.0, &b, 1.0));
        assert_eq!(mixed, vec![1500, 2000]); // second sample: 2000 + 0
    }
}
