# CrossShot – Çapraz Platform Ekran Görüntüsü Uygulaması

## Proje Özeti

**CrossShot**, Windows, macOS ve Linux üzerinde çalışan, hafif, hızlı ve gizlilik odaklı bir ekran görüntüsü alma uygulamasıdır.

Amaç; **Lightshot**, **ShareX** ve **Greenshot** gibi uygulamalardaki temel kullanıcı deneyimini modern teknolojilerle yeniden sunmaktır.

Uygulama varsayılan olarak tamamen **yerel (offline)** çalışır. Bulut yükleme, paylaşım bağlantısı oluşturma gibi özellikler tamamen isteğe bağlıdır ve yalnızca kullanıcı onayıyla etkinleştirilir.

---

# Proje Hedefleri

- Tek kod tabanı ile Windows, macOS ve Linux desteği
- Hızlı ekran yakalama
- Hafif ve düşük bellek kullanımı
- Modern kullanıcı arayüzü
- Yerel çalışma (Privacy First)
- Minimum tıklamayla ekran görüntüsü alma
- Profesyonel anotasyon araçları
- İsteğe bağlı bulut paylaşımı

---

# Teknoloji Yığını

| Katman | Teknoloji | Sebep |
|---------|-----------|--------|
| Desktop Framework | Tauri | Hafif, güvenli, native performans |
| Native Backend | Rust | Performans, sistem API erişimi |
| UI | React + TypeScript | Modern geliştirme deneyimi |
| State Management | Zustand | Hafif ve basit |
| UI Framework | shadcn/ui + TailwindCSS | Modern görünüm |
| Canvas | Fabric.js | Çizim araçları |
| Local Storage | SQLite | Ayarlar ve geçmiş |
| Build Tool | Vite | Hızlı geliştirme |
| Package Manager | pnpm | Daha hızlı bağımlılık yönetimi |

---

# Temel Özellikler

## 1. Ekran Yakalama

Desteklenecek yakalama türleri:

- Seçili alan yakalama
- Tam ekran
- Aktif pencere
- Belirli monitör
- Gecikmeli ekran görüntüsü
  - 3 saniye
  - 5 saniye
  - 10 saniye

---

## 2. Düzenleme Araçları

Kullanıcı ekran görüntüsü aldıktan sonra aşağıdaki araçları kullanabilir.

### Çizim

- Ok
- Çizgi
- Dikdörtgen
- Elips
- Serbest çizim

### Metin

- Yazı ekleme
- Font seçimi
- Boyut
- Kalın
- İtalik

### Vurgulama

- Marker
- Renk seçici

### Gizlilik

- Blur
- Pixelate (Mozaik)

### Diğer

- Numaralandırma
- Ölçüm çizgisi
- Emoji ekleme (Opsiyonel)

### Düzenleme

- Undo
- Redo

---

# Kaydetme

Desteklenen formatlar

- PNG
- JPG
- WebP

Dosya adı formatı

```
Screenshot_YYYYMMDD_HHMMSS.png
```

Kaydetme seçenekleri

- Panoya kopyala
- Dosyaya kaydet
- Sürükle bırak
- Favorilere ekle

---

# Paylaşım

Opsiyonel özellikler

- Cloud Upload
- Paylaşım linki oluşturma
- Link kopyalama
- QR Code oluşturma

Desteklenebilecek servisler

- Imgur
- AWS S3
- Cloudflare R2
- FTP
- WebDAV

---

# Kullanıcı Deneyimi

## Global Kısayollar

Varsayılan

```
Print Screen
```

Alternatif

```
Ctrl + Shift + S
```

Diğer

- Kullanıcı istediği kısayolu belirleyebilir.

---

## Sistem Tepsisi

- Arka planda çalışma
- Hızlı ekran görüntüsü
- Son görüntüyü aç
- Ayarlar
- Çıkış

---

## Tema

- Açık
- Koyu
- Sistem teması

---

## Çoklu Monitör

Desteklenecek

- Birden fazla monitör
- DPI desteği
- Farklı çözünürlükler

---

# Ayarlar Penceresi

## Genel

- Başlangıçta çalıştır
- Sistem tepsisinde başlat
- Güncellemeleri kontrol et

---

## Yakalama

- Varsayılan yakalama tipi
- Gecikme süresi
- Yakalama sesi
- İmleci dahil et

---

## Kaydetme

- Varsayılan klasör
- Dosya adı formatı
- Dosya tipi
- Kalite

---

## Pano

- Otomatik panoya kopyala
- Eski panoyu koru

---

## Kısayollar

- Capture Region
- Full Screen
- Active Window
- Open History
- Open Settings

---

## Bulut

- Cloud Upload Aç/Kapat
- API Anahtarları
- Varsayılan servis

---

## Gizlilik

- Telemetri
- Çökme raporları
- Bulut izinleri

---

# Geçmiş Paneli

Her ekran görüntüsü için

- Önizleme
- Dosya adı
- Boyut
- Tarih

Yapılabilecek işlemler

- Tekrar aç
- Düzenle
- Panoya kopyala
- Dosya konumunu aç
- Favorilere ekle
- Sil

---

# Mimari

```
+----------------------------+
| React UI                   |
+-------------+--------------+
              |
              |
       Zustand Store
              |
              |
     Tauri Commands
              |
              |
      Rust Backend
              |
+-------------+---------------------------+
| Capture Engine                          |
| Clipboard                               |
| File System                             |
| SQLite                                  |
| System Tray                             |
| Global Hotkeys                          |
+-----------------------------------------+
```

---

# Platform Gereksinimleri

## Windows

- Desktop Duplication API
- Win32 API

---

## macOS

- ScreenCaptureKit
- Screen Recording Permission

---

## Linux

- X11
- Wayland
- xdg-desktop-portal

---

# Önerilen Klasör Yapısı

```
crossshot/
│
├── src/
│   ├── app/
│   ├── components/
│   │   ├── toolbar/
│   │   ├── canvas/
│   │   ├── history/
│   │   ├── settings/
│   │   └── common/
│   │
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── types/
│   ├── utils/
│   └── pages/
│
├── src-tauri/
│   ├── src/
│   │   ├── capture/
│   │   ├── clipboard/
│   │   ├── tray/
│   │   ├── settings/
│   │   ├── storage/
│   │   ├── upload/
│   │   └── main.rs
│   │
│   └── tauri.conf.json
│
├── assets/
├── docs/
├── tests/
└── README.md
```

---

# Geliştirme Yol Haritası

# Sprint 1 (MVP)

## Hedef

- Tauri kurulumu
- React kurulumu
- Rust backend
- Sistem tepsisi
- Global Hotkey
- Bölge seçimi
- PNG kaydetme
- Clipboard desteği
- Basit ayarlar ekranı

---

# Sprint 2

## Yakalama

- Tam ekran
- Aktif pencere
- Monitör seçimi

## Düzenleme

- Ok
- Çizgi
- Dikdörtgen
- Elips
- Yazı

## Diğer

- Undo
- Redo

---

# Sprint 3

## Profesyonel Araçlar

- Blur
- Pixelate
- Marker
- Ölçüm
- Renk seçici

## Geçmiş

- History paneli
- Favoriler
- Arama

---

# Sprint 4

## Bulut

- Imgur
- S3
- R2

## Paylaşım

- Link oluşturma
- QR Code

---

# Sprint 5

## Gelişmiş Özellikler

- OCR
- Screen Recording
- GIF Recording
- Auto Update
- Plugin sistemi

---

# Güvenlik

CrossShot aşağıdaki prensiplerle geliştirilecektir.

- Varsayılan olarak tamamen offline çalışır.
- Kullanıcı izni olmadan veri göndermez.
- Bulut yükleme kapalı gelir.
- Hassas bölgeler için Blur aracı kolay erişilebilir olur.
- macOS izinleri doğru yönetilir.
- Windows Code Signing desteklenir.
- macOS Notarization desteklenir.

---

# Gelecekte Eklenebilecek Özellikler

- OCR
- Yapay zekâ ile otomatik hassas veri gizleme
- GIF oluşturma
- Video kaydı
- Plugin sistemi
- Eklenti mağazası
- Komut paleti (Command Palette)
- Markdown anotasyonları
- Renk paleti yönetimi
- Çoklu dil desteği
- Workspace sistemi
- Kendi tema sistemi

---

# Sonuç

CrossShot; **hafif, hızlı, modern ve gizlilik odaklı** bir ekran görüntüsü alma uygulaması olarak tasarlanmıştır.

İlk sürümde temel hedef; **hızlı ekran yakalama**, **panoya kopyalama**, **PNG olarak kaydetme**, **alan seçimi** ve **sistem tepsisi desteğini** eksiksiz sunmaktır.

Sonraki sürümlerde gelişmiş anotasyon araçları, geçmiş yönetimi, OCR, ekran kaydı ve bulut paylaşımı gibi profesyonel özellikler eklenerek uygulamanın tam teşekküllü, çapraz platform bir ekran yakalama çözümüne dönüşmesi hedeflenmektedir.