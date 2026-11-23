import '../models/track.dart';

Track _t(String id, String group, String name, double normal, double useful, String start, String end, [String status = 'active']) {
  return Track(
    id: id,
    group: group,
    name: name,
    normal: normal,
    useful: useful,
    start: start,
    end: end,
    status: status,
  );
}

final List<Track> stationTracks = [
  _t('askeri-1', 'Askerî Rampa', '1. Yol', 422, 374, '368+074', '368+496'),
  _t('askeri-2', 'Askerî Rampa', '2. Yol', 266, 169, '368+276', '368+542'),
  _t('askeri-3', 'Askerî Rampa', '3. Yol', 310, 213, '368+276', '368+586'),
  _t('askeri-kor', 'Askerî Rampa', '4. Kör Yol', 64, 16, '368+496', '368+560'),
  _t('gar-1', 'Sivil İstasyon', 'Gar 1. Yol', 641, 544, '368+603 (makas başı)', '369+244'),
  _t('gar-2', 'Sivil İstasyon', 'Gar 2. Yol', 641, 544, '368+603 (makas başı)', '369+244'),
  _t('gar-3', 'Sivil İstasyon', 'Gar 3. Yol', 788, 691, '368+496 (makas başı)', '369+284'),
  _t('gar-4', 'Sivil İstasyon', 'Gar 4. Yol', 918, 819, '368+430 (makas başı)', '369+347'),
  _t('gar-5', 'Sivil İstasyon', 'Gar 5. Yol', 872, 775, '368+474 (makas başı)', '369+346'),
  _t('gar-6', 'Sivil İstasyon', 'Gar 6. Yol', 781, 684, '368+520 (makas başı)', '369+301'),
  _t('gar-7', 'Sivil İstasyon', 'Gar 7. Yol', 684, 589, '368+571 (makas başı)', '369+257'),
  _t('gar-8', 'Sivil İstasyon', 'Gar 8. Yol', 768, 720, '368+571 (makas başı)', '369+339'),
  _t('tahliye-9', 'Tahliye', '9. Yol', 323, 226, '369+339', '369+662'),
  _t('tahliye-10', 'Tahliye', '10. Yol', 337, 289, '369+339', '369+676'),
  _t('akaryakit', 'Akaryakıt / Depo', 'Akaryakıt Yolu', 180, 132, '369+681', '369+861'),
  _t('depo-1', 'Akaryakıt / Depo', 'Depo Yolu 1', 97, 49, '369+738', '369+835'),
  _t('depo-2', 'Akaryakıt / Depo', 'Depo Yolu 2', 97, 49, '369+738', '369+835'),
  _t('ambar-1', 'Ambar', 'Ambar 1. Yol', 679, 630, '369+163', '369+842'),
  _t('ambar-2', 'Ambar', 'Ambar 2. Yol', 626, 529, '369+117', '369+743'),
  _t('ambar-3', 'Ambar', 'Ambar 3. Yol', 309, 212, '369+395', '369+704'),
  _t('ambar-4', 'Ambar', 'Ambar 4. Yol', 329, 232, '369+354', '369+683'),
  _t('ambar-5', 'Ambar', 'Ambar 5. Yol', 397, 350, '369+313', '369+710'),
  _t('ambar-6', 'Ambar', 'Ambar 6. Yol', 258, 210, '369+452', '369+710'),
  _t('ambar-kor', 'Ambar', 'Ambar Kör Yol', 467, 418, '369+163', '369+630'),
  _t('rahova-1', 'Rahova İstasyonu', 'Rahova 1. Yol', 1016, 921, '355+167', '356+183'),
  _t('rahova-2', 'Rahova İstasyonu', 'Rahova 2. Yol', 1016, 921, '355+167', '356+183'),
  _t('iskele-yuk-1', 'İskele / Yük', 'Yük 1. Yol', 390, 293, '3+916', '4+306'),
  _t('iskele-yuk-2', 'İskele / Yük', 'Yük 2. Yol', 390, 293, '3+916', '4+306'),
  _t('iskele-yuk-3', 'İskele / Yük', 'Yük 3. Yol', 381, 333, '3+879', '4+260'),
  _t('iskele-yuk-4', 'İskele / Yük', 'Yük 4. Yol', 420, 372, '3+843', '4+263'),
  _t('iskele-sol-1', 'İskele / Sol Eksen', 'Sol Eksen 1. Yol', 264, 216, '4+341', '4+605'),
  _t('iskele-sol-2', 'İskele / Sol Eksen', 'Sol Eksen 2. Yol', 230, 182, '4+375', '4+605'),
  _t('iskele-sol-3', 'İskele / Sol Eksen', 'Sol Eksen 3. Yol', 196, 148, '4+409', '4+605'),
  _t('iskele-sol-4', 'İskele / Sol Eksen', 'Sol Eksen 4. Yol', 196, 148, '4+409', '4+605'),
  _t('iskele-sag-1', 'İskele / Sağ Eksen', 'Sağ Eksen 1. Yol', 160, 160, '4+431', '4+591'),
  _t('iskele-sag-2', 'İskele / Sağ Eksen', 'Sağ Eksen 2. Yol', 235, 187, '4+356', '4+591'),
  _t('iskele-sag-3', 'İskele / Sağ Eksen', 'Sağ Eksen 3. Yol', 277, 226, '4+315', '4+591'),
  _t('iskele-sag-4', 'İskele / Sağ Eksen', 'Sağ Eksen 4. Yol', 318, 270, '4+273', '4+591'),
  _t('iskele-ara-sol-5', 'İskele / Ara Yol', 'Sol Eksen Ara 5. Yol', 458, 410, '3+806', '4+264'),
  _t('iskele-ara-sag-7', 'İskele / Ara Yol', 'Sağ Eksen Ara 7. Yol', 241, 193, '3+913', '4+154'),
  _t('iskele-akaryakit-8', 'İskele / Ara Yol', 'Akaryakıt 8. Yol', 236, 188, '4+264', '4+500'),
];

class OperationalRule {
  final String id;
  final String title;
  final String detail;
  final String level;

  OperationalRule({
    required this.id,
    required this.title,
    required this.detail,
    required this.level,
  });
}

final List<OperationalRule> operationalRules = [
  OperationalRule(
    id: 'destination',
    title: 'Varış sırası',
    detail: 'İlk bırakılacak istasyon vagonları dizinin kuyruk tarafında planlanır.',
    level: 'Teyit gerekli',
  ),
  OperationalRule(
    id: 'coupling',
    title: 'Koşum uyumu',
    detail: 'Manuel ve otomatik koşum grupları ayrılır; geçiş noktası/adaptör ihtiyacı ayrıca kontrol edilir.',
    level: 'Kritik',
  ),
  OperationalRule(
    id: 'safety',
    title: 'Emniyet vagonları',
    detail: 'Dizinin başı ve sonu için uygun emniyet vagonu seçimi saha yetkilisince doğrulanır.',
    level: 'Kritik',
  ),
  OperationalRule(
    id: 'capacity',
    title: 'Faydalı uzunluk',
    detail: 'Dizinin toplam boyu seçilen yolun faydalı uzunluğunu aşamaz.',
    level: 'Kritik',
  ),
  OperationalRule(
    id: 'brake',
    title: 'Fren ve tonaj',
    detail: 'Fren ağırlığı, brüt tonaj ve resmî 5600 belgesi kontrolleri yetkili sistem/belge üzerinden yapılır.',
    level: 'Haricî doğrulama',
  ),
];
