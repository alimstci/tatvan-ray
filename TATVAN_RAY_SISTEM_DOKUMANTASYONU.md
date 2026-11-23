# Tatvan Ray — Sistem ve Proje Dokümantasyonu

> **Belge türü:** Ürün, iş akışı ve teknik sistem dokümantasyonu  
> **Uygulama:** Tatvan Ray  
> **Paket adı:** `com.tatvan.ray`  
> **Mevcut sürüm:** `0.1.0`  
> **Ana kullanıcı:** Tren teşkil personeli  
> **Çalışma biçimi:** Android, yerel veri, çevrimdışı kullanım odaklı

---

## 1. Projenin çıkış noktası

Tatvan sahasında yaklaşık 320 vagon bulunabilmektedir. Her gün hazırlanacak tren için bu vagonların yalnızca bir bölümü seçilir. Hazırlanan trenler günün görevine göre 19, 28, 30 veya başka sayıda vagondan oluşabilir.

Vagonlar tek bir yerde hazır beklemez. Gar, rampa, yeni yol, atölye ve diğer saha yollarında karışık hâlde bulunur. Tren teşkil personeli:

1. Trene girecek vagonları bulur.
2. Vagonların hangi yolda ve hangi sırada olduğunu belirler.
3. Önlerindeki engel vagonları gerektiğinde başka yollara alır.
4. Vagonları varış yeri ve koşum türüne göre sıralar.
5. Dizinin başına ve sonuna uygun emniyet vagonlarını yerleştirir.
6. Hazırlanan diziyi belgeyle karşılaştırır.

Bu işlem çok sayıda yol, farklı uzunluktaki vagon ve her gün değişen saha vaziyeti nedeniyle zaman alır. Tatvan Ray bu işi otomatikleştiren bir hareket emri sistemi değil; personele vagon bulma, veri kontrolü ve ileride manevra planlama konusunda yardım eden bir **karar destek uygulamasıdır**.

---

## 2. Sistemin ana amacı

Sistemin hedeflenen tam iş akışı şöyledir:

```text
Günlük Excel'i yükle
        ↓
Sahadaki yolları ve vagon sıralarını oluştur
        ↓
Tren teşkil belgesini fotoğraftan oku
        ↓
Hedef vagonları günlük sahada bul
        ↓
Depo ve Rahva erişimlerini karşılaştır
        ↓
En az gereksiz hareketli manevra önerisini üret
        ↓
Vagonları hedef sırada birleştir
        ↓
Son kontrolleri kullanıcıya göster
```

Bu hedefin ilk temel aşaması geliştirilmiştir: günlük Excel okuma, saha görünümü, vagon sırası, kapasite hesabı, mükerrer kontrolü, yerel kayıt ve çevrimdışı OCR altyapısı.

---

## 3. Temel saha yönü: Depo ve Rahva

Tatvan yolları uygulamada iki ana cihete göre ele alınır:

```text
SOL TARAF                                      SAĞ TARAF
DEPO CİHETİ  →  yol üzerindeki vagonlar  →  RAHVA CİHETİ
```

Uygulamanın standart kayıt sırası her zaman:

```text
Depo → Rahva
```

şeklindedir.

Örnek yol:

```text
DEPO                                      RAHVA
[A] — [B] — [C] — [D] — [E]
```

| Vagon | Depo'dan sırası | Rahva'dan sırası |
|---|---:|---:|
| A | 1 | 5 |
| B | 2 | 4 |
| C | 3 | 3 |
| D | 4 | 2 |
| E | 5 | 1 |

Bu çift yönlü konum ileride manevra hesabının temelini oluşturacaktır. Örneğin hedef vagon Depo'dan 18., Rahva'dan 9. ise yalnız engel sayısına bakıldığında Rahva yönü daha avantajlıdır. Ancak kesin öneri için yol bağlantıları, makaslar ve erişim yasakları da bilinmelidir.

---

## 4. Kullanılan veri kaynakları

### 4.1 Günlük GAR SAHA YOLLARI Excel'i

Hareket memurundan günlük olarak alınan `.xlsx` dosyası, o güne ait başlangıç saha vaziyetidir.

İncelenen örnek dosya:

```text
Kopya GAR SAHA YOLLARI.xlsx
```

Örnek çalışma kitabında 25 sayfa vardır. Bunlar arasında:

- Ana sayfa
- Atölye 1–5
- Yeni Yol 1–3
- Rampa 1–3 ve kör yol
- Gar yolları 2–10
- Tamir yolu
- Feribot sahası
- Vagon teknik veri sayfası

bulunmaktadır.

### 4.2 Tatvan normal ve faydalı yol uzunlukları

13.05.2026 güncelli yol uzunlukları görselinden 41 sabit yol tanımı sayısallaştırılmıştır.

Her yol için mümkün olduğunda şunlar tutulur:

- Yol adı ve kimliği
- Yol grubu
- Normal uzunluk
- Faydalı uzunluk
- Başlangıç kilometresi
- Bitiş kilometresi

Kapasite hesabında **normal uzunluk değil, faydalı uzunluk** kullanılır.

### 4.3 Tatvan saha şeması

Paylaşılan saha şeması, yolların yaklaşık yerleşimini ve Depo–Rahva yönünü anlamak için kullanılmıştır. Ancak görseldeki bazı makas ve bağlantı ayrıntıları kesin algoritma kurmak için yeterince net değildir.

### 4.4 Tren teşkil bildirimi

Hazırlanacak trenin hedef dizisi fotoğraf veya galeriden alınan teşkil belgesinden okunmak üzere OCR altyapısına bağlanmıştır.

---

## 5. Excel içe aktarma sistemi

### 5.1 Kullanıcı işlemi

Kullanıcı uygulamanın **Günlük** ekranında:

```text
Günlük Excel'i seç
```

butonuna basar ve telefondaki `.xlsx` dosyasını seçer.

### 5.2 Uygulamanın yaptığı işlemler

Uygulama:

1. Çalışma kitabını cihazda açar.
2. Fiziksel yol sayfalarını bulur.
3. Özet sayfalarını tekrar envanter olarak saymaz.
4. Her yol sayfasında 11. satırdan itibaren vagon kayıtlarını okur.
5. F, G, H ve I sütunlarındaki parçaları tam UIC numarasına dönüştürür.
6. Excel'deki soldan sağa sırayı Depo → Rahva olarak kaydeder.
7. Her vagon için Rahva'dan ters sıra numarasını hesaplar.
8. Yolun doluluğunu vagon uzunluklarının toplamından hesaplar.
9. Aynı UIC numarasını birden fazla yol sayfasında arar.
10. Sonucu cihazdaki yerel depoya kaydeder.

### 5.3 Okunan temel sütunlar

| Excel sütunu | Kullanılan bilgi |
|---|---|
| C | Dingil sayısı |
| D | Vagon uzunluğu |
| E | Seri/cins |
| F–I | Tam UIC vagon numarası parçaları |
| K | Varış/hedef bilgisi |
| L | Net ağırlık |
| M | Brüt ağırlık |
| N | Fren bilgisi |

### 5.4 Örnek dosyanın gerçek sonucu

İncelenen örnek Excel için:

- 25 Excel sayfası incelenmiştir.
- Fiziksel yol sayfalarında 224 vagon satırı okunmuştur.
- 13 yol dolu bulunmuştur.
- 15 tam UIC numarası iki farklı yol sayfasında yer almaktadır.
- Bu nedenle benzersiz vagon numarası sayısı 209'dur.

224 sayısı “kesin fiziksel vagon sayısı” olarak değil, yol sayfalarından okunan kayıt sayısı olarak değerlendirilmelidir. Çakışan 15 kayıt sahada doğrulanmalıdır.

### 5.5 Günlük yenileme davranışı

Yeni Excel eski listeye eklenmez:

```text
Eski günlük saha
        ↓ tamamen değiştirilir
Yeni günlük Excel
        ↓
Yeni aktif saha
```

Bugün 224, yarın da 224 kayıt bulunması sorun değildir. Uygulama toplam sayıya göre değil; her vagonun numarası, yolu ve sırasına göre yeni saha fotoğrafını oluşturur.

```text
224 + 224 = 448     ❌
Eski 224 → Yeni 224 ✅
```

---

## 6. Mükerrer ve çakışan vagon kontrolü

Aynı tam UIC numarası iki ayrı yol sayfasında bulunduğunda sistem bunu çakışma olarak gösterir.

Örnek:

```text
33 96 5432 366-8

Olası konum 1: YY3 / Excel satırı 30
Olası konum 2: 7 YOL / Excel satırı 24
```

Bu uygulamanın aynı dosyayı iki defa eklemesinden kaynaklanmaz. Çakışma Excel'in kendi içindedir. Muhtemel nedenler:

- Vagon başka yola alındıktan sonra eski yol sayfasından silinmemesi
- Bir vagon grubunun yeni sayfaya kopyalanıp eski kaydın bırakılması
- Güncelleme sırasında iki yol sayfasının aynı anda doğru kabul edilmesi

Uygulama güvenlik nedeniyle hangi yolun doğru olduğuna kendisi karar vermez. Şunları gösterir:

- Tam vagon numarası
- İki olası yol
- Excel satırları
- Her konum için Depo'dan sıra
- Her konum için Rahva'dan sıra

Kullanıcı sahadaki gerçek konumu veya hareket memurunun kaydını doğrular.

Örnek dosyada çakışmalar iki grupta toplanmıştır:

- 8 vagon: YY3 ↔ 7 YOL
- 7 vagon: 7 YOL ↔ 4 YOL

---

## 7. Uygulama ekranları

### 7.1 Günlük

Ana başlangıç ekranıdır.

Gösterilenler:

- Günlük Excel seçme butonu
- Sahadaki kayıt sayısı
- Dolu yol sayısı
- Tanımlı yol sayısı
- Son yüklenen dosya
- Çakışma özeti
- Çakışan vagon ayrıntıları
- Yollar ve OCR ekranlarına geçiş
- Yerel verileri silme alanı

### 7.2 Yollar

Varsayılan olarak yalnız dolu yollar gösterilir. Kullanıcı isterse tüm yolları açabilir.

Özellikler:

- Dolu yollar / tüm yollar seçimi
- Yol veya grup arama
- Yol grubu filtresi
- Kapalı ve açılır yol kartları
- Normal ve faydalı uzunluk
- Kalan kapasite
- Depo → Rahva yön göstergesi
- Yatay vagon sırası
- Her vagon için Depo ve Rahva konumu

Kartların kapalı başlaması uzun sayfalarda sürekli dikey kaydırmayı azaltır.

### 7.3 Tara

Tren teşkil belgesi:

- Kamerayla çekilebilir.
- Galeriden seçilebilir.
- Android üzerinde cihaz içi OCR ile okunabilir.

OCR sonucunda kullanıcı:

- Vagon numarasını düzeltebilir.
- Varış bilgisini seçebilir.
- Koşum türünü işaretleyebilir.
- Emniyet vagonunu belirleyebilir.
- Satırı tek tek onaylayabilir.

### 7.4 Dizi

Mevcut sürümde taslak bir dizi görünümü vardır. Şunları gösterir:

- Seçilen vagon sayısı
- Toplam uzunluk
- Toplam brüt ton
- Lokomotiften kuyruğa taslak sıra
- Varış, koşum ve emniyet işaretleri
- Basit kontrol uyarıları

> **Önemli:** Bu ekran şu anda gerçek saha bağlantılarını kullanan bir manevra motoru değildir. Kesin hareket sırası veya resmî manevra talimatı üretmez.

### 7.5 Kurallar

Taslak karar destek kurallarını gösterir:

- Varış sırası
- Koşum uyumu
- Baş ve son emniyet vagonları
- Faydalı uzunluk
- Fren ve tonajın haricî/resmî doğrulaması

---

## 8. Çevrimdışı OCR

OCR için `@react-native-ml-kit/text-recognition` kullanılır.

Temel yaklaşım:

1. Kullanıcı kamera veya galeriden belge seçer.
2. Görsel Android cihazda işlenir.
3. Metin sunucuya yüklenmez.
4. Tam UIC numaraları metinden çıkarılır.
5. Başlıktaki beyan edilen vagon/dingil sayısı okunmaya çalışılır.
6. Okunan satırlar kullanıcıya düzeltme ve onay için gösterilir.

OCR özel bir yerel modül kullandığı için Expo Go içinde çalışmaz. Development veya preview APK gerekir.

OCR sonuçları kesin kabul edilmemelidir. Özellikle:

- UIC numarası
- Varış yeri
- Brüt/net değerler
- Fren bilgisi
- Emniyet işareti

kaynak belgeyle karşılaştırılmalıdır.

### Mevcut OCR sınırlaması

Mevcut prototip OCR satırlarını okuyup onaylatabilmektedir. Ancak OCR hedef listesini günlük saha envanteriyle eksiksiz eşleştiren ve bu eşleşmeden gerçek manevra planı oluşturan uçtan uca süreç henüz tamamlanmamıştır.

---

## 9. Yerel veri ve çevrimdışı çalışma

Uygulamanın operasyonel verileri cihazda `AsyncStorage` içinde saklanır.

Saklanan temel paket:

```text
{
  wagons: günlük vagon kayıtları,
  tracks: yol tanımları,
  importInfo: son Excel içe aktarma bilgisi
}
```

Yeni Excel seçildiğinde bu günlük saha paketi değiştirilir.

### Tümünü sil butonu

Günlük ekranındaki **Tümünü sil** işlemi:

- Günlük vagon listesini
- Son Excel içe aktarma bilgisini
- Cihazdaki aktif saha kaydını

siler.

İşlemden önce kullanıcıdan onay alınır. Sabit Tatvan yol tanımları ve uygulamanın kendisi silinmez. Silme sonrasında kullanıcı Excel'i yeniden yükleyebilir.

---

## 10. Yol kapasitesi hesabı

Bir yol için:

```text
Kullanılan uzunluk = yoldaki vagon uzunluklarının toplamı
Kalan uzunluk = faydalı yol uzunluğu − kullanılan uzunluk
Doluluk yüzdesi = kullanılan uzunluk / faydalı uzunluk × 100
```

Kalan değer negatifse ekranda sıfır gösterilse bile taşma uyarısı oluşturulmalıdır. Excel'de uzunluğu sıfır veya eksik gelen vagonlar kapasite hesabını yanıltabilir ve ayrıca kontrol edilmelidir.

---

## 11. Hedef tren dizisi kuralları

Saha anlatımından çıkarılan mevcut taslak kurallar:

1. Vagonlar gidecekleri illere/varış noktalarına göre gruplanır.
2. İlk bırakılacak ilin vagonları dizinin kuyruk tarafına gelecek şekilde planlanır.
3. Manuel ve otomatik koşumlu vagonlar kendi gruplarında değerlendirilir.
4. Farklı koşum türleri arasındaki geçiş/adaptör yetkili personelce doğrulanır.
5. Dizinin başına ve sonuna uygun emniyet vagonu verilir.
6. Emniyet vagonunun boş veya dolu olması tek başına uygunluk kararı değildir.
7. Toplam uzunluk seçilen yolun faydalı uzunluğunu aşmamalıdır.
8. Fren, tonaj ve resmî belge kontrolleri yetkili sistem ve personel üzerinden yapılır.

Bu maddeler resmî mevzuat olarak kodlanmamıştır; doğrulanması gereken iş kurallarıdır.

---

## 12. Manevra motorunun hedeflenen çalışma biçimi

Manevra motoru tamamlandığında her hedef vagon için:

1. Bulunduğu yol belirlenecek.
2. Depo tarafından önündeki vagonlar sayılacak.
3. Rahva tarafından önündeki vagonlar sayılacak.
4. İki cihetin erişilebilirliği kontrol edilecek.
5. Engel vagonların toplam uzunluğu hesaplanacak.
6. Geçici bırakma yollarının boş faydalı uzunlukları bulunacak.
7. Aynı yoldaki birden fazla hedefin birlikte alınma ihtimali değerlendirilecek.
8. Hedef diziyi en az bozacak toplama sırası hesaplanacak.
9. Alternatifler maliyet puanına göre sıralanacak.

Örnek:

```text
Hedef vagon: 7 YOL
Depo'dan sıra: 18 → önünde 17 engel
Rahva'dan sıra: 9 → önünde 8 engel

İlk tercih: Rahva ciheti
Neden: 9 daha az engel vagon hareket ettiriliyor
```

Örnek adım çıktısı:

```text
ADIM 1
7. Yol'a Rahva cihetinden gir.

ADIM 2
Öndeki 8 vagonu geçici olarak 6. Yol'a bırak.

ADIM 3
33 96 5432 366-8 numaralı hedef vagonu al.

ADIM 4
Hedef vagonu hazırlanan dizinin uygun sırasına bağla.
```

### Manevra maliyet puanı

Planlar ileride şu ölçütlerle karşılaştırılacaktır:

- Hareket ettirilen gereksiz vagon sayısı
- Geçici bırakılan vagon sayısı
- Aynı vagona tekrar dokunma sayısı
- Yol değişikliği sayısı
- Lokomotif yön değiştirme sayısı
- Kullanılan toplam mesafe
- Geçici yol kapasitesi
- Koşum geçişi ve elle müdahale ihtiyacı

---

## 13. Manevra motorunun neden henüz tamamlanmadığı

Excel vagonun hangi yolda ve kaçıncı sırada olduğunu verir; fakat kesin rota için yeterli değildir.

Doğrulanması gereken kritik bilgiler:

- Her yola Depo cihetinden girilebilir mi?
- Her yola Rahva cihetinden girilebilir mi?
- Kör yolların açık ucu hangisidir?
- Yollar hangi makaslarla birbirine bağlıdır?
- Hangi geçişler doğrudan mümkündür?
- Lokomotif hangi yollar üzerinde başa geçebilir?
- Hangi yollar geçici bırakma için kullanılamaz?
- Günlük kapalı veya yasak yollar nasıl bildirilecektir?
- Bir manevrada çekilebilecek uzunluk/tonaj sınırları nelerdir?
- Rampa, gar, yeni yol, atölye ve feribot bağlantılarının kesin grafiği nasıldır?

Yanlış saha grafiğiyle çalışan algoritma fiziksel olarak mümkün olmayan veya emniyetsiz bir öneri üretebilir. Bu nedenle mevcut sürüm kesin manevra talimatı vermemektedir.

---

## 14. Planlanan manevra sistemi mimarisi

### 14.1 Saha grafiği

Saha bir grafik olarak modellenecektir:

```text
Düğüm: yol ucu, makas veya bağlantı noktası
Kenar: lokomotif/vagon grubunun geçebildiği bağlantı
```

Her bağlantıda:

- Yön
- Kullanılabilirlik
- Kör yol bilgisi
- Kapasite
- Yasak/kısıt durumu
- Tahmini hareket maliyeti

tutulacaktır.

### 14.2 Saha durumu

Her manevra adımından sonra yerel saha güncellenecektir.

```text
Önce:
4. Yol: A — B — C — Hedef
6. Yol: D — E

Sonra:
4. Yol: Hedef
6. Yol: D — E — A — B — C
```

Kullanıcı “saha farklı” seçerse gerçek durumu düzeltip planı yeniden hesaplatabilecektir.

### 14.3 Açıklanabilir plan

Uygulama yalnız sonuç değil, gerekçe de göstermelidir:

```text
Rahva ciheti seçildi.
Depo cihetine göre 9 daha az engel vagon hareket ettiriliyor.
6. Yol'un 210 metresi boş; engel grubunun toplamı 112 metre.
```

---

## 15. Teknoloji mimarisi

### Kullanılan ana teknolojiler

- Expo SDK 54
- React 19
- React Native 0.81
- JavaScript/CommonJS
- SheetJS (`xlsx`)
- Expo Document Picker
- Expo File System
- Expo Image Picker
- Google ML Kit Text Recognition
- AsyncStorage
- EAS Build

### Temel dosyalar

| Dosya | Görev |
|---|---|
| `App.js` | Ekranlar, ana durum ve kullanıcı akışı |
| `src/data/stationData.js` | Sabit yol tanımları ve taslak kurallar |
| `src/utils/xlsxImporter.js` | Günlük Excel okuma ve konum çıkarma |
| `src/utils/ocrParser.js` | OCR metninden vagon satırları çıkarma |
| `src/utils/planner.js` | Kapasite ve taslak dizi hesapları |
| `src/services/localStore.js` | Yerel kaydetme, yükleme ve silme |
| `tests/` | Otomatik testler |
| `eas.json` | Android development/preview/production profilleri |

### Excel'in web ve mobilde okunması

- Web önizlemede tarayıcının `ArrayBuffer` dosya okuması kullanılır.
- Android/iOS tarafında dosya Base64 olarak yerel dosya sisteminden okunur.
- Her iki yol aynı Excel ayrıştırıcısına bağlanır.

---

## 16. Otomatik testler

Projede Node test altyapısı kullanılır.

Kontrol edilen başlıca durumlar:

1. Tam UIC vagon numarası normalizasyonu
2. OCR metninden vagon numarası çıkarma
3. Beyan edilen satır sayısı uyuşmazlığı
4. Yol doluluğunda faydalı uzunluğun kullanılması
5. Taslak dizide baş/son emniyet vagonu yerleşimi
6. Günlük Excel'in Depo → Rahva sırasıyla okunması
7. Web `ArrayBuffer` içe aktarma yolu

Test komutu:

```powershell
npm test
```

---

## 17. Geliştirme ve çalıştırma

### Web önizleme

```powershell
cd C:\Users\win\Documents\ChatGPT\fahrettin
npm install
npm run web
```

Web sürümü arayüz ve Excel içe aktarımı testi için kullanılabilir. Yerel ML Kit OCR web'de çalışmaz.

### Android development

```powershell
npm run android
```

Bu yöntem yerel Android SDK, emülatör veya USB hata ayıklama açık telefon gerektirir.

### Kurulabilir preview APK

```powershell
npx eas-cli build -p android --profile preview
```

Preview profili telefona doğrudan kurulabilen APK üretir. EAS derleme aşamasında internet gerekir. APK kurulduktan sonra Excel, yerel kayıt ve cihaz içi OCR iş akışları çevrimdışı kullanılabilir.

### EAS proje bilgisi

```text
Hesap: stcis-team
Proje: tatvan-ray
EAS Project ID: 7feb02f9-4bfb-47b8-aa41-632a3af5f3c7
```

---

## 18. Günlük kullanım özeti

```text
1. Hareket memurundan günlük Excel'i al.
2. Uygulamayı aç.
3. Günlük Excel'i seç.
4. Okunan kayıt ve dolu yol sayısını kontrol et.
5. Çakışan vagonları sahada doğrula.
6. Yollar ekranında vagonların Depo/Rahva sırasını kontrol et.
7. Tren teşkil belgesini kamera veya galeriden seç.
8. OCR sonuçlarını kaynak belgeyle karşılaştır ve düzelt.
9. Taslak diziyi incele.
10. Resmî belge, fren, koşum ve emniyet kontrollerini yetkili süreçle tamamla.
```

Manevra motoru tamamlanana kadar uygulama yalnız saha envanteri ve taslak karar desteği amacıyla kullanılmalıdır.

---

## 19. Mevcut durum tablosu

| Özellik | Durum |
|---|---|
| Günlük `.xlsx` seçme | Çalışıyor |
| Fiziksel yol sayfalarını okuma | Çalışıyor |
| Depo → Rahva sırası | Çalışıyor |
| Rahva'dan ters sıra hesabı | Çalışıyor |
| Yol kapasite görünümü | Çalışıyor |
| Dolu yollar filtresi | Çalışıyor |
| Açılır/kapanır yol kartları | Çalışıyor |
| Mükerrer UIC kontrolü | Çalışıyor |
| Çakışma yol/satır/konum açıklaması | Çalışıyor |
| Günlük verinin eskisinin yerine geçmesi | Çalışıyor |
| Yerel veri saklama | Çalışıyor |
| Tüm yerel verileri silme | Çalışıyor |
| Kamera/galeri belge seçimi | Çalışıyor |
| Android cihaz içi OCR altyapısı | Geliştirildi, gerçek cihaz testi gerekli |
| OCR satırı düzeltme/onaylama | Çalışan prototip |
| Hedef vagon–saha eşleştirmesi | Tamamlanmadı |
| Kesin saha bağlantı grafiği | Doğrulama bekliyor |
| En az hareketli manevra planı | Tamamlanmadı |
| Adım adım manevra uygulama modu | Planlandı |
| Manevra sonrası saha güncelleme | Planlandı |
| Resmî fren/hareket onayı | Uygulamanın kapsamı dışında |

---

## 20. Sonraki geliştirme yol haritası

### Aşama 1 — Telefon doğrulaması

- APK'yı gerçek Android telefona kur
- Excel seçimini test et
- 224 örnek kaydın okunmasını doğrula
- Depo/Rahva sıralarını sahayla karşılaştır
- Kamera ve galeri izinlerini test et
- OCR'ın farklı fotoğraf kalitelerindeki sonucunu ölç

### Aşama 2 — Hedef vagon eşleştirmesi

- OCR hedeflerini aktif günlük saha ile eşleştir
- Eşleşen vagonda yol ve iki cihet sırasını göster
- Eşleşmeyen numara için düzeltme/elle konum seçenekleri sun
- Mükerrer saha kaydı bulunan hedefi otomatik plana alma

### Aşama 3 — Saha grafiğinin doğrulanması

- Yol uçlarını Depo/Rahva olarak doğrula
- Makas bağlantılarını tek tek kaydet
- Kör yolları işaretle
- Geçici bırakmaya kapalı yolları belirle
- Lokomotif başlangıç konumunu günlük girişe ekle

### Aşama 4 — Manevra öneri motoru

- İki cihetten engel hesabı
- Geçici yol kapasitesi
- Aynı yoldaki hedefleri birlikte alma
- Alternatif plan üretme
- Açıklanabilir maliyet puanı

### Aşama 5 — Uygulama modu

- Tek adımlık manevra ekranı
- Tamamlandı / saha farklı / yeniden hesapla
- Yerel saha durumunu adım adım güncelleme
- Plan geçmişi ve geri alma

### Aşama 6 — Son kontrol

- Hedef sıra karşılaştırması
- Varış grupları
- Koşum geçişleri
- Baş/son emniyet vagonları
- Toplam uzunluk, dingil ve tonaj özeti
- Kullanıcı tarafından tamamlandı kaydı

---

## 21. Güvenlik ve sorumluluk sınırı

Tatvan Ray:

- Resmî hareket emri değildir.
- Trafik emri üretmez.
- Fren hesabını resmî olarak onaylamaz.
- Vagonun teknik sefere uygunluğuna karar vermez.
- Koşum adaptörü veya emniyet vagonu uygunluğunu tek başına belirlemez.
- TCDD/TCDD Taşımacılık mevzuatı ve yetkili personel onayının yerine geçmez.

Excel, OCR veya saha kaydı hatalı olabilir. Canlı operasyonda:

1. Vagon numarası fiziksel vagondan doğrulanmalıdır.
2. Yol ve sıra sahada kontrol edilmelidir.
3. Fren, tonaj, koşum ve emniyet kontrolleri resmî süreçten geçirilmelidir.
4. Uygulama önerisi sahadaki gerçek duruma aykırıysa uygulanmamalıdır.

---

## 22. Kısa sonuç

Tatvan Ray projesi, günlük Excel'i elle incelemek yerine sahayı otomatik oluşturan, vagonların Depo ve Rahva tarafından sırasını gösteren, Excel içindeki çakışmaları açıklayan ve tren teşkil belgesini cihaz üzerinde okumaya hazırlanan çevrimdışı bir mobil karar destek sistemidir.

Mevcut sürüm saha envanteri temelini oluşturmuştur. Projenin asıl ikinci aşaması; doğrulanmış makas/yol grafiği üzerinden hedef vagonları bulup en az gereksiz hareketli, açıklanabilir ve adım adım bir manevra önerisi üretmektir.

