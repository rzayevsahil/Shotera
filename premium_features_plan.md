# Shotera: Premium Özellikler Sprint Planı

Bu sprintte uygulamanın değerini katlayacak 3 harika premium özelliği ekleyeceğiz: **Bulanıklaştırma (Blur)**, **Ekrana İğneleme (Pin to Screen)** ve **Buluta Yükleme (Imgur Entegrasyonu)**.

## 🛠️ Aşama 1: Bulanıklaştırma Aracı (Blur / Pixelate)
Kullanıcıların hassas bilgileri (şifre, e-posta, yüz vb.) gizlemesini sağlayacak bir çizim aracı.

- **Frontend (`ScreenshotCapture.tsx`):**
  - Çizim araçlarına (Kalem, Dikdörtgen, Ok vb.) `"blur"` adında yeni bir araç eklenecek.
  - Toolbar'a Bulanıklaştırma (Damlacık veya Mozaik) ikonu eklenecek.
  - Kullanıcı ekranda bir dikdörtgen çizdiğinde, o bölgedeki orijinal görüntünün üzerine Canvas `filter = 'blur(8px)'` veya pikselleştirme algoritması uygulanacak.
  - **i18n:** Araç için çeviriler eklenecek.

## 📌 Aşama 2: Ekrana İğneleme (Pin to Screen)
Alınan ekran görüntüsünü, referans olarak kullanmak üzere masaüstünde her şeyin üstünde (always on top) duran, çerçevesiz bir not olarak sabitleme.

- **Backend (`lib.rs`):**
  - Tauri `WebviewWindowBuilder` kullanılarak dinamik, çerçevesiz (`decorations: false`), ve her zaman üstte (`alwaysOnTop: true`) yeni pencereler oluşturacak bir Rust komutu (`spawn_pinned_window`) yazılacak.
- **Frontend (`ScreenshotCapture.tsx`):**
  - Yakalama işlemi bittiğinde alt panele (Kaydet, Kopyala, Kapat ikonlarının yanına) bir **"İğnele (Pin)"** butonu eklenecek.
  - Butona tıklandığında seçili alanın Base64 verisi Rust backend'ine gönderilip, sadece o resmi gösteren yeni bir pencere açılacak.

## ☁️ Aşama 3: Buluta Yükleme (Cloud Upload - Imgur)
Ekran görüntüsünü tek tıkla buluta yükleyip paylaşılabilir linkini panoya kopyalama.

- **Frontend (`ScreenshotCapture.tsx`):**
  - Alt panele bir **"Yükle (Upload)"** ikonu (Bulut ikonu) eklenecek.
  - Butona basıldığında Canvas verisi Blob'a çevrilecek.
  - Imgur'un Anonim API'sine (`https://api.imgur.com/3/image`) `fetch` ile POST isteği atılacak. (Güvenlik için Client-ID frontend'de saklanabilir, anonim upload için güvenlidir).
  - Yükleme başarılı olduğunda dönen link (örn: `https://i.imgur.com/xyz.png`) Tauri'nin `arboard` (Kopyalama) eklentisiyle panoya eklenecek.
  - Kullanıcıya başarı mesajı (`Toastr` veya ekran üstü uyarı) gösterilecek.

---
*Hazırsanız, hemen 1. Aşama olan **Bulanıklaştırma (Blur) aracı** ile `ScreenshotCapture.tsx` dosyasından kodlamaya başlayalım!*
