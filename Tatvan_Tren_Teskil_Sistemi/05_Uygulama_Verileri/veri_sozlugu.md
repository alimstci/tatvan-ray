# Uygulama Veri Sözlüğü

## Yol

- `alan`: Yolun bağlı olduğu saha grubu.
- `yol_adi`: Sahada kullanılan yol adı/numarası.
- `normal_uzunluk_m`: Yolun fiziksel toplam uzunluğu.
- `faydali_uzunluk_m`: Emniyet sınırları içinde kullanılabilecek kapasite.
- `erisilebilir_uclar`: `tek`, `iki` veya `teyit_gerekli`.
- `durum`: `acik`, `kapali`, `kisitli`.

## Vagon

- `vagon_no`: Tam UIC vagon numarası.
- `mevcut_yol`: Vagonun bulunduğu yol.
- `yoldaki_sira`: Tanımlanmış referans uçtan sıra.
- `referans_uc`: Makas/rampa/feribot yönü gibi açık tanım.
- `varis`: İl veya istasyon kodu.
- `kosum_turu`: `manuel`, `otomatik`, `adaptorlu`, `bilinmiyor`.
- `dolu_bos`: `dolu`, `bos`.
- `gumruk_durumu`: `gumruklu`, `gumruksuz`, `bilinmiyor`.
- `net_ton`, `brut_ton`, `fren_degeri`, `uzunluk_m`, `dingil_sayisi`.
- `tehlikeli_yuk`: RID sınıfı veya `yok`.
- `teknik_durum`: `sefere_uygun`, `atolyelik`, `kontrol_bekliyor`.
- `emniyet_vagonu_uygun`: Yetkili kurala göre `evet`, `hayir`, `teyit_gerekli`.

## Teşkil planı

- `hedef_sira`: Lokomotif veya açıkça tanımlanmış referans uçtan sıra.
- `varis_grubu`: Aynı varış noktasına giden vagon grubu.
- `kosum_grubu`: Uyumlu koşum araçlarının grubu.
- `emniyet_rolu`: `bas`, `son`, `yok`.
- `kaynak_yol`, `kaynak_sira`: Vagonun alınacağı konum.
- `dogrulama_durumu`: `taslak`, `kullanici_onayli`, `yetkili_onayli`.

## OCR alanı

- `ham_deger`: OCR'ın doğrudan okuduğu metin.
- `normalize_deger`: Biçimlendirilmiş değer.
- `guven_puani`: OCR güveni.
- `kaynak_gorsel`: Dosya ve mümkünse hücre koordinatı.
- `kullanici_onayi`: Kritik alanın insan tarafından kontrol edilip edilmediği.

