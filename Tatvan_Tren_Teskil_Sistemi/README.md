# Tatvan Tren Teşkil Sistemi - Çalışma Arşivi

Bu klasör, Tatvan'da tren teşkili ve planlama uygulamasının geliştirilmesinde kullanılacak saha verilerini, resmî kaynakları, eğitim belgelerini ve örnek görselleri bir arada tutar.

## Klasörler

- `01_Saha_Verileri`: Kullanıcıdan alınan Tatvan yol envanteri ve doğrulama notları.
- `02_Resmi_Mevzuat`: Meslek yeterliliği ve görev/genel emir kaynakları.
- `03_TCDD_Sebeke_2026`: TCDD 2026 Şebeke Bildirimi ekleri.
- `04_Egitim_Referans`: Eğitim amaçlı kaynaklar. Operasyonel güncellik ayrıca kontrol edilmelidir.
- `05_Uygulama_Verileri`: Yazılım tarafından okunabilecek CSV dosyaları ve veri sözlüğü.
- `06_Kaynak_Gorseller`: Orijinal saha fotoğrafları ve örnek teşkil bildirimi.

## Önemli kullanım notları

1. Günlük vagon konumu, yol içindeki sıra, arıza durumu, gümrük/mühür bilgisi ve sefer görevi internette bulunmaz; günlük vaziyet cetvelinden veya yetkili kurum sisteminden alınmalıdır.
2. Yol kapasitesi hesabında `normal_uzunluk_m` yerine `faydali_uzunluk_m` kullanılmalıdır.
3. Fotoğraf/OCR ile okunan bütün vagon numaraları, toplamlar ve kritik alanlar kullanıcı tarafından doğrulanmalıdır.
4. Yazılım karar destek sistemi olacaktır; sevk uygunluğu veya emniyet onayı vermeyecektir.
5. 2026 istasyon özellikleri belgesinin eksiksiz kopyası `_v2.pdf` son ekli dosyadır. Aynı adlı son eksiz dosya başka bir süreç tarafından kilitlenmiş kısmi indirmedir ve kullanılmamalıdır.
6. `TCDD_Tren_Kodlari_Eski_Referans.pdf` eski bir belgedir; yalnız tarihsel/eğitim referansı olarak kullanılmalıdır.

## Uygulamanın beklediği günlük asgari veri

- Vagonun tam numarası
- Bulunduğu yol
- Yol içindeki fiziksel sıra
- Yolun hangi ucundan erişildiği
- Varış istasyonu/ili
- Koşum türü
- Dolu/boş ve gümrük durumu
- Net, brüt, dingil, uzunluk ve fren değerleri
- Arıza/atölyelik durumu
- Emniyet vagonu olarak kullanılabilirlik

## Doğrulanması gereken saha bilgileri

- Belgede 8 sivil istasyon yolu görünmesine karşılık önceki sözlü bilgide 7 gar yolu belirtilmişti.
- 6. İskele Sağ Eksen Ara Yol ölçüleri fotoğrafta seçilemiyor.
- Makas numaraları, yolların erişilebilir uçları ve manevra yönleri krokiden kesinleştirilemedi.

