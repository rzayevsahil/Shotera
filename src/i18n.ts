export const translations = {
  tr: {
    sidebarGeneral: "Genel",
    sidebarCapture: "Yakalama",
    sidebarSave: "Kaydetme",
    sidebarAbout: "Hakkında",

    generalTitle: "Genel Ayarlar",
    generalSubtitle: "Uygulamanın genel çalışma biçimini ve başlangıç davranışını özelleştirin.",

    runAtStartup: "Sistem Başlangıcında Çalıştır",
    runAtStartupDesc: "Windows açıldığında Shotera uygulamasını otomatik olarak başlat.",
    startInTray: "Sistem Tepsisinde Başlat",
    startInTrayDesc: "Uygulama açıldığında ana pencereyi gösterme, arka planda sistem tepsisinde çalıştır.",
    takeScreenshot: "Ekran Görüntüsü Al",
    takeScreenshotDesc: "Yakalama arayüzünü açmak için anında test edin. Kısayol:",
    captureNow: "Şimdi Yakala",
    languageSetting: "Dil Ayarı / Language",
    languageSettingDesc: "Uygulama dilini seçin / Select application language",

    captureTitle: "Yakalama Ayarları",
    captureSubtitle: "Ekran görüntüsü yakalama yöntemlerini ve kısayolları yönetin.",
    playShutterSound: "Kamera Deklanşör Sesi Çal",
    playShutterSoundDesc: "Başarıyla ekran görüntüsü alındığında ses efekti duyur.",
    includeCursor: "Fare İmlecini Dahil Et (Deneysel)",
    includeCursorDesc: "Alınan ekran görüntülerine sistem imlecini de yerleştir.",
    globalShortcut: "Global Kısayol (Bölge Seçimi)",
    globalShortcutDesc: "Bölge seçimi ekran görüntüsünü tetikleyen ana kısayollar.",

    saveTitle: "Kaydetme ve Dosya Ayarları",
    saveSubtitle: "Dosyaların nereye ve hangi formatta kaydedileceğini yapılandırın.",
    defaultSaveDir: "Varsayılan Kayıt Dizini",
    defaultSaveDirDesc: "Ekran görüntülerinin kaydedileceği klasör.",
    fileFormat: "Dosya Biçimi",
    fileFormatDesc: "Ekran görüntülerinin kaydedileceği dosya formatı.",
    imageQuality: "Görüntü Kalitesi",
    imageQualityDesc: "Görüntü kalitesi yüzdesi (JPG ve WebP formatları için geçerlidir).",

    aboutTitle: "Shotera Hakkında",
    aboutSubtitle: "Shotera projesi ve kurulu sürüm detayları.",
    aboutDesc: "Shotera, Windows, macOS ve Linux üzerinde çalışan, Rust ve Tauri ile geliştirilmiş, ultra hafif, hızlı ve gizlilik odaklı bir ekran görüntüsü alma aracıdır. Tüm görüntüleriniz cihazınızda yerel (offline) olarak işlenir.",
    developer: "Geliştirici",
    license: "Lisans",
    infrastructure: "Altyapı",

    dragToSelect: "Sürükleyip Alan Seçin | Çıkmak için ESC",
    toolSelect: "Seçim Aracı (Taşı / Yeniden Boyutlandır)",
    toolPencil: "Serbest Kalem",
    toolArrow: "Ok Ekle",
    toolRect: "Dikdörtgen Çiz",
    toolText: "Metin Yaz",
    toolClear: "Çizimleri Temizle",
    actionCopy: "Panoya Kopyala (Enter)",
    actionSave: "Dosyaya Kaydet",
    actionClose: "Kapat (ESC)",
  },
  en: {
    sidebarGeneral: "General",
    sidebarCapture: "Capture",
    sidebarSave: "Save Settings",
    sidebarAbout: "About",

    generalTitle: "General Settings",
    generalSubtitle: "Customize the general behavior and startup of the app.",

    runAtStartup: "Run at System Startup",
    runAtStartupDesc: "Automatically start Shotera when Windows starts.",
    startInTray: "Start in System Tray",
    startInTrayDesc: "Do not show main window on start, run in the background in system tray.",
    takeScreenshot: "Take Screenshot",
    takeScreenshotDesc: "Test immediately to open the capture interface. Shortcut:",
    captureNow: "Capture Now",
    languageSetting: "Language",
    languageSettingDesc: "Select application language",

    captureTitle: "Capture Settings",
    captureSubtitle: "Manage screen capture methods and shortcuts.",
    playShutterSound: "Play Camera Shutter Sound",
    playShutterSoundDesc: "Play a sound effect when a screenshot is successfully taken.",
    includeCursor: "Include Mouse Cursor (Experimental)",
    includeCursorDesc: "Render the system cursor on captured screenshots.",
    globalShortcut: "Global Shortcut (Capture Region)",
    globalShortcutDesc: "Main shortcuts to trigger area-selection screen capture.",

    saveTitle: "Save and File Settings",
    saveSubtitle: "Configure where and in which format files are saved.",
    defaultSaveDir: "Default Save Directory",
    defaultSaveDirDesc: "Folder where screenshots will be saved.",
    fileFormat: "File Format",
    fileFormatDesc: "File format to save screenshots.",
    imageQuality: "Image Quality",
    imageQualityDesc: "Image quality percentage (applies to JPG and WebP formats).",

    aboutTitle: "About Shotera",
    aboutSubtitle: "Shotera project and installed version details.",
    aboutDesc: "Shotera is an ultra-lightweight, fast, and privacy-focused screenshot utility running on Windows, macOS, and Linux, built with Rust and Tauri. All your images are processed locally (offline) on your device.",
    developer: "Developer",
    license: "License",
    infrastructure: "Infrastructure",

    dragToSelect: "Drag to Select Area | Press ESC to Exit",
    toolSelect: "Selection Tool (Move / Resize)",
    toolPencil: "Free Pencil",
    toolArrow: "Add Arrow",
    toolRect: "Draw Rectangle",
    toolText: "Write Text",
    toolClear: "Clear Drawings",
    actionCopy: "Copy to Clipboard (Enter)",
    actionSave: "Save to File",
    actionClose: "Close (ESC)",
  }
};

export type Language = "tr" | "en";

export function getLanguage(): Language {
  const lang = localStorage.getItem("language");
  if (lang === "en" || lang === "tr") return lang;

  // Detect browser language
  const browserLang = navigator.language.substring(0, 2).toLowerCase();
  return browserLang === "tr" ? "tr" : "en";
}

export function setLanguage(lang: Language) {
  localStorage.setItem("language", lang);
  // Dispatch custom storage event for multi-webview tab coordination
  window.dispatchEvent(new Event("storage"));
}
