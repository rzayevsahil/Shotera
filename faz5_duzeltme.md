Evet, şimdi sorunun tam olarak nerede olduğunu söyleyebilirim. **OBS'nin yaptığı şey senin şu an yaptığın sistemden biraz farklı.** Hatta önceki cevaplarımda bir noktayı fazla basitleştirmişim.

Gönderdiğin beyaz pencere aslında çok net bir kanıt:

> `http://localhost:1420 ile nelerin paylaşılacağını seç`

Bu **OBS'nin kullandığı native capture seçicisi değil**. Bu, Chromium/WebView tarafındaki `getDisplayMedia()` ekran paylaşım mekanizması.

## OBS neden kendi penceresinden seçebiliyor?

OBS'de iki ayrı şey var:

### 1. OBS'nin kendi arayüzü

OBS sana kendi Qt arayüzünde:

```text
Sources
 └── Display Capture
       └── Display 1
       └── Display 2
```

gibi seçenekler sunuyor.

Bu seçim **Chromium'a sorulmuyor**.

OBS işletim sistemindeki ekranları kendisi tespit ediyor ve hangi ekranın capture edileceğini kendisi belirliyor.

OBS'nin Windows tarafında Display Capture kaynakları için native Windows capture yöntemleri kullanılıyor. OBS'nin güncel dokümantasyonunda Windows Display Capture doğrudan monitör capture kaynağı olarak tanımlanıyor. ([OBS Project][1])

---

# 2. Asıl kayıt motoru

Seçimden sonra olay kabaca şöyle:

```text
        OBS UI
          │
          │ "Display 1 seçildi"
          ▼
   Native Windows Capture
          │
          ▼
      GPU Texture
          │
          ▼
      OBS Renderer
          │
          ▼
    Hardware Encoder
     ┌────┼─────┐
     │    │     │
   NVENC QSV   AMF
     │    │     │
     └────┼─────┘
          ▼
       H.264
          ▼
         MP4
```

Yani **frame'ler React/JavaScript'e gitmiyor.**

Bu çok önemli.

Microsoft'un DXGI Desktop Duplication API'sinde ekran görüntüsü DXGI surface olarak alınabiliyor ve GPU üzerinde işlenebiliyor. `AcquireNextFrame()` sana doğrudan desktop image surface'ini veriyor. ([Microsoft Learn][2])

---

# Senin Shotera'da şu anda olan

Senin mevcut sistem:

```text
Shotera React UI
      │
      ▼
getDisplayMedia()
      │
      ▼
❌ Chromium
      │
      ▼
❌ Windows/Chromium seçim penceresi
```

İşte **beyaz ekran buradan geliyor.**

Sen DXGI'ye geçsen bile eğer UI'dan önce hâlâ:

```text
getDisplayMedia()
```

çalıştırıyorsan, DXGI'ye geçmenin hiçbir anlamı yok.

Çünkü daha DXGI'ye ulaşmadan Chromium ekran seçimini yaptırıyor.

---

# Asıl istediğin şey şu

Sen aslında OBS'deki şu mimariyi istiyorsun:

```text
┌───────────────────────────────┐
│          SHOTERA              │
│                               │
│   Ekran Kaydı                 │
│                               │
│   ┌─────────┐ ┌─────────┐     │
│   │ Monitor │ │ Monitor │     │
│   │    1    │ │    2    │     │
│   └─────────┘ └─────────┘     │
│                               │
│       [ Kaydı Başlat ]        │
└───────────────────────────────┘
```

Kullanıcı burada **Shotera'nın kendi modalından** ekranı seçiyor.

Sonra:

```text
Shotera UI
    │
    │ monitor_id = 1
    ▼
Rust
    │
    ▼
Windows Native Capture
    │
    ▼
GPU
    │
    ▼
NVENC / QSV / AMF
    │
    ▼
MP4
```

**Chromium hiçbir aşamada ekran seçimi yapmıyor.**

İşte OBS'ye benzeyen mimari bu.

---

# Peki DXGI mi, Windows Graphics Capture mı?

Burada da önemli bir detay var.

OBS eskiden ağırlıklı olarak **DXGI Desktop Duplication** kullanıyordu. Fakat OBS'nin Windows tarafında **Windows Graphics Capture (WGC)** desteği de var; OBS geliştiricileri WGC'nin özellikle farklı GPU'lar arasında daha sorunsuz çalışması gibi avantajlarından bahsediyor. ([OBS Project][3])

DXGI Desktop Duplication ise gerçekten GPU surface üzerinden frame sağlar ve uygulama bu frame'leri GPU acceleration ile işleyebilir. ([Microsoft Learn][4])

Dolayısıyla bugün Shotera için benim tercih sıram:

### Windows için

**Windows Graphics Capture + D3D11 + hardware encoder**

ve gerektiğinde:

**DXGI Desktop Duplication fallback**

olurdu.

---

# Ama senin asıl problemin capture değil

Bence şu anda geliştiriciye bunu söylemen gerekiyor:

> **"DXGI'ye geçmek yetmedi. Ekran seçimi hâlâ getDisplayMedia üzerinden yapılıyor."**

Çünkü senin istediğin iki şey aslında birbirinden bağımsız:

### A) Ekranı nasıl seçiyoruz?

Şu anda:

```text
getDisplayMedia()
↓
Chromium picker ❌
```

İstediğimiz:

```text
Shotera UI
↓
Native monitor/window enumeration
↓
Kullanıcı Shotera içinde seçer
```

### B) Seçilen ekranı nasıl kaydediyoruz?

İstediğimiz:

```text
Native capture
↓
GPU texture
↓
D3D11
↓
NVENC/QSV/AMF
↓
H.264/H.265
↓
MP4
```

---

# Bir de "kendi penceresinde ekran görüntülerini göstermek" mümkün mü?

**Evet.**

Bu da OBS'nin yaptığı mantığa çok yakın.

Shotera Rust tarafında Windows'taki monitorleri enumerate edebilir:

```text
Monitor 1
1920 × 1080

Monitor 2
2560 × 1440
```

Bunların thumbnail'larını oluşturup Shotera UI'ına gösterebilirsin.

Kullanıcı:

> Monitor 2

seçtiğinde React sadece:

```text
monitorId = 2
```

gibi bir bilgi gönderir.

**Ekranın kendisini 60 FPS React'e göndermiyoruz.**

Sadece seçim için thumbnail/previews olabilir.

Kayıt başladığında ise tamamen native pipeline çalışır.

---

# Hatta daha da güzeli

Eğer Shotera'da ileride:

* 🖥️ Tüm ekran
* 🪟 Belirli pencere
* 🔲 Seçili alan
* 🖱️ Mouse cursor
* 🎙️ Mikrofon
* 🔊 Sistem sesi

eklemek istiyorsan yine aynı mimari üzerine kurulabilir.

Örneğin:

```text
Shotera
│
├── Screen Capture
│     ├── Monitor 1
│     └── Monitor 2
│
├── Window Capture
│     ├── Chrome
│     ├── VS Code
│     └── Discord
│
└── Region Capture
      └── Custom rectangle
```

Arka tarafta:

```text
              ScreenRecorder
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     Monitor      Window      Region
        │           │           │
        └───────────┼───────────┘
                    ▼
                 D3D11
                    ▼
              GPU Texture
                    ▼
          Hardware Encoder
                    ▼
                  MP4
```

Bu artık gerçekten **OBS/ShareX sınıfı native screen recorder mimarisi** olur.

---

## Dolayısıyla benim sana net önerim

Şu an geliştiricinin yaptığı:

> **DXGI capture eklemek**

tek başına yeterli değil.

Ona şunu yaptır:

> **`getDisplayMedia()` ve Chromium screen picker tamamen kaldırılmalı. Shotera kendi UI'ında monitor/window listesini göstermeli. Kullanıcı seçimini yaptıktan sonra seçilen HWND/HMONITOR/monitor bilgisi Rust'a aktarılmalı. Rust tarafında Windows Graphics Capture veya DXGI + D3D11 ile native capture yapılmalı. Frame'ler hiçbir şekilde React/JS/Canvas/Base64/IPC üzerinden taşınmamalı. Encoding mümkünse NVENC/QSV/AMF gibi hardware encoder ile native tarafta yapılmalı.**

**İşte OBS'deki mantığın Shotera'ya gerçek karşılığı bu.**

Ve evet: Senin ekran görüntüsündeki beyaz pencere **bu mimaride ortadan kalkar**, çünkü o pencereyi oluşturan `getDisplayMedia()` mekanizmasını artık hiç kullanmazsın.

Ayrıca 20 Mbps/60 FPS ayarlamak tek başına kaliteyi çözmez; **capture → GPU texture → encoder pipeline'ının gerçekten frame-drop yapmadan çalışması** gerekiyor. DXGI tarafı zaten GPU surface ve frame-by-frame erişim sağlıyor. ([Microsoft Learn][2]) Hardware encoder tarafında da OBS; NVENC, AMD AMF ve Intel QSV gibi encoder'ları destekliyor. ([OBS Project][5])

[1]: https://obsproject.com/kb/display-capture-sources?utm_source=chatgpt.com "Display Capture Sources | OBS"
[2]: https://learn.microsoft.com/en-us/windows/win32/direct3ddxgi/desktop-dup-api?utm_source=chatgpt.com "Desktop Duplication API - Win32 apps | Microsoft Learn"
[3]: https://obsproject.com/forum/threads/windows-graphics-capture-vs-dxgi-desktop-duplication.149320/?utm_source=chatgpt.com "Windows Graphics Capture vs DXGI Desktop Duplication | OBS Forums"
[4]: https://learn.microsoft.com/en-my/windows-hardware/drivers/display/desktop-duplication-api?utm_source=chatgpt.com "Desktop Duplication - Windows drivers | Microsoft Learn"
[5]: https://obsproject.com/kb/hardware-encoding?utm_source=chatgpt.com "Hardware Encoding | OBS"