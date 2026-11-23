function sumBy(items, field) {
  return items.reduce((total, item) => total + Number(item[field] || 0), 0);
}

function getTrackUsage(trackId, tracks, wagons) {
  const track = tracks.find((item) => item.id === trackId);
  if (!track) return null;
  const onTrack = wagons.filter((wagon) => wagon.trackId === trackId);
  const used = sumBy(onTrack, 'length');

  // Uzunluğu sıfır olan vagonları tespit et — kapasite hesabını yanıltır
  const zeroLengthWagons = onTrack.filter((w) => w.length === 0);

  return {
    ...track,
    wagons: onTrack,
    used,
    remaining: Math.max(0, track.useful - used),
    percentage: track.useful ? Math.min(100, Math.round((used / track.useful) * 100)) : 0,
    overflow: used > track.useful,
    // Taşma uyarısı: used > useful olduğunda mesaj üret
    overflowWarning: used > track.useful
      ? `Yol doluluk taşması: kullanılan ${used.toFixed(1)} m > faydalı ${track.useful} m`
      : null,
    // Uzunluğu eksik vagon uyarısı
    zeroLengthWarning: zeroLengthWagons.length > 0
      ? `${zeroLengthWagons.length} vagonun uzunluğu 0; kapasite hesabı eksik kalıyor: ${zeroLengthWagons.map((w) => w.number).join(', ')}`
      : null,
  };
}

function buildConsist(wagons, destinationOrder = ['Tatvan', 'Van', 'İran']) {
  const rank = new Map(destinationOrder.map((name, index) => [name, index]));

  // Emniyet vagonlarını önce ayır; sıralama yalnızca normal vagonlara uygulansın
  const safetyWagons = wagons.filter((w) => w.safety);
  const regularWagons = wagons.filter((w) => !w.safety);

  const sortedRegular = [...regularWagons].sort((a, b) => {
    const destinationDelta = (rank.get(b.destination) ?? 999) - (rank.get(a.destination) ?? 999);
    if (destinationDelta) return destinationDelta;
    return a.coupling.localeCompare(b.coupling, 'tr');
  });

  // Dizi: [baş emniyet] + [normal vagonlar] + [son emniyet]
  const result = [...sortedRegular];
  if (safetyWagons[0]) result.unshift(safetyWagons[0]);
  if (safetyWagons[1]) result.push(safetyWagons[1]);

  const warnings = [];
  if (safetyWagons.length < 2) warnings.push('Baş ve son için iki emniyet vagonu bulunamadı.');
  for (let index = 1; index < result.length; index += 1) {
    if (result[index - 1].coupling !== result[index].coupling) {
      warnings.push(`${index}. ve ${index + 1}. vagon arasında koşum geçişi doğrulanmalı.`);
    }
  }
  if (result.some((wagon) => wagon.series === 'Z' || /akaryakıt|tehlikeli/i.test(wagon.cargo))) {
    warnings.push('Tehlikeli/sarnıç yükü için RID ve koruyucu vagon kuralı yetkili personelce doğrulanmalı.');
  }

  // Uzunluğu 0 olan vagonlar dizideyse uyar
  const zeroLen = result.filter((w) => w.length === 0);
  if (zeroLen.length > 0) {
    warnings.push(`${zeroLen.length} vagonun uzunluğu bilinmiyor; toplam uzunluk hesabı eksik: ${zeroLen.map((w) => w.number).join(', ')}`);
  }

  return {
    wagons: result,
    totalLength: sumBy(result, 'length'),
    totalGross: sumBy(result, 'gross'),
    warnings: [...new Set(warnings)],
  };
}

module.exports = { sumBy, getTrackUsage, buildConsist };
