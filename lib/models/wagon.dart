class Wagon {
  final String id;
  final String number;
  final String series;
  final String destination;
  final String trackId;
  final int positionFromDepot;
  final int? positionFromRahva;
  final double length;
  final bool lengthFilledFromRef;
  final int axles;
  final double net;
  final double gross;
  final double brake;
  final String coupling;
  final String cargo;
  final bool safety;
  final String source;
  final String sourceSheet;
  final int sourceRow;

  Wagon({
    required this.id,
    required this.number,
    this.series = '—',
    this.destination = 'Bilinmiyor',
    required this.trackId,
    required this.positionFromDepot,
    this.positionFromRahva,
    this.length = 0.0,
    this.lengthFilledFromRef = false,
    this.axles = 0,
    this.net = 0.0,
    this.gross = 0.0,
    this.brake = 0.0,
    this.coupling = 'Bilinmiyor',
    this.cargo = 'Belirtilmedi',
    this.safety = false,
    this.source = 'daily-xlsx',
    this.sourceSheet = '',
    this.sourceRow = 0,
  });

  Wagon copyWith({
    String? id,
    String? number,
    String? series,
    String? destination,
    String? trackId,
    int? positionFromDepot,
    int? positionFromRahva,
    double? length,
    bool? lengthFilledFromRef,
    int? axles,
    double? net,
    double? gross,
    double? brake,
    String? coupling,
    String? cargo,
    bool? safety,
    String? source,
    String? sourceSheet,
    int? sourceRow,
  }) {
    return Wagon(
      id: id ?? this.id,
      number: number ?? this.number,
      series: series ?? this.series,
      destination: destination ?? this.destination,
      trackId: trackId ?? this.trackId,
      positionFromDepot: positionFromDepot ?? this.positionFromDepot,
      positionFromRahva: positionFromRahva ?? this.positionFromRahva,
      length: length ?? this.length,
      lengthFilledFromRef: lengthFilledFromRef ?? this.lengthFilledFromRef,
      axles: axles ?? this.axles,
      net: net ?? this.net,
      gross: gross ?? this.gross,
      brake: brake ?? this.brake,
      coupling: coupling ?? this.coupling,
      cargo: cargo ?? this.cargo,
      safety: safety ?? this.safety,
      source: source ?? this.source,
      sourceSheet: sourceSheet ?? this.sourceSheet,
      sourceRow: sourceRow ?? this.sourceRow,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'number': number,
      'series': series,
      'destination': destination,
      'trackId': trackId,
      'positionFromDepot': positionFromDepot,
      'positionFromRahva': positionFromRahva,
      'length': length,
      'lengthFilledFromRef': lengthFilledFromRef,
      'axles': axles,
      'net': net,
      'gross': gross,
      'brake': brake,
      'coupling': coupling,
      'cargo': cargo,
      'safety': safety,
      'source': source,
      'sourceSheet': sourceSheet,
      'sourceRow': sourceRow,
    };
  }

  factory Wagon.fromJson(Map<String, dynamic> json) {
    return Wagon(
      id: json['id'] as String,
      number: json['number'] as String,
      series: json['series'] as String? ?? '—',
      destination: json['destination'] as String? ?? 'Bilinmiyor',
      trackId: json['trackId'] as String,
      positionFromDepot: json['positionFromDepot'] as int,
      positionFromRahva: json['positionFromRahva'] as int?,
      length: (json['length'] as num?)?.toDouble() ?? 0.0,
      lengthFilledFromRef: json['lengthFilledFromRef'] as bool? ?? false,
      axles: json['axles'] as int? ?? 0,
      net: (json['net'] as num?)?.toDouble() ?? 0.0,
      gross: (json['gross'] as num?)?.toDouble() ?? 0.0,
      brake: (json['brake'] as num?)?.toDouble() ?? 0.0,
      coupling: json['coupling'] as String? ?? 'Bilinmiyor',
      cargo: json['cargo'] as String? ?? 'Belirtilmedi',
      safety: json['safety'] as bool? ?? false,
      source: json['source'] as String? ?? 'daily-xlsx',
      sourceSheet: json['sourceSheet'] as String? ?? '',
      sourceRow: json['sourceRow'] as int? ?? 0,
    );
  }
}
