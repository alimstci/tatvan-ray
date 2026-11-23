import '../models/wagon.dart';

class OcrDocumentResult {
  final String rawText;
  final int? declaredWagons;
  final int? declaredAxles;
  final List<Wagon> wagons;
  final List<String> warnings;

  OcrDocumentResult({
    required this.rawText,
    this.declaredWagons,
    this.declaredAxles,
    required this.wagons,
    required this.warnings,
  });
}

class OcrParserService {
  static String normalizeText(String value) {
    return value
        .replaceAll('İ', 'I')
        .replaceAll('ı', 'i')
        .replaceAll('|', ' ')
        .replaceAll('–', '-')
        .replaceAll('—', '-')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  static String normalizeWagonNumber(String value) {
    final digits = value.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length == 12) {
      return '${digits.substring(0, 2)} ${digits.substring(2, 4)} ${digits.substring(4, 8)} ${digits.substring(8, 11)}-${digits.substring(11)}';
    }
    if (digits.length == 8) {
      return '${digits.substring(0, 4)} ${digits.substring(4, 7)}-${digits.substring(7)}';
    }
    return value.replaceAll(RegExp(r'\s+'), ' ').trim();
  }

  static bool wagonNumberIsPlausible(String value) {
    final normalized = normalizeWagonNumber(value);
    return RegExp(r'^(?:\d{2} \d{2} )?\d{4} \d{3}-\d$').hasMatch(normalized);
  }

  static int? findHeaderNumber(String text, String label) {
    final expression = RegExp('$label\\s*[:=]?\\s*(\\d+(?:[.,]\\d+)?)', caseSensitive: false);
    final match = expression.firstMatch(normalizeText(text));
    if (match != null && match.group(1) != null) {
      final str = match.group(1)!.replaceAll(',', '.');
      return double.tryParse(str)?.toInt();
    }
    return null;
  }

  static final List<Map<String, dynamic>> destinationKeywords = [
    { 'keys': ['IRAN', 'İRAN'], 'destination': 'İran' },
    { 'keys': ['TATVAN'], 'destination': 'Tatvan' }, // TATVAN VAN'dan önce olmalı
    { 'keys': ['VAN'], 'destination': 'Van' },
    { 'keys': ['ELAZIG', 'ELAZIĞ', 'ELAZİĞ'], 'destination': 'Elazığ' },
    { 'keys': ['MALATYA'], 'destination': 'Malatya' },
    { 'keys': ['ISKENDERUN', 'İSKENDERUN'], 'destination': 'İskenderun' },
    { 'keys': ['MERSIN', 'MERSİN'], 'destination': 'Mersin' },
    { 'keys': ['ISTANBUL', 'İSTANBUL'], 'destination': 'İstanbul' },
    { 'keys': ['HAYDARPASA', 'HAYDARPAŞA'], 'destination': 'Haydarpaşa' },
    { 'keys': ['ERZURUM'], 'destination': 'Erzurum' },
    { 'keys': ['KARS'], 'destination': 'Kars' },
    { 'keys': ['DIYARBAKIR', 'DİYARBAKIR'], 'destination': 'Diyarbakır' },
    { 'keys': ['ADANA'], 'destination': 'Adana' },
    { 'keys': ['GAZIANTEP'], 'destination': 'Gaziantep' },
    { 'keys': ['SIVAS'], 'destination': 'Sivas' },
    { 'keys': ['ANKARA'], 'destination': 'Ankara' },
    { 'keys': ['KONYA'], 'destination': 'Konya' },
  ];

  static String detectDestination(String upperContext) {
    for (final entry in destinationKeywords) {
      final keys = entry['keys'] as List<String>;
      final destination = entry['destination'] as String;
      if (keys.any((k) => upperContext.contains(k))) {
        return destination;
      }
    }
    return 'Bilinmiyor';
  }

  static List<Map<String, dynamic>> extractWagonCandidates(String text) {
    final normalized = normalizeText(text);
    final patterns = [
      RegExp(r'\b\d{2}\s+\d{2}\s+\d{4}\s+\d{3}\s*[- ]\s*\d\b'),
      RegExp(r'\b\d{4}\s+\d{3}\s*[- ]\s*\d\b'),
    ];

    final found = <Map<String, dynamic>>[];
    for (var pIndex = 0; pIndex < patterns.length; pIndex++) {
      final matches = patterns[pIndex].allMatches(normalized);
      for (final match in matches) {
        final start = match.start;
        final end = match.end;
        if (pIndex > 0 && found.any((item) => start >= item['start'] && end <= item['end'])) {
          continue;
        }
        final number = normalizeWagonNumber(match.group(0)!);
        if (!found.any((item) => item['number'] == number)) {
          found.add({'number': number, 'start': start, 'end': end});
        }
      }
    }

    found.sort((a, b) => (a['start'] as int).compareTo(b['start'] as int));
    return found;
  }

  static String nearbyContext(String text, int index, {int radius = 90}) {
    final start = (index - radius).clamp(0, text.length);
    final end = (index + radius).clamp(0, text.length);
    return normalizeText(text.substring(start, end));
  }

  static OcrDocumentResult parseOcrDocument(String text) {
    final candidates = extractWagonCandidates(text);
    final wagons = <Wagon>[];

    for (var i = 0; i < candidates.length; i++) {
      final candidate = candidates[i];
      final number = candidate['number'] as String;
      final start = candidate['start'] as int;
      final context = nearbyContext(text, start);
      final upper = context.toUpperCase();

      final destination = detectDestination(upper);
      final safety = upper.contains('EMNIYET') || upper.contains('EMNİYET');
      final cargo = safety
          ? 'Emniyet'
          : (upper.contains('GUMRUKLU') || upper.contains('GÜMRÜKLÜ') ? 'Gümrüklü' : 'Belirtilmedi');

      wagons.add(Wagon(
        id: 'OCR-${DateTime.now().millisecondsSinceEpoch}-$i-${number.replaceAll(RegExp(r'\D'), '')}',
        number: number,
        destination: destination,
        coupling: 'Bilinmiyor',
        cargo: cargo,
        safety: safety,
        trackId: '',
        positionFromDepot: i + 1,
        source: 'ocr',
      ));
    }

    final declaredWagons = findHeaderNumber(text, 'vagon');
    final declaredAxles = findHeaderNumber(text, 'dingil');
    final warnings = <String>[];

    if (wagons.isEmpty) {
      warnings.add('Vagon numarası otomatik olarak bulunamadı. Görsel kalitesini veya kırpmayı kontrol edin.');
    }
    if (declaredWagons != null && declaredWagons != wagons.length) {
      warnings.add('Başlıkta $declaredWagons vagon yazıyor; OCR ${wagons.length} benzersiz vagon numarası buldu.');
    }
    if (declaredAxles != null && declaredWagons != null && declaredAxles != declaredWagons * 4) {
      warnings.add('Başlıktaki dingil ve vagon toplamları dört dingilli araç varsayımıyla uyuşmuyor.');
    }
    if (wagons.any((w) => w.destination == 'Bilinmiyor')) {
      warnings.add('Bazı varış bilgileri okunamadı; elle doğrulanmalı.');
    }

    return OcrDocumentResult(
      rawText: text,
      declaredWagons: declaredWagons,
      declaredAxles: declaredAxles,
      wagons: wagons,
      warnings: warnings,
    );
  }
}
