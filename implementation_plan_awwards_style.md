# Awwwards Stili Modern Web Tasarım Analizi ve Uygulama Planı

Sitenin şu anki "dümdüz" dikey akışını kırmak ve **Awwwards** ödüllü sitelerdeki o "premium" hissiyatı yakalamak için harika bir noktaya değindiniz. Modern web tasarım trendlerinde dümdüz aşağı kayan sayfalar yerine, kullanıcıyı şaşırtan dinamik eksenler ve cesur tipografi tercih ediliyor.

Yaptığım araştırmalara ve güncel "Awwwards / CSSDesignAwards" trendlerine göre kullanabileceğimiz yaklaşımları aşağıda özetledim:

## 1. Araştırma ve Trend Raporu

### A. Tipografi (Yazı Tipleri)
Ödüllü sitelerde genellikle sıradan sistem fontları (Roboto, Arial) yerine, karakteri olan, geometrik veya "Grotesk" yapıdaki fontlar kullanılır.
- **Başlıklar için (Display Fonts):** `Clash Display`, `Syne`, `Space Grotesk` veya `Outfit` gibi okunaklı ama iddialı, köşeli/geniş karakterlere sahip fontlar çok popülerdir.
- **Gövde Metinleri için:** `Inter` veya Vercel'in yeni fontu `Geist` gibi aşırı temiz fontlar kullanılarak başlıklarla yüksek bir kontrast yaratılır.
- **Tipografi Animasyonları:** Başlıklar ekrana girerken bütün olarak değil, satır satır veya kelime kelime (Staggered Text Reveal) kayarak belirir.

### B. Scroll Animasyonları (Kaydırma Efektleri)
- **Horizontal Scroll (Yatay Kaydırma):** Kullanıcı faresinin tekerleğini *aşağı* doğru çevirse bile, sayfanın belirli bir bölümünde ekran sabitlenir (Sticky) ve içerikler sağdan sola doğru akar. Bu özellikle kart dizilimleri veya "Nasıl Çalışır" adımları için inanılmaz bir akıcılık sağlar.
- **Paralaks (Parallax) Geçişler:** Görsellerin ve metinlerin birbirinden farklı hızlarda yukarı/aşağı kayması.
- **Scale (Büyüme/Küçülme) Efektleri:** Bir bölüme girerken resimlerin veya kartların %80 boyutundan %100'e pürüzsüzce büyümesi.

---

## 2. Shotera İçin Önerilen Değişiklikler (Uygulama Planı)

Sitenizi daha "şov" (premium) odaklı bir yapıya kavuşturmak için şu adımları uygulamayı teklif ediyorum:

### Adım 1: Premium Tipografi Entegrasyonu
- Ana başlıklar (H1, H2) için **Clash Display** veya **Outfit** fontunu projeye eklemek.
- Tüm sayfalardaki başlıkları bu yeni fontla daha büyük (oversized) ve daha keskin bir hale getirmek.
- Alt başlıklar ve uzun metinler için mevcut temiz sans-serif yapısını korumak.

### Adım 2: Yatay Kaydırma (Horizontal Scroll) Bölümü Eklemek
- **Nasıl Çalışır (How it Works)** veya **Özellik Matrisi (Feature Grid)** bölümünü dikey tasarımdan çıkarıp **Yatay Kaydırmalı (Horizontal Scroll)** bir alana çevirmek.
- Kullanıcı bu bölüme geldiğinde ekran kilitlenecek ve fareyi aşağı kaydırdıkça kartlar sağdan sola doğru (Framer Motion `useScroll` ve `useTransform` kullanılarak) şık bir şekilde geçecek.

### Adım 3: Yumuşak Ekrana Giriş (Reveal) Efektleri
- Her bölümün (Hero, Showcases, Downloads) ekrana girerken aşağıdan yukarıya yumuşak bir saydamlık (Fade-up) ile gelmesini sağlamak.

---

> [!IMPORTANT]
> **Kullanıcı İncelemesi Bekleniyor (User Review Required)**
>
> 1. **Font Seçimi:** Başlıklar için keskin ve modern bir hava katan **Clash Display** fontunu mu yoksa daha yuvarlak ve teknolojik duran **Outfit** fontunu mu tercih edersiniz? (Benim önerim uygulamanın teknik doğasından dolayı *Clash Display* veya *Space Grotesk*).
> 2. **Yatay Kaydırma Hangi Bölüme Uygulansın?** Bu yatay (horizontal) scroll etkisini **"Nasıl Çalışır" (1-2-3 adımları)** bölümünde mi uygulayalım yoksa devasa **"Kısayollar" (Shortcuts Grid)** veya **"Özellik Matrisi"** kartlarında mı deneyelim? (Önerim: Özellik Matrisi veya Nasıl Çalışır adımlarında uygulamak görsel bir şölen yaratacaktır).

Lütfen planı onaylayın veya yukarıdaki 2 soru için tercihlerinizi belirtin. Sonrasında kodlamaya hemen başlayacağım!
