# Tatvan Ray Mobile

Tatvan Garı için saha envanteri ve tren teşkil karar desteği mobil MVP'si.

Uygulamanın onaylanan iş akışı ve geliştirme kapsamı için [UYGULAMA_GEREKSINIMLERI.md](UYGULAMA_GEREKSINIMLERI.md) belgesi esas alınır.

## Kapsam

- 13.05.2026 tarihli görselden sayısallaştırılmış 41 yol kaydı
- Hareket memurundan gelen günlük `.xlsx` dosyasını cihazdan seçme
- Excel içindeki fiziksel yol sayfalarından vagonları ve Depo → Rahva sırasını çıkarma
- Günlük saha durumunu internet kullanmadan cihazda saklama
- Normal/faydalı uzunluk ve başlangıç/bitiş kilometreleri
- Yol bazında vagon ve kapasite görünümü
- Varış, koşum tipi ve emniyet vagonu kontrolleriyle taslak dizi
- Yeni vagon ekleme, havuzdan seçme ve uyarı üretimi
- Kamera veya galeriden teşkil belgesi alma
- Google ML Kit ile cihaz üzerinde, çevrimdışı OCR
- OCR satırlarını elle düzeltme ve tek tek onaylama
- Onaylanan vagonları cihazdaki yerel depoya kaydetme
- Kurum mevzuatıyla teyit edilmesi gereken kuralların açık işaretlenmesi

## Çalıştırma

```powershell
npm install
npm run web
```

Arayüzün web önizlemesi `npm run web` ile açılabilir. Excel içe aktarma ve çevrimdışı OCR'ın gerçek cihaz testi özel development APK ile yapılmalıdır.

OCR, özel native ML Kit modülü kullandığı için Expo Go içinde çalışmaz. Development APK veya preview APK gerekir:

```powershell
npx eas-cli build -p android --profile development
npx eas-cli build -p android --profile preview
```

`development` profili geliştirme içindir. `preview` profili telefona doğrudan kurulabilen bağımsız APK üretir. Uygulama kurulduktan sonra belge okuma ve kayıt işlemleri internet gerektirmez.

## Yerel veri

Günlük vagon envanteri, yol listesi ve son içe aktarma bilgisi `AsyncStorage` içinde cihazda tutulur. Yeni günlük Excel seçildiğinde saha fotoğrafı bu dosyayla yenilenir. Belge görseli OCR için bir sunucuya yüklenmez. OCR sonucu kullanıcı onayı olmadan envantere aktarılmaz.

## Güvenlik notu

Bu yazılım operasyonel karar desteği prototipidir. Resmî TCDD/TCDD Taşımacılık mevzuatı, 5600 belgesi, fren hesabı, trafik emri veya yetkili personel onayının yerine geçmez. Fotoğraftan okunan değerler canlı kullanımdan önce kaynak belgeyle satır satır doğrulanmalıdır.
