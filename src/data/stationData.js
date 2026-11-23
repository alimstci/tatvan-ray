const track = (id, group, name, normal, useful, start, end, status = 'active') => ({
  id, group, name, normal, useful, start, end, status,
});

const tracks = [
  track('askeri-1', 'Askerî Rampa', '1. Yol', 422, 374, '368+074', '368+496'),
  track('askeri-2', 'Askerî Rampa', '2. Yol', 266, 169, '368+276', '368+542'),
  track('askeri-3', 'Askerî Rampa', '3. Yol', 310, 213, '368+276', '368+586'),
  track('askeri-kor', 'Askerî Rampa', '4. Kör Yol', 64, 16, '368+496', '368+560'),
  track('gar-1', 'Sivil İstasyon', 'Gar 1. Yol', 641, 544, '368+603 (makas başı)', '369+244'),
  track('gar-2', 'Sivil İstasyon', 'Gar 2. Yol', 641, 544, '368+603 (makas başı)', '369+244'),
  track('gar-3', 'Sivil İstasyon', 'Gar 3. Yol', 788, 691, '368+496 (makas başı)', '369+284'),
  track('gar-4', 'Sivil İstasyon', 'Gar 4. Yol', 918, 819, '368+430 (makas başı)', '369+347'),
  track('gar-5', 'Sivil İstasyon', 'Gar 5. Yol', 872, 775, '368+474 (makas başı)', '369+346'),
  track('gar-6', 'Sivil İstasyon', 'Gar 6. Yol', 781, 684, '368+520 (makas başı)', '369+301'),
  track('gar-7', 'Sivil İstasyon', 'Gar 7. Yol', 684, 589, '368+571 (makas başı)', '369+257'),
  track('gar-8', 'Sivil İstasyon', 'Gar 8. Yol', 768, 720, '368+571 (makas başı)', '369+339'),
  track('tahliye-9', 'Tahliye', '9. Yol', 323, 226, '369+339', '369+662'),
  track('tahliye-10', 'Tahliye', '10. Yol', 337, 289, '369+339', '369+676'),
  track('akaryakit', 'Akaryakıt / Depo', 'Akaryakıt Yolu', 180, 132, '369+681', '369+861'),
  track('depo-1', 'Akaryakıt / Depo', 'Depo Yolu 1', 97, 49, '369+738', '369+835'),
  track('depo-2', 'Akaryakıt / Depo', 'Depo Yolu 2', 97, 49, '369+738', '369+835'),
  track('ambar-1', 'Ambar', 'Ambar 1. Yol', 679, 630, '369+163', '369+842'),
  track('ambar-2', 'Ambar', 'Ambar 2. Yol', 626, 529, '369+117', '369+743'),
  track('ambar-3', 'Ambar', 'Ambar 3. Yol', 309, 212, '369+395', '369+704'),
  track('ambar-4', 'Ambar', 'Ambar 4. Yol', 329, 232, '369+354', '369+683'),
  track('ambar-5', 'Ambar', 'Ambar 5. Yol', 397, 350, '369+313', '369+710'),
  track('ambar-6', 'Ambar', 'Ambar 6. Yol', 258, 210, '369+452', '369+710'),
  track('ambar-kor', 'Ambar', 'Ambar Kör Yol', 467, 418, '369+163', '369+630'),
  track('rahova-1', 'Rahova İstasyonu', 'Rahova 1. Yol', 1016, 921, '355+167', '356+183'),
  track('rahova-2', 'Rahova İstasyonu', 'Rahova 2. Yol', 1016, 921, '355+167', '356+183'),
  track('iskele-yuk-1', 'İskele / Yük', 'Yük 1. Yol', 390, 293, '3+916', '4+306'),
  track('iskele-yuk-2', 'İskele / Yük', 'Yük 2. Yol', 390, 293, '3+916', '4+306'),
  track('iskele-yuk-3', 'İskele / Yük', 'Yük 3. Yol', 381, 333, '3+879', '4+260'),
  track('iskele-yuk-4', 'İskele / Yük', 'Yük 4. Yol', 420, 372, '3+843', '4+263'),
  track('iskele-sol-1', 'İskele / Sol Eksen', 'Sol Eksen 1. Yol', 264, 216, '4+341', '4+605'),
  track('iskele-sol-2', 'İskele / Sol Eksen', 'Sol Eksen 2. Yol', 230, 182, '4+375', '4+605'),
  track('iskele-sol-3', 'İskele / Sol Eksen', 'Sol Eksen 3. Yol', 196, 148, '4+409', '4+605'),
  track('iskele-sol-4', 'İskele / Sol Eksen', 'Sol Eksen 4. Yol', 196, 148, '4+409', '4+605'),
  track('iskele-sag-1', 'İskele / Sağ Eksen', 'Sağ Eksen 1. Yol', 160, 160, '4+431', '4+591'),
  track('iskele-sag-2', 'İskele / Sağ Eksen', 'Sağ Eksen 2. Yol', 235, 187, '4+356', '4+591'),
  track('iskele-sag-3', 'İskele / Sağ Eksen', 'Sağ Eksen 3. Yol', 277, 226, '4+315', '4+591'),
  track('iskele-sag-4', 'İskele / Sağ Eksen', 'Sağ Eksen 4. Yol', 318, 270, '4+273', '4+591'),
  track('iskele-ara-sol-5', 'İskele / Ara Yol', 'Sol Eksen Ara 5. Yol', 458, 410, '3+806', '4+264'),
  track('iskele-ara-sag-7', 'İskele / Ara Yol', 'Sağ Eksen Ara 7. Yol', 241, 193, '3+913', '4+154'),
  track('iskele-akaryakit-8', 'İskele / Ara Yol', 'Akaryakıt 8. Yol', 236, 188, '4+264', '4+500'),
];

const sampleWagons = [
  { id: 'W-3547120-3', number: '3547 120-3', series: 'Fas', destination: 'Van', trackId: 'gar-3', length: 14.2, gross: 64, coupling: 'Manuel', cargo: 'Gümrüklü', safety: false },
  { id: 'W-3180441-8', number: '3180 441-8', series: 'Rll', destination: 'İran', trackId: 'gar-3', length: 15.1, gross: 58, coupling: 'Manuel', cargo: 'Konteyner', safety: false },
  { id: 'W-3350890-1', number: '3350 890-1', series: 'Ea', destination: 'Van', trackId: 'ambar-2', length: 14.0, gross: 22, coupling: 'Manuel', cargo: 'Boş', safety: true },
  { id: 'W-8450012-4', number: '8450 012-4', series: 'Z', destination: 'İran', trackId: 'akaryakit', length: 13.7, gross: 71, coupling: 'Otomatik', cargo: 'Akaryakıt', safety: false },
  { id: 'W-3788122-0', number: '3788 122-0', series: 'F', destination: 'İran', trackId: 'gar-7', length: 14.6, gross: 68, coupling: 'Otomatik', cargo: 'Dökme yük', safety: false },
  { id: 'W-3199011-6', number: '3199 011-6', series: 'R', destination: 'Van', trackId: 'gar-7', length: 15.0, gross: 24, coupling: 'Manuel', cargo: 'Boş', safety: true },
];

const operationalRules = [
  { id: 'destination', title: 'Varış sırası', detail: 'İlk bırakılacak istasyon vagonları dizinin kuyruk tarafında planlanır.', level: 'Teyit gerekli' },
  { id: 'coupling', title: 'Koşum uyumu', detail: 'Manuel ve otomatik koşum grupları ayrılır; geçiş noktası/adaptör ihtiyacı ayrıca kontrol edilir.', level: 'Kritik' },
  { id: 'safety', title: 'Emniyet vagonları', detail: 'Dizinin başı ve sonu için uygun emniyet vagonu seçimi saha yetkilisince doğrulanır.', level: 'Kritik' },
  { id: 'capacity', title: 'Faydalı uzunluk', detail: 'Dizinin toplam boyu seçilen yolun faydalı uzunluğunu aşamaz.', level: 'Kritik' },
  { id: 'brake', title: 'Fren ve tonaj', detail: 'Fren ağırlığı, brüt tonaj ve resmî 5600 belgesi kontrolleri yetkili sistem/belge üzerinden yapılır.', level: 'Haricî doğrulama' },
];

module.exports = { tracks, sampleWagons, operationalRules };
