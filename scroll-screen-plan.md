Shotera'ya profesyonel bir "Scrolling Screenshot" özelliği ekle.

Amaç:
Kullanıcı ekranda bir bölge seçsin ve Shotiara o bölgenin scroll edilebilen tüm içeriğini otomatik olarak aşağı doğru kaydırıp tek ve uzun bir PNG/JPEG görüntü olarak birleştirsin.

Temel çalışma mantığı:

1. Kullanıcı "Scrolling Screenshot" hotkey'ine bassın.
2. Ekranda normal region selection UI açılsın.
3. Kullanıcı scroll edilecek alanı seçsin.
4. Seçilen alanın ilk screenshot'ını al.
5. Hedef alanın scroll edilebilir olup olmadığını kontrol et.
6. İçeriği aşağı doğru scroll et.
7. Scroll sonrasında yeni screenshot al.
8. Önceki screenshot ile yeni screenshot arasındaki ortak görüntüyü (overlap) image matching / pixel similarity yöntemiyle tespit et.
9. Ortak bölümü tekrar ekleme; yalnızca yeni görünen kısmı final görüntünün altına ekle.
10. Scroll işlemini tekrar et.
11. Scroll artık ilerlemiyorsa veya yeni görüntü önceki görüntüyle tamamen aynı hale geliyorsa işlemi sonlandır.
12. Tüm parçaları tek bir uzun görüntü halinde oluştur.
13. Sonuç normal Shotiara screenshot workflow'una gönderilsin:

* Preview
* Edit/Annotate
* OCR
* Copy to Clipboard
* Save as PNG/JPEG
* Save path
  seçenekleri mevcut olsun.

Scrolling engine için birden fazla yöntem destekle:

Preferred:

1. UI Automation / ScrollPattern
2. Mouse wheel simulation
3. Page Down fallback

Kullanıcı ayarlarında:

* Scroll method: Auto / Mouse Wheel / Page Down / UI Automation
* Scroll delay: örn. 100–1000 ms
* Scroll amount
* Overlap sensitivity
* Maximum scroll count
* Stop when no movement detected

Image stitching algoritması:

* Fixed pixel overlap kullanmak yerine görüntü tabanlı overlap detection tercih et.
* Yeni frame ile önceki frame arasında ortak bölgeleri tespit et.
* Ortak bölgeyi final görüntüde yalnızca bir kez tut.
* Küçük pixel/rendering farklılıklarına tolerans göster.
* Anti-aliasing, font rendering ve küçük animasyonlar stitching'i bozmasın.
* Gerekirse grayscale/downscaled görüntü üzerinden matching yaparak performansı artır.
* Final görüntü oluşturulurken mümkün olduğunca orijinal çözünürlüğü koru.

Edge cases:

* Sticky/fixed header varsa tekrar tekrar görüntüye eklenmesini engelle.
* Scroll sırasında smooth animation devam ediyorsa screenshot almadan önce delay uygula.
* Lazy-loaded içerik için configurable delay kullan.
* Infinite scrolling sayfalarda maximum scroll count zorunlu olsun.
* Scroll artık ilerlemiyorsa otomatik dur.
* Aynı frame birkaç kez tekrar gelirse otomatik dur.
* Çok uzun görüntülerde memory kullanımını kontrol et.
* Horizontal scrolling de desteklenebilecek şekilde mimariyi tasarla.
* DPI scaling / multi-monitor koordinatlarını doğru ele al.
* Selection area dışında kalan ekran içeriğini final görüntüye dahil etme.

UX:
Scrolling Screenshot başlatıldığında küçük ve sade bir floating status indicator göster:

"Scrolling... 3 / ?"

veya

"Scrolling Screenshot
Scroll 4"

Kullanıcı ESC'ye basarsa işlem iptal edilsin.

İşlem tamamlandığında:

"Scrolling Screenshot completed"

ve final görüntü Shotiara'nın mevcut screenshot editor'üne açılsın.

Önemli:
Bu özellik sadece web sayfaları için tasarlanmasın. Chrome/Edge, PDF viewer, VS Code, File Explorer, uzun listeler ve mümkün olduğu kadar diğer Windows uygulamalarında çalışabilecek genel bir scrolling capture sistemi tasarla.

Kod mimarisinde scrolling, screenshot capture, image matching ve stitching bileşenlerini birbirinden ayır. Daha sonra farklı scroll engine veya matching algorithm eklenebilecek şekilde interface/strategy pattern kullan.

İlk implementasyonda önce Windows + Chrome/Edge + PDF + VS Code üzerinde stabil çalışan MVP oluştur. Daha sonra diğer uygulamalar için fallback'leri geliştir.