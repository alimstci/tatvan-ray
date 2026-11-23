# Tatvan Ray — Flutter & GitHub Actions Bulut Derleme Kılavuzu

> **Durum:** Flutter projesi ve CI/CD altyapısı başarıyla kuruldu.  
> **Gereksinim:** Bilgisayarınıza **hiçbir program (Flutter, Android Studio, Java) kurmanıza gerek yoktur.** Tüm derleme GitHub bulutunda gerçekleşir.

---

## 1. Mimari ve Dosya Yapısı

Proje dosyaları oluşturuldu:

```text
├── .github/workflows/
│   └── build_apk.yml              # GitHub Actions otomatik APK derleme hattı
├── lib/
│   ├── data/
│   │   └── station_data.dart      # 41 adet sabit Tatvan Garı yolu ve mevzuat kuralları
│   ├── models/
│   │   ├── wagon.dart             # Vagon veri modeli (çift yön Depo/Rahva sırası, UIC, uzunluk)
│   │   ├── track.dart             # Yol ve doluluk kapasite modeli (faydalı uzunluk, taşma)
│   │   └── consist.dart           # Tren teşkil dizisi modeli
│   ├── services/
│   │   ├── xlsx_importer_service.dart # Excel ayrıştırıcı (25 sayfa, mükerrer, eksik UIC tespiti)
│   │   ├── planner_service.dart   # Yol doluluk kapasitesi ve taslak dizi oluşturma
│   │   ├── ocr_parser_service.dart# Google ML Kit tabanlı çevrimdışı teşkil belgesi okuma
│   │   └── local_store_service.dart# SharedPreferences ile internetsiz yerel veri saklama
│   └── main.dart                  # 5 sekmeli (Günlük, Yollar, Tara, Dizi, Kurallar) Material 3 arayüzü
├── test/
│   └── app_logic_test.dart        # Dart & Flutter birim ve entegrasyon testleri
└── pubspec.yaml                   # Paket ve bağımlılık tanımları
```

---

## 2. GitHub'a Bağlama ve APK Alma Adımları

Bilgisayarınızda terminalden sırasıyla şu adımları yapmanız yeterlidir:

### Adım 1: GitHub'da Yeni Bir Depo (Repository) Açın
1. [GitHub](https://github.com) hesabınıza girin.
2. Sağ üstten **New repository** seçeneğine tıklayın.
3. Depo adı olarak örneğin `tatvan-ray-flutter` yazın.
4. **Public** veya **Private** seçebilirsiniz (GitHub Actions her ikisinde de ücretsiz çalışır).
5. "Create repository" butonuna basın.

### Adım 2: Kodu GitHub'a Gönderin (Push)
Terminalde projenin olduğu klasörde şu komutları çalıştırın (kendi kullanıcı adı ve repo adınızı yazarak):

```powershell
git commit -m "feat: Flutter mimarisi ve GitHub Actions bulut derleme eklendi"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/tatvan-ray-flutter.git
git push -u origin main
```

*(Eğer daha önce remote eklediyseniz `git push origin main` yeterlidir.)*

---

## 3. APK'yı İndirme (GitHub Actions)

1. GitHub'da deponuzun sayfasına gidin.
2. Üst menüdeki **Actions** sekmesine tıklayın.
3. **Build Android APK** adlı iş akışının çalıştığını göreceksiniz.
4. Yaklaşık 2-3 dakika içinde derleme tamamlanacak ve yeşil onay işareti (✅) çıkacaktır.
5. Tamamlanan göreve tıklayın; sayfanın en altında **Artifacts** bölümünde **`Tatvan-Ray-Release-APK`** dosyasını göreceksiniz.
6. Tıklayıp `.apk` dosyasını doğrudan telefonunuza indirin ve kurun!

---

## 4. Yetenekler ve Algoritmik Güvenceler

- **%100 Çevrimdışı Çalışma:** Excel seçme, yerel depolama ve fotoğraftan OCR işlemleri telefonun kendi donanımında gerçekleşir; hiçbir veri sunucuya gitmez.
- **Depo → Rahva Çift Yönlü Sıralama:** Vagonların iki cihetten sıra numaraları otomatik hesaplanır.
- **Eksik UIC ve Mükerrer Kontrolü:** Eksik kontrol numaralı veya birden fazla yolda mükerrer olan vagonlar anında tespit edilir ve kullanıcıya şeffaf raporlanır.
- **Referanstan Uzunluk Tamamlama:** Uzunluğu boş gelen vagonlar, `vagonlar` referans sayfasındaki seri bilgisine göre otomatik doldurulur.
