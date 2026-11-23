function normalizeText(value = '') {
  return value
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .replace(/[|]/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeWagonNumber(value = '') {
  const digits = value.replace(/[^0-9]/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 11)}-${digits.slice(11)}`;
  }
  if (digits.length === 8) return `${digits.slice(0, 4)} ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return value.replace(/\s+/g, ' ').trim();
}

function wagonNumberIsPlausible(value = '') {
  return /^(?:\d{2} \d{2} )?\d{4} \d{3}-\d$/.test(normalizeWagonNumber(value));
}

function findHeaderNumber(text, label) {
  const expression = new RegExp(`${label}\\s*[:=]?\\s*(\\d+(?:[.,]\\d+)?)`, 'i');
  const match = normalizeText(text).match(expression);
  return match ? Number(match[1].replace(',', '.')) : null;
}

function extractWagonCandidates(text = '') {
  const normalized = normalizeText(text);
  const patterns = [/\b\d{2}\s+\d{2}\s+\d{4}\s+\d{3}\s*[- ]\s*\d\b/g, /\b\d{4}\s+\d{3}\s*[- ]\s*\d\b/g];
  const found = [];
  patterns.forEach((pattern, patternIndex) => {
    for (const match of normalized.matchAll(pattern)) {
      const start = match.index;
      const end = start + match[0].length;
      if (patternIndex > 0 && found.some((item) => start >= item.index && end <= item.end)) continue;
      const number = normalizeWagonNumber(match[0]);
      if (!found.some((item) => item.number === number)) found.push({ number, index: start, end });
    }
  });
  return found.sort((a, b) => a.index - b.index);
}

function nearbyContext(text, index, radius = 90) {
  return normalizeText(text.slice(Math.max(0, index - radius), Math.min(text.length, index + radius)));
}

/**
 * Varış istasyonu anahtar kelime listesi.
 * Her giriş: { keys: string[], destination: string }
 * İlk eşleşen istasyon adı döner.
 * ÖNEMLİ: Daha uzun/spesifik isimler önce gelmeli (TATVAN, VAN'dan önce).
 * Yeni istasyonlar buraya eklenerek genişletilebilir.
 */
const DESTINATION_KEYWORDS = [
  { keys: ['IRAN', 'İRAN'], destination: 'İran' },
  // TATVAN, VAN'dan önce gelmeli — aksi hâlde 'TATVAN' içinde 'VAN' eşleşir
  { keys: ['TATVAN'], destination: 'Tatvan' },
  { keys: ['VAN'], destination: 'Van' },
  { keys: ['ELAZIG', 'ELAZIĞ', 'ELAZİĞ'], destination: 'Elazığ' },
  { keys: ['MALATYA'], destination: 'Malatya' },
  { keys: ['ISKENDERUN', 'İSKENDERUN'], destination: 'İskenderun' },
  { keys: ['MERSIN', 'MERSİN'], destination: 'Mersin' },
  { keys: ['ISTANBUL', 'İSTANBUL'], destination: 'İstanbul' },
  { keys: ['HAYDARPASA', 'HAYDARPAŞA'], destination: 'Haydarpaşa' },
  { keys: ['ERZURUM'], destination: 'Erzurum' },
  { keys: ['KARS'], destination: 'Kars' },
  { keys: ['DIYARBAKIR', 'DİYARBAKIR'], destination: 'Diyarbakır' },
  { keys: ['ADANA'], destination: 'Adana' },
  { keys: ['GAZIANTEP'], destination: 'Gaziantep' },
  { keys: ['SIVAS'], destination: 'Sivas' },
  { keys: ['ANKARA'], destination: 'Ankara' },
  { keys: ['KONYA'], destination: 'Konya' },
];

/**
 * Metin içindeki en yakın varış istasyonunu bulur.
 * Listedeki sıraya göre öncelik verilir; eşleşme yoksa 'Bilinmiyor' döner.
 */
function detectDestination(upperContext) {
  for (const { keys, destination } of DESTINATION_KEYWORDS) {
    if (keys.some((k) => upperContext.includes(k))) return destination;
  }
  return 'Bilinmiyor';
}

function parseOcrDocument(text = '') {
  const candidates = extractWagonCandidates(text);
  const wagons = candidates.map((candidate, index) => {
    const context = nearbyContext(text, candidate.index);
    const upper = context.toLocaleUpperCase('tr');
    const destination = detectDestination(upper);
    const safety = upper.includes('EMNIYET') || upper.includes('EMNİYET');
    const cargo = safety ? 'Emniyet' : upper.includes('GUMRUKLU') || upper.includes('GÜMRÜKLÜ') ? 'Gümrüklü' : 'Belirtilmedi';
    return {
      // Tekil ID: Date.now() yerine index + rastgele suffix kullan (eş zamanlı çağrılarda çakışmayı önler)
      id: `OCR-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      number: candidate.number,
      destination,
      coupling: 'Bilinmiyor',
      cargo,
      safety,
      trackId: null,
      trackPosition: null,
      length: 0,
      gross: 0,
      series: '—',
      confirmed: false,
      confidence: wagonNumberIsPlausible(candidate.number) ? 'orta' : 'dusuk',
      sourceContext: context,
    };
  });

  const declaredWagons = findHeaderNumber(text, 'vagon');
  const declaredAxles = findHeaderNumber(text, 'dingil');
  const warnings = [];
  if (!wagons.length) warnings.push('Vagon numarası otomatik olarak bulunamadı. Görsel kalitesini veya kırpmayı kontrol edin.');
  if (declaredWagons !== null && declaredWagons !== wagons.length) warnings.push(`Başlıkta ${declaredWagons} vagon yazıyor; OCR ${wagons.length} benzersiz vagon numarası buldu.`);
  if (declaredAxles !== null && declaredWagons !== null && declaredAxles !== declaredWagons * 4) warnings.push('Başlıktaki dingil ve vagon toplamları dört dingilli araç varsayımıyla uyuşmuyor.');
  if (wagons.some((wagon) => wagon.destination === 'Bilinmiyor')) warnings.push('Bazı varış bilgileri okunamadı; elle doğrulanmalı.');

  return {
    rawText: text,
    header: { declaredWagons, declaredAxles },
    wagons,
    warnings,
  };
}

module.exports = { normalizeText, normalizeWagonNumber, wagonNumberIsPlausible, extractWagonCandidates, detectDestination, parseOcrDocument };

