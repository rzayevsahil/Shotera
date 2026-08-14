# ZoomIt Entegrasyonu Görev Listesi

- `[x]` Faz 1: Çizim Modu & Renk/Şekil Kısayolları (Draw Mode Enhancements)
  - `[x]` Renk kısayolları (`R`, `G`, `B`, `Y`, `O`, `P`) entegrasyonu
  - `[x]` Geometrik şekil tuş modları (`Shift` ile Çizgi, `Ctrl` ile Kutu, `Tab` ile Daire, `Shift+Ctrl` ile Ok)
  - `[x]` Ekran tahtası modları (`W` Beyaz Tahta, `K` Siyah Tahta)
  - `[x]` Metin ekleme modu (`T`) ve klavye temizleme/geri alma (`Ctrl+Z`, `E`)
- `[x]` Faz 2: Statik Ekran Büyüteci (Static Screen Zoom - `Ctrl + 1`)
  - `[x]` Ekran dondurma ve yumuşak Zoom & Pan canvas altyapısı (`ZoomCanvas.tsx`)
  - `[x]` Fare tekerleği ve ok tuşlarıyla zoom oranını ayarlama
- `[x]` Faz 3: Mola & Geri Sayım Sayacı (Break Timer - `Ctrl + 3`)
  - `[x]` `BreakTimer.tsx` tam ekran overlay bileşeni
  - `[x]` Geri sayım süresi ayarlama, halka ilerleme çubuğu ve bitiş ses efekti
- `[x]` Faz 4: Canlı Zoom & Ekran Pencere Altyapısı
  - `[x]` Tauri pencereleri (`zoom`, `timer`) ve Rust global shortcut köprüsü (`lib.rs`)
- `[x]` Faz 5: Ayarlar Penceresine ZoomIt Kısayolları ve Seçenekleri
  - `[x]` `SettingsWindow.tsx` için ZoomIt ayarlar sekmesi ve çoklu dil (TR, EN, DE, RU, AZ) güncellemeleri
- `[x]` Faz 6: Test ve Doğrulama
  - `[x]` TypeScript tip kontrolü (`npx tsc --noEmit`)
  - `[x]` Rust backend derleme kontrolü (`cargo check`)

