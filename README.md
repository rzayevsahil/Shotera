# Shotera

Modern, hızlı ve şık tasarımlı bir ekran yakalama uygulaması. React, TypeScript ve Tauri (v2) kullanılarak geliştirilmiştir.

## 🚀 Kurulum ve Geliştirme

Projeyi yerel ortamınızda çalıştırmak için:
```bash
npm install
npm run tauri dev
```

## 🔄 Otomatik Güncelleme Sistemi (GitHub Releases & Actions)

Uygulamanın yeni bir sürümünü yayınladığınızda, kullanıcılarınızın program içindeki **"Güncellemeleri Denetle"** butonuyla otomatik güncelleme almasını sağlamak için aşağıdaki adımları izleyin. Arka plandaki tüm derleme ve imzalama işlemleri `.github/workflows/release.yml` dosyasındaki GitHub Actions tarafından otomatik yapılacaktır.

### 1. GitHub Secrets Ayarı (Sadece Bir Kez Yapılır)
Uygulamanın güncellemeleri doğrulayabilmesi için imzalama anahtarınızın Private Key (gizli) kısmını GitHub'a eklemelisiniz:
1. Bilgisayarınızdaki proje ana dizininde bulunan **`signer-key`** (uzantısı olmayan) dosyasını metin editörüyle açın ve içindeki metni kopyalayın. *(Not: `.pub` uzantılı olan dosyayı DEĞİL, uzantısız olanı kopyalayacaksınız)*
2. Tarayıcınızda GitHub'daki reponuza gidin.
3. **Settings** (Ayarlar) > **Secrets and variables** > **Actions** menüsünü açın.
4. **"New repository secret"** butonuna tıklayın.
5. **Name** kısmına: `TAURI_SIGNING_PRIVATE_KEY` yazın.
6. **Secret** kısmına kopyaladığınız metni yapıştırın ve kaydedin.

### 2. Yeni Sürüm Yayınlama (Release Çıkmak)
Kodunuzda yeni özellikler eklediniz ve kullanıcılara dağıtmak istiyorsunuz. Şu 3 adımı uygulamanız yeterlidir:

**Adım 1: Sürüm Numarasını Yükseltin**
Aşağıdaki iki dosyada bulunan `"version"` numaralarını bir üst sürüme (örneğin `0.1.1`) çekin:
- `tauri.conf.json`
- `package.json`

**Adım 2: Kodları GitHub'a Pushlayın**
Yaptığınız değişiklikleri commit'leyip repoya gönderin:
```bash
git add .
git commit -m "feat: yeni ozellikler eklendi"
git push
```

**Adım 3: Sürüm Etiketi (Tag) Oluşturun ve Pushlayın (ÖNEMLİ)**
GitHub Actions'ın tetiklenmesi için bir `v` ile başlayan tag oluşturup göndermelisiniz:
```bash
git tag v0.1.1
git push origin v0.1.1
```

🎉 **Hepsi Bu Kadar!**
Bu adımları tamamladığınızda GitHub Actions otomatik olarak tetiklenir:
1. Uygulamayı derler ve kurulum `.exe` dosyasını oluşturur.
2. Özel anahtarınızla (`TAURI_SIGNING_PRIVATE_KEY`) güncellemeyi imzalar.
3. GitHub reponuzda "Draft" (Taslak) halinde yeni bir Release oluşturur ve içine kurulum dosyasını (`.exe`), `.zip` güncelleme paketini ve uygulamanın okuyacağı `latest.json` dosyasını otomatik yükler.

**Son Dokunuş:**
GitHub reponuzun **Releases** sayfasına gidin, oluşturulan taslak sürüme tıklayın. İsterseniz "Neler değişti?" kısmına güncelleme notlarınızı yazın ve **Publish** diyerek yayına alın. Artık uygulamanızı kullanan herkes, "Güncellemeleri Denetle" butonuna basarak yeni sürüme geçebilir!
