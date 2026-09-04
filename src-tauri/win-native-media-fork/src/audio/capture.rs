//! WASAPI audio capture: system loopback and microphone.
//!
//! Both sources use a shared-mode `IAudioClient` polled on a dedicated thread.
//! Loopback captures the default *render* device with the loopback flag; the
//! mic captures the default *capture* device. The device mix format (commonly
//! 32-bit float, 48 kHz, stereo) is converted to interleaved 16-bit PCM, which
//! the AAC encoder accepts.

use std::sync::mpsc::{Receiver, SyncSender};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use windows::Win32::Media::Audio::*;
use windows::Win32::System::Com::{
    CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED,
};

use crate::{AudioBuffer, AudioSource, Result};

/// A running audio capture. Dropping it stops the capture thread.
pub struct AudioCapture {
    stop: Arc<AtomicBool>,
    handle: Option<std::thread::JoinHandle<()>>,
    pub sample_rate: u32,
    pub channels: u16,
}

impl Drop for AudioCapture {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::SeqCst);
        if let Some(h) = self.handle.take() {
            let _ = h.join();
        }
    }
}

/// Start capturing `source`. Returns the capture handle and a receiver of PCM
/// buffers. The format (sample rate / channels) is read from the device and
/// exposed on the handle so the encoder can be configured to match.
pub fn start(source: AudioSource, bound: usize, base_time_100ns: Arc<std::sync::atomic::AtomicI64>, is_paused: Arc<AtomicBool>) -> Result<(AudioCapture, Receiver<AudioBuffer>)> {
    // Probe the device format synchronously to know its native format.
    // However, we will try to force WASAPI to auto-convert to 48kHz/Stereo.
    let (native_rate, native_channels) = probe_format(source)?;

    let (tx, rx) = std::sync::mpsc::sync_channel::<AudioBuffer>(bound);
    let stop = Arc::new(AtomicBool::new(false));
    let stop_thread = stop.clone();

    // We ALWAYS expose 48000 Hz and 2 Channels to the AAC encoder.
    let target_sample_rate = 48000;
    let target_channels = 2;

    let handle = std::thread::spawn(move || {
        if let Err(e) = capture_loop(source, tx, stop_thread, base_time_100ns, is_paused) {
            tracing::error!("audio capture loop ended: {e}");
        }
    });

    Ok((
        AudioCapture {
            stop,
            handle: Some(handle),
            sample_rate: target_sample_rate,
            channels: target_channels,
        },
        rx,
    ))
}

/// Open the device, read its mix format, close. Used to report format upfront.
fn probe_format(source: AudioSource) -> Result<(u32, u16)> {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let client = activate_client(source)?;
        let fmt = client.GetMixFormat()?;
        let sr = (*fmt).nSamplesPerSec;
        let ch = (*fmt).nChannels;
        windows::Win32::System::Com::CoTaskMemFree(Some(fmt as *const _));
        Ok((sr, ch))
    }
}

unsafe fn activate_client(source: AudioSource) -> Result<IAudioClient> {
    let enumerator: IMMDeviceEnumerator =
        CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)?;
    let (data_flow, _role) = match source {
        // Loopback captures the render endpoint.
        AudioSource::SystemLoopback => (eRender, eConsole),
        AudioSource::Microphone => (eCapture, eConsole),
    };
    let device = enumerator.GetDefaultAudioEndpoint(data_flow, eConsole)?;
    let client = device.Activate::<IAudioClient>(CLSCTX_ALL, None)?;
    Ok(client)
}

fn capture_loop(
    source: AudioSource,
    tx: SyncSender<AudioBuffer>,
    stop: Arc<AtomicBool>,
    base_time_100ns: Arc<std::sync::atomic::AtomicI64>,
    is_paused: Arc<AtomicBool>,
) -> Result<()> {
    unsafe {
        let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
        let client = activate_client(source)?;
        let mut fmt_ptr = client.GetMixFormat()?;
        
        // Define our target ideal format for AAC encoder (48kHz, Stereo, 32-bit Float)
        let mut target_fmt = windows::Win32::Media::Audio::WAVEFORMATEXTENSIBLE::default();
        target_fmt.Format.wFormatTag = 0xFFFE; // WAVE_FORMAT_EXTENSIBLE
        target_fmt.Format.nChannels = 2;
        target_fmt.Format.nSamplesPerSec = 48000;
        target_fmt.Format.wBitsPerSample = 32;
        target_fmt.Format.nBlockAlign = (2 * 32) / 8;
        target_fmt.Format.nAvgBytesPerSec = 48000 * target_fmt.Format.nBlockAlign as u32;
        target_fmt.Format.cbSize = 22;
        target_fmt.Samples.wValidBitsPerSample = 32;
        target_fmt.dwChannelMask = 3; // KSAUDIO_SPEAKER_STEREO
        target_fmt.SubFormat = windows::Win32::Media::Multimedia::KSDATAFORMAT_SUBTYPE_IEEE_FLOAT;
        
        let target_fmt_ptr = &mut target_fmt as *mut _ as *mut WAVEFORMATEX;

        let mut stream_flags = match source {
            AudioSource::SystemLoopback => AUDCLNT_STREAMFLAGS_LOOPBACK,
            AudioSource::Microphone => 0,
        };

        let buffer_duration_hns = 2_000_000i64; // 200ms in 100ns units

        // Try initializing with Auto-Convert to 48kHz first
        let mut auto_convert_success = false;
        let mut actual_sample_rate = 48000;
        let mut actual_channels = 2;
        let mut is_float = true;
        let mut bits = 32;

        let auto_convert_flags = stream_flags | AUDCLNT_STREAMFLAGS_AUTOCONVERTPCM | AUDCLNT_STREAMFLAGS_SRC_DEFAULT_QUALITY;
        if client.Initialize(
            AUDCLNT_SHAREMODE_SHARED,
            auto_convert_flags,
            buffer_duration_hns,
            0,
            target_fmt_ptr,
            None,
        ).is_ok() {
            auto_convert_success = true;
            tracing::info!(target: "av_sync_diagnostics", "WASAPI Auto-Convert SUCCESS: source {:?} to 48000Hz", source);
        } else {
            // Fallback to Native Format
            tracing::warn!(target: "av_sync_diagnostics", "WASAPI Auto-Convert FAILED for {:?}. Falling back to native format with software resampling.", source);
            client.Initialize(
                AUDCLNT_SHAREMODE_SHARED,
                stream_flags,
                buffer_duration_hns,
                0,
                fmt_ptr,
                None,
            )?;
            let fmt = *fmt_ptr;
            actual_sample_rate = fmt.nSamplesPerSec;
            actual_channels = fmt.nChannels;
            is_float = format_is_float(fmt_ptr);
            bits = fmt.wBitsPerSample;
        }

        let capture: IAudioCaptureClient = client.GetService()?;
        client.Start()?;
        windows::Win32::System::Com::CoTaskMemFree(Some(fmt_ptr as *const _));

        let mut qpc_freq = 0i64;
        windows::Win32::System::Performance::QueryPerformanceFrequency(&mut qpc_freq).unwrap();
        // Poll interval ~ half the buffer.
        let poll = std::time::Duration::from_millis(10);

        while !stop.load(Ordering::SeqCst) {
            let packet_len = capture.GetNextPacketSize()?;
            if packet_len == 0 {
                std::thread::sleep(poll);
                continue;
            }

            let mut data_ptr: *mut u8 = std::ptr::null_mut();
            let mut num_frames: u32 = 0;
            let mut flags: u32 = 0;
            capture.GetBuffer(
                &mut data_ptr,
                &mut num_frames,
                &mut flags,
                None,
                None,
            )?;

            if is_paused.load(Ordering::Relaxed) {
                capture.ReleaseBuffer(num_frames)?;
                continue;
            }

            let silent = (flags & AUDCLNT_BUFFERFLAGS_SILENT.0 as u32) != 0;
            let frame_bytes = (bits / 8) as usize * actual_channels as usize;
            let byte_len = num_frames as usize * frame_bytes;

            let pcm16 = if silent {
                vec![0u8; num_frames as usize * 2 * actual_channels as usize]
            } else {
                let raw = std::slice::from_raw_parts(data_ptr, byte_len);
                to_pcm16(raw, is_float, bits, actual_channels)
            };
            
            // Normalize audio to 48000Hz Stereo via Software Resampling if Auto-Convert failed
            let final_pcm = normalize_audio(&pcm16, actual_sample_rate, actual_channels, 48000, 2);

            capture.ReleaseBuffer(num_frames)?;

            // Compute relative timestamp
            let mut current_qpc = 0i64;
            windows::Win32::System::Performance::QueryPerformanceCounter(&mut current_qpc).unwrap();
            
            let current_100ns = (current_qpc as f64 * 10_000_000.0 / qpc_freq as f64) as i64;
            let start_100ns = base_time_100ns.load(Ordering::SeqCst);
            let rel_100ns = (current_100ns - start_100ns).max(0) as u64;
            let timestamp = std::time::Duration::from_nanos(rel_100ns * 100);
            
            // [DIAGNOSTIC LOGGING]
            tracing::info!(
                target: "av_sync_diagnostics",
                "AUDIO_BUFFER | Current_QPC: {} | Computed_PTS: {:?}",
                current_qpc, timestamp
            );

            // Bounded, drop on backpressure (audio glitch beats a stall).
            let _ = tx.try_send(AudioBuffer {
                data: final_pcm,
                timestamp,
                sample_rate: 48000,
                channels: 2,
            });
        }

        client.Stop()?;
        Ok(())
    }
}

/// Software linear-interpolation resampler and channel mixer.
/// Converts any PCM16 format to the target sample rate and target channels.
fn normalize_audio(input: &[u8], src_rate: u32, src_channels: u16, dst_rate: u32, dst_channels: u16) -> Vec<u8> {
    if src_rate == dst_rate && src_channels == dst_channels {
        return input.to_vec();
    }
    
    let num_src_frames = input.len() / (src_channels as usize * 2);
    if num_src_frames == 0 { return vec![]; }
    
    let dst_frames = (num_src_frames as u64 * dst_rate as u64 / src_rate as u64) as usize;
    
    let input_i16 = unsafe { std::slice::from_raw_parts(input.as_ptr() as *const i16, input.len() / 2) };
    let mut output_i16 = Vec::with_capacity(dst_frames * dst_channels as usize);
    
    for i in 0..dst_frames {
        let src_index_f = i as f64 * src_rate as f64 / dst_rate as f64;
        let src_index = src_index_f as usize;
        let next_index = (src_index + 1).min(num_src_frames - 1);
        let t = src_index_f - src_index as f64;
        
        for dc in 0..dst_channels as usize {
            // Mix channels: if mono to stereo, copy mono to both. If stereo to mono, average.
            let mut s1 = 0.0;
            let mut s2 = 0.0;
            
            if src_channels == 1 {
                s1 = input_i16[src_index] as f64;
                s2 = input_i16[next_index] as f64;
            } else if src_channels == 2 && dst_channels == 1 {
                s1 = (input_i16[src_index * 2] as f64 + input_i16[src_index * 2 + 1] as f64) * 0.5;
                s2 = (input_i16[next_index * 2] as f64 + input_i16[next_index * 2 + 1] as f64) * 0.5;
            } else {
                let sc = dc.min((src_channels - 1) as usize);
                s1 = input_i16[src_index * src_channels as usize + sc] as f64;
                s2 = input_i16[next_index * src_channels as usize + sc] as f64;
            }
            
            let val = s1 + (s2 - s1) * t;
            output_i16.push(val as i16);
        }
    }
    
    unsafe {
        std::slice::from_raw_parts(output_i16.as_ptr() as *const u8, output_i16.len() * 2).to_vec()
    }
}

/// Determine if the mix format is IEEE float (vs integer PCM), handling the
/// WAVE_FORMAT_EXTENSIBLE case by checking the subformat GUID.
unsafe fn format_is_float(fmt: *const WAVEFORMATEX) -> bool {
    const WAVE_FORMAT_IEEE_FLOAT: u16 = 0x0003;
    const WAVE_FORMAT_EXTENSIBLE: u16 = 0xFFFE;
    match (*fmt).wFormatTag {
        WAVE_FORMAT_IEEE_FLOAT => true,
        WAVE_FORMAT_EXTENSIBLE => {
            use windows::Win32::Media::Multimedia::KSDATAFORMAT_SUBTYPE_IEEE_FLOAT;
            let ext = fmt as *const WAVEFORMATEXTENSIBLE;
            // Copy out of the packed struct before comparing (unaligned read).
            let subformat = std::ptr::addr_of!((*ext).SubFormat).read_unaligned();
            subformat == KSDATAFORMAT_SUBTYPE_IEEE_FLOAT
        }
        _ => false,
    }
}

/// Convert raw device samples to interleaved 16-bit signed PCM.
fn to_pcm16(raw: &[u8], is_float: bool, bits: u16, _channels: u16) -> Vec<u8> {
    if is_float && bits == 32 {
        let n = raw.len() / 4;
        let mut out = Vec::with_capacity(n * 2);
        for i in 0..n {
            let f = f32::from_le_bytes([
                raw[i * 4],
                raw[i * 4 + 1],
                raw[i * 4 + 2],
                raw[i * 4 + 3],
            ]);
            let clamped = f.clamp(-1.0, 1.0);
            let s = (clamped * 32767.0) as i16;
            out.extend_from_slice(&s.to_le_bytes());
        }
        out
    } else if bits == 16 {
        raw.to_vec() // already PCM16
    } else if bits == 32 {
        // 32-bit int PCM -> 16-bit (take high word).
        let n = raw.len() / 4;
        let mut out = Vec::with_capacity(n * 2);
        for i in 0..n {
            out.push(raw[i * 4 + 2]);
            out.push(raw[i * 4 + 3]);
        }
        out
    } else {
        raw.to_vec()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn float_to_pcm16_maps_range() {
        // +1.0, 0.0, -1.0 as f32 LE.
        let mut raw = Vec::new();
        for f in [1.0f32, 0.0, -1.0] {
            raw.extend_from_slice(&f.to_le_bytes());
        }
        let pcm = to_pcm16(&raw, true, 32, 1);
        let s: Vec<i16> = pcm
            .chunks(2)
            .map(|c| i16::from_le_bytes([c[0], c[1]]))
            .collect();
        assert_eq!(s[0], 32767);
        assert_eq!(s[1], 0);
        assert_eq!(s[2], -32767);
    }

    #[test]
    fn pcm16_passthrough() {
        let raw = vec![0x11, 0x22, 0x33, 0x44];
        assert_eq!(to_pcm16(&raw, false, 16, 1), raw);
    }
}
