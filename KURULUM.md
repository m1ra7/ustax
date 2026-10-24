# UstaX kurulum rehberi

## 1. Gereksinimler

- Node.js **22.13 veya üzeri**.
- pnpm **11.25.0** (`npm install -g pnpm@11.25.0`).
- Neon PostgreSQL bağlantısı.
- Fotoğraf için özel Neon Object Storage kovası veya Cloudinary.
- Müşteri onay kodları için Resend ve doğrulanmış gönderici alan adı.

Bu uygulama backend içerir. Yalnızca HTML dosyası yüklenen statik hosting yeterli değildir. Next.js/Node.js destekli barındırma veya kendi Node.js sunucunuz gerekir.

## 2. Yerelde açma

ZIP'i çıkarın, terminalde `UstaX` klasörüne girin:

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
```

`.env.local` dosyasını düzenleyin:

| Değişken | Değer |
|---|---|
| `DATABASE_URL` | Neon Connect ekranından pooled bağlantı |
| `DIRECT_DATABASE_URL` | Aynı veritabanının pooler kapalı doğrudan bağlantısı; migration için |
| `APP_URL` | Yerelde `http://localhost:3000`; yayında kendi HTTPS adresiniz; sonunda `/` olmadan |
| `AWS_ENDPOINT_URL_S3` | Neon Storage ekranındaki S3 endpoint |
| `AWS_REGION` | Kovanın bölgesi |
| `AWS_ACCESS_KEY_ID` | Storage erişim anahtarı |
| `AWS_SECRET_ACCESS_KEY` | Storage gizli anahtarı |
| `S3_BUCKET` | Özel kovanın adı; mevcut proje için `repair-photos` |
| `RESEND_API_KEY` | Resend gönderim anahtarı |
| `EMAIL_FROM` | Doğrulanmış gönderici, ör. `UstaX <servis@alanadiniz.com>` |

S3 yerine Cloudinary kullanacaksanız üç `CLOUDINARY_*` değişkenini doldurun; S3 alanlarını boş bırakın. Sağlayıcı anahtarlarını kullanıcı arayüzüne veya GitHub'a koymayın. Neon sırlarını Neon hesabınızdaki Connect/Storage ekranlarından alın; ZIP içinde bulunmaz.

### Yeni veritabanında ilk kurulum

`.env.local` dosyasına geçici olarak `ADMIN_EMAIL`, `ADMIN_NAME` ve en az 12 karakterlik `ADMIN_PASSWORD` girin. Varsayılan parola yoktur.

```bash
node --env-file=.env.local --import tsx scripts/migrate.ts
node --env-file=.env.local --import tsx scripts/admin.ts
```

Yönetici oluşturulduktan sonra `ADMIN_PASSWORD` satırını kaldırın. Yönetici oluşturma komutu mevcut hesabın üzerine yazmaz; yinelenen e-postada hata verir.

### Önceden oluşturulan UstaX Neon veritabanını kullanıyorsanız

Yeni migration'ı uygulayın. Daha önceki yönetici hesabı için bağımsız giriş parolasını tanımlayın. `.env.local` dosyasına geçici olarak `STAFF_EMAIL` (mevcut yönetici e-postası) ve en az 12 karakterlik `STAFF_PASSWORD` ekleyin:

```bash
node --env-file=.env.local --import tsx scripts/migrate.ts
node --env-file=.env.local --import tsx scripts/password.ts
```

Sonra `STAFF_PASSWORD` satırını kaldırın. Bu işlem mevcut kayıtları silmez; ilgili çalışanın eski oturumlarını ve mobil API anahtarlarını iptal eder. Mevcut çalışan `active=false` ise önce yetkili yönetici tarafından etkinleştirilmelidir.

### Başlatma

```bash
pnpm dev
```

`http://localhost:3000/yonetim/giris` adresini açın. Oluşturduğunuz e-posta ve parolayla giriş yapın. Müşteriler `/takip/<gizli-anahtar>` sayfasını üyelik açmadan kullanır. Takip bağlantısı oluşturulduğunda kopyalayın; veritabanında yalnızca hash tutulduğu için eski bağlantının kendisi geri okunamaz. Yönetici gerektiğinde bağlantıyı yenileyebilir.

Yeni teknisyeni Ekip ve yetkiler ekranında en az 12 karakterlik başlangıç parolasıyla oluşturun. Mevcut çalışanın parolasını kartındaki Parola belirle alanından yenileyebilirsiniz. Parola, rol veya erişim değişikliğinde ilgili çalışanın eski oturumları iptal edilir. `scripts/password.ts` komutu acil durum terminal yöntemi olarak kullanılabilir. Kamuya açık kayıt veya parola sıfırlama uç noktası yoktur.

## 3. Kendi sunucunuzda yayınlama

Sunucuya kaynak kodu taşıyın. Sırları sunucunun ortam değişkenlerine ekleyin veya sadece sunucuda okunabilen `.env.local` dosyasında saklayın. `APP_URL=https://kendi-alanadiniz.com` olarak ayarlayın.

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Uygulama varsayılan olarak 3000 portunda açılır. Alan adını HTTPS reverse proxy üzerinden bu porta yönlendirin. Node işlemini kendi süreç yöneticinizle sürekli çalıştırın. Üretimde oturum çerezi `Secure` olduğundan HTTP üzerinden çalışan girişi kullanılamaz; HTTPS gerekir.

Reverse proxy kullanıcıdan gelen `x-real-ip`/`cf-connecting-ip` başlıklarını temizleyip doğru istemci IP'sini kendisi iletmelidir. Aksi takdirde istek sınırlaması farklı kullanıcıları aynı grupta değerlendirebilir veya atlatılabilir.

Next.js destekli bir dağıtım platformunda framework `Next.js`, build `pnpm build`, kurulum `pnpm install --frozen-lockfile` olarak seçilebilir. Migration ve ilk yönetici komutlarını kontrollü terminal/CI ortamında bir kez çalıştırın; her build'de otomatik yönetici oluşturmayın.

## 4. Yayından önce kabul kontrolü

1. Yönetici giriş/çıkışını, yanlış parola reddini ve teknisyen yetkilerini kontrol edin.
2. Bir kurgu servis oluşturup sayfayı yenileyin; kaydın kalıcı kaldığını görün.
3. İç not yazın; takip sayfasında görünmediğini doğrulayın.
4. Fotoğraf yükleyin; özel fotoğrafın müşteri görünümünde çıkmadığını kontrol edin.
5. Teklif gönderin; kayıtlı gerçek e-postaya kod geldiğini doğrulayın. Onaysız tamir geçişi reddedilmeli.
6. Kodla onay verip tamir, teslime hazır ve teslim edildi akışını tamamlayın.
7. Fiyatı değiştirince yeni sürüm ve yeni onay gerektiğini kontrol edin.

## 5. Testler, örnek veri ve API

```bash
pnpm test
pnpm typecheck
```

Yalnızca ayrı geliştirme veritabanında örnek kayıt oluşturmak için `.env.local` dosyasında `ALLOW_DEVELOPMENT_SEED=yes` tanımlayın ve `node --env-file=.env.local --import tsx scripts/seed.ts` çalıştırın. Canlı müşteri veritabanında seed çalıştırmayın.

`docs/API.md` uç noktaları açıklar. Gelecekteki SwiftUI istemcisi aynı `/api/v1` API'sini yönetici tarafından verilen süreli Bearer anahtarıyla kullanabilir. API anahtarlarını Keychain'de saklayın.

## Eski kayıtların takip bağlantısı ve QR kodu

Güvenli anahtarın kendisi veritabanında saklanmaz. Sayfa yenilendiğinde önceki bağlantı bu oturumda bulunmayabilir. Yönetici kayıt detayındaki Takip bağlantısı veya QR kod düğmesine basınca eski bağlantının iptal edileceğine dair onay görür. Onaydan sonra yeni bağlantı oluşturulur ve istenen kopyalama/QR işlemi bu yeni bağlantıyla yapılır. Bağlantı ayrıca seçilip kopyalanabilen bir alanda gösterilir. Aynı oturumda mevcut bağlantı varsa düğmeler yeni bağlantı üretmeden onu kullanır. Teknisyenler bağlantıyı yenileyemez.

## 501 NotImplemented yükleme hatasından sonra

Güncel paketteki kaynakları birlikte kullanın. Yerelde eski Node işlemini Ctrl+C ile kapatıp `pnpm dev` ile yeniden açın. Vercel'de güncel kaynağı yeniden dağıtın. Bu düzeltme için yeni veritabanı migration'ı veya yeni depolama anahtarı gerekmez. Uygulama eski bir terminalden çalışıyorsa yalnızca tarayıcıyı yenilemek sunucu kodunu güncellemez.

501 yerine erişim reddi veya kova bulunamadı açıklaması gelirse mevcut ortam değişkenlerini kontrol edin; sırları paylaşmayın.
