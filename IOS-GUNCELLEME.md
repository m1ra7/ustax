# Para birimi ve son web uyumluluk güncellemesi

1. Önce bu sürümle verilen UstaX-Web.zip içeriğini mevcut web projenize uygulayın ve Vercel üzerinde yeniden yayınlayın. Var olan ortam değişkenlerini koruyun. Depolama sağlayıcısını değiştirmeniz gerekmez. `501 NotImplemented` düzeltmesi sunucu kodundadır; yalnızca iOS uygulamasını değiştirmek yeterli değildir.
2. iOS ZIP dosyasını yeni bir klasöre çıkarın. UstaX.xcodeproj dosyasını Xcode 14.2 ile açın. Signing & Capabilities bölümünde Team ve gerekiyorsa Bundle Identifier ayarınızı tekrar seçin. Eski ve yeni Swift dosyalarını aynı projeye birlikte eklemeyin.
3. Uygulamayı çalıştırın. Sunucu alanına gerçek HTTPS Vercel adresinizi yazın ve çalışan hesabınızla giriş yapın.
4. Ayarlar > Para birimi: Euro, Türk lirası veya ABD doları seçin. Yeni servis kaydı sırasında bu seçimi değiştirebilirsiniz. Kaydedilen servisin teklifleri, nihai ücreti ve müşteri takibi aynı para birimini kullanır. Eski kayıtların para birimi TRY kabul edilir; otomatik kur dönüşümü yapılmaz. Onaylı teklifin para birimi sonradan değiştirilemez.
5. Servis detayı > Fotoğraflar: fotoğraf seçin veya çekin. Görseller arka planda en fazla 3 MB JPEG olarak hazırlanır; sıralı yükleme ve tamamlanan dosya sayısı gösterilir. İlk dosyalar başarılıysa sonraki dosyanın hatasında korunur. Sunucu erişim, bucket ve boyut hataları açıklanır. Güncel sunucuya rağmen hata varsa bildirilen hata ve sunucu logunu kontrol edin.
6. Yönetici işlem geçmişindeki Adımı kaldır ile bir adımı onay sonrasında görünümden kaldırabilir. Özgün kayıt ve denetim izi korunur; servis durumu geri alınmaz. Teknisyen için sunucu bu işlemi reddeder.
7. Takip bağlantısı ve QR kod, oluşturulduğu oturumda yeniden açılabilir. Yeniden giriş sonrasında ham bağlantı geri alınamaz; yönetici eski bağlantıyı iptal ederek yenisini oluşturabilir. Çalışan hesapları ilk parolalarıyla oluşturulur; yönetici diğer çalışanların parolasını yenileyebilir. Parola yenilemek mevcut oturumları kapatır.

Servis detayları tam sayfa NavigationStack ekranıdır. Bilgiler, işlem geçmişi ve teklif bölümleri List üzerinden; fotoğraf ve işlem formları kendi kaydırılabilir List/Form ekranlarında gezilir.

Web tarafında 30 otomatik test ve üretim derlemesi çalıştırıldı. iOS kaynak/parça doğrulaması çalıştırıldı; Xcode derlemesi ve XCTest bu ortamda çalıştırılmadı. macOS üzerinde Command+U ile testleri, iPhone üzerinde gerçek giriş/fotoğraf/teklif akışını doğrulayın.
