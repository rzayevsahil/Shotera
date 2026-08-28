# Mola Sayacı & Kamera: Sabit Görsel Eklentisi (Static Image Mode)

Kullanıcıların canlı web kamerası açmak yerine önceden seçtikleri sabit bir görseli (logo, avatar vb.) kamera penceresinde gösterebilmelerini sağlamak için yapılacak geliştirmelerin planı aşağıdadır.

## User Review Required

> [!IMPORTANT]
> Bu planı inceleyip onaylamanızı bekliyorum. Tasarımsal olarak "Kamera Modu" seçimini ayarlar sayfasında nerede göstermeliyiz? (Kamera çerçeve rengi ayarlarının hemen üstünde olması uygun mu?)

## Proposed Changes

### Rust Backend (Tauri)

#### [MODIFY] [lib.rs](file:///c:/Users/sahil/source/antigravity/screen-app/src-tauri/src/lib.rs)
- Kullanıcının sistemden görsel seçebilmesi için `rfd::FileDialog` kütüphanesini kullanan yeni bir `select_image` Tauri command'i (fonksiyonu) eklenecek.
- Bu dosya seçici sadece görsellere izin verecek (`png`, `jpg`, `jpeg`, `webp`).

### Frontend (React & UI)

#### [MODIFY] [i18n.ts](file:///c:/Users/sahil/source/antigravity/screen-app/src/i18n.ts)
- Bütün dillere yeni çeviriler eklenecek:
  - `webcamModeLabel`: "Kamera Modu" (Camera Mode)
  - `webcamModeCamera`: "Canlı Kamera" (Live Camera)
  - `webcamModeImage`: "Sabit Görsel" (Static Image)
  - `webcamImageSelect`: "Görsel Seç" (Select Image)

#### [MODIFY] [SettingsWindow.tsx](file:///c:/Users/sahil/source/antigravity/screen-app/src/components/SettingsWindow.tsx)
- Yeni durum değişkenleri eklenecek: `webcamMode` (`camera` veya `image`) ve `webcamImagePath`.
- Bu ayarlar `localStorage` üzerinde kaydedilip anlık yansıtılması için `storage` event'i fırlatılacak.
- Ayarlar ekranına yeni bir "Kamera Modu" alanı eklenecek:
  - Dropdown ile "Canlı Kamera" veya "Sabit Görsel" seçilebilecek.
  - "Sabit Görsel" seçilirse hemen altında "Görsel Seç" butonu belirecek ve butona tıklandığında Rust'taki `select_image` fonksiyonu çağrılacak.
  - Seçilen görsel Tauri'nin `convertFileSrc` fonksiyonu ile ayarlar ekranında minik bir önizleme olarak gösterilecek.

#### [MODIFY] [WebcamOverlay.tsx](file:///c:/Users/sahil/source/antigravity/screen-app/src/components/WebcamOverlay.tsx)
- `localStorage`'dan `webcamMode` ve `webcamImagePath` okunacak.
- Eğer mod "image" ise:
  - Tarayıcı kamera izinleri **istenmeyecek**.
  - `navigator.mediaDevices.getUserMedia` fonksiyonu **çalıştırılmayacak**.
  - `<video>` elementi yerine, seçilen resmi Tauri'nin yerel dosya protokolü (`convertFileSrc`) ile yükleyen bir `<img>` elementi gösterilecek.
  - Sürükle bırak, tekerlekle boyutlandırma ve kamera altı yazısı gibi diğer tüm özellikler resim modunda da tam olarak aynı şekilde çalışmaya devam edecek.

## Verification Plan

### Automated / Manual Verification
- Tauri baştan derlenip çalıştırılacak.
- Ayarlar menüsünden "Sabit Görsel" seçilip bir PNG dosyası yüklenecek.
- "Kamera aç (Ctrl+7)" kısayoluyla veya kayıt modundan kamera açıldığında, donanım kamerası yerine seçilen resmin yuvarlak çerçeve içinde hatasız yüklendiği doğrulanacak.
- Yeniden "Canlı Kamera" moduna geçildiğinde kameranın sorunsuz şekilde tekrar aktifleştiği test edilecek.
