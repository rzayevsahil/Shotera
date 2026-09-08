import { Language, TranslationStrings } from './types';

export const translations: Record<Language, TranslationStrings> = {
  en: {
    nav: {
      features: 'Features',
      howItWorks: 'How It Works',
      shortcuts: 'Shortcuts',
      whyShotera: 'Why Shotera',
      download: 'Download',
      github: 'GitHub',
      versionBadge: 'v1.4.0',
    },
    hero: {
      eyebrow: 'Native Desktop Screen Capture & Productivity',
      headline: 'Everything you need to capture,',
      headlineHighlight: 'explain, and record your screen.',
      supporting:
        'Shotera combines instant screenshot capture, live screen zoom, crisp annotations, OCR text extraction, and hardware-accelerated screen recording in one fast desktop application.',
      downloadBtn: 'Download for Windows',
      githubBtn: 'View on GitHub',
      compatibility: 'Windows 10 & 11 • 64-bit • Free & Open Source',
      trustPills: {
        openSource: '100% Open Source (MIT)',
        privacy: 'Privacy First • Zero Telemetry',
        lightweight: 'Fast & Lightweight Native App',
      },
    },
    whyShotera: {
      eyebrow: 'Consolidation',
      title: 'Stop juggling six different utilities',
      subtitle:
        'Shotera unifies essential screen capture, presentation, and recording tools into a single background application with instant global hotkeys.',
      beforeTitle: 'Before: Fragmented Tooling',
      afterTitle: 'With Shotera: All-in-One Native Utility',
      items: [
        {
          name: 'Screen Snipping & Region Capture',
          replaced: 'Standalone Snipping Tools',
          desc: 'High-precision pixel snapping, color loupe, and instant multi-monitor capture.',
        },
        {
          name: 'Live Screen Zoom & Magnifier',
          replaced: 'Separate Screen Magnifiers',
          desc: 'Smooth hardware zoom with live screen drawing and cursor tracking.',
        },
        {
          name: 'Annotation & Step Numbering',
          replaced: 'Basic Paint Apps',
          desc: 'Vector arrows, auto-incrementing step badges, text callouts, and pixelated blur redaction.',
        },
        {
          name: 'Instant Screen OCR',
          replaced: 'Standalone OCR Readers',
          desc: 'Extract unselectable text from code, error logs, images, and video frames to clipboard.',
        },
        {
          name: 'Screen & Audio Recording',
          replaced: 'Heavy Recording Software',
          desc: 'Hardware-accelerated window and screen recording with microphone and system audio.',
        },
        {
          name: 'Focus & Break Timer',
          replaced: 'Separate Timer Extensions',
          desc: 'Integrated Pomodoro and eye-strain rest intervals on your screen.',
        },
      ],
      bannerTitle: 'One Unified Background Process',
      bannerDesc: '~40MB RAM footprint • Zero background telemetry • Instant global hotkey hook',
      bannerBtn: 'Download Unified App',
    },
    showcases: {
      capture: {
        tag: 'Pixel-Perfect Capture',
        title: 'Capture anything on your display with surgical accuracy',
        desc: 'Select custom rectangular regions, active windows, or full multi-monitor workspaces. Use the built-in magnifying loupe with live RGB/HEX hex-code readout for pixel-exact alignment.',
        points: [
          'Full-screen, free-form region, and active window capture',
          'Live pixel loupe magnifier with precise coordinate grid',
          'Multiple export formats (PNG, JPEG, WebP, BMP) with adjustable compression',
          'Multi-monitor and high-DPI display calibration',
        ],
      },
      annotation: {
        tag: 'Visual Communication',
        title: 'Explain complex concepts in seconds with clear markup',
        desc: 'Turn raw screenshots into self-explanatory guides. Add crisp directional arrows, auto-incrementing step numbers, highlight boxes, text callouts, and security redaction blur.',
        points: [
          'Auto-sequenced step badges (1, 2, 3...) for clear step-by-step tutorials',
          'Non-destructive redaction blur and pixelation for sensitive data',
          'Vector arrows, outlines, fills, rectangles, and freehand drawing',
          'Pin captures as floating always-on-top reference overlays',
        ],
      },
      zoom: {
        tag: 'Live Presentation & Zoom',
        title: 'Zoom and draw directly on your live screen during calls',
        desc: 'Inspired by classic presentation tools like ZoomIt, Shotera lets you smoothly magnify any section of your desktop and draw live annotations during presentations and live streams.',
        points: [
          'Live interactive screen zoom (2×, 4×, 8× magnification)',
          'Draw live vector lines and callouts over active windows',
          'Fluid mouse cursor tracking with zero stutter',
          'Instant hotkey activation (Ctrl+1 and Ctrl+4)',
        ],
      },
      record: {
        tag: 'Hardware-Accelerated Recording',
        title: 'Record smooth screen video with crystal-clear audio',
        desc: 'Capture software tutorials, bug reports, and presentations using native hardware acceleration for maximum quality and minimal CPU overhead.',
        points: [
          'Capture full screen or specific application windows',
          'Synchronized microphone commentary and system audio recording',
          'Lightweight memory footprint without background bloat',
          'Quick export to standard MP4 container format',
        ],
      },
      ocr: {
        tag: 'Optical Character Recognition',
        title: 'Extract uncopyable text directly from your screen',
        desc: 'Ever needed to copy an error message from a modal dialog, text inside an image, or code inside a video? Snip the region and Shotera instantly extracts plain text into your clipboard.',
        points: [
          'Accurate multi-language optical character recognition',
          'Instant one-click copy to clipboard with formatting cleanup',
          'Works on protected PDFs, command-line outputs, and video frames',
          'Fully local processing for complete data privacy',
        ],
      },
      timer: {
        tag: 'Ergonomic Productivity',
        title: 'Stay focused and protect your eyes with break intervals',
        desc: 'Built-in ergonomic focus and rest timers remind you to take 20-20-20 eye rests and Pomodoro work intervals without requiring another background app.',
        points: [
          'Customizable focus intervals (25m / 50m)',
          'Gentle full-screen break reminders with countdown',
          'Quick toggle via global hotkey (Ctrl+3)',
          'Keeps your desktop workspace distraction-free',
        ],
      },
    },
    matrix: {
      eyebrow: 'Capability Matrix',
      title: 'Engineered for developers, designers, and educators',
      subtitle: 'Every feature is purpose-built to eliminate friction in your daily visual workflow.',
    categories: [
  {
    id: 'capture',
    title: 'Capture',
    items: [
      {
        title: 'Region & Window Snapping',
        description: 'Pixel-accurate crosshair with smart edge detection and active window outline detection.'
      },
      {
        title: 'Full-Screen & Multi-Monitor',
        description: 'Single-hotkey capture across 4K displays and mixed DPI setups without downscaling artifacts.'
      },
      {
        title: 'Multiple Image Formats',
        description: 'Direct output to lossless PNG, compressed JPEG, modern WebP, or uncompressed BMP.'
      },
      {
        title: 'Lossless Loupe & HEX Inspector',
        description: 'Real-time 8x zoom magnifier showing exact RGB and HEX color codes for UI developers.'
      }
    ]
  },
  {
    id: 'explain',
    title: 'Explain',
    items: [
      {
        title: 'Step Numbering Badges',
        description: 'Auto-incrementing numbered circles (1, 2, 3...) for documenting workflows and tutorials.'
      },
      {
        title: 'Vector Arrows & Shapes',
        description: 'Clean geometric lines, filled rectangles, ellipses, and curved pointer arrows.'
      },
      {
        title: 'Security Blur & Pixelation',
        description: 'Non-destructive Gaussian blur and pixelation brushes for hiding passwords, tokens, and PII.'
      },
      {
        title: 'Clean Typography Callouts',
        description: 'High-contrast text badges with customizable font weights, background pill, and shadows.'
      }
    ]
  },
  {
    id: 'present',
    title: 'Present',
    items: [
      {
        title: 'Hardware Screen Zoom',
        description: 'Fluid 2x to 8x screen magnification with zero CPU lag during live presentations.'
      },
      {
        title: 'Live Screen Drawing',
        description: 'Draw freehand vector lines, arrows, and circles directly on top of running desktop applications.'
      },
      {
        title: 'Interactive Live Zoom',
        description: 'Keep desktop apps clickable and interactive while working in a magnified viewport.'
      },
      {
        title: 'Screen Pinning (Always-on-Top)',
        description: 'Pin screenshot snippets anywhere on screen as floating reference cards while writing code.'
      }
    ]
  },
  {
    id: 'record',
    title: 'Record',
    items: [
      {
        title: 'Hardware Acceleration',
        description: 'Native GPU-backed video encoding (NVENC / QuickSync / AMD AMF) for seamless 60 FPS recording.'
      },
      {
        title: 'Targeted Window Capture',
        description: 'Record specific application windows without capturing confidential taskbar or background clutter.'
      },
      {
        title: 'Synchronized Audio Streams',
        description: 'Simultaneously capture studio microphone audio and internal PC audio with balance sliders.'
      },
      {
        title: 'Lightweight MP4 Packaging',
        description: 'Immediate export to widely supported H.264 MP4 with compact file sizes ready for sharing.'
      }
    ]
  },
  {
    id: 'smarter',
    title: 'Work Smarter',
    items: [
      {
        title: 'On-Device Screen OCR',
        description: 'Instantly extract text from unselectable UI dialogs, protected PDFs, and videos to clipboard.'
      },
      {
        title: 'Ergonomic Break & Focus Timer',
        description: 'Integrated 20-20-20 rest intervals and Pomodoro timers to reduce eye fatigue during long sessions.'
      },
      {
        title: 'Cloud Upload & Instant Link',
        description: 'Upload captures with one click and receive a clean shareable URL in your clipboard.'
      },
      {
        title: 'System Tray & Auto Updates',
        description: 'Runs silently in background with ~40MB RAM usage; automatic frictionless update engine.'
      }
    ]
  }
],
    },
    howItWorks: {
      eyebrow: 'Workflow',
      title: 'Simple three-step workflow',
      subtitle: 'From quick trigger to final delivery in less than two seconds.',
      step1: {
        num: '01',
        title: 'Trigger & Capture',
        desc: 'Press global hotkey Ctrl+Shift+S. Select any region, window, or monitor with real-time loupe precision.',
      },
      step2: {
        num: '02',
        title: 'Annotate & Redact',
        desc: 'Add step badges, arrows, text callouts, or blur sensitive passwords and private tokens effortlessly.',
      },
      step3: {
        num: '03',
        title: 'Copy, Save, or Pin',
        desc: 'Instant clipboard copy, direct file save, or pin as a floating reference on top of your code editor.',
      },
    },
    shortcuts: {
      eyebrow: 'Efficiency',
      title: 'Built around fast keyboard shortcuts',
      subtitle: 'Perform every operation instantly without taking your hands off the keyboard. All hotkeys are fully customizable inside Shotera.',
      customizableNote: 'All shortcut combinations can be remapped in Settings > Keyboard Shortcuts.',
      categories: {
        all: 'All Shortcuts',
        capture: 'Capture',
        zoom: 'Zoom & Live',
        record: 'Recording',
        timer: 'Timer',
      },
    },
    download: {
      eyebrow: 'Installation',
      title: 'Get Shotera for Windows',
      subtitle: 'Download the lightweight installer or portable standalone archive. Completely free, no registration required.',
      windowsInstaller: 'Shotera Installer (.exe)',
      windowsInstallerDesc: 'Recommended for Windows 10/11. Includes auto-updates and system tray integration.',
      windowsPortable: 'Portable Standalone (.zip)',
      windowsPortableDesc: 'Zero installation required. Extract and run directly from any folder or USB drive.',
      viewReleases: 'View All Releases on GitHub',
      systemRequirements: 'System Requirements',
      reqWindows: 'Windows 10 / Windows 11 (64-bit)',
      reqRam: '100 MB available RAM (Ultra-lightweight)',
      reqStorage: '50 MB free disk space',
      licenseTitle: 'Free & Open Source',
            licenseDesc: 'Released under the permissive MIT license. Zero spyware, zero telemetry, zero forced ads.',
      recommended: 'Recommended',
      downloadExeBtn: 'Download Shotera (.exe)',
      downloadZipBtn: 'Download Portable (.zip)',
      windowsInstallerFeatures: [
        'Windows 10 / 11 (64-bit Architecture)',
        'Automatic background updates & system tray',
        'Instant global hotkey registration'
      ],
      windowsPortableFeatures: [
        'Zero installation or registry writes',
        'Runs from USB flash drive or network folder',
        'Self-contained configuration file'
      ],
      bannerTitle: 'One Unified Background Process',
      bannerDesc: '~40MB RAM footprint • Zero background telemetry • Instant global hotkey hook',
      bannerBtn: 'Download Unified App',
    },
    github: {
      eyebrow: 'Open Source',
      title: 'Built completely in the open',
      subtitle: 'Shotera is open-source software developed on GitHub. Inspect the codebase, file feature requests, report bugs, or contribute code.',
      viewRepo: 'Explore on GitHub',
      reportIssue: 'Report an Issue',
      starsNote: 'Open-source desktop software crafted with care by Sahil Rzayev.',
    },
    philosophy: {
      eyebrow: 'Philosophy',
      title: 'Simple tools. Fast workflows. Zero bloat.',
      quote: '"Productivity software should get out of your way and do its job in milliseconds."',
      body: 'Shotera was created to eliminate the clutter of having six separate sluggish tools running in the background. We believe in native desktop performance, instant hotkey responsiveness, and absolute user privacy.',
    },
    footer: {
      desc: 'Fast desktop screen capture, hardware-accelerated recording, live zoom, and annotation tool.',
      product: 'Product',
      resources: 'Resources',
      openSource: 'Open Source',
      copyright: '© 2026 Shotera. Open source under the MIT License.',
            builtFor: 'Developed by Sahil Rzayev. Built for creators, developers, and teams.',
      releaseNotes: 'Release Notes',
      githubRepo: 'GitHub Repository',
      issueTracker: 'Issue Tracker',
      languages: 'Languages',
    },
  },
  az: {
    nav: {
      features: 'Xüsusiyyətlər',
      howItWorks: 'Necə İşləyir',
      shortcuts: 'Qısayollar',
      whyShotera: 'Niyə Shotera',
      download: 'Yüklə',
      github: 'GitHub',
      versionBadge: 'v1.4.0',
    },
    hero: {
      eyebrow: 'Masaüstü Ekran Çəkmə və Məhsuldarlıq Proqramı',
      headline: 'Ekranınızı çəkmək, izah etmək',
      headlineHighlight: 'və qeydə almaq üçün hər şey bir yerdə.',
      supporting:
        'Shotera ekran görüntülərini, canlı böyütməni (Zoom), aydın qeydləri, OCR mətn oxumasını və aparat sürətləndirməli ekran qeydini bir sürətli masaüstü tətbiqdə birləşdirir.',
      downloadBtn: 'Windows üçün Yüklə',
      githubBtn: 'GitHub-da Baxın',
      compatibility: 'Windows 10 & 11 • 64-bit • Pulsuz və Açıq Mənbəli',
      trustPills: {
        openSource: '100% Açıq Mənbə (MIT)',
        privacy: 'Məxfilik Əsasdır • Sıfır İzləmə',
        lightweight: 'Sürətli və Yüngül Masaüstü Tətbiq',
      },
    },
    whyShotera: {
      eyebrow: 'Birləşdirmə',
      title: 'Altı fərqli köməkçi proqramı bağlamağın vaxtıdır',
      subtitle:
        'Shotera əsas ekran çəkmə, təqdimat və qeyd alətlərini qlobal qısayollara malik vahid tətbiqdə birləşdirir.',
      beforeTitle: 'Əvvəl: Dağınıq Alətlər',
      afterTitle: 'Shotera ilə: Vahid Tətbiq',
      items: [
        {
          name: 'Ekran və Sahə Çəkmə',
          replaced: 'Xarici Ekran Alıntısı Alətləri',
          desc: 'Piksel dəqiqlikli sahə seçimi və çoxlu monitor dəstəyi.',
        },
        {
          name: 'Canlı Ekran Böyütmə (Zoom)',
          replaced: 'Ayrı Ekran Böyüdücüləri',
          desc: 'Sərbəst rəsm və kursor izləmə ilə hamar aparat böyütməsi.',
        },
        {
          name: 'Qeydlər və Nömrələmə',
          replaced: 'Sadə Rəsm Tətbiqləri',
          desc: 'Oxlar, addım-addım nömrələr, mətn və bulanıqlaşdırma (blur).',
        },
        {
          name: 'Ekranda OCR Mətn Oxuma',
          replaced: 'Ayrı OCR alətləri',
          desc: 'Kopyalana bilməyən mətnləri birbaşa buferə kopyalamaq imkanı.',
        },
        {
          name: 'Ekran və Səs Qeydi',
          replaced: 'Ağır qeyd proqramları',
          desc: 'Mikrofon və sistem səsi ilə yüksək keyfiyyətli video qeydi.',
        },
        {
          name: 'Fokus və İstirahət Taymeri',
          replaced: 'Ayrı taymer tətbiqləri',
          desc: 'Göz istirahəti və Pomodoro üçün daxili taymer sistemi.',
        },
      ],
      bannerTitle: 'Tək Vahid Arxa Fon Prosesi',
      bannerDesc: '~40MB RAM istifadəsi • Arxa fonda izləmə yoxdur • Anında qlobal qısayol bağlantısı',
      bannerBtn: 'Vahid Tətbiqi Yüklə',
    },
    showcases: {
      capture: {
        tag: 'Dəqiq Çəkmə',
        title: 'Ekranınızdakı istənilən sahəni dəqiqliklə çəkin',
        desc: 'Fərdi düzbucaqlı sahələri, aktiv pəncərələri və ya tam ekranı seçin. Piksel dəqiqliyi üçün daxili böyüdücü və rəng oxuyucu (HEX/RGB) istifadə edin.',
        points: [
          'Tam ekran, sərbəst sahə və aktiv pəncərə çəkilişi',
          'Dəqiq koordinat şəbəkəli canlı böyüdücü',
          'PNG, JPEG, WebP, BMP formatları və keyfiyyət tənzimləməsi',
          'Çoxlu monitor və yüksək DPI ekran kalibrasiyası',
        ],
      },
      annotation: {
        tag: 'Vizual İzah',
        title: 'Aydın qrafik alətlərlə fikrinizi dərhal çatdırın',
        desc: 'Ekran görüntülərini aydın təlimatlara çevirin. Oxlar, ardıcıl addım nömrələri, mətn və məxfi məlumatlar üçün bulanıqlaşdırma (blur) əlavə edin.',
        points: [
          'Addım-addım təlimatlar üçün avtomatik nömrələmə (1, 2, 3...)',
          'Şifrələr və məxfi məlumatlar üçün bulanıqlaşdırma aləti',
          'Vektor oxlar, çərçivələr, formalar və sərbəst rəsm',
          'Görüntünü ekranda digər pəncərələrin üzərində sabitlemə (Pin)',
        ],
      },
      zoom: {
        tag: 'Canlı Təqdimat və Zoom',
        title: 'Təqdimat və zənglər zamanı ekranda canlı böyütmə və rəsm',
        desc: 'ZoomIt tərzi alətlərdən ilhamlanan Shotera ilə ekranın istənilən hissəsini dərhal böyüdə və üzərində canlı qeydlər apara bilərsiniz.',
        points: [
          'Canlı interaktiv ekran böyütməsi (2×, 4×, 8×)',
          'Aktiv pəncərələrin üzərində canlı vektor xətləri çəkmək',
          'Gecikməsiz hamar siçan kursoru izləməsi',
          'Qlobal qısayollarla dərhal aktivləşmə (Ctrl+1 və Ctrl+4)',
        ],
      },
      record: {
        tag: 'Aparat Sürətləndirməli Video',
        title: 'Kristal aydınlığında səs ilə ekran videosu çəkin',
        desc: 'Dərsliklər, xəta hesabatları və təqdimatlar üçün minimum CPU yükü ilə yüksək keyfiyyətli video qeydiyyatı.',
        points: [
          'Tam ekranı və ya seçilmiş tətbiq pəncərəsini qeydə almaq',
          'Mikrofon və sistem səsinin sinxron qeydiyyatı',
          'Sistem resurslarına qənaət edən yüngül arxitektura',
          'Standart MP4 formatında sürətli ixrac',
        ],
      },
      ocr: {
        tag: 'Optik Mətn Tanıma (OCR)',
        title: 'Kopyalanması mümkün olmayan mətnləri dərhal çıxarın',
        desc: 'Xəta bildirişlərindən, şəkillərdən və ya videolardan mətni kopyalamaq üçün sahəni seçin və Shotera onu dərhal mətn olaraq buferə köçürsün.',
        points: [
          'Çoxdilli dəqiq optik mətn tanıma',
          'Bir kliklə buferə kopyalama',
          'Qorunan PDF və video kadrlarında problemsiz işləmə',
          'Tam məxfilik üçün lokal emal',
        ],
      },
      timer: {
        tag: 'Erqonomik Məhsuldarlıq',
        title: 'İstirahət və fokus taymeri ilə gözlərinizi qoruyun',
        desc: 'Daxili Pomodoro və 20-20-20 qaydası istirahət taymerləri sayəsində əlavə proqramlara ehtiyac qalmadan sağlam iş rejimini saxlayın.',
        points: [
          'Fərdiləşdirilə bilən iş intervalları (25 dəq / 50 dəq)',
          'Tam ekran geri sayımlı zərif istirahət xatırlatması',
          'Qısayol ilə dərhal aktivləşdirmə (Ctrl+3)',
          'İş mühitini səliqəli saxlayır',
        ],
      },
    },
    matrix: {
      eyebrow: 'İmkanlar Cədvəli',
      title: 'Tərtibatçılar, dizaynerlər və müəllimlər üçün hazırlanıb',
      subtitle: 'Hər bir funksiya gündəlik vizual iş axınınızı sürətləndirmək üçün yaradılıb.',
    categories: [
  {
    id: 'capture',
    title: 'Yakala',
    items: [
      {
        title: 'Bölge ve Pencere Yakalama',
        description: 'Akıllı kenar algılama ve aktif pencere tespiti ile piksel hassasiyetinde seçim.'
      },
      {
        title: 'Tam Ekran ve Çoklu Monitör',
        description: 'Görüntü bozulması olmadan 4K ve farklı çözünürlüklü ekranlarda tek tuşla yakalama.'
      },
      {
        title: 'Çoklu Format Desteği',
        kayıp: 'Kayıpsız PNG, sıkıştırılmış JPEG, WebP veya BMP olarak doğrudan dışa aktarma.',
        description: 'Kayıpsız PNG, sıkıştırılmış JPEG, modern WebP veya BMP formatlarında dışa aktarma.'
      },
      {
        title: 'Kayıpsız Büyüteç ve HEX',
        description: 'Tasarımcılar için tam RGB ve HEX renk kodlarını gösteren gerçek zamanlı 8x büyüteç.'
      }
    ]
  },
  {
    id: 'explain',
    title: 'Açıkla',
    items: [
      {
        title: 'Adım Numaralandırma',
        description: 'İş akışlarını ve eğitimleri belgelemek için otomatik artan sıralı numaralar (1, 2, 3...).'
      },
      {
        title: 'Vektör Oklar ve Şekiller',
        description: 'Temiz geometrik çizgiler, içi dolu dikdörtgenler, elipsler ve kavisli işaret okları.'
      },
      {
        title: 'Güvenlik ve Sansürleme (Blur)',
        description: 'Şifreleri ve gizli verileri gizlemek için tahribatsız bulanıklaştırma (blur) ve pikselleştirme.'
      },
      {
        title: 'Temiz Metin Kutuları',
        description: 'Özelleştirilebilir font kalınlığı, arka plan ve gölgelere sahip yüksek kontrastlı metin kutuları.'
      }
    ]
  },
  {
    id: 'present',
    title: 'Sun',
    items: [
      {
        title: 'Donanımsal Ekran Yakınlaştırma',
        description: 'Canlı sunumlar sırasında sıfır CPU gecikmesi ile akıcı 2x - 8x ekran yakınlaştırması.'
      },
      {
        title: 'Canlı Ekran Çizimi',
        description: 'Doğrudan masaüstü uygulamalarının üzerinde serbest vektör çizgileri, oklar ve daireler çizin.'
      },
      {
        title: 'Etkileşimli Canlı Zoom',
        description: 'Yakınlaştırılmış ekranda çalışırken masaüstü uygulamalarını tıklanabilir ve etkileşimli tutun.'
      },
      {
        title: 'Ekrana Sabitleme (Pin)',
        description: 'Kod yazarken ekran görüntülerini sürekli üstte duran referans kartları olarak sabitleyin.'
      }
    ]
  },
  {
    id: 'record',
    title: 'Kaydet',
    items: [
      {
        title: 'Donanım Hızlandırma',
        description: 'Kesintisiz 60 FPS kayıt için donanım tabanlı video kodlama (NVENC / QuickSync / AMD AMF).'
      },
      {
        title: 'Hedef Pencere Kaydı',
        description: 'Görev çubuğunu veya arkaplandaki gizli verileri almadan sadece belirli bir pencereyi kaydedin.'
      },
      {
        title: 'Senkronize Ses Kaydı',
        description: 'Mikrofon sesini ve sistem sesini denge ayarlarıyla aynı anda sorunsuz kaydedin.'
      },
      {
        title: 'Hafif MP4 Formatı',
        description: 'Paylaşmaya hazır kompakt dosya boyutlarıyla evrensel H.264 MP4 formatına anında çıktı.'
      }
    ]
  },
  {
    id: 'smarter',
    title: 'Akıllı Çalış',
    items: [
      {
        title: 'Dahili Ekran OCR',
        description: 'Seçilemeyen arayüzlerden, PDF ve videolardan metinleri anında panoya kopyalayın.'
      },
      {
        title: 'Ergonomik Mola Zamanlayıcısı',
        description: 'Uzun seanslarda göz yorgunluğunu azaltmak için 20-20-20 molaları ve Pomodoro zamanlayıcıları.'
      },
      {
        title: 'Buluta Yükleme ve Anında Link',
        description: 'Ekran görüntülerini tek tıkla yükleyin ve anında paylaşılabilir bir bağlantı alın.'
      },
      {
        title: 'Sistem Tepsisi ve Otomatik Güncelleme',
        description: '~40MB RAM kullanımı ile arka planda sessizce çalışır; pürüzsüz otomatik güncelleme motoru.'
      }
    ]
  }
],
    },
    howItWorks: {
      eyebrow: 'İş Axını',
      title: 'Üç sadə addım',
      subtitle: 'Qısayolu basmaqdan nəticəni əldə etməyə qədər cəmi iki saniyə.',
      step1: {
        num: '01',
        title: 'Çəkin',
        desc: 'Ctrl+Shift+S qısayolunu basın və istədiyiniz sahəni və ya pəncərəni seçin.',
      },
      step2: {
        num: '02',
        title: 'Düzəliş Edin',
        desc: 'Oxlar, addım nömrələri əlavə edin və ya məxfi sahələri bulanıqlaşdırın.',
      },
      step3: {
        num: '03',
        title: 'Paylaşın və ya Saxlayın',
        desc: 'Buferə kopyalayın, fayl kimi yadda saxlayın və ya ekranda sabitleyin.',
      },
    },
    shortcuts: {
      eyebrow: 'Sürət',
      title: 'Sürətli klaviatura qısayolları',
      subtitle: 'Hər bir əməliyyatı klaviaturadan əlinizi çəkmədən icra edin. Bütün düymələr tənzimlənə biləndir.',
      customizableNote: 'Bütün qısayol kombinasiyaları Tənzimləmələr > Qısayollar bölməsində dəyişdirilə bilər.',
      categories: {
        all: 'Bütün Qısayollar',
        capture: 'Çəkmə',
        zoom: 'Zoom və Canlı',
        record: 'Qeyd',
        timer: 'Taymer',
      },
    },
    download: {
      eyebrow: 'Quraşdırma',
      title: 'Shotera-nı Windows üçün Əldə Edin',
      subtitle: 'Quraşdırıcı və ya portativ (portable) versiyanı yükləyin. Tamamilə pulsuz, qeydiyyatsız.',
      windowsInstaller: 'Shotera Quraşdırıcısı (.exe)',
      windowsInstallerDesc: 'Windows 10/11 üçün tövsiyə olunur. Avtomatik yeniləmə dəstəyi ilə.',
      windowsPortable: 'Portativ Versiya (.zip)',
      windowsPortableDesc: 'Quraşdırma tələb olunmur. Arxivdən çıxarın və dərhal işə salın.',
      viewReleases: 'GitHub-da Bütün Buraxılışlar',
      systemRequirements: 'Sistem Tələbləri',
      reqWindows: 'Windows 10 / Windows 11 (64-bit)',
      reqRam: '100 MB RAM (Çox yüngül)',
      reqStorage: '50 MB boş disk sahəsi',
      licenseTitle: 'Pulsuz və Açıq Mənbə',
            licenseDesc: 'MIT lisenziyası ilə buraxılıb. Sıfır casus proqram, sıfır reklam.',
      recommended: 'Tövsiyə olunur',
      downloadExeBtn: 'Shotera Yüklə (.exe)',
      downloadZipBtn: 'Portativ Versiya Yüklə (.zip)',
      windowsInstallerFeatures: [
        'Windows 10 / 11 (64-bit Arxitektura)',
        'Avtomatik arxa fon yenilənmələri və sistem tepsisi',
        'Dərhal qlobal qısayol qeydiyyatı'
      ],
      windowsPortableFeatures: [
        'Quraşdırma və ya reyestr yazıları tələb etmir',
        'USB fleş disk və ya şəbəkə qovluğundan işləyir',
        'Özündə cəmlənmiş konfiqurasiya faylı'
      ],
      bannerTitle: 'Tək Vahid Arxa Fon Prosesi',
      bannerDesc: '~40MB RAM istifadəsi • Arxa fonda izləmə yoxdur • Anında qlobal qısayol bağlantısı',
      bannerBtn: 'Vahid Tətbiqi Yüklə',
    },
    github: {
      eyebrow: 'Açıq Mənbə',
      title: 'Tamamilə açıq şəkildə yaradılıb',
      subtitle: 'Shotera GitHub-da inkişaf etdirilən açıq mənbəli layihədir. Kodu yoxlayın, təklif verin və ya töhfə verin.',
      viewRepo: 'GitHub-da Baxın',
      reportIssue: 'Xəta Bildirin',
      starsNote: 'Sahil Rzayev tərəfindən sevgi ilə hazırlanmış masaüstü alət.',
    },
    philosophy: {
      eyebrow: 'Fəlsəfə',
      title: 'Sadə alətlər. Sürətli iş axını. Sıfır artıq yük.',
      quote: '"Məhsuldarlıq proqramı mane olmamalı və öz işini millisaniyələr içində görməlidir."',
      body: 'Shotera arxa fonda çalışan 6 fərqli ağır proqramın yaratdığı sıxlığı aradan qaldırmaq üçün yaradılıb. Biz yerli masaüstü sürətinə və istifadəçi məxfiliyinə inanırıq.',
    },
    footer: {
      desc: 'Masaüstü ekran çəkmə, aparat sürətləndirməli qeyd, canlı zoom və qrafik qeyd proqramı.',
      product: 'Məhsul',
      resources: 'Resurslar',
      openSource: 'Açıq Mənbə',
      copyright: '© 2026 Shotera. MIT Lisenziyası ilə açıq mənbəli.',
            builtFor: 'Sahil Rzayev tərəfindən yaradılıb. Yaradıcılar və mühəndislər üçün.',
      releaseNotes: 'Buraxılış Qeydləri',
      githubRepo: 'GitHub Repozitoriyası',
      issueTracker: 'Xəta İzləyici',
      languages: 'Dillər',
    },
  },
  tr: {
    nav: {
      features: 'Özellikler',
      howItWorks: 'Nasıl Çalışır',
      shortcuts: 'Kısayollar',
      whyShotera: 'Neden Shotera',
      download: 'İndir',
      github: 'GitHub',
      versionBadge: 'v1.4.0',
    },
    hero: {
      eyebrow: 'Masaüstü Ekran Yakalama ve Verimlilik Aracı',
      headline: 'Ekranınızı yakalamak, açıklamak',
      headlineHighlight: 've kaydetmek için gereken her şey.',
      supporting:
        'Shotera; anlık ekran görüntüsü, canlı ekran yakınlaştırma (Zoom), çizim araçları, OCR metin çıkarma ve donanım hızlandırmalı video kaydını tek bir hızlı masaüstü uygulamasında birleştirir.',
      downloadBtn: "Windows için İndir",
      githubBtn: "GitHub'da İncele",
      compatibility: 'Windows 10 & 11 • 64-bit • Ücretsiz ve Açık Kaynak',
      trustPills: {
        openSource: '%100 Açık Kaynak (MIT)',
        privacy: 'Gizlilik Öncelikli • Sıfır Telemetri',
        lightweight: 'Hızlı ve Hafif Masaüstü Uygulaması',
      },
    },
    whyShotera: {
      eyebrow: 'Konsolidasyon',
      title: 'Altı farklı yardımcı aracı çalıştırmaya son verin',
      subtitle:
        'Shotera, temel ekran yakalama, sunum ve kayıt araçlarını global kısayollara sahip tek bir arka plan uygulamasında bir araya getirir.',
      beforeTitle: 'Önce: Dağınık Araçlar',
      afterTitle: 'Shotera ile: Hepsi Bir Arada',
      items: [
        {
          name: 'Ekran ve Bölge Yakalama',
          replaced: 'Harici Ekran Alıntısı Araçları',
          desc: 'Piksel hassasiyetinde seçim, büyüteç ve çoklu monitör desteği.',
        },
        {
          name: 'Canlı Ekran Yakınlaştırma (Zoom)',
          replaced: 'Ayrı Ekran Büyüteçleri',
          desc: 'Ekran üzerinde canlı çizim ve kesintisiz donanım yakınlaştırması.',
        },
        {
          name: 'Açıklama ve Adım Numaralandırma',
          replaced: 'Basit Çizim Uygulamaları',
          desc: 'Vektör oklar, sıralı adım rozetleri, metin ve sansürleme (blur).',
        },
        {
          name: 'Anında Ekran OCR',
          replaced: 'Ayrı OCR Araçları',
          desc: 'Kopyalanamayan metinleri anında panoya aktarma.',
        },
        {
          name: 'Ekran ve Ses Kaydı',
          replaced: 'Ağır Kayıt Yazılımları',
          desc: 'Mikrofon ve sistem sesi ile yüksek performanslı video kaydı.',
        },
        {
          name: 'Odaklanma ve Mola Zamanlayıcısı',
          replaced: 'Ayrı Zamanlayıcılar',
          desc: 'Göz dinlendirme ve Pomodoro için entegre zamanlayıcı.',
        },
      ],
      bannerTitle: 'Tek ve Birleşik Arka Plan Süreci',
      bannerDesc: '~40MB RAM kullanımı • Arka planda telemetri yok • Anında global kısayol bağlantısı',
      bannerBtn: 'Birleşik Uygulamayı İndir',
    },
    showcases: {
      capture: {
        tag: 'Piksel Hassasiyetinde Yakalama',
        title: 'Ekranınızdaki her şeyi milimetrik doğrulukla yakalayın',
        desc: 'Özel dikdörtgen bölgeleri, pencereleri veya tüm monitörleri seçin. Dahili büyüteç ve HEX/RGB renk okuyucu ile pikselleri tam hizalayın.',
        points: [
          'Tam ekran, serbest alan ve pencere yakalama',
          'Hassas koordinat ızgaralı canlı büyüteç',
          'PNG, JPEG, WebP, BMP formatları ve kalite ayarı',
          'Çoklu monitör ve yüksek DPI kalibrasyonu',
        ],
      },
      annotation: {
        tag: 'Görsel Anlatım',
        title: 'Fikirlerinizi anlaşılır çizim araçlarıyla aktarın',
        desc: 'Ekran görüntülerini net kılavuzlara dönüştürün. Oklar, sıralı adım numaraları, metin kutuları ve hassas bilgiler için sansürleme (blur) ekleyin.',
        points: [
          'Adım adım anlatımlar için otomatik numaralandırma (1, 2, 3...)',
          'Şifreler ve gizli veriler için pikselleştirme ve bulanıklaştırma',
          'Vektörel oklar, dikdörtgenler ve serbest çizim',
          'Görüntüyü diğer pencerelerin üstüne sabitleme (Pin)',
        ],
      },
      zoom: {
        tag: 'Canlı Sunum ve Zoom',
        title: 'Görüşmeler ve sunumlar sırasında ekrana canlı zoom yapın',
        desc: 'ZoomIt benzeri araçlardan esinlenen Shotera ile ekranın istediğiniz yerine anında yaklaşabilir ve canlı çizimler yapabilirsiniz.',
        points: [
          'Canlı etkileşimli yakınlaştırma (2×, 4×, 8×)',
          'Açık pencerelerin üzerine anlık çizim yapma',
          'Kasmayan akıcı fare imleci takibi',
          'Kısayollarla saniyeler içinde çalıştırma (Ctrl+1 ve Ctrl+4)',
        ],
      },
      record: {
        tag: 'Donanım Hızlandırmalı Video',
        title: 'Net ses kaydı ile akıcı ekran videoları çekin',
        desc: 'Eğitimler, hata bildirimleri ve sunumlar için minimum işlemci kullanımı ile yüksek kaliteli video kaydı yapın.',
        points: [
          'Tam ekranı veya belirli bir uygulama penceresini kaydetme',
          'Mikrofon ve sistem sesini senkronize kaydetme',
          'Sistem kaynaklarını tüketmeyen hafif mimari',
          'Standart MP4 formatında hızlı dışa aktarma',
        ],
      },
      ocr: {
        tag: 'Optik Karakter Tanıma (OCR)',
        title: 'Kopyalanamayan metinleri anında çekip alın',
        desc: 'Hata pencerelerindeki veya videolardaki metinleri kopyalamak için alanı seçin; Shotera anında metni panonuza kopyalasın.',
        points: [
          'Çok dilli optik metin tanıma',
          'Tek tıkla panoya kopyalama',
          'Korumalı PDF ve video karelerinde tam uyum',
          'Tam gizlilik için yerel işlem',
        ],
      },
      timer: {
        tag: 'Ergonomik Verimlilik',
        title: 'Mola zamanlayıcısı ile gözlerinizi ve odaklanmanızı koruyun',
        desc: 'Dahili Pomodoro ve göz dinlendirme zamanlayıcıları sayesinde çalışma ritminizi sağlıklı tutun.',
        points: [
          'Özelleştirilebilir odak süreleri (25 dk / 50 dk)',
          'Geri sayımlı tam ekran dinlenme bildirimi',
          'Kısayol ile anında açıp kapatma (Ctrl+3)',
          'Masaüstünüzü sade ve düzenli tutar',
        ],
      },
    },
    matrix: {
      eyebrow: 'Özellik Matrisi',
      title: 'Geliştiriciler, tasarımcılar ve eğitmenler için tasarlandı',
      subtitle: 'Her özellik, günlük iş akışınızdaki sürtünmeyi yok etmek için geliştirildi.',
    categories: [
  {
    id: 'capture',
    title: 'Yakala',
    items: [
      {
        title: 'Bölge ve Pencere Yakalama',
        description: 'Akıllı kenar algılama ve aktif pencere tespiti ile piksel hassasiyetinde seçim.'
      },
      {
        title: 'Tam Ekran ve Çoklu Monitör',
        description: 'Görüntü bozulması olmadan 4K ve farklı çözünürlüklü ekranlarda tek tuşla yakalama.'
      },
      {
        title: 'Çoklu Format Desteği',
        kayıp: 'Kayıpsız PNG, sıkıştırılmış JPEG, WebP veya BMP olarak doğrudan dışa aktarma.',
        description: 'Kayıpsız PNG, sıkıştırılmış JPEG, modern WebP veya BMP formatlarında dışa aktarma.'
      },
      {
        title: 'Kayıpsız Büyüteç ve HEX',
        description: 'Tasarımcılar için tam RGB ve HEX renk kodlarını gösteren gerçek zamanlı 8x büyüteç.'
      }
    ]
  },
  {
    id: 'explain',
    title: 'Açıkla',
    items: [
      {
        title: 'Adım Numaralandırma',
        description: 'İş akışlarını ve eğitimleri belgelemek için otomatik artan sıralı numaralar (1, 2, 3...).'
      },
      {
        title: 'Vektör Oklar ve Şekiller',
        description: 'Temiz geometrik çizgiler, içi dolu dikdörtgenler, elipsler ve kavisli işaret okları.'
      },
      {
        title: 'Güvenlik ve Sansürleme (Blur)',
        description: 'Şifreleri ve gizli verileri gizlemek için tahribatsız bulanıklaştırma (blur) ve pikselleştirme.'
      },
      {
        title: 'Temiz Metin Kutuları',
        description: 'Özelleştirilebilir font kalınlığı, arka plan ve gölgelere sahip yüksek kontrastlı metin kutuları.'
      }
    ]
  },
  {
    id: 'present',
    title: 'Sun',
    items: [
      {
        title: 'Donanımsal Ekran Yakınlaştırma',
        description: 'Canlı sunumlar sırasında sıfır CPU gecikmesi ile akıcı 2x - 8x ekran yakınlaştırması.'
      },
      {
        title: 'Canlı Ekran Çizimi',
        description: 'Doğrudan masaüstü uygulamalarının üzerinde serbest vektör çizgileri, oklar ve daireler çizin.'
      },
      {
        title: 'Etkileşimli Canlı Zoom',
        description: 'Yakınlaştırılmış ekranda çalışırken masaüstü uygulamalarını tıklanabilir ve etkileşimli tutun.'
      },
      {
        title: 'Ekrana Sabitleme (Pin)',
        description: 'Kod yazarken ekran görüntülerini sürekli üstte duran referans kartları olarak sabitleyin.'
      }
    ]
  },
  {
    id: 'record',
    title: 'Kaydet',
    items: [
      {
        title: 'Donanım Hızlandırma',
        description: 'Kesintisiz 60 FPS kayıt için donanım tabanlı video kodlama (NVENC / QuickSync / AMD AMF).'
      },
      {
        title: 'Hedef Pencere Kaydı',
        description: 'Görev çubuğunu veya arkaplandaki gizli verileri almadan sadece belirli bir pencereyi kaydedin.'
      },
      {
        title: 'Senkronize Ses Kaydı',
        description: 'Mikrofon sesini ve sistem sesini denge ayarlarıyla aynı anda sorunsuz kaydedin.'
      },
      {
        title: 'Hafif MP4 Formatı',
        description: 'Paylaşmaya hazır kompakt dosya boyutlarıyla evrensel H.264 MP4 formatına anında çıktı.'
      }
    ]
  },
  {
    id: 'smarter',
    title: 'Akıllı Çalış',
    items: [
      {
        title: 'Dahili Ekran OCR',
        description: 'Seçilemeyen arayüzlerden, PDF ve videolardan metinleri anında panoya kopyalayın.'
      },
      {
        title: 'Ergonomik Mola Zamanlayıcısı',
        description: 'Uzun seanslarda göz yorgunluğunu azaltmak için 20-20-20 molaları ve Pomodoro zamanlayıcıları.'
      },
      {
        title: 'Buluta Yükleme ve Anında Link',
        description: 'Ekran görüntülerini tek tıkla yükleyin ve anında paylaşılabilir bir bağlantı alın.'
      },
      {
        title: 'Sistem Tepsisi ve Otomatik Güncelleme',
        description: '~40MB RAM kullanımı ile arka planda sessizce çalışır; pürüzsüz otomatik güncelleme motoru.'
      }
    ]
  }
],
    },
    howItWorks: {
      eyebrow: 'İş Akışı',
      title: 'Üç basit adım',
      subtitle: 'Kısayola basmaktan sonucu elde etmeye kadar sadece iki saniye.',
      step1: {
        num: '01',
        title: 'Yakala',
        desc: 'Ctrl+Shift+S kısayoluna basın ve hedef bölgeyi veya pencereyi seçin.',
      },
      step2: {
        num: '02',
        title: 'Düzenle',
        desc: 'Oklar, adımlar ekleyin veya gizli bilgileri bulanıklaştırın.',
      },
      step3: {
        num: '03',
        title: 'Paylaş / Kaydet',
        desc: 'Panoya kopyalayın, dosya olarak kaydedin veya ekranda sabitleyin.',
      },
    },
    shortcuts: {
      eyebrow: 'Hız',
      title: 'Hızlı klavye kısayolları',
      subtitle: 'Ellerinizi klavyeden kaldırmadan her işlemi anında gerçekleştirin. Tüm tuşlar özelleştirilebilir.',
      customizableNote: 'Tüm kısayol kombinasyonları Ayarlar > Kısayollar menüsünden değiştirilebilir.',
      categories: {
        all: 'Tüm Kısayollar',
        capture: 'Yakalama',
        zoom: 'Zoom ve Canlı',
        record: 'Kayıt',
        timer: 'Zamanlayıcı',
      },
    },
    download: {
      eyebrow: 'Kurulum',
      title: "Windows için Shotera'yı İndirin",
      subtitle: 'Kurulum dosyasını veya taşınabilir (portable) arşivi indirin. Tamamen ücretsiz, kayıt gerektirmez.',
      windowsInstaller: 'Shotera Kurulum Paketi (.exe)',
      windowsInstallerDesc: 'Windows 10/11 için önerilir. Otomatik güncelleme desteği içerir.',
      windowsPortable: 'Taşınabilir Sürüm (.zip)',
      windowsPortableDesc: 'Kurulum gerektirmez. Arşivden çıkartıp doğrudan çalıştırın.',
      viewReleases: "GitHub'daki Tüm Sürümler",
      systemRequirements: 'Sistem Gereksinimleri',
      reqWindows: 'Windows 10 / Windows 11 (64-bit)',
      reqRam: '100 MB RAM (Çok Hafif)',
      reqStorage: '50 MB boş disk alanı',
      licenseTitle: 'Ücretsiz ve Açık Kaynak',
            licenseDesc: 'MIT lisansı ile sunulmaktadır. Sıfır casus yazılım, sıfır reklam.',
      recommended: 'Önerilen',
      downloadExeBtn: 'Shotera İndir (.exe)',
      downloadZipBtn: 'Taşınabilir İndir (.zip)',
      windowsInstallerFeatures: [
        'Windows 10 / 11 (64-bit Mimari)',
        'Otomatik arka plan güncellemeleri ve sistem tepsisi',
        'Anında global kısayol kaydı'
      ],
      windowsPortableFeatures: [
        'Kurulum veya kayıt defteri yazısı yok',
        'USB bellekten veya ağ klasöründen çalışır',
        'Bağımsız yapılandırma dosyası'
      ],
      bannerTitle: 'Tek ve Birleşik Arka Plan Süreci',
      bannerDesc: '~40MB RAM kullanımı • Arka planda telemetri yok • Anında global kısayol bağlantısı',
      bannerBtn: 'Birleşik Uygulamayı İndir',
    },
    github: {
      eyebrow: 'Açık Kaynak',
      title: 'Tamamen açık olarak geliştirildi',
      subtitle: "Shotera, GitHub üzerinde geliştirilen açık kaynaklı bir yazılımdır. Kodu inceleyin, hata bildirin veya katkıda bulunun.",
      viewRepo: "GitHub'da İncele",
      reportIssue: 'Hata Bildir',
      starsNote: 'Sahil Rzayev tarafından özenle geliştirilmiş masaüstü aracı.',
    },
    philosophy: {
      eyebrow: 'Felsefe',
      title: 'Sade araçlar. Hızlı iş akışları. Sıfır şişkinlik.',
      quote: '"Verimlilik yazılımı aradan çekilmeli ve işini milisaniyeler içinde yapmalıdır."',
      body: 'Shotera, arka planda çalışan 6 ayrı hantal uygulamanın yarattığı karmaşayı bitirmek için tasarlandı. Yerel performansa ve kullanıcı gizliliğine inanıyoruz.',
    },
    footer: {
      desc: 'Masaüstü ekran yakalama, donanım hızlandırmalı kayıt, canlı zoom ve çizim aracı.',
      product: 'Ürün',
      resources: 'Kaynaklar',
      openSource: 'Açık Kaynak',
      copyright: '© 2026 Shotera. MIT Lisansı ile açık kaynak.',
            builtFor: 'Sahil Rzayev tarafından geliştirildi. Üreticiler ve mühendisler için.',
      releaseNotes: 'Sürüm Notları',
      githubRepo: 'GitHub Deposu',
      issueTracker: 'Sorun İzleyici',
      languages: 'Diller',
    },
  },
  ru: {
    nav: {
      features: 'Возможности',
      howItWorks: 'Как это работает',
      shortcuts: 'Горячие клавиши',
      whyShotera: 'Почему Shotera',
      download: 'Скачать',
      github: 'GitHub',
      versionBadge: 'v1.4.0',
    },
    hero: {
      eyebrow: 'Нативное настольное приложение для скриншотов и записи',
      headline: 'Всё необходимое для захвата,',
      headlineHighlight: 'пояснения и записи экрана.',
      supporting:
        'Shotera объединяет быстрый захват скриншотов, живой зум экрана, аннотации, распознавание текста (OCR) и аппаратную запись видео в одном легковесном приложении.',
      downloadBtn: 'Скачать для Windows',
      githubBtn: 'Смотреть на GitHub',
      compatibility: 'Windows 10 & 11 • 64-бит • Бесплатно и с открытым кодом',
      trustPills: {
        openSource: '100% Открытый код (MIT)',
        privacy: 'Приватность • Без телеметрии',
        lightweight: 'Быстрое и легковесное приложение',
      },
    },
    whyShotera: {
      eyebrow: 'Консолидация',
      title: 'Хватит держать открытыми шесть разных утилит',
      subtitle:
        'Shotera объединяет все ключевые инструменты работы с экраном в едином фоновом приложении с глобальными горячими клавишами.',
      beforeTitle: 'Раньше: Разрозненные утилиты',
      afterTitle: 'С Shotera: Единое приложение',
      items: [
        {
          name: 'Захват области и экрана',
          replaced: 'Сторонние утилиты для скриншотов',
          desc: 'Пиксельная точность, лупа и мгновенный захват нескольких мониторов.',
        },
        {
          name: 'Живой зум и увеличение',
          replaced: 'Отдельные экранные лупы',
          desc: 'Плавное аппаратное увеличение с рисованием прямо по экрану.',
        },
        {
          name: 'Аннотации и нумерация шагов',
          replaced: 'Базовые графические редакторы',
          desc: 'Стрелки, авто-нумерация шагов (1, 2, 3), текст и размытие (blur).',
        },
        {
          name: 'Распознавание текста (OCR)',
          replaced: 'Отдельные OCR-сервисы',
          desc: 'Копирование некопируемого текста из окон, видео и изображений в буфер.',
        },
        {
          name: 'Запись экрана и звука',
          replaced: 'Тяжелые программы записи',
          desc: 'Аппаратная запись видео с микрофоном и системным звуком.',
        },
        {
          name: 'Таймер фокуса и отдыха',
          replaced: 'Сторонние таймеры',
          desc: 'Встроенный таймер для отдыха глаз и работы по Pomodoro.',
        },
      ],
      bannerTitle: 'Единый фоновый процесс',
      bannerDesc: '~40 МБ ОЗУ • Никакой фоновой телеметрии • Мгновенные глобальные горячие клавиши',
      bannerBtn: 'Скачать единое приложение',
    },
    showcases: {
      capture: {
        tag: 'Точный захват',
        title: 'Захватывайте любую область экрана с идеальной точностью',
        desc: 'Выделяйте прямоугольные области, активные окна или все мониторы. Используйте встроенную лупу с определением HEX/RGB для точного позиционирования.',
        points: [
          'Полный экран, произвольная область и захват окон',
          'Экранная лупа с координатной сеткой',
          'Форматы PNG, JPEG, WebP, BMP с настройкой сжатия',
          'Поддержка нескольких мониторов и High-DPI экранов',
        ],
      },
      annotation: {
        tag: 'Визуальные пояснения',
        title: 'Объясняйте сложные идеи за секунды с помощью четкой разметки',
        desc: 'Превращайте скриншоты в понятные инструкции. Добавляйте векторные стрелки, пошаговые номера, текст и скрывайте конфиденциальные данные размытием.',
        points: [
          'Авто-нумерация шагов (1, 2, 3...) для обучающих руководств',
          'Безопасное размытие паролей и персональных данных',
          'Стрелки, рамки, фигуры и свободное рисование',
          'Закрепление скриншота поверх всех окон (Pin)',
        ],
      },
      zoom: {
        tag: 'Презентации и Зум',
        title: 'Приближайте и рисуйте прямо на экране во время звонков',
        desc: 'Вдохновленная ZoomIt, Shotera позволяет плавно увеличивать любую часть экрана и делать заметки во время презентаций и демонстраций.',
        points: [
          'Интерактивное живое увеличение (2×, 4×, 8×)',
          'Рисование векторных линий поверх активных окон',
          'Плавное движение курсора без задержек',
          'Мгновенный вызов по Ctrl+1 и Ctrl+4',
        ],
      },
      record: {
        tag: 'Аппаратная запись видео',
        title: 'Записывайте плавное видео экрана с чистым звуком',
        desc: 'Записывайте демонстрации, баг-репорты и обучающие ролики с аппаратным ускорением и минимальной нагрузкой на процессор.',
        points: [
          'Запись всего экрана или отдельного окна программы',
          'Синхронная запись микрофона и системного аудио',
          'Легковесная архитектура без лишней нагрузки',
          'Быстрый экспорт в стандартный формат MP4',
        ],
      },
      ocr: {
        tag: 'Оптическое распознавание (OCR)',
        title: 'Извлекайте некопируемый текст прямо с экрана',
        desc: 'Нужно скопировать текст ошибки из модального окна или код из видео? Выделите область, и Shotera мгновенно скопирует текст в буфер.',
        points: [
          'Точное многоязычное распознавание текста',
          'Копирование в буфер обмена в один клик',
          'Работает с защищенными PDF и видеокадрами',
          'Полностью локальная обработка без отправки в сеть',
        ],
      },
      timer: {
        tag: 'Эргономика и фокус',
        title: 'Берегите зрение и держите фокус с таймером отдыха',
        desc: 'Встроенные интервалы отдыха (20-20-20) и Pomodoro помогут поддерживать продуктивность без сторонних приложений.',
        points: [
          'Настраиваемые интервалы работы (25 мин / 50 мин)',
          'Полноэкранное деликатное напоминание об отдыхе',
          'Быстрое включение по горячей клавише (Ctrl+3)',
          'Не перегружает рабочий стол лишними окнами',
        ],
      },
    },
    matrix: {
      eyebrow: 'Матрица возможностей',
      title: 'Создано для разработчиков, дизайнеров и преподавателей',
      subtitle: 'Каждая функция спроектирована для максимальной скорости работы.',
    categories: [
  {
    id: 'capture',
    title: 'Capture',
    items: [
      {
        title: 'Region & Window Snapping',
        description: 'Pixel-accurate crosshair with smart edge detection and active window outline detection.'
      },
      {
        title: 'Full-Screen & Multi-Monitor',
        description: 'Single-hotkey capture across 4K displays and mixed DPI setups without downscaling artifacts.'
      },
      {
        title: 'Multiple Image Formats',
        description: 'Direct output to lossless PNG, compressed JPEG, modern WebP, or uncompressed BMP.'
      },
      {
        title: 'Lossless Loupe & HEX Inspector',
        description: 'Real-time 8x zoom magnifier showing exact RGB and HEX color codes for UI developers.'
      }
    ]
  },
  {
    id: 'explain',
    title: 'Explain',
    items: [
      {
        title: 'Step Numbering Badges',
        description: 'Auto-incrementing numbered circles (1, 2, 3...) for documenting workflows and tutorials.'
      },
      {
        title: 'Vector Arrows & Shapes',
        description: 'Clean geometric lines, filled rectangles, ellipses, and curved pointer arrows.'
      },
      {
        title: 'Security Blur & Pixelation',
        description: 'Non-destructive Gaussian blur and pixelation brushes for hiding passwords, tokens, and PII.'
      },
      {
        title: 'Clean Typography Callouts',
        description: 'High-contrast text badges with customizable font weights, background pill, and shadows.'
      }
    ]
  },
  {
    id: 'present',
    title: 'Present',
    items: [
      {
        title: 'Hardware Screen Zoom',
        description: 'Fluid 2x to 8x screen magnification with zero CPU lag during live presentations.'
      },
      {
        title: 'Live Screen Drawing',
        description: 'Draw freehand vector lines, arrows, and circles directly on top of running desktop applications.'
      },
      {
        title: 'Interactive Live Zoom',
        description: 'Keep desktop apps clickable and interactive while working in a magnified viewport.'
      },
      {
        title: 'Screen Pinning (Always-on-Top)',
        description: 'Pin screenshot snippets anywhere on screen as floating reference cards while writing code.'
      }
    ]
  },
  {
    id: 'record',
    title: 'Record',
    items: [
      {
        title: 'Hardware Acceleration',
        description: 'Native GPU-backed video encoding (NVENC / QuickSync / AMD AMF) for seamless 60 FPS recording.'
      },
      {
        title: 'Targeted Window Capture',
        description: 'Record specific application windows without capturing confidential taskbar or background clutter.'
      },
      {
        title: 'Synchronized Audio Streams',
        description: 'Simultaneously capture studio microphone audio and internal PC audio with balance sliders.'
      },
      {
        title: 'Lightweight MP4 Packaging',
        description: 'Immediate export to widely supported H.264 MP4 with compact file sizes ready for sharing.'
      }
    ]
  },
  {
    id: 'smarter',
    title: 'Work Smarter',
    items: [
      {
        title: 'On-Device Screen OCR',
        description: 'Instantly extract text from unselectable UI dialogs, protected PDFs, and videos to clipboard.'
      },
      {
        title: 'Ergonomic Break & Focus Timer',
        description: 'Integrated 20-20-20 rest intervals and Pomodoro timers to reduce eye fatigue during long sessions.'
      },
      {
        title: 'Cloud Upload & Instant Link',
        description: 'Upload captures with one click and receive a clean shareable URL in your clipboard.'
      },
      {
        title: 'System Tray & Auto Updates',
        description: 'Runs silently in background with ~40MB RAM usage; automatic frictionless update engine.'
      }
    ]
  }
],
    },
    howItWorks: {
      eyebrow: 'Рабочий процесс',
      title: 'Три простых шага',
      subtitle: 'От нажатия горячей клавиши до готового результата менее чем за 2 секунды.',
      step1: {
        num: '01',
        title: 'Захват',
        desc: 'Нажмите Ctrl+Shift+S и выберите нужную область или окно с помощью лупы.',
      },
      step2: {
        num: '02',
        title: 'Разметка',
        desc: 'Добавьте стрелки, номера шагов или скройте приватные данные размытием.',
      },
      step3: {
        num: '03',
        title: 'Отправка',
        desc: 'Скопируйте в буфер, сохраните в файл или закрепите поверх окон.',
      },
    },
    shortcuts: {
      eyebrow: 'Скорость',
      title: 'Быстрые горячие клавиши',
      subtitle: 'Выполняйте любые действия не снимая рук с клавиатуры. Все комбинации настраиваются.',
      customizableNote: 'Все сочетания клавиш можно изменить в Настройки > Горячие клавиши.',
      categories: {
        all: 'Все клавиши',
        capture: 'Захват',
        zoom: 'Зум и Живой режим',
        record: 'Запись',
        timer: 'Таймер',
      },
    },
    download: {
      eyebrow: 'Установка',
      title: 'Скачать Shotera для Windows',
      subtitle: 'Загрузите установочный файл или портативный архив. Полностью бесплатно, без регистрации.',
      windowsInstaller: 'Установщик Shotera (.exe)',
      windowsInstallerDesc: 'Рекомендуется для Windows 10/11. Поддерживает автообновления.',
      windowsPortable: 'Портативная версия (.zip)',
      windowsPortableDesc: 'Не требует установки. Распакуйте и запускайте из любой папки.',
      viewReleases: 'Все релизы на GitHub',
      systemRequirements: 'Системные требования',
      reqWindows: 'Windows 10 / Windows 11 (64-бит)',
      reqRam: '100 МБ ОЗУ (Ультра-легковесный)',
      reqStorage: '50 МБ свободного места',
      licenseTitle: 'Бесплатно и с открытым кодом',
            licenseDesc: 'Выпущено под лицензией MIT. Без шпионских программ и рекламы.',
      recommended: 'Рекомендуется',
      downloadExeBtn: 'Скачать Shotera (.exe)',
      downloadZipBtn: 'Скачать Portable (.zip)',
      windowsInstallerFeatures: [
        'Windows 10 / 11 (64-битная архитектура)',
        'Автоматические обновления и системный трей',
        'Мгновенная регистрация глобальных горячих клавиш'
      ],
      windowsPortableFeatures: [
        'Без установки и записей в реестре',
        'Запускается с USB-накопителя или сетевой папки',
        'Автономный конфигурационный файл'
      ],
      bannerTitle: 'Единый фоновый процесс',
      bannerDesc: '~40 МБ ОЗУ • Никакой фоновой телеметрии • Мгновенные глобальные горячие клавиши',
      bannerBtn: 'Скачать единое приложение',
    },
    github: {
      eyebrow: 'Открытый код',
      title: 'Разработано открыто на GitHub',
      subtitle: 'Shotera — проект с открытым исходным кодом. Изучайте код, сообщайте об ошибках или вносите вклад.',
      viewRepo: 'Открыть репозиторий',
      reportIssue: 'Сообщить об ошибке',
      starsNote: 'Качественное настольное приложение от Sahil Rzayev.',
    },
    philosophy: {
      eyebrow: 'Философия',
      title: 'Простые инструменты. Быстрые процессы. Ноль лишнего.',
      quote: '"Программа для продуктивности должна мгновенно выполнять свою задачу и не отвлекать."',
      body: 'Shotera создана, чтобы избавить вас от шести тяжелых фоновых утилит. Мы верим в нативную скорость и полную конфиденциальность пользователей.',
    },
    footer: {
      desc: 'Быстрый захват экрана, аппаратная видеозапись, живой зум и разметка.',
      product: 'Продукт',
      resources: 'Ресурсы',
      openSource: 'Открытый код',
      copyright: '© 2026 Shotera. Лицензия MIT.',
            builtFor: 'Разработано Сахилем Рзаевым. Для создателей и инженеров.',
      releaseNotes: 'История версий',
      githubRepo: 'Репозиторий GitHub',
      issueTracker: 'Трекер задач',
      languages: 'Языки',
    },
  },
  de: {
    nav: {
      features: 'Funktionen',
      howItWorks: 'So funktioniert es',
      shortcuts: 'Tastenkürzel',
      whyShotera: 'Warum Shotera',
      download: 'Herunterladen',
      github: 'GitHub',
      versionBadge: 'v1.4.0',
    },
    hero: {
      eyebrow: 'Natives Desktop-Tool für Bildschirmaufnahme & Produktivität',
      headline: 'Alles, was Sie zum Erfassen,',
      headlineHighlight: 'Erklären und Aufnehmen benötigen.',
      supporting:
        'Shotera kombiniert blitzschnelle Screenshots, Live-Bildschirm-Zoom, präzise Anmerkungen, OCR-Texterkennung und hardwarebeschleunigte Bildschirmaufnahme in einer schlanken Desktop-App.',
      downloadBtn: 'Für Windows herunterladen',
      githubBtn: 'Auf GitHub ansehen',
      compatibility: 'Windows 10 & 11 • 64-Bit • Kostenlos & Open Source',
      trustPills: {
        openSource: '100% Open Source (MIT)',
        privacy: 'Datenschutz zuerst • Keine Telemetrie',
        lightweight: 'Schnelle & schlanke native App',
      },
    },
    whyShotera: {
      eyebrow: 'Konsolidierung',
      title: 'Schluss mit sechs verschiedenen Einzeltools',
      subtitle:
        'Shotera vereint die wichtigsten Bildschirmaufnahme-, Präsentations- und Aufnahmetools in einer einzigen Hintergrund-App mit globalen Hotkeys.',
      beforeTitle: 'Vorher: Fragmentierte Tools',
      afterTitle: 'Mit Shotera: Alles in einer App',
      items: [
        {
          name: 'Bereichs- & Bildschirmaufnahme',
          replaced: 'Externe Snipping-Tools',
          desc: 'Pixelgenaue Auswahl, Farblupe und Multimonitor-Unterstützung.',
        },
        {
          name: 'Live-Zoom & Bildschirmlupe',
          replaced: 'ZoomIt / Windows-Lupe',
          desc: 'Flüssiger Hardware-Zoom mit Live-Zeichenmodus auf dem Bildschirm.',
        },
        {
          name: 'Anmerkungen & Schritt-Nummerierung',
          replaced: 'Paint / Markup-Tools',
          desc: 'Vektorpfeile, auto-inkrementierende Schritt-Badges, Text und Zensur-Blur.',
        },
        {
          name: 'Sofortige OCR-Textextraktion',
          replaced: 'Separate OCR-Tools',
          desc: 'Nicht kopierbaren Text aus Bildern, Fenstern und Videos in die Zwischenablage kopieren.',
        },
        {
          name: 'Bildschirm- & Audioaufnahme',
          replaced: 'Schwere Aufnahmesoftware',
          desc: 'Hardwarebeschleunigte Videoaufnahme mit Mikrofon und Systemton.',
        },
        {
          name: 'Fokus- & Pausen-Timer',
          replaced: 'Zusätzliche Timer-Apps',
          desc: 'Integrierte Pomodoro- und Augenschonungs-Intervalle direkt auf dem Bildschirm.',
        },
      ],
      bannerTitle: 'Ein einheitlicher Hintergrundprozess',
      bannerDesc: '~40MB RAM-Bedarf • Keine Hintergrund-Telemetrie • Sofortige globale Hotkeys',
      bannerBtn: 'Einheitliche App herunterladen',
    },
    showcases: {
      capture: {
        tag: 'Pixelgenaue Erfassung',
        title: 'Erfassen Sie Bildschirminhalte mit chirurgischer Präzision',
        desc: 'Wählen Sie benutzerdefinierte Rechtecke, aktive Fenster oder ganze Bildschirme aus. Nutzen Sie die integrierte Lupe mit HEX/RGB-Farbanzeige für perfekte Ausrichtung.',
        points: [
          'Vollbild, freier Bereich und Fensteraufnahme',
          'Präzise Koordinatenlupe für feine Kanten',
          'Export in PNG, JPEG, WebP, BMP mit Qualitätseinstellungen',
          'Multi-Monitor und High-DPI Unterstützung',
        ],
      },
      annotation: {
        tag: 'Visuelle Kommunikation',
        title: 'Erklären Sie komplexe Sachverhalte in Sekundenschnelle',
        desc: 'Verwandeln Sie einfache Screenshots in verständliche Anleitungen. Fügen Sie Richtungspfeile, Schritt-Nummern, Textfelder und Verpixelungen hinzu.',
        points: [
          'Automatische Schrittnummern (1, 2, 3...) für Tutorials',
          'Sichere Weichzeichnung (Blur) für Passwörter und Tokens',
          'Vektorpfeile, Formen, Rahmen und Freihandzeichnen',
          'Screenshots als schwebende Overlays oben anheften (Pin)',
        ],
      },
      zoom: {
        tag: 'Live-Präsentation & Zoom',
        title: 'Vergrößern und zeichnen Sie live während Online-Meetings',
        desc: 'Inspiriert von ZoomIt ermöglicht Shotera nahtloses Heranzoomen und Live-Zeichnen auf aktiven Fenstern bei Vorträgen und Streams.',
        points: [
          'Interaktiver Live-Zoom (2×, 4×, 8× Vergrößerung)',
          'Direktes Zeichnen über aktive Programme',
          'Flüssige Mauszeigerverfolgung ohne Ruckeln',
          'Sofortige Hotkey-Aktivierung (Ctrl+1 & Ctrl+4)',
        ],
      },
      record: {
        tag: 'Hardwarebeschleunigte Aufnahme',
        title: 'Flüssige Bildschirmvideos mit klarem Ton aufnehmen',
        desc: 'Erstellen Sie Video-Anleitungen und Fehlerberichte mit nativer Hardwarebeschleunigung für minimale CPU-Belastung.',
        points: [
          'Ganzen Bildschirm oder einzelne Anwendungsfenster aufnehmen',
          'Synchrone Aufnahme von Mikrofon und Systemsound',
          'Geringer Speicherverbrauch ohne Hintergrundlast',
          'Schneller Export im MP4-Standardformat',
        ],
      },
      ocr: {
        tag: 'Optische Zeichenerkennung (OCR)',
        title: 'Extrahieren Sie nicht kopierbaren Text direkt vom Bildschirm',
        desc: 'Fehlermeldung in einem Dialogfeld oder Code im Video? Bereich markieren und Shotera kopiert den Text direkt formatiert in die Zwischenablage.',
        points: [
          'Präzise mehrsprachige Texterkennung',
          'Mit einem Klick in die Zwischenablage kopieren',
          'Funktioniert auf geschützten PDFs und Videobildern',
          'Vollständig lokale Verarbeitung für maximalen Datenschutz',
        ],
      },
      timer: {
        tag: 'Ergonomische Produktivität',
        title: 'Augenschonung und Fokus mit integrierten Intervallen',
        desc: 'Der integrierte Pausen- und Pomodoro-Timer erinnert an regelmäßige Bildschirmpausen, ohne zusätzliche Hintergrund-Apps zu benötigen.',
        points: [
          'Anpassbare Arbeitsintervalle (25 Min / 50 Min)',
          'Dezente Vollbild-Pausenerinnerung mit Countdown',
          'Schnellaktivierung über Hotkey (Ctrl+3)',
          'Hält Ihren Desktop aufgeräumt',
        ],
      },
    },
    matrix: {
      eyebrow: 'Funktionsübersicht',
      title: 'Entwickelt für Programmierer, Designer und Dozenten',
      subtitle: 'Jede Funktion wurde entwickelt, um Reibung in Ihrem täglichen Arbeitsablauf zu minimieren.',
    categories: [
  {
    id: 'capture',
    title: 'Capture',
    items: [
      {
        title: 'Region & Window Snapping',
        description: 'Pixel-accurate crosshair with smart edge detection and active window outline detection.'
      },
      {
        title: 'Full-Screen & Multi-Monitor',
        description: 'Single-hotkey capture across 4K displays and mixed DPI setups without downscaling artifacts.'
      },
      {
        title: 'Multiple Image Formats',
        description: 'Direct output to lossless PNG, compressed JPEG, modern WebP, or uncompressed BMP.'
      },
      {
        title: 'Lossless Loupe & HEX Inspector',
        description: 'Real-time 8x zoom magnifier showing exact RGB and HEX color codes for UI developers.'
      }
    ]
  },
  {
    id: 'explain',
    title: 'Explain',
    items: [
      {
        title: 'Step Numbering Badges',
        description: 'Auto-incrementing numbered circles (1, 2, 3...) for documenting workflows and tutorials.'
      },
      {
        title: 'Vector Arrows & Shapes',
        description: 'Clean geometric lines, filled rectangles, ellipses, and curved pointer arrows.'
      },
      {
        title: 'Security Blur & Pixelation',
        description: 'Non-destructive Gaussian blur and pixelation brushes for hiding passwords, tokens, and PII.'
      },
      {
        title: 'Clean Typography Callouts',
        description: 'High-contrast text badges with customizable font weights, background pill, and shadows.'
      }
    ]
  },
  {
    id: 'present',
    title: 'Present',
    items: [
      {
        title: 'Hardware Screen Zoom',
        description: 'Fluid 2x to 8x screen magnification with zero CPU lag during live presentations.'
      },
      {
        title: 'Live Screen Drawing',
        description: 'Draw freehand vector lines, arrows, and circles directly on top of running desktop applications.'
      },
      {
        title: 'Interactive Live Zoom',
        description: 'Keep desktop apps clickable and interactive while working in a magnified viewport.'
      },
      {
        title: 'Screen Pinning (Always-on-Top)',
        description: 'Pin screenshot snippets anywhere on screen as floating reference cards while writing code.'
      }
    ]
  },
  {
    id: 'record',
    title: 'Record',
    items: [
      {
        title: 'Hardware Acceleration',
        description: 'Native GPU-backed video encoding (NVENC / QuickSync / AMD AMF) for seamless 60 FPS recording.'
      },
      {
        title: 'Targeted Window Capture',
        description: 'Record specific application windows without capturing confidential taskbar or background clutter.'
      },
      {
        title: 'Synchronized Audio Streams',
        description: 'Simultaneously capture studio microphone audio and internal PC audio with balance sliders.'
      },
      {
        title: 'Lightweight MP4 Packaging',
        description: 'Immediate export to widely supported H.264 MP4 with compact file sizes ready for sharing.'
      }
    ]
  },
  {
    id: 'smarter',
    title: 'Work Smarter',
    items: [
      {
        title: 'On-Device Screen OCR',
        description: 'Instantly extract text from unselectable UI dialogs, protected PDFs, and videos to clipboard.'
      },
      {
        title: 'Ergonomic Break & Focus Timer',
        description: 'Integrated 20-20-20 rest intervals and Pomodoro timers to reduce eye fatigue during long sessions.'
      },
      {
        title: 'Cloud Upload & Instant Link',
        description: 'Upload captures with one click and receive a clean shareable URL in your clipboard.'
      },
      {
        title: 'System Tray & Auto Updates',
        description: 'Runs silently in background with ~40MB RAM usage; automatic frictionless update engine.'
      }
    ]
  }
],
    },
    howItWorks: {
      eyebrow: 'Workflow',
      title: 'In drei einfachen Schritten',
      subtitle: 'Vom Tastendruck bis zum fertigen Ergebnis in weniger als zwei Sekunden.',
      step1: {
        num: '01',
        title: 'Erfassen',
        desc: 'Drücken Sie Ctrl+Shift+S und wählen Sie den Bereich oder das Fenster mit der Lupe.',
      },
      step2: {
        num: '02',
        title: 'Bearbeiten',
        desc: 'Fügen Sie Pfeile und Schritte hinzu oder zensieren Sie sensible Daten mit Weichzeichner.',
      },
      step3: {
        num: '03',
        title: 'Teilen & Speichern',
        desc: 'In die Zwischenablage kopieren, als Datei sichern oder auf dem Bildschirm anheften.',
      },
    },
    shortcuts: {
      eyebrow: 'Effizienz',
      title: 'Optimiert für Tastenkürzel',
      subtitle: 'Führen Sie jede Aktion blitzschnell aus, ohne die Hand von der Tastatur zu nehmen. Alle Hotkeys sind frei konfigurierbar.',
      customizableNote: 'Alle Tastenkombinationen können unter Einstellungen > Tastenkürzel angepasst werden.',
      categories: {
        all: 'Alle Kürzel',
        capture: 'Aufnahme',
        zoom: 'Zoom & Live',
        record: 'Video',
        timer: 'Timer',
      },
    },
    download: {
      eyebrow: 'Installation',
      title: 'Shotera für Windows herunterladen',
      subtitle: 'Wählen Sie das Installationspaket oder das portable Archiv. Vollständig kostenlos, keine Registrierung.',
      windowsInstaller: 'Shotera Setup (.exe)',
      windowsInstallerDesc: 'Empfohlen für Windows 10/11. Beinhaltet automatische Updates.',
      windowsPortable: 'Portable Version (.zip)',
      windowsPortableDesc: 'Keine Installation erforderlich. Entpacken und direkt starten.',
      viewReleases: 'Alle Versionen auf GitHub ansehen',
      systemRequirements: 'Systemanforderungen',
      reqWindows: 'Windows 10 / Windows 11 (64-Bit)',
      reqRam: '100 MB RAM (Extrem ressourcenschonend)',
      reqStorage: '50 MB freier Festplattenspeicher',
      licenseTitle: 'Kostenlos & Open Source',
            licenseDesc: 'Veröffentlicht unter der MIT-Lizenz. Keine Spyware, keine Werbung.',
      recommended: 'Empfohlen',
      downloadExeBtn: 'Shotera Herunterladen (.exe)',
      downloadZipBtn: 'Portable Herunterladen (.zip)',
      windowsInstallerFeatures: [
        'Windows 10 / 11 (64-bit Architektur)',
        'Automatische Hintergrund-Updates & System-Tray',
        'Sofortige globale Hotkey-Registrierung'
      ],
      windowsPortableFeatures: [
        'Keine Installation oder Registry-Einträge',
        'Läuft vom USB-Stick oder Netzwerkordner',
        'Eigenständige Konfigurationsdatei'
      ],
      bannerTitle: 'Ein einheitlicher Hintergrundprozess',
      bannerDesc: '~40MB RAM-Bedarf • Keine Hintergrund-Telemetrie • Sofortige globale Hotkeys',
      bannerBtn: 'Einheitliche App herunterladen',
    },
    github: {
      eyebrow: 'Open Source',
      title: 'Vollständig transparent entwickelt',
      subtitle: 'Shotera ist Open-Source-Software auf GitHub. Quellcode einsehen, Feedback geben oder mitentwickeln.',
      viewRepo: 'Auf GitHub erkunden',
      reportIssue: 'Problem melden',
      starsNote: 'Sorgfältig entwickeltes Desktop-Tool von Sahil Rzayev.',
    },
    philosophy: {
      eyebrow: 'Philosophie',
      title: 'Einfache Werkzeuge. Schnelle Arbeitsabläufe. Kein Ballast.',
      quote: '"Produktivitätssoftware sollte unauffällig im Hintergrund bleiben und Aufgaben in Millisekunden erledigen."',
      body: 'Shotera wurde entwickelt, um das Chaos aus sechs verschiedenen trägen Hintergrund-Tools zu beenden. Wir stehen für native Desktop-Geschwindigkeit und absolute Privatsphäre.',
    },
    footer: {
      desc: 'Schnelle Bildschirmaufnahme, hardwarebeschleunigte Videoaufnahme, Live-Zoom und Markup-Tool.',
      product: 'Produkt',
      resources: 'Ressourcen',
      openSource: 'Open Source',
      copyright: '© 2026 Shotera. Open Source unter MIT-Lizenz.',
            builtFor: 'Entwickelt von Sahil Rzayev. Für Entwickler und Teams.',
      releaseNotes: 'Versionshinweise',
      githubRepo: 'GitHub Repository',
      issueTracker: 'Issue Tracker',
      languages: 'Sprachen',
    },
  },
};
