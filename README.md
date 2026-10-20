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

Bu bağımsız paket resmi `next build --webpack` ile derlendi. Migration, fiyat kararı SQL'i, durum geçişleri, roller, müşteri verisi ayrımı, çeviriler ve parola doğrulamasını kapsayan **19 test geçti**. Oturumlu bağımsız dağıtım için gerçek tarayıcı ve gelen kutusu kabul testi henüz yapılmadı.

Önceki barındırılan sürümde Neon üzerinden gerçek kayıt oluşturma, teklif hazırlama, onaysız tamiri engelleme ve özel fotoğraf yükleme/indirme doğrulandı. Bu sonuçlar yeni sunucunuzun bağlantılarının test edildiği anlamına gelmez.

E-posta ile müşteri onayı Resend API anahtarı ve doğrulanmış gönderici adresi gerektirir. Yapılandırma eksikse gönderim başarılı gösterilmez. E-postası olmayan müşteri durumunu takip edebilir; teklif kararından önce e-posta eklenmelidir.

Bu paket veritabanı yedeği değildir. Gerçek müşteri kayıtları, parolalar, bağlantı sırları ve API anahtarları ZIP'e eklenmemiştir. Mevcut Neon veritabanınıza bağlanırsanız oradaki kayıtları kullanır; yeni veritabanıyla başlarsanız boş açılır. `db:seed` yalnızca ayrı geliştirme veritabanı içindir.

İlk sürüm tek işletme içindir. Büyük veri için sunucuda sayfalama; parola unutma e-postası; otomatik medya temizleme; mobil OAuth/PKCE ve çok şube yapısı dahil değildir. Çalışan parolası yetkili CLI üzerinden sıfırlanır; sıfırlama o çalışanın bütün oturum/API anahtarlarını iptal eder.

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
