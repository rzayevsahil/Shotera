# Professional Scrolling Screenshot (Kaydırmalı Ekran Görüntüsü) Feature

Shotera uygulamasına ekranda seçilen herhangi bir bölgenin (web sayfaları, Chrome/Edge, PDF okuyucular, VS Code, Dosya Gezgini, uzun listeler vb.) içeriğini otomatik olarak aşağı doğru kaydırıp piksel tabanlı örtüşme (overlap) tespiti ile tek ve pürüzsüz bir uzun görüntü (PNG/JPEG/WebP) haline getiren profesyonel **Scrolling Screenshot** özelliğinin eklenmesi planıdır.

---

## User Review Required

> [!IMPORTANT]
> **Windows Input & UI Automation İzinleri ve Davranışı:**
> - Scroll işlemi sırasında hedef pencereyi kaydırmak için `UI Automation`, `Mouse Wheel` simülasyonu ve `Page Down` yöntemleri strateji (strategy pattern) olarak desteklenecektir.
> - Mouse Wheel simülasyonu sırasında seçilen alanın merkez noktasına fare kaydırma tekeri girdisi (`SendInput / MOUSEEVENTF_WHEEL`) gönderilecektir. Bu esnada kullanıcının bilgisayarda başka bir işlem yapmaması ve fareyi hareket ettirmemesi tavsiye edilir. Kullanıcı istediği an **ESC** tuşuna basarak veya ekrandaki yüzen göstergeden **Durdur (Stop)** butonuna tıklayarak işlemi güvenle durdurabilir veya iptal edebilir.

> [!TIP]
> **Editör Entegrasyonu ve Çok Uzun Görüntüler (Canvas Scaling):**
> - Birleştirilen uzun görüntü (örneğin 1080x4500 px), Shotera'nın mevcut tam ekran editörüne (`ScreenshotCapture.tsx`) aktarıldığında, ekran yüksekliğine zorla sığdırılıp basık hale getirilmek yerine; kullanıcının tekerlek veya sürükleme ile kaydırabileceği ve %100 netlikte düzenleyebileceği (çizim, ok, şekil, metin, sansür) **kaydırılabilir ve yakınlaştırılabilir bir çalışma alanı** ile sunulacaktır.
> - Tüm çıktı aksiyonları (Panoya Kopyalama, PNG/JPEG Olarak Kaydetme, OCR Metin Tanıma, Ekrana Sabitleme, Buluta Yükleme) eksiksiz olarak çalışacaktır.

---

## Open Questions

> [!NOTE]
> Aşağıdaki tasarım kararları için varsayılanlar belirlenmiştir, gerekirse geri bildiriminiz doğrultusunda revize edilebilir:
> 1. **Varsayılan Global Kısayol:** Shotera'nın mevcut `Ctrl+1` (Bölge), `Ctrl+2` (Tam Ekran), `Ctrl+3` (Zoom), `Ctrl+4` (Mola), `Ctrl+5` (Kayıt), `Ctrl+6` (Canlı Zoom) sıralamasıyla tam uyumlu olması için varsayılan Scrolling Screenshot kısayolu **`Ctrl+9`** (alternatif olarak `Alt+Shift+S`) olarak ayarlanacaktır. Kullanıcı ayarlar panelinden bunu serbestçe değiştirebilecektir.
> 2. **Varsayılan Kaydırma Adımı (Scroll Amount):** Varsayılan olarak her adımda 2-3 tekerlek çentiği (yaklaşık 240-300 piksel) kaydırma yapılarak en az %50-70 dikey örtüşme garanti edilecek ve şablon eşleme hatasız çalışacaktır.

---

## Proposed Changes

Mimaride **scrolling**, **screenshot capture**, **image matching** ve **stitching** bileşenleri birbirinden bağımsız modüller olarak tasarlanacaktır.

```
src-tauri/src/scrolling/
├── mod.rs             # Oturum koordinatörü, durum yönetimi, Tauri komutları ve event'ler
├── engine.rs          # ScrollEngine trait (Auto, MouseWheel, PageDown, UiAutomation)
├── capture.rs         # Seçilen (x, y, w, h) ekran bölgesinin GDI BitBlt ile anlık sub-millisecond yakalanması
├── matcher.rs         # OverlapMatcher trait (Luminance Normalized SAD, sticky header engelleme, tolerans)
└── stitcher.rs        # Bellek korumalı dinamik dilim birleştirici, max boy ve duplicate kontrolü
```

---

### Rust Backend (Tauri & Windows API)

#### [NEW] [engine.rs](file:///c:/Users/sahil/source/antigravity/screen-app/src-tauri/src/scrolling/engine.rs)
- `ScrollEngine` trait tanımı:
  - `fn scroll_down(&self, target_point: (i32, i32), amount: i32) -> Result<(), String>`
  - `fn is_scrollable(&self, target_point: (i32, i32)) -> Option<bool>`
- Strateji implementasyonları:
  - `MouseWheelEngine`: Windows `SendInput` ile `MOUSEINPUT` (`MOUSEEVENTF_WHEEL`) kullanarak hedef koordinatta aşağı kaydırma.
  - `PageDownEngine`: `VK_NEXT` veya `VK_DOWN` tuş simülasyonu fallback'i.
  - `UiAutomationEngine`: Windows COM UI Automation (`IUIAutomation`, `UIA_ScrollPatternId`) ile hedef pencerenin dikey kaydırılabilirliğini denetleme ve programatik kaydırma.
  - `AutoScrollEngine`: UI Automation destekleniyorsa onu, desteklenmiyorsa `MouseWheel`'i, içerik ilerlemezse `PageDown`'u otomatik dener.

#### [NEW] [capture.rs](file:///c:/Users/sahil/source/antigravity/screen-app/src-tauri/src/scrolling/capture.rs)
- Yalnızca seçilen fiziksel `(x, y, w, h)` dikdörtgenini `BitBlt` (`SRCCOPY | CAPTUREBLT`) ile masaüstü DC'sinden mikro saniyeler içinde okuyan ve doğrudan `image::RgbaImage`'e dönüştüren yüksek performanslı yakalama motoru.
- Multi-monitor ve DPI ölçeklendirme koordinatlarını hatasız fiziksel piksel eşlemesi ile hesaplar.
- Shotera pencereleri `WDA_EXCLUDEFROMCAPTURE` ile korunduğu veya gizlendiği için çekimlerde Shotera arayüzü asla görünmez.

#### [NEW] [matcher.rs](file:///c:/Users/sahil/source/antigravity/screen-app/src-tauri/src/scrolling/matcher.rs)
- `OverlapMatcher` trait tanımı ve `TemplateOverlapMatcher` implementasyonu:
  - **Sticky/Fixed Header Engelleme:** Eşleme şablonu, görüntünün tepe noktasından (0 pikselden) DEĞİL; önceki karenin alt-orta bölümünden ($0.50 \times H$ ile $0.85 \times H$ arası) seçilir. Böylece sabit kalan web/uygulama başlıkları eşlemeyi bozmaz.
  - **Kaydırma Çubuğu (Scrollbar) Filtresi:** Pencerenin en sağındaki 25 piksel ve en solundaki 10 piksel şablon alanından çıkarılarak kayan dikey scrollbar'ların veya gölgelerin pikselleri eşleme dışı bırakılır.
  - **Luminance SAD & Alt-Örnekleme:** Renkli pikseller gri tonlama parlaklık (Luminance) değerine dönüştürülür, yatayda 2x subsample edilir.
  - **2 Aşamalı Arama (Coarse-to-Fine):** Önce 4'er piksellik kaba tarama ile minimum hata aralığı bulunur, ardından 1'er piksellik hassas arama ile $\Delta y$ pürüzsüz tespit edilir.
  - **Tolerans:** Font ClearType/Anti-aliasing ve küçük render farklılıkları ortalama mutlak fark eşiği (MAD threshold) sayesinde dikişsiz tolere edilir.

#### [NEW] [stitcher.rs](file:///c:/Users/sahil/source/antigravity/screen-app/src-tauri/src/scrolling/stitcher.rs)
- Dinamik bellek ve dikiş yönetimi:
  - İlk kare ana temel olarak saklanır.
  - Takip eden her karede yalnızca yeni görünen $\Delta y_i$ yüksekliğindeki alt şerit belleğe eklenir.
  - Bellek güvenliği: Maksimum dikey sınır (örn. 30.000 piksel) ve maksimum kare sayısı (kullanıcı ayarı, örn. 30 kare) kontrolü.
  - Bitiş tespiti: Üst üste $\Delta y == 0$ veya aynı görüntünün gelmesi durumunda otomatik durdurma.
  - Finalde tek bir `RgbaImage` oluşturup `state.last_screenshot` içine yazar.

#### [NEW] [mod.rs](file:///c:/Users/sahil/source/antigravity/screen-app/src-tauri/src/scrolling/mod.rs)
- Oturum yaşam döngüsü (Start, Progress, Stop, Cancel, Finalize).
- Asenkron tokio görevinde kaydırma döngüsünü çalıştırma.
- Döngü esnasında `GetAsyncKeyState(VK_ESCAPE)` ile global ESC basımını anlık yakalama ve güvenli iptal.
- Frontend'e Tauri event'leri yayınlama (`scrolling-progress`, `scrolling-finished`, vb.).

#### [MODIFY] [Cargo.toml](file:///c:/Users/sahil/source/antigravity/screen-app/src-tauri/Cargo.toml)
- `windows-sys` özelliklerine klavye ve fare simülasyonu için `"Win32_UI_Input_KeyboardAndMouse"` eklenmesi.

#### [MODIFY] [lib.rs](file:///c:/Users/sahil/source/antigravity/screen-app/src-tauri/src/lib.rs)
- `scrolling` modülünün tanıtılması.
- `AppState` içine Scrolling kısayolu (`scrolling_shortcut`) ve ayarlarının eklenmesi.
- Tauri komutlarının kaydedilmesi:
  - `start_scrolling_capture`
  - `stop_scrolling_capture`
  - `cancel_scrolling_capture`
  - `get_scrolling_settings`
  - `update_scrolling_settings`
- Sistem tepsisi menüsüne "Scrolling Screenshot" öğesinin eklenmesi.
- Global kısayol dinleyicisine scrolling kısayolunun dahil edilmesi.

---

### Frontend (React & TypeScript)

#### [NEW] [ScrollingHud.tsx](file:///c:/Users/sahil/source/antigravity/screen-app/src/components/ScrollingHud.tsx)
- Kaydırma işlemi başladığında ekranda görünen modern, sade yüzen gösterge:
  - Nabız atan gösterge ışığı / minik animasyon
  - "Scrolling Screenshot... Frame 4 / 30"
  - İşlemi mevcut karede sonlandırıp birleştirmek için **[Bitir / Stop]** butonu
  - "İptal için ESC" ipucu
  - Tamamlandığında "Scrolling Screenshot completed" rozeti.

#### [MODIFY] [ScreenshotCapture.tsx](file:///c:/Users/sahil/source/antigravity/screen-app/src/components/ScreenshotCapture.tsx)
- Bölge seçimi yapıldığında araç çubuğuna (toolbar) yeni **"Scrolling Screenshot"** aksiyon butonu eklenmesi.
- Kullanıcı scrolling screenshot başlattığında pencerenin gizlenmesi ve Rust backend'ine seçilen fiziksel koordinatların gönderilmesi.
- Tamamlanan dikey uzun ekran görüntüsü editöre yüklendiğinde:
  - Ekranı dikeyde esnetip bozmadan, doğal çözünürlüğünde kaydırılabilir/pan yapılabilir kanvas modu.
  - Mevcut tüm araçların (Kalem, Ok, Şekiller, Yazı, Sansür, Silgi, Adım sayacı) uzun görüntü üzerinde piksel hassasiyetiyle çalışabilmesi.
  - Panoya Kopyalama, PNG/JPEG Olarak Kaydetme, OCR, Pinleme ve Buluta Yükleme aksiyonlarının tam uyumu.

#### [MODIFY] [SettingsWindow.tsx](file:///c:/Users/sahil/source/antigravity/screen-app/src/components/SettingsWindow.tsx)
- Yakalama (Capture) sekmesinde "Scrolling Screenshot" konfigürasyon paneli:
  - **Scroll Method:** Auto / Mouse Wheel / Page Down / UI Automation
  - **Scroll Delay:** 100 ms – 1000 ms (varsayılan 350 ms)
  - **Scroll Amount:** 1 – 5 çentik (varsayılan 2)
  - **Overlap Sensitivity:** Normal / Yüksek / Esnek
  - **Maximum Scroll Count:** 5 – 100 (varsayılan 30)
  - **Stop when no movement detected:** Açık / Kapalı
  - **Global Shortcut:** Tuş atama kutusu (varsayılan `Ctrl+9`)

#### [MODIFY] [i18n.ts](file:///c:/Users/sahil/source/antigravity/screen-app/src/i18n.ts)
- Scrolling Screenshot ile ilgili tüm metinlerin 5 dilde (`tr`, `en`, `az`, `ru`, `de`) eksiksiz eklenmesi.

---

## Verification Plan

### Automated Tests
- Rust birim testleri (`cargo test`):
  - Şablon eşleme (`find_vertical_overlap`) sentetik kaydırılmış görüntüler üzerinde test edilmesi (örtüşme mesafesi $\Delta y$ doğruluğu).
  - Sabit başlıklı (sticky header) görüntülerde eşlemenin başlığı atlayıp gerçek içeriği doğru tespit ettiğinin doğrulanması.
  - Hiç hareket etmeyen görüntülerde `is_identical == true` tespitinin doğrulanması.
- `cargo check` ve `npm run build` ile derleme ve tip kontrolü.

### Manual Verification
1. **Web Sayfaları (Chrome/Edge):**
   - Uzun bir web sayfasında (örneğin Wikipedia veya GitHub reposu) bölge seçilip Scrolling Screenshot başlatılması.
   - Sabit üst navbar'ın (sticky header) tekrar etmediğinin ve içeriğin dikişsiz birleştiğinin doğrulanması.
2. **PDF Görüntüleyici / VS Code:**
   - Çok sayfalı bir PDF veya uzun bir kod dosyasında test edilmesi; fare tekeri ve sayfa kaydırma davranışının incelenmesi.
3. **Kullanıcı Kontrolleri ve İptal (ESC):**
   - Kaydırma devam ederken ESC tuşuna basıldığında işlemin anında durdurulup arayüzün güvenle normale döndüğünün doğrulanması.
   - Yüzen göstergedeki "Bitir" butonuna basıldığında o ana kadar çekilen karelerin derlenip editörde açıldığının doğrulanması.
4. **Editör ve Çıktı Doğrulaması:**
   - Birleşen uzun görüntünün düzenleyicide açılması, üzerine ok/yazı eklenmesi, panoya kopyalanması ve dosya olarak kaydedilip çözünürlüğünün teyit edilmesi.
