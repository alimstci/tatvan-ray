const XLSX = require('xlsx');

const SHEET_TRACK_MAP = {
  'R1': 'askeri-1', 'R2': 'askeri-2', 'R3': 'askeri-3', 'KOR YOL': 'askeri-kor',
  '2 YOL': 'gar-2', '3 YOL': 'gar-3', '4 YOL': 'gar-4', '5 YOL': 'gar-5',
  '6 YOL': 'gar-6', '7 YOL': 'gar-7', '8 YOL': 'gar-8', '9 YOL': 'tahliye-9', '10 YOL': 'tahliye-10',
  'ATOLYE1': 'atolye-1', 'ATOLYE2': 'atolye-2', 'ATOLYE3': 'atolye-3', 'ATOLYE4': 'atolye-4', 'ATOLYE5': 'atolye-5',
  'YY1': 'yeni-1', 'YY2': 'yeni-2', 'YY3': 'yeni-3', 'TAMIR YOLU': 'tamir-yolu', 'FERIBOT SAHASI': 'feribot-sahasi',
};

// Satır limiti: Yol sayfalarındaki maksimum fiziksel vagon satırı.
// 95 idi; 4 YOL'da 31 vagon okundu (satır 11-41), güvenlik payı ile 150'ye çekildi.
// Bu değer ileride yapılandırılabilir hale getirilebilir.
const MAX_WAGON_ROWS = 150;

function asciiKey(value = '') {
  return String(value).toLocaleUpperCase('tr').replace(/İ/g, 'I').replace(/Ş/g, 'S').replace(/Ğ/g, 'G').replace(/Ü/g, 'U').replace(/Ö/g, 'O').replace(/Ç/g, 'C').replace(/[^A-Z0-9]+/g, ' ').trim();
}

function cleanPart(value) {
  if (value === null || value === undefined || value === '') return '';
  return String(value).replace(/\.0$/, '').trim();
}

function fullWagonNumber(row) {
  const parts = [cleanPart(row[5]), cleanPart(row[6]), cleanPart(row[7]), cleanPart(row[8])];
  if (!parts[2] || !parts[3]) return '';
  return parts.filter(Boolean).join(' ').replace(/\s+-\s+/g, '-');
}

/**
 * Eksik UIC numarasına sahip satırı analiz eder.
 * H sütunu (index 7) var ama I sütunu (index 8) yoksa kısmi kayıt olarak işaretler.
 */
function partialWagonInfo(row) {
  const h = cleanPart(row[7]);
  const i = cleanPart(row[8]);
  const hasSerial = cleanPart(row[5]) || cleanPart(row[6]);
  // En az H sütununda değer varsa kayıt girilmiş ama eksik demektir
  if (h && !i) return { partial: true, hint: `H=${h}` };
  if (!h && !i && hasSerial) return { partial: true, hint: `F/G=${hasSerial}` };
  return { partial: false };
}

function dynamicTrack(id, sheetName) {
  return { id, name: sheetName, group: 'Günlük Excel', normal: 0, useful: 0, start: '—', end: '—', status: 'active', sourceSheet: sheetName, capacityNeedsReview: true };
}

/**
 * 'vagonlar' referans sayfasından seri → uzunluk haritası oluşturur.
 * Gerçek sütun düzeni (0 tabanlı indeks):
 *   [1] = Seri no (sayısal), [2] = Cinsi (Ea, Ha, vb.), [6] = metre
 * Birden fazla satır aynı Cinsi'ye sahip olabilir; en uzun değer alınır
 * (bazı serilerde birden fazla alt tip var, güvenli taraf uzun olandır).
 */
function buildSeriesLengthMap(workbook) {
  const map = new Map();
  const sheet = workbook.Sheets['vagonlar'];
  if (!sheet) return map;
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    // Cinsi sütunu (indeks 2): Ea, Ha, Kb vb.
    const series = cleanPart(row[2]);
    const lengthVal = Number(String(row[6]).replace(',', '.'));
    if (!series || lengthVal <= 0) continue;
    // Aynı seri için en uzun değeri tut
    const existing = map.get(series) || 0;
    if (lengthVal > existing) {
      map.set(series, lengthVal);
      map.set(series.toLocaleUpperCase('tr'), lengthVal);
      map.set(series.toLocaleLowerCase('tr'), lengthVal);
    }
  }
  return map;
}

function parseWorkbook(workbook, knownTracks = []) {
  const trackById = new Map(knownTracks.map((track) => [track.id, { ...track }]));
  const wagons = [];
  const warnings = [];
  const ignored = new Set(['ANASAYFA', 'VAGONLAR']);

  // 'vagonlar' sayfasından seri→uzunluk haritası
  const seriesLengthMap = buildSeriesLengthMap(workbook);

  // Her sayfa için atlanmış (eksik UIC) satır sayısını takip et
  const skippedBySheet = new Map();

  for (const sheetName of workbook.SheetNames) {
    const key = asciiKey(sheetName);
    if (ignored.has(key)) continue;
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
    const trackId = SHEET_TRACK_MAP[key] || `excel-${key.toLocaleLowerCase('tr').replace(/\s+/g, '-')}`;
    const existing = trackById.get(trackId);
    trackById.set(trackId, { ...(existing || dynamicTrack(trackId, sheetName)), sourceSheet: sheetName });

    let sheetSkipped = 0;

    for (let index = 10; index < Math.min(rows.length, MAX_WAGON_ROWS + 10); index += 1) {
      const row = rows[index] || [];
      const number = fullWagonNumber(row);

      if (!number) {
        // Eksik UIC kontrolü: satırda bir şeyler var ama numara tamamlanamadı
        const { partial } = partialWagonInfo(row);
        if (partial) sheetSkipped += 1;
        continue;
      }

      const positionFromDepot = wagons.filter((wagon) => wagon.trackId === trackId).length + 1;

      // Uzunluk: D sütunundan oku; 0 ise 'vagonlar' sayfasından seri ile tamamla
      let length = Number(String(row[3]).replace(',', '.')) || 0;
      const series = cleanPart(row[4]) || '—';
      let lengthFilledFromRef = false;
      if (length === 0 && series !== '—') {
        const refLength = seriesLengthMap.get(series) || seriesLengthMap.get(series.toLocaleUpperCase('tr'));
        if (refLength) {
          length = refLength;
          lengthFilledFromRef = true;
        }
      }

      wagons.push({
        id: `XLSX-${trackId}-${positionFromDepot}-${number.replace(/\D/g, '')}`,
        number,
        series,
        destination: cleanPart(row[10]) || 'Bilinmiyor',
        trackId,
        positionFromDepot,
        positionFromRahva: null,
        length,
        lengthFilledFromRef,
        axles: Number(row[2]) || 0,
        net: Number(String(row[11]).replace(',', '.')) || 0,
        gross: Number(String(row[12]).replace(',', '.')) || 0,
        brake: Number(String(row[13]).replace(',', '.')) || 0,
        coupling: 'Bilinmiyor',
        cargo: 'Belirtilmedi',
        safety: false,
        source: 'daily-xlsx',
        sourceSheet: sheetName,
        sourceRow: index + 1,
      });
    }

    if (sheetSkipped > 0) {
      skippedBySheet.set(sheetName, sheetSkipped);
    }
  }

  const counts = new Map();
  wagons.forEach((wagon) => counts.set(wagon.trackId, (counts.get(wagon.trackId) || 0) + 1));
  wagons.forEach((wagon) => { wagon.positionFromRahva = (counts.get(wagon.trackId) || 0) - wagon.positionFromDepot + 1; });

  const numberCounts = new Map();
  wagons.forEach((wagon) => numberCounts.set(wagon.number, (numberCounts.get(wagon.number) || 0) + 1));
  const duplicates = [...numberCounts.entries()].filter(([, count]) => count > 1).map(([number]) => number);
  const duplicateGroups = duplicates.map((number) => ({
    number,
    occurrences: wagons.filter((wagon) => wagon.number === number).map((wagon) => ({
      trackId: wagon.trackId,
      sheetName: wagon.sourceSheet,
      row: wagon.sourceRow,
      positionFromDepot: wagon.positionFromDepot,
      positionFromRahva: wagon.positionFromRahva,
    })),
  }));

  // Uzunluğu sıfır kalan (referanstan da tamamlanamayan) vagonlar
  const zeroLengthWagons = wagons.filter((w) => w.length === 0);

  // Varışı bilinmeyen vagonlar
  const unknownDestinationCount = wagons.filter((w) => w.destination === 'Bilinmiyor').length;

  // Referanstan uzunluğu tamamlanan vagonlar
  const lengthFilledCount = wagons.filter((w) => w.lengthFilledFromRef).length;

  // Eksik UIC uyarıları
  if (skippedBySheet.size > 0) {
    const total = [...skippedBySheet.values()].reduce((s, n) => s + n, 0);
    const detail = [...skippedBySheet.entries()].map(([s, n]) => `${s}: ${n}`).join(', ');
    warnings.push(`${total} satır eksik UIC numarası nedeniyle atlandı (${detail}). Excel'de I sütunu boş olan satırları kontrol edin.`);
  }

  if (duplicates.length) warnings.push(`${duplicates.length} vagon numarası birden fazla yol/sırada bulundu.`);
  if (!wagons.length) warnings.push('Yol sayfalarında vagon kaydı bulunamadı.');

  // Uzunluğu hâlâ sıfır olan vagonlar için uyarı (referanstan da tamamlanamadı)
  if (zeroLengthWagons.length > 0) {
    const detail = zeroLengthWagons.map((w) => `${w.number} (${w.sourceSheet} satır ${w.sourceRow})`).join('; ');
    warnings.push(`${zeroLengthWagons.length} vagonun uzunluğu Excel'de ve referans sayfasında bulunamadı; kapasite hesabı eksik kalacak: ${detail}`);
  }

  // Varış bilgisi eksik uyarısı (çok sayıda ise sadece sayı ver)
  if (unknownDestinationCount > 0) {
    warnings.push(`${unknownDestinationCount} vagonun varış istasyonu Excel'de girilmemiş (K sütunu boş). Varış bilgisi teşkil bildiriminden eşleştirilecek.`);
  }

  return {
    wagons,
    tracks: [...trackById.values()],
    warnings,
    summary: {
      sheetCount: workbook.SheetNames.length,
      roadSheetCount: new Set(wagons.map((wagon) => wagon.trackId)).size,
      wagonCount: wagons.length,
      duplicateCount: duplicates.length,
      duplicateGroups,
      skippedCount: [...skippedBySheet.values()].reduce((s, n) => s + n, 0),
      skippedBySheet: Object.fromEntries(skippedBySheet),
      zeroLengthCount: zeroLengthWagons.length,
      lengthFilledFromRefCount: lengthFilledCount,
      unknownDestinationCount,
    },
  };
}

function importXlsxBase64(base64, knownTracks = []) {
  const workbook = XLSX.read(base64, { type: 'base64', cellFormula: false, cellHTML: false, cellStyles: false });
  return parseWorkbook(workbook, knownTracks);
}

function importXlsxBuffer(buffer, knownTracks = []) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellFormula: false, cellHTML: false, cellStyles: false });
  return parseWorkbook(workbook, knownTracks);
}

function importXlsxArrayBuffer(arrayBuffer, knownTracks = []) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellFormula: false, cellHTML: false, cellStyles: false });
  return parseWorkbook(workbook, knownTracks);
}

module.exports = { asciiKey, fullWagonNumber, partialWagonInfo, buildSeriesLengthMap, parseWorkbook, importXlsxBase64, importXlsxBuffer, importXlsxArrayBuffer };

