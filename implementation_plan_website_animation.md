# Hedef: Global Scroll-Driven Kayıt Çerçevesi (Viewfinder) Animasyonu

Kullanıcının seçimi doğrultusunda (Seçenek 2), web sitesi boyunca kaydırıldıkça (scroll) içerikleri takip eden, belirli özelliklerin üzerine gelince onları "kayıt altına alıyormuş" gibi odaklayan dinamik bir sarı kayıt çerçevesi (Viewfinder) eklenecektir.

## ⚠️ User Review Required
Bu yapısal bir değişiklik olduğu için aşağıdaki planı inceleyip onaylamanızı rica ediyorum. Onayınızdan sonra kodlamaya başlayacağım.

## 1. Mimari Yaklaşım
Responsive (mobil uyumlu) bir düzende sayfa yükseklikleri değiştiği için sabit piksel değerleri kullanmak sorun yaratır. Bu yüzden dinamik bir sistem kuracağız:
- **Target (Hedef) Elementler:** Vurgulanması istenen yerlere (Hero'daki uygulama ekranı, özellik kartları vs.) görünmez hedef `div`leri yerleştireceğiz.
- **Global Viewfinder Bileşeni:** Sayfada `fixed` (sabit) pozisyonda duran ve sayfanın neresinde olduğumuzu (Scroll Y) dinleyen tek bir çerçeve olacak.
- **Framer Motion `useScroll` ve `useTransform`:** Kaydırma yüzdesine göre bu global çerçevenin `x`, `y`, `width` ve `height` değerleri, sıradaki hedef elementin koordinatlarına doğru pürüzsüzce (interpolasyon ile) dönüştürülecek.

## 2. Geliştirme Adımları (Değişecek Dosyalar)

### `src/components/GlobalViewfinder.tsx` [YENİ]
- Sayfanın en üstünde, `fixed` pozisyonlu, sarı renkli ve dışı yarı saydam karanlık olan (tıpkı ana uygulamadaki gibi) çerçeveyi oluşturacak.
- `useScroll` ile sayfa kaydırmasını dinleyip koordinat hesaplamasını yapacak.

### `src/App.tsx` [DEĞİŞTİRİLECEK]
- `GlobalViewfinder` bileşenini en üst seviyeye ekleyecek.
- Tüm `main` içeriğini sarmalayarak hedef noktalarının (refs) hesaplanabilmesi için gerekli context veya prop yapısını kuracak.

### `src/components/Hero.tsx` & `ShoteraAppWindow.tsx` [DEĞİŞTİRİLECEK]
- Kaydırma başladığında `ShoteraAppWindow` içindeki yerel sarı çerçevenin gizlenip, global çerçevenin onun yerini pürüzsüzce alması sağlanacak.

### Diğer Bölümler (ConsolidationSection, FeatureShowcases vb.) [DEĞİŞTİRİLECEK]
- Bu bölümlerin içine, çerçevenin nereye konması gerektiğini belirten `id`'lere sahip (örneğin `id="viewfinder-target-1"`) hedef alanlar eklenecek.

## 3. Doğrulama Planı (Verification)
- Uygulama çalıştırılarak masaüstü ve mobil çözünürlüklerde kaydırma testi yapılacak.
- Çerçevenin (sarı kayıt alanının) ekranı kaydırdıkça bir hedef noktasından diğerine şekil (genişlik/yükseklik) değiştirerek akıcı bir şekilde gidip gitmediği kontrol edilecek.
- Framer-motion performans sorunu yaratıp yaratmadığı test edilecek.

Onaylıyorsanız, "Onaylıyorum" veya "Başla" demeniz yeterlidir!
