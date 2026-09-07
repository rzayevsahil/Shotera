# Yeni Web Sitesine Geçiş ve Shotera Uygulama Simülasyonunun Gerçek Uygulama Birebiri Olarak Geliştirilmesi

Kullanıcının talebi:
1. `shotera_new_website` projesini mevcut web sitesinin (`website/`) yerine geçirmek.
2. Web sitesindeki Shotera uygulama simülasyonunu (`ShoteraAppWindow.tsx`), kullanıcının paylaştığı görsel ve masaüstü uygulamasının gerçek fonksiyonları (Screenshot & Annotation, Live Zoom, Screen Recording, Webcam Overlay, Pin Image, OCR Scan, Eraser, Blur slider, Text stil seçenekleri vb.) ile birebir hale getirmek.

---

## Kullanıcı İncelemesi Gereken Konular

> [!NOTE]
> Mevcut `website/` klasöründeki eski statik HTML/JS dosyaları (`index.html`, `script.js`, `style.css`), modern React + Vite + Tailwind tabanlı yeni web sitesi ile değiştirilecektir.
> GitHub Pages dağıtım iş akışı (`.github/workflows/pages.yml`), yeni React projesini otomatik olarak build edip `website/dist` üzerinden yayına alacak şekilde güncellenecektir.

---

## Planlanan Değişiklikler

### 1. Shotera Uygulama Simülasyonunun Gerçek Uygulama Birebiri Olarak Geliştirilmesi
Simülasyon bileşeni `shotera_new_website/src/components/ShoteraAppWindow.tsx` ve `InteractiveWebcamOverlay.tsx` üzerinde yapılacak geliştirmeler:

#### Tasarım ve Arayüz (Görsel ile 1:1 Uyum)
- **Üst Başlık Çubuğu:**
  - Mac tarzı pencere düğmeleri (Kırmızı, Sarı, Yeşil).
  - Kamera diyafram simgesi ve `SHOTERA STUDIO` metni.
  - Sağ üst sekme düğmeleri: `Draw & Markup` (seçili: beyaz hap buton, koyu yazı tipi), `Live Zoom`, `Recording`.
- **Merkezi Kod Penceresi:**
  - `TS index.ts` ve `JSON config.json` sekmeleri. Tıklanabilir ve içerik dinamik olarak değişir.
  - 1-7 satır numaraları ve görseldeki ile birebir syntax highlighting.
- **Alt Yüzen Araç Çubuğu (Draw & Markup Modu):**
  - Görseldeki tüm araçlar sırasıyla:
    1. **İmleç / Seçim** (`MousePointer`)
    2. **Kalem / Çizim** (`PenTool` / `Pencil`) - Seçili iken beyaz yuvarlak zemin, siyah ikon
    3. **Ok** (`ArrowUpRight`)
    4. **Dikdörtgen** (`Square`)
    5. **Daire** (`Circle`)
    6. **Numaralı Adım** (`ListOrdered`) - Tıklanan yere 1, 2, 3... şeklinde otomatik artan numara rozeti
    7. **Metin** (`Type`) - Metin aracı seçildiğinde Kalın (B), İtalik (I), Altı Çizili (U) seçenekleri
    8. **Bulanıklaştırma (Blur)** (`Droplet`) - Seçildiğinde bulanıklık yoğunluğu kaydırıcısı (2px - 30px)
    9. **Silgi (Eraser)** (`Eraser`) - Gerçek Shotera uygulamasındaki gibi çizimlerin üzerinden geçerek silme
    10. **Geri Al** (`Undo2`)
    11. **Temizle** (`Trash2`)
    12. **Ayrıştırıcı Çizgi**
    13. **Renk Seçiciler**: Görseldeki çift halkalı Cyan `#38bdf8`, Kırmızı `#ef4444`, Yeşil `#10b981`, Turuncu `#f59e0b`, Mor `#a855f7`, Beyaz `#f8fafc`, Pembe `#ec4899` + Özel renk seçici popover
    14. **Ayrıştırıcı Çizgi**
    15. **OCR / Metin Tarama** (`ScanText`) - Ekranı lazer tarama efektiyle tarayıp kodu panoya kopyalar
    16. **Kopyala** (`Copy`) - Görseli panoya kopyalar
    17. **Kaydet** (`Save`) - PNG olarak indirme simülasyonu
    18. **Sabitle (Pin)** (`Pin`) - Gerçek Shotera'daki gibi masaüstünde yüzen Pinned Snapshot penceresi açar
    19. **Kapat** (`X`)
- **Pencere Alt Durum Çubuğu:**
  - `3840 × 2160 UHD • 60 FPS`
  - Sağda yeşil aktif göstergesi `• Active`

#### 2. Canlı Yakınlaştırma (Live Zoom) Modu
- 2×, 4×, 8× yakınlaştırma faktörleri ve fareyle serbest pan hareketi.
- `[Ctrl+1] Freeze & Draw` düğmesi: Büyütülmüş kareyi dondurup anında çizim moduna geçme (gerçek uygulamadaki gibi).
- Otomatik gizlenen Live Zoom HUD rozeti (`2.0× ZOOM`).

#### 3. Ekran Kaydı (Recording) Modu & Gerçek Webcam Arayüzü
- Gerçek Shotera `ScreenRecorderModal` yüzen hap çubuğu:
  - Yanıp sönen kırmızı kayıt noktası, kronometre (`00:04:12`), Duraklat/Devam Et (`Mola` durumu), Durdur.
  - Mikrofon aç/kapat ve canlı zıplayan ses ekolayzır dalgaları.
  - Kamera aç/kapat: Gerçek Shotera dairesel/squircle web kamerası arayüzü (taşınabilir, parlayan kenarlık, ayna modu, boyut ayarı).
- Ekran etrafında parlayan kesikli kırmızı kayıt sınır çerçevesi.

---

### 2. Web Sitesinin Değiştirilmesi (`website/` ← `shotera_new_website/`)

#### [NEW / MODIFY] `website/`
- Mevcut `website/` içeriği yedeklenip yeni web sitesi projesi (`shotera_new_website` kaynak dosyaları, bileşenleri, `package.json`, `vite.config.ts`, `public/` ve `src/`) ile değiştirilecektir.
- `website/` içinde üretim derlemesi (`npm run build`) çalıştırılarak `dist/` oluşturulacaktır.
- `vite.config.ts` içinde `base: './'` ayarlanarak hem özel alan adında hem de GitHub Pages alt dizininde (`/Shotera/`) sorunsuz çalışması sağlanacaktır.

#### [MODIFY] [pages.yml](file:///c:/Users/sahil/source/antigravity/screen-app/.github/workflows/pages.yml)
- GitHub Actions iş akışı, `website` klasöründe `npm ci && npm run build` çalıştırıp derlenen `website/dist` klasörünü GitHub Pages'e yükleyecek şekilde güncellenecektir.

#### [MODIFY] [package.json](file:///c:/Users/sahil/source/antigravity/screen-app/package.json)
- Ana projeye `dev:website` ve `build:website` scriptleri eklenecektir.

---

## Doğrulama Planı

### Otomatik Testler & Derleme Kontrolü
1. `npm run build` komutunun `shotera_new_website` ve `website` içinde 0 hata ile derlendiğinin doğrulanması.
2. `npm run lint` / TypeScript tip kontrollerinin hatasız geçmesi.

### Manuel Doğrulama
1. Web sitesi önizlemesinin yerel sunucuda (`vite preview` veya `vite`) başlatılarak kontrol edilmesi.
2. Simülatörde Draw & Markup, Live Zoom ve Recording modlarının denenmesi:
   - Kalem, Ok, Şekiller, Metin, Adım Numarası ve Bulanıklık araçlarının test edilmesi.
   - Silgi aracı ile çizilen ögelerin silinebildiğinin test edilmesi.
   - Text aracı seçildiğinde Bold/Italic araçlarının çalıştığının doğrulanması.
   - Bulanıklık seçildiğinde yoğunluk kaydırıcısının çalıştığının doğrulanması.
   - `Pin` düğmesine tıklandığında yüzen Pinned Image penceresinin açıldığının görülmesi.
   - `ScanText` (OCR) düğmesine tıklandığında lazer animasyonu ve panoya kopyalama bildiriminin çalışması.
   - `Live Zoom` modunda büyütme ve `Freeze & Draw` geçişinin çalışması.
   - `Recording` modunda sayaç, duraklatma, web kamerası baloncuğu ve ses seviyesi göstergelerinin çalışması.
