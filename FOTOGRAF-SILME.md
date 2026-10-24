# Web arayüzü ve iOS 404 kontrolü

Webde Servis detayı > Fotoğraflar bölümünde her fotoğrafın altında Fotoğrafı sil düğmesi vardır. Onay iptal edilirse istek gönderilmez. Hata olursa fotoğraf listede kalır; başarıda liste ve boş ekran güncellenir. Silme sürerken düğmeler ve görünürlük seçeneği devre dışıdır.

## Yayınlama

ZIP'i indirmek veya iOS projesini derlemek Vercel backend'ini güncellemez. Web paketini mevcut Git deponuza uygulayıp commit/push yapın; .env.local ve mevcut .git klasörünüzü koruyun. Örneğin web proje klasöründe:

```bash
git add app lib scripts package.json pnpm-lock.yaml

git commit -m "Add web and iOS photo deletion"
git push
```

Vercel'de bu yeni commit'in Ready olmasını bekleyin. Eski commit için Redeploy yapmak yeni kaynak kodunu eklemez. Next.js proje kökü bu paketin package.json dosyasının olduğu klasör olmalıdır.

Sunucu adresinizin sonuna `/api/v1/health` ekleyerek açın. Güncel yanıtta `features: {photoDelete: true}` ve `release: "quotes-delete-v1"` görünür. Görünmüyorsa bu sürüm o adreste yayında değildir. iOS'un Sunucu adresi bu yayının kök HTTPS adresi olmalıdır; sonuna `/api/v1` eklemeyin.

`DELETE /api/v1/records/{recordId}/photos/{photoId}` iOS ve web tarafından ortak kullanılır. Güncel handler bu adresi destekler ve DELETE metodu dışa aktarılmıştır. `Uç nokta bulunamadı / Endpunkt nicht gefunden` mesajı yayımdaki sürümün bu handler'a ulaşmadığını gösterir; yerel dosyanın güncel olması yayındaki dosyanın güncel olduğunu kanıtlamaz. Bu paket iOS kaynak kodunda yeni değişiklik gerektirmez.

# Fotoğraf silme ve kart boşlukları

## Kurulum

Önce bu sürümün UstaX-Web.zip içeriğini web projenize uygulayıp Vercel'e yayınlayın. iOS'un Sunucu adresi güncel web yayınıyla aynı olmalıdır. Yeni endpoint eski backend'de olmadığı için yalnızca iOS'u güncellemek silme özelliğini çalıştırmaz. Ek veritabanı migration gerekmiyor; silme temizleme kuyruğu servis JSONB verisinde tutuluyor.

Ardından iOS ZIP'ini yeni klasöre çıkarın. UstaX.xcodeproj dosyasını Xcode 14.2 ile açın, Team ayarınızı seçin ve Command+R ile çalıştırın.

## Kullanım

Servis detayı > Fotoğraflar bölümünde her fotoğrafın altında Fotoğrafı sil düğmesi vardır. Dokunup silmeyi onaylayın. Sunucu başarılı yanıt verince fotoğraf listeden ve müşteri takibinden kaldırılır; uygulamanın fotoğraf önbelleği temizlenir. Hata olursa fotoğraf istemcide önceden gizlenmez ve anlaşılır mesaj gösterilir. Yönetici ve teknisyen yapabilir; müşteriler için silme endpoint'i açık değildir.

Fotoğraf kartları ve teklif geçmişindeki teklif kartları 16 piksel iç boşluk ve üst/alt 8'er piksel dış boşluk kullanır. Teklif sürümü, tutar ve onay bilgileri değiştirilmez. Dil/para birimi/aşama menüleri aynı ekranda açılır. Otomatik fotoğraf yükleme korunur.

## Depolama temizliği

Fotoğraf bağlantısını kaldırma ve denetim kaydı tek atomik sorguda yapılır; eşzamanlı kayıt değişikliği 409 döndürür. Sonra dosya S3 veya Cloudinary'den silinir. Başarısız depolama silmesi kaydı geri açmaz: özel temizlik kuyruğunda kalır ve uygulama uyarı gösterir. Sunucuda silme yetkisi bulunmalıdır. Aynı DELETE isteği tekrarlandığında kuyruk yeniden işlenir; ikinci bir geçmiş/denetim adımı oluşturulmaz. Bekleyen dosyalar sunucu veya yerel yönetim ortamında `pnpm photos:cleanup` ile tekrar temizlenebilir (.env.local gerekli). Bu komut yalnızca kuyrukta bulunan silinmiş fotoğrafları işler; aktif fotoğrafları silmez. Anahtarları günlüklere yazmaz. Servis kayıtları veya teklifler silinmez. Depolama sağlayıcısının sürüm/yedekleme kuralları önceki dosya sürümlerini tutabilir.

API: DELETE /api/v1/records/{recordId}/photos/{photoId}. Yetkili oturum veya Bearer gerekir. Yanıt güncel ServiceRecord; depolama temizliği bekliyorsa warning eklenir. Müşteri fotoğraf yolu kayıttaki photos dizisini doğruladığından kaldırılan fotoğrafı sunmaz.

## Doğrulama

Web tarafında 32 test ve üretim derlemesi geçti; ek iki depolama DELETE protokol testi de çalıştırıldı. Silme atomikliği, revision çakışması, müşteri izdüşümü ve tekrar deneme kontrol edildi. Gerçek müşteri fotoğrafları test amacıyla silinmedi. Swift sözdizimi/çeviri/kaynak kontrolleri geçti. Xcode derlemesi, XCTest ve iPhone ekran görüntüsü doğrulaması bu ortamda yapılamadı.
