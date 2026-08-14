# Microsoft ZoomIt Özelliklerinin Shotera Entegrasyon Planı

Microsoft Sysinternals **ZoomIt** uygulamasının sunduğu canlı yakınlaştırma (Live Zoom), statik ekran büyütme (Screen Zoom), gelişmiş ekran üzeri çizim & not alma araçları (Draw Mode), mola sayacı (Break Timer) ve ekran kaydı gibi popüler özelliklerin **Shotera** masaüstü uygulamasına birebir entegre edilmesi hedeflenmektedir.

---

## 🎯 Hedef ve Genel Bakış

ZoomIt, sunumlarda, eğitimlerde, canlı yayınlarda ve ekran paylaşımlarında ekranı hızlıca büyütmek, ekran üzerine çizimler yapmak ve zamanlayıcı çalıştırmak için dünya çapında standart kabul edilen bir araçtır. 

Bu plan, Shotera'nın mevcut Tauri + React/TypeScript altyapısını kullanarak ZoomIt'in 5 ana modülünü Shotera'ya kazandırmayı amaçlar:

1. **Statik Yakınlaştırma (Static Zoom - `Ctrl + 1`)**: Ekran görüntüsünü anlık dondurup fare tekerleği ile dinamik büyütme ve kaydırma.
2. **Çizim & Not Alma Modu (Draw Mode - `Ctrl + 2`)**: Ekranı dondurmadan/dondurarak renk ve şekil kısayolları (`R`, `G`, `B`, `Y`, `O`, `P`, `Shift` ile çizgi, `Ctrl` ile kutu, `Tab` ile elips, `Shift+Ctrl` ile ok, `W` beyaz tahta, `K` siyah tahta, `T` metin modu).
3. **Mola & Geri Sayım Sayacı (Break Timer - `Ctrl + 3`)**: Ekranı kaplayan özelleştirilebilir geri sayım zamanlayıcısı (fare tekerleği veya ok tuşları ile süre ayarlama).
4. **Canlı Yakınlaştırma (Live Zoom - `Ctrl + 4`)**: Masaüstü etkileşimleri devam ederken canlı ekran alanını farenin odağına göre gerçek zamanlı büyütme.
5. **Ekran Kaydı / GIF Yakalama (Record - `Ctrl + 5`)**: Ekranın seçili veya tamamının video/GIF formatında kaydedilmesi.

---

## 📊 ZoomIt Özellik Haritası ve Shotera Durumu

| ZoomIt Özelliği | Varsayılan Kısayol | Shotera Mevcut Durum | Yapılacak Entegrasyon |
| :--- | :--- | :--- | :--- |
| **Zoom (Statik Büyütme)** | `Ctrl + 1` | Yok (Sadece kırpma modu var) | Canvas Zoom Transformation & Smooth Panning altyapısı eklenecek. |
| **Draw Mode (Çizim Modu)** | `Ctrl + 2` | Kısmi (Masaüstü overlay var, renk & tuş kısayolları eksik) | ZoomIt tuş kısayolları (R, G, B, Y, O, P, Shift/Ctrl/Tab şekilleri, W/K tahtaları, T metin) eklenecek. |
| **Break Timer (Mola Sayacı)** | `Ctrl + 3` | Yok | Özel Tam Ekran Countdown Overlay bileşeni oluşturulacak. |
| **Live Zoom (Canlı Büyütme)** | `Ctrl + 4` | Yok | Windows Desktop Magnification API / Tauri viewport live zoom köprüsü kurulacak. |
| **Record (Ekran Kaydı)** | `Ctrl + 5` | Yok | MediaRecorder / Tauri native video capture entegre edilecek. |

---

## 🏗️ Mimari & Fazlar

### Faz 1: Çizim & Renk Kısayolları (Draw Mode Enhancements)
ZoomIt'in hızlı sunum çizim tuş kombinasyonlarını `ScreenshotCapture.tsx` bileşenine kazandırma.

- **Tek Dokunuşla Renk Değişimi**:
  - `R` -> Kırmızı (Red)
  - `G` -> Yeşil (Green)
  - `B` -> Mavi (Blue)
  - `Y` -> Sarı (Yellow)
  - `O` -> Turuncu (Orange)
  - `P` -> Pembe (Pink)
- **Geometrik Şekil Kısayolları**:
  - `Shift` + Sürükle -> Düz Çizgi (Straight Line)
  - `Ctrl` + Sürükle -> Dikdörtgen / Kutu (Rectangle)
  - `Tab` + Sürükle -> Daire / Elips (Ellipse)
  - `Shift` + `Ctrl` + Sürükle -> Ok İşareti (Arrow)
- **Ekran Tahtası Modları**:
  - `W` tuşu -> Beyaz Tahta Mode (Ekran arka planını düz beyaz yapar, çizim için boş alan sağlar).
  - `K` tuşu -> Siyah Tahta Mode (Ekran arka planını düz siyah yapar).
- **Metin Modu (`T` Tuşu)**:
  - Tıklanan konuma yazı yazma alanı açma, Enter veya dışarı tıklama ile canvas'a sabitleme.
- **Temizleme & Geri Al**:
  - `Ctrl + Z` -> Son çizimi geri alma.
  - `E` -> Tüm çizimleri temizleme.

---

### Faz 2: Statik Ekran Büyüteci (Static Screen Zoom - `Ctrl + 1`)
- **Çalışma Prensibi**: Kısayola basıldığında mevcut ekranın yüksek çözünürlüklü ekran görüntüsü alınır ve tam ekran overlay açılır.
- **Dinamik Zoom**:
  - Fare tekerleği ileri (Scroll Up) -> Zoom seviyesini artırır (%100 - %500 arası).
  - Fare tekerleği geri (Scroll Down) -> Zoom seviyesini düşürür.
  - Ok tuşları (`Yukarı`, `Aşağı`, `Sol`, `Sağ`) -> İnce kaydırma adımları.
- **Fare Pan Etkisi**: Fare hareket ettirildikçe ekranın görünmeyen kısımları yumuşak bir şekilde farenin olduğu tarafa kayar (Smooth viewport pan).
- **Çizime Geçiş**: Zoom modundayken sol tıklama yapıldığında Zoom seviyesi dondurulur ve çizim modu (Draw Mode) aktifleşir.

---

### Faz 3: Mola ve Geri Sayım Sayacı (Break Timer - `Ctrl + 3`)
- **Bileşen**: `BreakTimer.tsx` (Yeni bileşen).
- **Özellikler**:
  - `Ctrl + 3` basıldığında tam ekran şeffaf/özelleştirilebilir arka planlı sayaç açılır.
  - **Süre Ayarlama**: Fare tekerleği veya `Yukarı`/`Aşağı` ok tuşları ile sayaç dakikası artırılır veya azaltılır (+1/ -1 dk, Shift ile +5/ -5 dk).
  - **Görsel Tasarım**: Büyük dijital tipografi, kalan süreyi yüzdelik olarak gösteren daire/ilerleme çubuğu.
  - **Sesli Uyarı**: Süre bittiğinde bildirim sesi (Audio API / Chime chime chime) tetiklenir.
  - **Gelişmiş Seçenekler**: Arka plan opaklığı (Opacity slider), arka plan görseli koyma desteği.
  - **Çıkış**: `ESC` veya sağ tık ile zamanlayıcıdan çıkış.

---

### Faz 4: Canlı Ekran Büyütme (Live Zoom - `Ctrl + 4`)
- **Çalışma Prensibi**: ZoomIt'in en ikonik özelliklerinden biridir. Statik resim yerine masaüstü canlı olarak farenin etrafında büyütülür ve kullanıcı arka plandaki uygulamalarla etkileşime girmeye devam edebilir.
- **Tauri Native Entegrasyonu**:
  - Rust tarafında `windows` crate veya Magnification API (`MagInitialize`, `MagSetWindowTransform`) köprüsü.
  - Alternatif web tabanlı yaklaşım: Screen Capture Stream (MediaDevices.getDisplayMedia) ile 60 FPS canlı video canvas yayını ve farenin takibi.
- **Kısayollar**: `Ctrl + 4` aç/kapat, `Ctrl + Up/Down` canlı zoom oranını ayarlama.

---

### Faz 5: Ekran Kaydı & GIF Oluşturucu (Record - `Ctrl + 5`)
- **Seçilen Alan veya Tam Ekran Kaydı**:
  - Kısayol basıldığında kayıt başlatılır, sistem tepsisinde veya ekran köşesinde kırmızı yanıp sönen bir kayıt indikatörü görüntülenir.
  - Kayıt bitiminde `.mp4` veya `.gif` olarak kaydetme diyaloğu açılır.

---

### Faz 6: Ayarlar ve Global Kısayol Yönetimi
- **Ayarlar Ekranı Entegrasyonu**:
  - `SettingsWindow.tsx` içerisine **ZoomIt Araçları** adında yeni sekme eklenecek.
  - Her bir özellik için özelleştirilebilir Hotkey (Kısayol) tanımlama alanı (Örn: `Ctrl+1`, `Ctrl+2`, `Ctrl+3`, `Ctrl+4`).
  - Mola sayacı varsayılan süresi (varsayılan: 10 dakika), ses uyarısı ve renk tercihleri paneli.

---

## 🛠️ Değiştirilecek ve Yeni Eklenecek Dosyalar

### 1. Yeni Frontend Bileşenleri
- `[NEW]` [BreakTimer.tsx](file:///c:/Users/sahil/source/antigravity/screen-app/src/components/BreakTimer.tsx): Mola sayacı overlay arayüzü ve geri sayım mantığı.
- `[NEW]` [ZoomCanvas.tsx](file:///c:/Users/sahil/source/antigravity/screen-app/src/components/ZoomCanvas.tsx): Statik ve canlı ekran yakınlaştırma (Zooming & Panning) motoru.

### 2. Güncellenecek Frontend Bileşenleri
- `[MODIFY]` [ScreenshotCapture.tsx](file:///c:/Users/sahil/source/antigravity/screen-app/src/components/ScreenshotCapture.tsx): ZoomIt tuş kısayollarının (R, G, B, Y, O, P, Shift, Ctrl, Tab, W, K, T) canvas çizim sistemine entegrasyonu.
- `[MODIFY]` [SettingsWindow.tsx](file:///c:/Users/sahil/source/antigravity/screen-app/src/components/SettingsWindow.tsx): ZoomIt kısayolları ve ayarları için yeni konfigürasyon sekmesi.
- `[MODIFY]` [App.tsx](file:///c:/Users/sahil/source/antigravity/screen-app/src/App.tsx): `timer` ve `zoom` pencere label yönlendirmelerinin eklenmesi.
- `[MODIFY]` [i18n.ts](file:///c:/Users/sahil/source/antigravity/screen-app/src/i18n.ts): ZoomIt özellikleri için çoklu dil metinleri (TR, EN, DE, RU, AZ).

### 3. Rust & Tauri Tarafı
- `[MODIFY]` [lib.rs](file:///c:/Users/sahil/source/antigravity/screen-app/src-tauri/src/lib.rs): Global kısayol dinleyicileri (`Ctrl+1`, `Ctrl+2`, `Ctrl+3`, `Ctrl+4`), yeni pencere açma komutları (`open_break_timer`, `open_zoom_view`).
- `[MODIFY]` [tauri.conf.json](file:///c:/Users/sahil/source/antigravity/screen-app/src-tauri/tauri.conf.json): Break Timer ve Zoom pencereleri için pencere tanımları.

---

## 🧪 Doğrulama ve Test Planı

### Otomatik & Manuel Testler
1. **Kısayol Tetikleme Testi**:
   - `Ctrl+1`, `Ctrl+2`, `Ctrl+3`, `Ctrl+4` kombinasyonlarının arka planda çalışırken pencereyi sorunsuz tetiklediğinin doğrulanması.
2. **Çizim Kısayolları Testi**:
   - Çizim modundayken klavyeden `R`, `G`, `B`, `Y`, `O`, `P` basıldığında renklerin anında değiştiğinin doğrulanması.
   - `Shift` ile düz çizgi, `Ctrl` ile kare, `Tab` ile daire, `Shift+Ctrl` ile ok çiziminin test edilmesi.
   - `W` ile ekranın beyaza, `K` ile siyaha dönüştüğünün test edilmesi.
3. **Mola Sayacı (Break Timer) Testi**:
   - Fare tekerleği ile sürenin artırılıp azaltılması.
   - Süre dolduğunda ses uyarısının çalması ve `ESC` ile düzgün kapatılması.
4. **Zoom & Pan Testi**:
   - Zoom modunda fare hareketiyle ekranın yumuşak bir şekilde kayması ve çözünürlük kaybı yaşanmaması.
