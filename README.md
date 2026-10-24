# UstaX — Bağımsız Web Sürümü

Bu paket kendi alan adınızda çalıştırmak için hazırlanmıştır. Next.js 16, React, TypeScript, Tailwind CSS, Drizzle ORM ve Neon PostgreSQL kullanır. Kendi sunucunuzda bağımsız çalışır. Türkçe, İngilizce ve Almanca arayüz ile açık/koyu tema dahildir.

Önce **KURULUM.md** dosyasını okuyun. API sözleşmesi `docs/API.md` içindedir.

## Neler dahil?

- Yönetici/teknisyen rolleri; sunucuda kontrol edilen yetkiler.
- E-posta ve parola girişi; scrypt ile tuzlanmış parola özeti; 8 saatlik HttpOnly oturum çerezi; üretimde Secure, SameSite=Lax. Oturum anahtarları veritabanında yalnızca hash olarak saklanır.
- Müşteri/cihaz kabulü, servis geçmişi, durum akışı, iç notlar ve işlem geçmişi.
- Sürümlü teklifler; onaysız tamiri engelleme; tek kullanımlık süreli kodla müşteri kararı.
- Tahmin edilemeyen takip bağlantıları; müşteriye açık veri izdüşümü.
- Özel Neon S3 uyumlu depolama veya authenticated Cloudinary fotoğrafları.
- Tamamlama/teslim kaydı, garanti açıklaması; Drizzle migration dosyaları ve geliştirme seed verileri.

## Doğrulama ve sınırlar

Bu bağımsız paket resmi `next build --webpack` ile derlendi. Migration, fiyat kararı SQL'i, durum geçişleri, roller, müşteri verisi ayrımı, çeviriler ve parola doğrulamasını kapsayan **28 otomatik test geçti**. Oturumlu bağımsız dağıtım için gerçek tarayıcı ve gelen kutusu kabul testi henüz yapılmadı.

Önceki barındırılan sürümde Neon üzerinden gerçek kayıt oluşturma, teklif hazırlama, onaysız tamiri engelleme ve özel fotoğraf yükleme/indirme doğrulandı. Bu sonuçlar yeni sunucunuzun bağlantılarının test edildiği anlamına gelmez.

E-posta ile müşteri onayı Resend API anahtarı ve doğrulanmış gönderici adresi gerektirir. Yapılandırma eksikse gönderim başarılı gösterilmez. E-postası olmayan müşteri durumunu takip edebilir; teklif kararından önce e-posta eklenmelidir.

Bu paket veritabanı yedeği değildir. Gerçek müşteri kayıtları, parolalar, bağlantı sırları ve API anahtarları ZIP'e eklenmemiştir. Mevcut Neon veritabanınıza bağlanırsanız oradaki kayıtları kullanır; yeni veritabanıyla başlarsanız boş açılır. `db:seed` yalnızca ayrı geliştirme veritabanı içindir.

İlk sürüm tek işletme içindir. Büyük veri için sunucuda sayfalama; parola unutma e-postası; otomatik medya temizleme; mobil OAuth/PKCE ve çok şube yapısı dahil değildir. Çalışan parolası yönetici panelinden veya yetkili CLI üzerinden sıfırlanır; sıfırlama o çalışanın bütün oturum/API anahtarlarını iptal eder.

## Komutlar

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

Üretim ortamında HTTPS kullanın. `DATABASE_URL` yalnızca sunucuda bulunmalı; `NEXT_PUBLIC_` ile başlayan değişkenlere gizli anahtar koymayın. Uygulama platformdan gelen kimlik başlıklarına güvenmez.

Veritabanı HTTP sürücüsü Neon içindir; yerel sıradan PostgreSQL sunucusuna geçmek için PostgreSQL sürücü adaptörü ayrıca değiştirilmelidir.

## Erişim türleri

Yönetici tüm servis kayıtlarını ve çalışan hesaplarını yönetir. Ekip ekranında başlangıç parolası, rol/aktiflik değişimi ve parola yenileme vardır. Teknisyen müşteri/cihaz kabulü ve servis sürecini yönetir; ekip ve API anahtar yönetimine erişemez. Bu kısıtlar sunucuda denetlenir. Müşteri kaydolmadan takip bağlantısını kullanır; yalnızca bağlantısına ait müşteriye açık kayıt verisi ve paylaşılmış fotoğraflar döndürülür.

Bu değişiklikler kaynak pakete uygulanmıştır. Mevcut Vercel dağıtımı bu kodla yeniden yayınlanmalıdır. Yeni migration gerekmiyor; önceki staff_credentials migration'ı uygulanmış olmalıdır.

## Servis detayı, fotoğraflar ve geçmiş

Servis detayı masaüstünde ve mobilde ekranın tamamını kaplar. Fotoğraf yükleme dosya başına 30 MB'a kadar girdi kabul eder; 3 MB üzerindeki desteklenen görseller tarayıcıda küçültülüp JPEG olarak gönderilir. Sunucunun gerçek dosya türü ve 8 MB dosya sınırı denetimi sürer. HEIC/HEIF yalnızca tarayıcı çözümleyebiliyorsa JPEG'e çevrilebilir; desteklenmeyen dosyada JPEG/PNG istenir. Yükleme ilerlemesi, boyut hataları ve bağlantı hataları gösterilir.

Yönetici İşlem geçmişi bölümündeki Adımı sil düğmesiyle bir adımı görünür geçmişten kaldırabilir. Orijinal adım veritabanında silinme tarihi ve çalışan kimliğiyle korunur; işlem ayrı denetim kaydına aynı SQL ifadesi içinde yazılır. Kayıt sürümü değişmişse işlem reddedilir. Müşteri görünümü kaldırılmış adımları göstermez. Silme, servis durumunu veya teklif kararını değiştirmez.

Canlı health uç noktasında depolama yapılandırması mevcut göründü; bu kontrol gerçek yükleme kabul testi değildir. Yeni kod Vercel'de yeniden yayınlanmalı ve mevcut özel kovanın yazma yetkisiyle yükleme denenmelidir.

## Yükleme ve kaydırma düzeltmesi

Sunucu S3 yüklemesini imzalı Request nesnesinin gövde akışıyla göndermek yerine, bilinen boyutlu Buffer ve açık Content-Length başlığıyla gönderir. Bu, aktarım kodlamasını desteklemeyen depolama uç noktalarındaki 501 NotImplemented hatasını hedefler. İmzalı URL ve içerik türü korunur; anahtarlar veya imzalı URL'ler günlüğe yazılmaz.

Kontroller: sabit uzunluk isteyen yerel HTTP sunucusunda eski akış 501, yeni gönderim 200 döndü. Gerçek özel Neon kovasında yeni gönderimle test dosyası yüklendi ve geri indirilen baytlar eşleşti. Bu depolama testi kısa süreli imzalı test URL'siyle yapıldı; kullanıcının yerel/Vercel anahtarları okunmadı veya değiştirilmedi.

Tarayıcıda 1280×720 ve 390×844 boyutlarında dört sekmede dikey kaydırma doğrulandı. Tek kaydırma sahibi dış detay penceresidir; sekme içeriğinde ikinci dikey kaydırma yoktur. Tarayıcıda 13.7 MB PNG, 2.8 MB JPEG isteğine küçültüldü; bu arayüz denemesinde API yanıtı test verisiyle sağlandı. 28 otomatik test ve üretim derlemesi geçti.
