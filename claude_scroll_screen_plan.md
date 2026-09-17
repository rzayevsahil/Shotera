# Görev: Shotera'ya "Scrolling Screenshot" (Kaydırmalı Ekran Görüntüsü) Özelliği Ekle

## Bağlam
Shotera, Tauri (Rust backend + web frontend) tabanlı bir masaüstü ekran görüntüsü uygulaması. Şu anda normal screen/region screenshot desteği var. Windows'u öncelikli platform olarak hedefliyoruz (macOS desteği sonra gelecek, bu yüzden mimariyi cross-platform'a açık ama Windows-first kur).

Amaç: Kullanıcının, görünür ekrandan taşan bir web sayfasını, dokümanı, chat penceresini, kod editörünü vb. tek bir uzun görüntü (long screenshot) olarak yakalayabilmesi. Sektördeki referanslar: ShareX "Scrolling Capture", Zight/CloudApp "Scrolling Screenshot", PicPick "Scrolling Window", Snagit "Panoramic/Scrolling Capture".

## Mimari Yaklaşım (bunu izle)

Özelliği üç ayrı, test edilebilir katmana böl:

### 1) Capture katmanı (tekrarlanan frame yakalama)
- Windows'ta pencere/bölge yakalama için `xcap` crate'ini kullan (Windows Graphics Capture / DXGI destekli, GDI fallback'i olan bir crate). Zaten bir screenshot uygulaması olduğumuz için muhtemelen benzer bir capture pipeline'ı var — onu tekrar kullan, sadece "N ms aralıkla sürekli capture" moduna genişlet.
- Yakalama hedefi: kullanıcının seçtiği **sabit bir bölge (region)** veya **pencere handle'ı (HWND)**. Bölge bazlı yakalamayı öncelikli yap çünkü sabit header/footer/sidebar'ları dışarıda bırakmak kullanıcının elinde olmalı (ShareX'in en büyük zayıflığı bu — sabit elemanlar overlap algoritmasını bozuyor, biz bunu kullanıcıya bölge seçtirerek çözelim).
- Her capture'da: zaman damgası + RGBA buffer (image crate ile `RgbaImage`) tut.

### 2) Scroll tetikleme katmanı — İKİ MOD destekle
**Mod A: Manuel scroll (varsayılan, en güvenilir)**
- Kullanıcı bölgeyi seçer, "Start" der, kendi mouse wheel'iyle içeriği kaydırır.
- Uygulama arka planda ~150-250ms aralıklarla otomatik capture alır (throttle'lı, scroll'un oturmasını bekleyerek — anlık scroll sırasında blur/yarım frame yakalamamak için son scroll event'inden belli bir debounce sonrası capture al).
- Kullanıcı Esc'e basınca veya "Stop"a tıklayınca capture durur, stitching devreye girer.
- Bu mod her türlü içerikte çalışır (native app'ler, PDF viewer, chat pencereleri, IDE) çünkü scroll'u gerçek kullanıcı tetikliyor.

**Mod B: Otomatik scroll (opsiyonel, ileri seviye)**
- Windows API ile hedef pencereye scroll gönder. İki yol var, ikisini de dene ve hedefin desteğine göre fallback sırası kur:
  1. `SendInput` ile senkronize `WM_MOUSEWHEEL` simülasyonu (fiziksel wheel hareketi gibi davranır, en geniş uyumluluk).
  2. Hedef HWND biliniyorsa doğrudan `SendMessage(hwnd, WM_VSCROLL, SB_LINEDOWN, 0)` veya `PostMessage` ile Page Down (`VK_NEXT`) tuşu simülasyonu.
- Otomatik moddaki kayma miktarı ayarlanabilir olsun (kullanıcı "scroll speed / step" seçebilsin) — çok hızlı scroll dikiş algoritmasını bozuyor, bunu belgelerde de gördük.
- `windows` crate'ini (raw Win32 bindings) bu katman için kullan.

### 3) Stitching (dikiş) katmanı — asıl kritik kısım
Klasik "template matching / overlap detection" algoritmasını uygula:

1. `frame[n]` ile `frame[n-1]`'i al.
2. `frame[n-1]`'in **alt kenarına yakın bir şerit** (örn. son 30-50 piksel satırı) ile `frame[n]`'in tamamında bu şeridin nerede eşleştiğini ara:
   - Basit ve hızlı yöntem: dikey satır bazında **SAD (Sum of Absolute Differences)** veya satır hash'i (her satırı tek bir hash/checksum'a indirip hızlı karşılaştırma) kullanarak `frame[n-1]`'in son satırlarının `frame[n]` içindeki en iyi eşleşen y-offset'ini bul.
   - Küçük bir tolerans payı bırak (piksel-mükemmel eşleşme yerine, belirli bir eşik altındaki farkı "eşleşme" say) — anti-aliasing, font rendering farkları, subpixel kayma gibi gürültüleri tolere etmek için.
3. Eşleşme bulunduysa: `frame[n]`'in eşleşen noktadan sonraki (yeni/benzersiz) kısmını sonuç görüntüsünün altına ekle (crop + append, `image` crate ile).
4. Eşleşme bulunamadıysa (örn. dinamik/animasyonlu içerik, çok hızlı scroll):
   - Kullanıcıyı uyar ("bu frame'i atla" veya "capture'ı burada durdur, elle düzelt" seçeneği sun) — sessizce yanlış sonuç üretme.
5. **Bitiş algılama:** `frame[n]` ile `frame[n-1]` piksel-piksel (ya da hash) aynıysa, scroll artık ilerlemiyor demektir → otomatik olarak capture'ı sonlandır ve son görüntüyü finalize et.
6. Sonuç: tüm frame'lerin overlap'leri çıkarılmış halde dikey olarak birleştirilmiş tek bir uzun `RgbaImage`.

Bunu ayrı, test edilebilir bir Rust modülü olarak yaz (örn. `scroll_stitcher.rs`), UI/capture koddan bağımsız, saf fonksiyon olarak: `fn stitch(frames: Vec<RgbaImage>) -> Result<RgbaImage, StitchError>` gibi. Overlap arama fonksiyonunu birim testleriyle kapsa (sentetik test görüntüleri: bilinen offsetli iki dilim üret, doğru offset'i bulduğunu doğrula).

## UI/UX Gereksinimleri
- Mevcut screenshot bölge seçici UI'ının üzerine "Scroll Capture" modu eklensin (buton/toggle).
- Bölge seçildikten sonra küçük bir kontrol paneli (overlay) göster: **Start / Stop / Cancel**, yakalanan frame sayısı, canlı önizleme (son yakalanan şeridin küçük bir thumbnail'i).
- Stop'a basınca: stitching işlemini bir progress indicator ile çalıştır (büyük sayfalar için birkaç yüz ms sürebilir), sonra normal editör/export ekranına düşür (mevcut screenshot post-processing akışınla aynı: kaydet, panoya kopyala, düzenle vb.).
- Hata durumları için kullanıcıya net mesaj: "Bu içerik otomatik dikilemedi, sabit header/footer olabilir mi? Bölgeyi daraltmayı deneyin" gibi.

## Teknik Notlar / Crate Önerileri
- Capture: `xcap` (zaten kullanıyorsanız mevcut wrapper'ı genişlet).
- Görüntü işleme: `image` crate (`RgbaImage`, crop, satır bazlı erişim).
- Windows input simülasyonu (Mod B için): `windows` crate (raw `SendInput`, `SendMessage`, `PostMessage`, `WM_MOUSEWHEEL`, `WM_VSCROLL` sabitleri) — cross-platform bir input crate (`enigo` gibi) da düşünülebilir ama düşük seviye kontrol için native `windows` crate daha güvenilir.
- Performans: capture döngüsünü ayrı bir async task/thread'de çalıştır, ana UI thread'ini bloklamadan; frame buffer'ları bellekte tutarken büyük sayfalarda (100+ frame) bellek kullanımını izle, gerekirse ara adımda kısmi stitching yap (tüm frame'leri sona kadar biriktirmek yerine her N frame'de bir mevcut sonuçla birleştir).
- DPI/scaling: çoklu monitör ve farklı DPI ölçeklerinde capture koordinatlarının doğru eşleştiğinden emin ol (mevcut screenshot modülündeki DPI-awareness mantığını buraya da taşı).

## Teslim Edilecekler
1. `scroll_stitcher.rs` — saf stitching mantığı + birim testleri.
2. Capture döngüsü (Mod A: manuel scroll + throttled capture) — Mod B (otomatik scroll) ikinci öncelik, önce Mod A'yı sağlam yap.
3. Frontend tarafında "Scroll Capture" modu için UI (start/stop overlay, progress, hata mesajları).
4. Mevcut export/save/copy akışıyla entegrasyon.
5. Kısa bir README bölümü: özelliğin nasıl çalıştığı, bilinen sınırlamalar (sabit header/footer, animasyonlu içerik, çok hızlı scroll).

Öncelik sırası: Mod A (manuel scroll + stitching) tam çalışır hale getir ve sağlamlaştır → sonra Mod B (otomatik scroll) ekle → sonra macOS için capture katmanını `xcap`'in macOS desteğiyle genişlet (ScreenCaptureKit tabanlı, ayrı bir görev olarak bırak, bu promptun kapsamı dışında).