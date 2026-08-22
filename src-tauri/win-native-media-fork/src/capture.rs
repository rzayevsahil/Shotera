//! Windows.Graphics.Capture (WGC) session over a raw D3D11 device.
//!
//! Produces `CapturedFrame`s (BGRA8 D3D11 textures) pushed through a channel.
//! Frames stay on the GPU; no CPU readback happens here. The `FrameArrived`
//! callback recreates the frame pool when the content size changes.

use std::sync::mpsc::{Receiver, SyncSender};
use std::sync::Mutex;
use std::time::Duration;

use windows::core::{IInspectable, Interface, Result as WResult};
use windows::Foundation::TypedEventHandler;
use windows::Graphics::Capture::{
    Direct3D11CaptureFramePool, GraphicsCaptureItem, GraphicsCaptureSession,
};
use windows::Win32::Graphics::Direct3D11::{
    ID3D11DeviceContext, D3D11_TEXTURE2D_DESC, D3D11_USAGE_STAGING, D3D11_CPU_ACCESS_READ,
    D3D11_MAP_READ, D3D11_MAPPED_SUBRESOURCE, D3D11_BOX,
};
use windows::Graphics::DirectX::Direct3D11::IDirect3DDevice;
use windows::Graphics::DirectX::DirectXPixelFormat;
use windows::Graphics::SizeInt32;
use windows::Win32::Foundation::HWND;
use windows::Win32::Graphics::Direct3D::{D3D_DRIVER_TYPE_HARDWARE, D3D_FEATURE_LEVEL_11_0};
use windows::Win32::Graphics::Direct3D11::{
    D3D11CreateDevice, ID3D11Device, ID3D11Texture2D, D3D11_CREATE_DEVICE_BGRA_SUPPORT,
    D3D11_CREATE_DEVICE_VIDEO_SUPPORT, D3D11_SDK_VERSION,
};
use windows::Win32::Graphics::Dxgi::IDXGIDevice;
use windows::Win32::Graphics::Gdi::{MonitorFromWindow, HMONITOR, MONITOR_DEFAULTTOPRIMARY};
use windows::Win32::System::WinRT::Direct3D11::{
    CreateDirect3D11DeviceFromDXGIDevice, IDirect3DDxgiInterfaceAccess,
};
use windows::Win32::System::WinRT::Graphics::Capture::IGraphicsCaptureItemInterop;

use crate::{CaptureTarget, CapturedFrame, PipelineError, Result};

/// Number of buffers in the WGC frame pool. Two is the common minimum that
/// avoids stalling the compositor while we consume the previous frame.
// ponytail: fixed at 2; bump only if we observe capture stalls under load.
const FRAME_POOL_BUFFERS: i32 = 2;

/// A running capture session. Dropping it stops capture and releases the
/// D3D11/WGC resources.
pub struct CaptureSession {
    _item: GraphicsCaptureItem,
    frame_pool: Direct3D11CaptureFramePool,
    session: GraphicsCaptureSession,
    device: ID3D11Device,
    // Kept so the FrameArrived handler stays registered for the session's life.
    _frame_arrived_token: i64,
}

impl CaptureSession {
    /// The raw D3D11 device backing this capture, shared later with the encoder
    /// so frames need no cross-device copy.
    pub fn device(&self) -> &ID3D11Device {
        &self.device
    }
}

impl Drop for CaptureSession {
    fn drop(&mut self) {
        // Close is best-effort; if the session already tore down, ignore.
        let _ = self.session.Close();
        let _ = self.frame_pool.Close();
    }
}

/// Options for a capture session.
#[derive(Clone, Copy, Debug)]
pub struct CaptureConfig {
    pub target: CaptureTarget,
    pub capture_cursor: bool,
}

/// Start capturing `config.target`. Frames arrive on the returned `Receiver`.
///
/// The channel is bounded (`bound`); if the consumer falls behind, the oldest
/// slot backpressures the callback, which drops the frame rather than block the
/// compositor thread. Returns the session (keep it alive) and the receiver.
pub fn start(
    config: CaptureConfig,
    bound: usize,
    recording_start_100ns: i64,
) -> Result<(CaptureSession, Receiver<CapturedFrame>)> {
    if !GraphicsCaptureSession::IsSupported()? {
        return Err(PipelineError::CaptureUnsupported);
    }

    let device = create_d3d_device()?;
    let d3d_interop = create_winrt_device(&device)?;

    let item = create_capture_item(config.target)?;
    let size = item.Size()?;

    let frame_pool = Direct3D11CaptureFramePool::CreateFreeThreaded(
        &d3d_interop,
        DirectXPixelFormat::B8G8R8A8UIntNormalized,
        FRAME_POOL_BUFFERS,
        size,
    )?;

    let (tx, rx) = std::sync::mpsc::sync_channel::<CapturedFrame>(bound);

    // Shared state the callback needs: the sender, the frame pool (to recreate
    // on resize), the winrt device (for recreation), and the capture-start QPC
    // baseline (set on the first frame so timestamps are relative).
    let context = unsafe { device.GetImmediateContext().ok() };
    
    let state = std::sync::Arc::new(Mutex::new(FrameState {
        tx,
        device: AgileDevice(d3d_interop.clone()),
        d3d11_device: AgileD3D11Device(device.clone()),
        context: context.map(AgileContext),
        staging_tex: None,
        last_size: size,
        recording_start_100ns,
        last_timestamp: None,
    }));

    let handler_state = state.clone();
    let handler = TypedEventHandler::<Direct3D11CaptureFramePool, IInspectable>::new(
        move |pool, _| -> WResult<()> {
            let pool = pool.as_ref().expect("frame pool present in callback");
            on_frame_arrived(pool, &handler_state);
            Ok(())
        },
    );

    let token = frame_pool.FrameArrived(&handler)?;

    let session = frame_pool.CreateCaptureSession(&item)?;
    // Cursor toggle is available on the session; ignore if the OS build lacks it.
    let _ = session.SetIsCursorCaptureEnabled(config.capture_cursor);
    session.StartCapture()?;

    Ok((
        CaptureSession {
            _item: item,
            frame_pool,
            session,
            device,
            _frame_arrived_token: token,
        },
        rx,
    ))
}

struct FrameState {
    tx: SyncSender<CapturedFrame>,
    device: AgileDevice,
    d3d11_device: AgileD3D11Device,
    context: Option<AgileContext>,
    staging_tex: Option<windows::Win32::Graphics::Direct3D11::ID3D11Texture2D>,
    last_size: SizeInt32,
    recording_start_100ns: i64,
    last_timestamp: Option<Duration>,
}

/// The `windows` bindings mark COM interfaces `!Send` conservatively, but WGC
/// objects created via `CreateFreeThreaded` are agile (marshal-free across
/// threads). The free-threaded frame pool invokes `FrameArrived` on an
/// arbitrary pool thread, so we must move the device we use for `Recreate`
/// into that closure. This newtype asserts the agility WGC guarantees.
// ponytail: narrow unsafe Send only for the agile WGC device, not a blanket wrapper.
struct AgileDevice(IDirect3DDevice);
unsafe impl Send for AgileDevice {}

struct AgileD3D11Device(ID3D11Device);
unsafe impl Send for AgileD3D11Device {}

#[derive(Clone)]
struct AgileContext(ID3D11DeviceContext);
unsafe impl Send for AgileContext {}

fn on_frame_arrived(
    pool: &Direct3D11CaptureFramePool,
    state: &std::sync::Arc<Mutex<FrameState>>,
) {
    let mut guard = match state.lock() {
        Ok(g) => g,
        Err(_) => return,
    };

    let frame = match pool.TryGetNextFrame() {
        Ok(f) => f,
        Err(_) => return,
    };

    // Content size can change (window resize / display mode). WGC requires the
    // frame pool be recreated at the new size; do it, then this frame is the
    // last at the old size and we skip pushing it.
    let content_size = match frame.ContentSize() {
        Ok(s) => s,
        Err(_) => return,
    };
    if content_size.Width != guard.last_size.Width
        || content_size.Height != guard.last_size.Height
    {
        let _ = pool.Recreate(
            &guard.device.0,
            DirectXPixelFormat::B8G8R8A8UIntNormalized,
            FRAME_POOL_BUFFERS,
            content_size,
        );
        guard.last_size = content_size;
        return;
    }

    let ticks = match frame.SystemRelativeTime() {
        Ok(t) => t.Duration, // 100ns units
        Err(_) => return,
    };
    let start = guard.recording_start_100ns;
    let rel_100ns = (ticks - start).max(0) as u64;
    let timestamp = Duration::from_nanos(rel_100ns * 100);

    // [DIAGNOSTIC] Timestamp Gap Detection
    let last = guard.last_timestamp;
    guard.last_timestamp = Some(timestamp);
    if let Some(prev) = last {
        let diff = timestamp.saturating_sub(prev);
        if diff > Duration::from_millis(60) {
            tracing::warn!(target: "av_sync_diagnostics", "VIDEO_TIMESTAMP_GAP | PTS: {:?} | Gap: {:?}", timestamp, diff);
        }
    }

    // Pull the D3D11 texture out of the WinRT surface (stays on GPU).
    let surface = match frame.Surface() {
        Ok(s) => s,
        Err(_) => return,
    };

    // [DIAGNOSTIC LOGGING]
    // Get actual QPC time to compare with WGC SystemRelativeTime
    let mut current_qpc = 0i64;
    unsafe { windows::Win32::System::Performance::QueryPerformanceCounter(&mut current_qpc).unwrap(); }
    
    // Log every 60th frame (approx 1 second) to avoid log spam, or log the first few
    tracing::info!(
        target: "av_sync_diagnostics",
        "VIDEO_FRAME | WGC_SystemRelativeTime: {} | Current_QPC: {} | Computed_PTS: {:?}",
        ticks, current_qpc, timestamp
    );

    let texture: ID3D11Texture2D = match surface.cast::<IDirect3DDxgiInterfaceAccess>() {
        Ok(access) => match unsafe { access.GetInterface::<ID3D11Texture2D>() } {
            Ok(t) => t,
            Err(_) => return,
        },
        Err(_) => return,
    };

    let width = content_size.Width.max(0) as u32;
    let height = content_size.Height.max(0) as u32;

    // [DIAGNOSTIC] Texture Black Check
    let ctx_opt = guard.context.clone();
    if let Some(ctx) = ctx_opt {
        unsafe {
            if guard.staging_tex.is_none() {
                let mut desc = D3D11_TEXTURE2D_DESC::default();
                texture.GetDesc(&mut desc);
                let mut staging_desc = desc;
                staging_desc.Width = 1;
                staging_desc.Height = 1;
                staging_desc.Usage = D3D11_USAGE_STAGING;
                staging_desc.BindFlags = 0;
                staging_desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ.0 as u32;
                staging_desc.MiscFlags = 0;
                let mut staging: Option<windows::Win32::Graphics::Direct3D11::ID3D11Texture2D> = None;
                if guard.d3d11_device.0.CreateTexture2D(&staging_desc, None, Some(&mut staging)).is_ok() {
                    guard.staging_tex = staging;
                }
            }

            if let Some(staging) = &guard.staging_tex {
                let src_box = D3D11_BOX {
                    left: width / 2,
                    top: height / 2,
                    right: (width / 2) + 1,
                    bottom: (height / 2) + 1,
                    front: 0,
                    back: 1,
                };
                ctx.0.CopySubresourceRegion(staging, 0, 0, 0, 0, &texture, 0, Some(&src_box));
                let mut mapped = D3D11_MAPPED_SUBRESOURCE::default();
                if ctx.0.Map(staging, 0, D3D11_MAP_READ, 0, Some(&mut mapped)).is_ok() {
                    let pixel = std::slice::from_raw_parts(mapped.pData as *const u8, 4);
                    if pixel[0] == 0 && pixel[1] == 0 && pixel[2] == 0 {
                        tracing::warn!(target: "av_sync_diagnostics", "POSSIBLE_BLACK_FRAME | PTS: {:?} | Center Pixel: {:?}", timestamp, pixel);
                    }
                    ctx.0.Unmap(staging, 0);
                }
            }
        }
    }

    // Bounded, non-blocking: if the consumer is behind, drop this frame rather
    // than stall the compositor.
    let _ = state_send_nonblocking(
        &guard.tx,
        CapturedFrame {
            texture,
            frame,
            timestamp,
            width,
            height,
        },
        current_qpc,
    );
}

fn state_send_nonblocking(tx: &SyncSender<CapturedFrame>, f: CapturedFrame, current_qpc: i64) -> Result<()> {
    match tx.try_send(f) {
        Ok(()) => Ok(()),
        Err(std::sync::mpsc::TrySendError::Full(dropped_f)) => {
            tracing::warn!(target: "av_sync_diagnostics", "FRAME_DROPPED_QUEUE_FULL | Current_QPC: {} | Dropped_PTS: {:?}", current_qpc, dropped_f.timestamp);
            Ok(())
        },
        Err(std::sync::mpsc::TrySendError::Disconnected(_)) => Err(PipelineError::Stopped),
    }
}

/// Create a hardware D3D11 device with BGRA + video support and multithread
/// protection (needed later so the encoder's DXGI device manager can share it).
fn create_d3d_device() -> Result<ID3D11Device> {
    use windows::Win32::Foundation::HMODULE;
    let flags = D3D11_CREATE_DEVICE_BGRA_SUPPORT | D3D11_CREATE_DEVICE_VIDEO_SUPPORT;
    let mut device: Option<ID3D11Device> = None;
    let feature_levels = [D3D_FEATURE_LEVEL_11_0];
    unsafe {
        D3D11CreateDevice(
            None,
            D3D_DRIVER_TYPE_HARDWARE,
            HMODULE::default(),
            flags,
            Some(&feature_levels),
            D3D11_SDK_VERSION,
            Some(&mut device),
            None,
            None,
        )?;
    }
    let device = device.expect("D3D11CreateDevice succeeded but returned null device");

    // Enable multithread protection: WGC callbacks and later the encoder touch
    // the immediate context from different threads.
    use windows::Win32::Graphics::Direct3D11::ID3D11Multithread;
    if let Ok(mt) = device.cast::<ID3D11Multithread>() {
        unsafe { let _ = mt.SetMultithreadProtected(true); };
    }

    Ok(device)
}

/// Wrap the raw D3D11 device as a WinRT `IDirect3DDevice` for WGC.
fn create_winrt_device(device: &ID3D11Device) -> Result<IDirect3DDevice> {
    let dxgi: IDXGIDevice = device.cast()?;
    let inspectable = unsafe { CreateDirect3D11DeviceFromDXGIDevice(&dxgi)? };
    let winrt: IDirect3DDevice = inspectable.cast()?;
    Ok(winrt)
}

/// Build a `GraphicsCaptureItem` for a monitor or window via the interop factory.
fn create_capture_item(target: CaptureTarget) -> Result<GraphicsCaptureItem> {
    let interop: IGraphicsCaptureItemInterop =
        windows::core::factory::<GraphicsCaptureItem, IGraphicsCaptureItemInterop>()?;

    match target {
        CaptureTarget::Monitor(index) => {
            let hmon = monitor_at_index(index)?;
            let item: GraphicsCaptureItem =
                unsafe { interop.CreateForMonitor(hmon)? };
            Ok(item)
        }
        CaptureTarget::Window(hwnd) => {
            let item: GraphicsCaptureItem =
                unsafe { interop.CreateForWindow(HWND(hwnd as *mut _))? };
            Ok(item)
        }
    }
}

/// Resolve a monitor index into an `HMONITOR` by enumerating display monitors.
fn monitor_at_index(index: usize) -> Result<HMONITOR> {
    use windows::Win32::Graphics::Gdi::{EnumDisplayMonitors, HDC};
    use windows::core::BOOL;
    use windows::Win32::Foundation::{LPARAM, RECT};

    struct Collector {
        monitors: Vec<HMONITOR>,
    }

    unsafe extern "system" fn cb(
        hmon: HMONITOR,
        _hdc: HDC,
        _rect: *mut RECT,
        data: LPARAM,
    ) -> BOOL {
        let collector = &mut *(data.0 as *mut Collector);
        collector.monitors.push(hmon);
        BOOL(1) // continue
    }

    let mut collector = Collector {
        monitors: Vec::new(),
    };
    unsafe {
        let _ = EnumDisplayMonitors(
            None,
            None,
            Some(cb),
            LPARAM(&mut collector as *mut _ as isize),
        );
    }

    collector
        .monitors
        .get(index)
        .copied()
        .ok_or(PipelineError::MonitorNotFound(index))
}

/// Convenience: the primary monitor's HMONITOR (used by examples).
pub fn primary_monitor() -> HMONITOR {
    unsafe { MonitorFromWindow(HWND(std::ptr::null_mut()), MONITOR_DEFAULTTOPRIMARY) }
}
