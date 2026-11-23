# Tatvan Tren Teşkil ve Manevra Yardımcısı

## 1. Amaç

Bu uygulama, Tatvan sahasında görev yapan tren teşkil personelinin günlük tren hazırlama işini kolaylaştırmak için geliştirilecektir.

Uygulamanın temel amacı:

1. Sahadaki vagonların hangi yolda ve hangi sırada olduğunu günlük Excel dosyasından almak.
2. Hazırlanacak trenin hedef vagon sırasını tren teşkil bildiriminin fotoğrafından OCR ile okumak.
3. Hedef vagonları saha envanteriyle eşleştirmek.
4. Vagon uzunluklarını, yol kapasitelerini, yol üzerindeki konumları ve erişim yönlerini dikkate almak.
5. Treni mümkün olan en az gereksiz vagon hareketi ve yol değişikliğiyle hazırlamak için adım adım manevra önerisi üretmek.

Uygulama resmî hareket emri, fren onayı veya sevk uygunluğu vermez. Tren teşkil personeline saha karar desteği sağlar.

## 2. Kullanıcı

Ana kullanıcı tren teşkil görevlisidir.

Kullanıcı:

- Sahadaki vagonları bulur.
- Vagonları yollar arasında hareket ettirir.
- Hedef sıraya göre birleştirir.
- Otomatik ve manuel koşum takımlarını kontrol eder.
- Baş ve son emniyet vagonlarını yerleştirir.
- Uygulamadaki manevra adımlarını sahadaki gerçek duruma göre tamamlar veya değiştirir.

## 3. Çalışma ortamı

- Uygulama Android telefonda çalışacaktır.
- Expo/React Native kullanılacaktır.
- Uygulamanın operasyonel özellikleri çevrimdışı çalışacaktır.
- Günlük Excel, belge fotoğrafı, OCR sonucu ve saha değişiklikleri cihazda tutulacaktır.
- Belge fotoğrafı OCR için herhangi bir sunucuya gönderilmeyecektir.
- APK doğrudan telefona kurulabilecektir.

## 4. Tatvan saha yön standardı

Her yol iki ana cihete göre gösterilir:

```text
SOL TARAF                                  SAĞ TARAF
DEPO CİHETİ  ->  VAGONLAR SOLDAN SAĞA  ->  RAHVA CİHETİ
```

Uygulamanın standart iç sıralaması her zaman:

```text
Depo ciheti -> Rahva ciheti
```

olacaktır.

Örnek:

```text
DEPO                                      RAHVA
[A] - [B] - [C] - [D] - [E]
```

| Vagon | Depo cihetinden sıra | Rahva cihetinden sıra |
|---|---:|---:|
| A | 1 | 5 |
| B | 2 | 4 |
| C | 3 | 3 |
| D | 4 | 2 |
| E | 5 | 1 |

Bir hedef vagona iki cihetten de erişilebiliyorsa uygulama her iki yöndeki engel vagon sayısını hesaplar.

## 5. Saha yolları

Paylaşılan 13.05.2026 güncelli yol belgesine göre uygulamada aşağıdaki yol grupları bulunur:

- Sivil istasyon/gar yolları
- Askerî rampa yolları
- Tahliye yolları
- Akaryakıt ve depo yolları
- Ambar yolları
- Atölye/tamir yolları
- Yeni yollar
- Rahova istasyon yolları
- İskele yük yolları
- İskele sağ ve sol eksen yolları
- Feribot sahası ve bağlantı yolları

Kapasite hesaplarında normal yol uzunluğu değil, faydalı yol uzunluğu kullanılacaktır.

Her yol için tutulacak bilgiler:

- Yol kimliği
- Yol adı
- Yol grubu
- Normal uzunluk
- Faydalı uzunluk
- Başlangıç ve bitiş kilometresi
- Depo cihetinden erişilebilirlik
- Rahva cihetinden erişilebilirlik
- Kör yol durumu
- Geçici kullanım durumu
- Bağlı olduğu makas ve yollar
- Yol üzerindeki vagonların Depo -> Rahva sırası

## 6. Günlük Excel dosyası

Hareket memuru her gün `GAR SAHA YOLLARI` Excel dosyasını kullanıcıya verir.

Bu Excel günlük saha vaziyetinin başlangıç kaynağıdır. Kullanıcı 320 civarındaki vagonu her gün elle girmeyecektir.

İncelenen örnek Excel dosyasında 25 sayfa bulunmaktadır:

- ANASAYFA
- ATÖLYE 1-5
- Yeni Yol 1-3
- Rampa Kör Yol
- Rampa 1-3
- Gar yolları 2-10
- Tamir Yolu
- Feribot Sahası
- `vagonlar` ana teknik veri sayfası

Örnek dosyada yol sayfalarında 237 dolu vagon satırı tespit edilmiştir. Günlük dosyalardaki sayı değişebilir.

### 6.1 Excel içe aktarımı

Kullanıcı:

```text
Günlük vaziyeti yükle -> Excel dosyasını seç
```

işlemini yapar.

Uygulama:

1. Yol sayfalarını bulur.
2. Her yolun üzerindeki vagon numaralarını okur.
3. Excel'deki soldan sağa sıralamayı Depo -> Rahva sırası olarak kaydeder.
4. `vagonlar` sayfasından teknik özellikleri eşleştirir.
5. Formül sonuçlarına güvenmeden gerekli toplamları kendisi hesaplar.
6. Mükerrer, eksik veya geçersiz vagon numaralarını kullanıcıya gösterir.

### 6.2 Excel'den alınacak vagon alanları

- Tam vagon numarası
- Seri/cins
- Değişim rejimi
- Sahip idare
- Dingil sayısı
- Uzunluk
- Dara
- Boş fren
- Dolu fren
- Fren değişim ağırlığı
- Bulunduğu yol
- Depo cihetinden sıra
- Rahva cihetinden sıra

### 6.3 Excel sorunlarına karşı yaklaşım

Örnek dosyada:

- Sayfa sekmesi alanı görünmez durumdadır.
- Çalışma kitabı yapısı korumalıdır.
- Bazı Türkçe karakterler bozulmuştur.
- Bazı hesap hücrelerinde `#REF!` ve `#N/A` vardır.
- Bazı çizim XML'leri standart dışıdır.

Uygulama özet formüllerine ve çizim nesnelerine bağımlı olmayacaktır. Ham sayfa hücrelerini okuyacak, toplamları yeniden hesaplayacaktır.

## 7. Günlük tren görevi

Hazırlanacak trenin hedef dizisi, tren teşkil bildirimi fotoğrafından alınacaktır.

Belgede bulunabilecek bilgiler:

- Tren/sefer bilgisi
- Çıkış ve varış istasyonu
- Vagon sayısı
- Dingil sayısı
- Net ve brüt tonaj
- Gerekli fren
- Toplam uzunluk
- Vagonların hedef sırası
- Vagon numarası
- Varış istasyonu
- Gümrük durumu
- Emniyet vagonu
- Ara grup uzunluk ve tonajları

## 8. OCR süreci

1. Kullanıcı belgeyi kamerayla çeker veya galeriden seçer.
2. OCR cihaz üzerinde çalışır.
3. Vagon numarası parçaları tam UIC numarası hâline getirilir.
4. OCR sonucu kaynak görselle birlikte kullanıcıya gösterilir.
5. Kullanıcı hatalı alanları düzeltir.
6. Kullanıcı satırları onaylar.
7. Onaylanmayan satırlar manevra hesabına alınmaz.

Kontroller:

- UIC vagon numarası biçimi
- Mükerrer vagon
- Başlıktaki vagon sayısı ile okunan satır sayısı
- Dingil toplamı
- Net, brüt ve fren toplamları
- Okunamayan varış bilgisi
- Emniyet vagonu işareti
- Düşük OCR güveni

## 9. Eşleştirme

Onaylanan hedef vagonlar günlük Excel envanteriyle tam vagon numarası üzerinden eşleştirilir.

Örnek:

```text
3547 120-3 -> 4. Yol / Depo cihetinden 18. sıra
2851 179-1 -> 2. Yol / Depo cihetinden 3. sıra
6641 306-5 -> Yeni Yol 3 / Depo cihetinden 11. sıra
```

Eşleşmeyen hedef için kullanıcıya şu seçenekler verilir:

- Vagon numarasını düzelt
- Sahadaki yerini elle gir
- Vagon sahada bulunamadı
- Görevden geçici olarak çıkar

## 10. Manevra planlama amacı

Uygulama aşağıdaki maliyetleri azaltmaya çalışır:

1. Gereksiz hareket ettirilen vagon sayısı
2. Geçici bırakılan vagon sayısı
3. Yol değişikliği sayısı
4. Lokomotifin gereksiz gidiş-gelişi
5. Hedef vagonların tekrar tekrar ayrılması ve bağlanması
6. Geçici yol kullanım süresi

Tam saha bağlantı grafiği ve makas bilgileri doğrulanana kadar sonuç `en kısa kesin plan` olarak değil, `en az hareketli önerilen plan` olarak gösterilecektir.

## 11. Manevra hesapları

Her hedef vagon için uygulama:

1. Bulunduğu yolu belirler.
2. Depo cihetinden önündeki engel vagonları sayar.
3. Rahva cihetinden önündeki engel vagonları sayar.
4. Yolun hangi uçlarından erişilebildiğini kontrol eder.
5. Lokomotifin bulunduğu ciheti dikkate alır.
6. Engel vagonların toplam uzunluğunu hesaplar.
7. Geçici bırakma yollarının boş faydalı uzunluklarını kontrol eder.
8. Hedef tren sırasını bozmadan birden fazla hedef vagonun birlikte alınıp alınamayacağını kontrol eder.
9. Alternatif planları maliyetlerine göre sıralar.

## 12. Koşum türleri

Vagonlar aşağıdaki koşum türlerinden biriyle işaretlenir:

- Manuel
- Otomatik
- Adaptörlü/geçişli
- Bilinmiyor

Otomatik ve manuel koşumlu vagonlar kendi grupları içinde planlanır. Farklı koşum türlerinin bağlantı noktasında uygulama yalnız uyarı verir. Bağlantının uygun olduğuna kendisi karar vermez.

## 13. Emniyet vagonları

- Hedef dizinin baş ve son emniyet vagonları ayrı işaretlenir.
- Emniyet vagonu eksikse görev tamamlanmış sayılmaz.
- Bir vagonun boş veya dolu olması tek başına emniyet vagonu uygunluğu anlamına gelmez.
- Nihai uygunluk yetkili talimat ve saha kontrolüyle belirlenir.

## 14. Manevra uygulama ekranı

Uygulama kullanıcıya tek seferde karmaşık rapor vermek yerine sıradaki işi gösterir.

Örnek:

```text
ADIM 1

4. Yol'a Rahva cihetinden gir.
Öndeki 2 vagonu geçici olarak 6. Yol'a bırak.

[Başlat] [Saha farklı] [Yeniden hesapla]
```

Sonraki adım:

```text
ADIM 2

31 75 3547 120-3 numaralı hedef vagonu al.

[Numarayı doğrula] [Alındı]
```

Sonraki adım:

```text
ADIM 3

Vagonu hazırlanan dizinin 1. sırasına bağla.

[Bağlandı]
```

## 15. Saha durumunun güncellenmesi

Tamamlanan her manevra yerel saha durumunu günceller.

Örnek:

```text
Önce:
4. Yol: A - B - C - Hedef
6. Yol: D - E

Sonra:
4. Yol: Hedef
6. Yol: D - E - A - B - C
```

Sahadaki gerçek durum uygulamadakinden farklıysa kullanıcı düzenleme yapar ve plan yeniden hesaplanır.

Ertesi gün yeni Excel içe aktarıldığında bu dosya yeni başlangıç vaziyeti olur. Önceki günün yerel durumu tarihli arşive alınabilir.

## 16. Temel ekranlar

### 16.1 Günlük başlangıç

- Günlük Excel seç
- Dosya tarihi ve yol sayısını göster
- Okunan toplam vagon sayısını göster
- Hatalı ve mükerrer kayıtları göster
- Günlük vaziyeti onayla

### 16.2 Saha görünümü

- Bütün yollar
- Depo ve Rahva yönleri
- Yol üzerindeki vagonlar
- Kullanılan/kalan faydalı uzunluk
- Vagon arama
- Elle konum düzeltme

### 16.3 Yeni tren görevi

- Belge fotoğrafı çek/seç
- OCR sonucu
- Satır doğrulama
- Saha eşleştirmesi
- Eksik vagonlar

### 16.4 Plan

- Önerilen manevra adımları
- Alternatif planlar
- Tahmini gereksiz hareket sayısı
- Geçici bırakma yolları
- Koşum ve emniyet uyarıları

### 16.5 Uygulama modu

- Sıradaki tek adım
- Aranan vagon numarası
- Yol ve cihet
- Tamamlandı/saha farklı seçenekleri
- Otomatik saha güncellemesi

### 16.6 Son kontrol

- Hedef vagon sayısı
- Sıra kontrolü
- Grup kontrolü
- Baş/son emniyet vagonu
- Koşum geçişleri
- Toplam uzunluk
- Kullanıcı tarafından tamamlanan adımlar

## 17. İlk sürüm kapsamı

İlk çalışan sürümde:

1. Günlük Excel içe aktarılır.
2. Yol ve vagon sıraları gösterilir.
3. Vagon numarasıyla saha araması yapılır.
4. Tren teşkil belgesi fotoğrafı çevrimdışı OCR ile okunur.
5. Hedef vagonlar saha envanteriyle eşleştirilir.
6. Her hedefin Depo ve Rahva cihetinden engel sayısı hesaplanır.
7. Yol kapasitesine göre geçici bırakma seçenekleri gösterilir.
8. Kullanıcı adımları tamamladıkça yerel saha güncellenir.

İlk sürümde kesin makas rotası optimizasyonu bulunmayabilir. Bu özellik, saha bağlantıları ve erişim kuralları doğrulandıkça eklenir.

## 18. Doğrulanması gereken bilgiler

- Her yol Depo cihetinden erişilebilir mi?
- Her yol Rahva cihetinden erişilebilir mi?
- Kör yolların açık ucu hangi cihettedir?
- Lokomotif günlük işe hangi yol ve cihetten başlar?
- Yollar arasındaki kesin makas bağlantıları nelerdir?
- Hangi yollar geçici vagon bırakmak için kullanılamaz?
- Günlük Excel'deki vagonların soldan sağa fiziksel sırası bütün sayfalarda aynı standardı kullanıyor mu?
- Otomatik ve manuel koşum geçişinde kullanılan yerel yöntem ve kısıtlar nelerdir?
- Emniyet vagonu seçiminde uygulanan güncel yerel/resmî kurallar nelerdir?
- Feribot gruplarının hangi iskele yollarına yerleştirileceği nasıl belirlenir?

## 19. Başarı ölçütü

Uygulama aşağıdaki günlük süreci desteklediğinde amacına ulaşmış sayılır:

```text
Günlük Excel'i içe aktar
-> Saha vaziyetini oluştur
-> Tren teşkil belgesini tara
-> Hedef vagonları bul
-> En az hareketli planı öner
-> Manevrayı adım adım uygula
-> Saha durumunu güncelle
-> Hedef diziyi kontrol et
```

