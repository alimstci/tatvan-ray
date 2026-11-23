import 'dart:typed_data';
import 'package:excel/excel.dart';
import '../models/wagon.dart';
import '../models/track.dart';

class ImportSummary {
  final int sheetCount;
  final int roadSheetCount;
  final int wagonCount;
  final int duplicateCount;
  final List<Map<String, dynamic>> duplicateGroups;
  final int skippedCount;
  final Map<String, int> skippedBySheet;
  final int zeroLengthCount;
  final int lengthFilledFromRefCount;
  final int unknownDestinationCount;

  ImportSummary({
    required this.sheetCount,
    required this.roadSheetCount,
    required this.wagonCount,
    required this.duplicateCount,
    required this.duplicateGroups,
    required this.skippedCount,
    required this.skippedBySheet,
    required this.zeroLengthCount,
    required this.lengthFilledFromRefCount,
    required this.unknownDestinationCount,
  });

  Map<String, dynamic> toJson() {
    return {
      'sheetCount': sheetCount,
      'roadSheetCount': roadSheetCount,
      'wagonCount': wagonCount,
      'duplicateCount': duplicateCount,
      'duplicateGroups': duplicateGroups,
      'skippedCount': skippedCount,
      'skippedBySheet': skippedBySheet,
      'zeroLengthCount': zeroLengthCount,
      'lengthFilledFromRefCount': lengthFilledFromRefCount,
      'unknownDestinationCount': unknownDestinationCount,
    };
  }
}

class ImportResult {
  final List<Wagon> wagons;
  final List<Track> tracks;
  final List<String> warnings;
  final ImportSummary summary;

  ImportResult({
    required this.wagons,
    required this.tracks,
    required this.warnings,
    required this.summary,
  });
}

class XlsxImporterService {
  static const int maxWagonRows = 150;

  static const Map<String, String> sheetTrackMap = {
    'R1': 'askeri-1',
    'R2': 'askeri-2',
    'R3': 'askeri-3',
    'KOR YOL': 'askeri-kor',
    '2 YOL': 'gar-2',
    '3 YOL': 'gar-3',
    '4 YOL': 'gar-4',
    '5 YOL': 'gar-5',
    '6 YOL': 'gar-6',
    '7 YOL': 'gar-7',
    '8 YOL': 'gar-8',
    '9 YOL': 'tahliye-9',
    '10 YOL': 'tahliye-10',
    'ATOLYE1': 'atolye-1',
    'ATOLYE2': 'atolye-2',
    'ATOLYE3': 'atolye-3',
    'ATOLYE4': 'atolye-4',
    'ATOLYE5': 'atolye-5',
    'YY1': 'yeni-1',
    'YY2': 'yeni-2',
    'YY3': 'yeni-3',
    'TAMIR YOLU': 'tamir-yolu',
    'FERIBOT SAHASI': 'feribot-sahasi',
  };

  static String asciiKey(String value) {
    return value
        .replaceAll('İ', 'I')
        .replaceAll('ı', 'I')
        .replaceAll('Ş', 'S')
        .replaceAll('ş', 'S')
        .replaceAll('Ğ', 'G')
        .replaceAll('ğ', 'G')
        .replaceAll('Ü', 'U')
        .replaceAll('ü', 'U')
        .replaceAll('Ö', 'O')
        .replaceAll('ö', 'O')
        .replaceAll('Ç', 'C')
        .replaceAll('ç', 'C')
        .toUpperCase()
        .replaceAll(RegExp(r'[^A-Z0-9]+'), ' ')
        .trim();
  }

  static String cleanPart(dynamic value) {
    if (value == null) return '';
    var str = value.toString().trim();
    if (str.endsWith('.0')) {
      str = str.substring(0, str.length - 2);
    }
    return str.trim();
  }

  static String fullWagonNumber(List<dynamic> row) {
    if (row.length <= 8) return '';
    final f = cleanPart(row[5]);
    final g = cleanPart(row[6]);
    final h = cleanPart(row[7]);
    final i = cleanPart(row[8]);
    if (h.isEmpty || i.isEmpty) return '';
    return [f, g, h, i]
        .where((s) => s.isNotEmpty)
        .join(' ')
        .replaceAll(RegExp(r'\s+-\s+'), '-');
  }

  static bool isPartialWagon(List<dynamic> row) {
    if (row.length <= 7) return false;
    final f = row.length > 5 ? cleanPart(row[5]) : '';
    final g = row.length > 6 ? cleanPart(row[6]) : '';
    final h = cleanPart(row[7]);
    final i = row.length > 8 ? cleanPart(row[8]) : '';
    if (h.isNotEmpty && i.isEmpty) return true;
    if (h.isEmpty && i.isEmpty && (f.isNotEmpty || g.isNotEmpty)) return true;
    return false;
  }

  static Map<String, double> buildSeriesLengthMap(Excel excel) {
    final map = <String, double>{};
    final sheet = excel.tables['vagonlar'];
    if (sheet == null) return map;

    for (var r = 1; r < sheet.rows.length; r++) {
      final row = sheet.rows[r];
      if (row.length <= 6) continue;
      final series = cleanPart(row[2]?.value); // Cinsi sütunu: Ea, Ha vb.
      final lengthRaw = row[6]?.value?.toString().replaceAll(',', '.');
      final lengthVal = double.tryParse(lengthRaw ?? '') ?? 0.0;

      if (series.isNotEmpty && lengthVal > 0) {
        final existing = map[series] ?? 0.0;
        if (lengthVal > existing) {
          map[series] = lengthVal;
          map[series.toUpperCase()] = lengthVal;
          map[series.toLowerCase()] = lengthVal;
        }
      }
    }
    return map;
  }

  static ImportResult parseBytes(Uint8List bytes, List<Track> knownTracks) {
    final excel = Excel.decodeBytes(bytes);
    final trackById = <String, Track>{for (final t in knownTracks) t.id: t};
    final wagons = <Wagon>[];
    final warnings = <String>[];
    final ignored = {'ANASAYFA', 'VAGONLAR'};

    final seriesLengthMap = buildSeriesLengthMap(excel);
    final skippedBySheet = <String, int>{};

    for (final sheetName in excel.tables.keys) {
      final key = asciiKey(sheetName);
      if (ignored.contains(key)) continue;

      final sheet = excel.tables[sheetName];
      if (sheet == null) continue;

      final trackId = sheetTrackMap[key] ?? 'excel-${key.toLowerCase().replaceAll(' ', '-')}';
      final existing = trackById[trackId];
      trackById[trackId] = existing ??
          Track(
            id: trackId,
            group: 'Günlük Excel',
            name: sheetName,
            normal: 0,
            useful: 0,
            start: '—',
            end: '—',
            sourceSheet: sheetName,
            capacityNeedsReview: true,
          );

      var sheetSkipped = 0;
      final maxIdx = (maxWagonRows + 10).clamp(0, sheet.rows.length);

      for (var rowIndex = 10; rowIndex < maxIdx; rowIndex++) {
        final rowCells = sheet.rows[rowIndex];
        final row = rowCells.map((cell) => cell?.value).toList();

        final number = fullWagonNumber(row);
        if (number.isEmpty) {
          if (isPartialWagon(row)) {
            sheetSkipped++;
          }
          continue;
        }

        final positionFromDepot = wagons.where((w) => w.trackId == trackId).length + 1;
        var length = double.tryParse(row.length > 3 ? cleanPart(row[3]).replaceAll(',', '.') : '') ?? 0.0;
        final series = row.length > 4 ? cleanPart(row[4]) : '—';
        var lengthFilledFromRef = false;

        if (length == 0.0 && series != '—') {
          final refLength = seriesLengthMap[series] ?? seriesLengthMap[series.toUpperCase()];
          if (refLength != null && refLength > 0) {
            length = refLength;
            lengthFilledFromRef = true;
          }
        }

        final destination = row.length > 10 ? cleanPart(row[10]) : '';
        final axles = int.tryParse(row.length > 2 ? cleanPart(row[2]) : '') ?? 0;
        final net = double.tryParse(row.length > 11 ? cleanPart(row[11]).replaceAll(',', '.') : '') ?? 0.0;
        final gross = double.tryParse(row.length > 12 ? cleanPart(row[12]).replaceAll(',', '.') : '') ?? 0.0;
        final brake = double.tryParse(row.length > 13 ? cleanPart(row[13]).replaceAll(',', '.') : '') ?? 0.0;

        wagons.add(Wagon(
          id: 'XLSX-$trackId-$positionFromDepot-${number.replaceAll(RegExp(r'\D'), '')}',
          number: number,
          series: series.isEmpty ? '—' : series,
          destination: destination.isEmpty ? 'Bilinmiyor' : destination,
          trackId: trackId,
          positionFromDepot: positionFromDepot,
          length: length,
          lengthFilledFromRef: lengthFilledFromRef,
          axles: axles,
          net: net,
          gross: gross,
          brake: brake,
          sourceSheet: sheetName,
          sourceRow: rowIndex + 1,
        ));
      }

      if (sheetSkipped > 0) {
        skippedBySheet[sheetName] = sheetSkipped;
      }
    }

    // Rahva cihetinden ters sıra hesaplama
    final trackCounts = <String, int>{};
    for (final w in wagons) {
      trackCounts[w.trackId] = (trackCounts[w.trackId] ?? 0) + 1;
    }
    for (var i = 0; i < wagons.length; i++) {
      final totalOnTrack = trackCounts[wagons[i].trackId] ?? 0;
      final posFromRahva = totalOnTrack - wagons[i].positionFromDepot + 1;
      wagons[i] = wagons[i].copyWith(positionFromRahva: posFromRahva);
    }

    // Mükerrer vagon kontrolü
    final numberCounts = <String, int>{};
    for (final w in wagons) {
      numberCounts[w.number] = (numberCounts[w.number] ?? 0) + 1;
    }
    final duplicateNumbers = numberCounts.entries.where((e) => e.value > 1).map((e) => e.key).toList();
    final duplicateGroups = duplicateNumbers.map((num) {
      final occs = wagons.where((w) => w.number == num).map((w) => {
        'trackId': w.trackId,
        'sheetName': w.sourceSheet,
        'row': w.sourceRow,
        'positionFromDepot': w.positionFromDepot,
        'positionFromRahva': w.positionFromRahva,
      }).toList();
      return {'number': num, 'occurrences': occs};
    }).toList();

    final zeroLengthWagons = wagons.where((w) => w.length == 0.0).toList();
    final unknownDestinationCount = wagons.where((w) => w.destination == 'Bilinmiyor').length;
    final lengthFilledCount = wagons.where((w) => w.lengthFilledFromRef).length;
    final totalSkipped = skippedBySheet.values.fold(0, (a, b) => a + b);

    if (totalSkipped > 0) {
      final detail = skippedBySheet.entries.map((e) => '${e.key}: ${e.value}').join(', ');
      warnings.add('$totalSkipped satır eksik UIC numarası nedeniyle atlandı ($detail). Excel\'de I sütunu boş olan satırları kontrol edin.');
    }
    if (duplicateNumbers.isNotEmpty) {
      warnings.add('${duplicateNumbers.length} vagon numarası birden fazla yol/sırada bulundu.');
    }
    if (wagons.isEmpty) {
      warnings.add('Yol sayfalarında vagon kaydı bulunamadı.');
    }
    if (zeroLengthWagons.isNotEmpty) {
      final detail = zeroLengthWagons.map((w) => '${w.number} (${w.sourceSheet} satır ${w.sourceRow})').join('; ');
      warnings.add('${zeroLengthWagons.length} vagonun uzunluğu Excel\'de ve referans sayfasında bulunamadı; kapasite hesabı eksik kalacak: $detail');
    }
    if (unknownDestinationCount > 0) {
      warnings.add('$unknownDestinationCount vagonun varış istasyonu Excel\'de girilmemiş (K sütunu boş). Varış bilgisi teşkil bildiriminden eşleştirilecek.');
    }

    return ImportResult(
      wagons: wagons,
      tracks: trackById.values.toList(),
      warnings: warnings,
      summary: ImportSummary(
        sheetCount: excel.tables.length,
        roadSheetCount: wagons.map((w) => w.trackId).toSet().length,
        wagonCount: wagons.length,
        duplicateCount: duplicateNumbers.length,
        duplicateGroups: duplicateGroups,
        skippedCount: totalSkipped,
        skippedBySheet: skippedBySheet,
        zeroLengthCount: zeroLengthWagons.length,
        lengthFilledFromRefCount: lengthFilledCount,
        unknownDestinationCount: unknownDestinationCount,
      ),
    );
  }
}
