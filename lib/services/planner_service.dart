import '../models/wagon.dart';
import '../models/track.dart';
import '../models/consist.dart';

double sumBy(List<Wagon> items, double Function(Wagon) field) {
  return items.fold(0.0, (total, item) => total + field(item));
}

TrackUsage? getTrackUsage(String trackId, List<Track> tracks, List<Wagon> wagons) {
  final trackMatches = tracks.where((item) => item.id == trackId);
  if (trackMatches.isEmpty) return null;
  final track = trackMatches.first;

  final onTrack = wagons.where((w) => w.trackId == trackId).toList();
  final used = sumBy(onTrack, (w) => w.length);
  final zeroLengthWagons = onTrack.where((w) => w.length == 0).toList();

  final overflow = track.useful > 0 && used > track.useful;
  final percentage = track.useful > 0 ? (used / track.useful * 100).round().clamp(0, 100) : 0;
  final remaining = (track.useful - used) < 0 ? 0.0 : (track.useful - used);

  return TrackUsage(
    track: track,
    wagons: onTrack,
    used: used,
    remaining: remaining,
    percentage: percentage,
    overflow: overflow,
    overflowWarning: overflow
        ? 'Yol doluluk taşması: kullanılan ${used.toStringAsFixed(1)} m > faydalı ${track.useful} m'
        : null,
    zeroLengthWarning: zeroLengthWagons.isNotEmpty
        ? '${zeroLengthWagons.length} vagonun uzunluğu 0; kapasite hesabı eksik kalıyor: ${zeroLengthWagons.map((w) => w.number).join(', ')}'
        : null,
  );
}

ConsistResult buildConsist(
  List<Wagon> wagons, {
  List<String> destinationOrder = const ['Tatvan', 'Van', 'İran'],
}) {
  final rank = <String, int>{};
  for (var i = 0; i < destinationOrder.length; i++) {
    rank[destinationOrder[i]] = i;
  }

  // Emniyet vagonlarını önce ayır; sıralama yalnızca normal vagonlara uygulansın
  final safetyWagons = wagons.where((w) => w.safety).toList();
  final regularWagons = wagons.where((w) => !w.safety).toList();

  final sortedRegular = List<Wagon>.from(regularWagons)..sort((a, b) {
      final aRank = rank[a.destination] ?? 999;
      final bRank = rank[b.destination] ?? 999;
      final destinationDelta = bRank.compareTo(aRank); // yüksek rank (kuyruk olmayan) öne gelir
      if (destinationDelta != 0) return destinationDelta;
      return a.coupling.compareTo(b.coupling);
    });

  final result = List<Wagon>.from(sortedRegular);
  if (safetyWagons.isNotEmpty) result.insert(0, safetyWagons[0]);
  if (safetyWagons.length > 1) result.add(safetyWagons[1]);

  final warnings = <String>{};
  if (safetyWagons.length < 2) {
    warnings.add('Baş ve son için iki emniyet vagonu bulunamadı.');
  }

  for (var i = 1; i < result.length; i++) {
    if (result[i - 1].coupling != result[i].coupling) {
      warnings.add('$i. ve ${i + 1}. vagon arasında koşum geçişi doğrulanmalı.');
    }
  }

  if (result.any((w) => w.series == 'Z' || RegExp(r'akaryakıt|tehlikeli', caseSensitive: false).hasMatch(w.cargo))) {
    warnings.add('Tehlikeli/sarnıç yükü için RID ve koruyucu vagon kuralı yetkili personelce doğrulanmalı.');
  }

  final zeroLen = result.where((w) => w.length == 0).toList();
  if (zeroLen.isNotEmpty) {
    warnings.add('${zeroLen.length} vagonun uzunluğu bilinmiyor; toplam uzunluk hesabı eksik: ${zeroLen.map((w) => w.number).join(', ')}');
  }

  return ConsistResult(
    wagons: result,
    totalLength: sumBy(result, (w) => w.length),
    totalGross: sumBy(result, (w) => w.gross),
    warnings: warnings.toList(),
  );
}
