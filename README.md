# Shotera

Modern, hızlı ve şık tasarımlı bir ekran yakalama uygulaması. React, TypeScript ve Tauri (v2) kullanılarak geliştirilmiştir.

## 🚀 Kurulum ve Geliştirme

Projeyi yerel ortamınızda çalıştırmak için:
```bash
npm install
npm run tauri dev
```

## 📦 Kurulum Dosyası (.exe) Oluşturma (3 Farklı Yöntem)

Kendi bilgisayarınızda veya başka bilgisayarlarda çalıştırmak için kurulum dosyasını (Setup.exe) oluşturmanın 3 yolu vardır:

### Yöntem 1: Hazır Olan Dosyayı Kullanmak
Uygulama zaten bir kez derlendiyse, kurulum dosyası proje dizininde hazır bekliyor olabilir.
Dosyanın konumu:
📁 `src-tauri/target/release/bundle/nsis/Shotera_0.1.0_x64-setup.exe`
*(Bu dosyayı kopyalayıp başka bir bilgisayarda doğrudan çalıştırabilirsiniz.)*

### Yöntem 2: Gelecekte Kendiniz Manuel Üretmek İsterseniz (Lokal Build)
Eğer kodlarda bir değişiklik yapıp, GitHub ile uğraşmadan direkt kendi bilgisayarımda yeni bir `.exe` üreteyim derseniz, terminale (PowerShell) şu komutu yazmanız yeterlidir:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "signer-key" -Raw; npm run tauri build
```
*(Bu komut, oluşturduğumuz gizli anahtarı okur ve güncellemeler için imzalayarak uygulamanızı derler. İşlem bitince `.exe` dosyası yine `nsis` klasörüne düşer.)*

### Yöntem 3: GitHub Actions ile Otomatik Üretmek (Önerilen)
Siz kodunuzu GitHub'a yüklediğinizde, `.github/workflows/release.yml` dosyası sayesinde her şey otomatik gerçekleşir. (Bkz. Otomatik Güncelleme Sistemi)
Sadece şu komutları terminale girmeniz yeterlidir:
```bash
git tag v0.1.0
git push origin v0.1.0
```
Bunu yaptığınızda GitHub sunucuları 5-10 dakika içinde uygulamayı derleyecek, paketleyecek ve `.exe` dosyasını GitHub reponuzdaki **Releases** sayfasına koyacaktır.


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
