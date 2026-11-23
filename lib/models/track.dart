import 'wagon.dart';

class Track {
  final String id;
  final String group;
  final String name;
  final double normal;
  final double useful;
  final String start;
  final String end;
  final String status;
  final String sourceSheet;
  final bool capacityNeedsReview;

  Track({
    required this.id,
    required this.group,
    required this.name,
    required this.normal,
    required this.useful,
    required this.start,
    required this.end,
    this.status = 'active',
    this.sourceSheet = '',
    this.capacityNeedsReview = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'group': group,
      'name': name,
      'normal': normal,
      'useful': useful,
      'start': start,
      'end': end,
      'status': status,
      'sourceSheet': sourceSheet,
      'capacityNeedsReview': capacityNeedsReview,
    };
  }

  factory Track.fromJson(Map<String, dynamic> json) {
    return Track(
      id: json['id'] as String,
      group: json['group'] as String? ?? 'Günlük Excel',
      name: json['name'] as String,
      normal: (json['normal'] as num?)?.toDouble() ?? 0.0,
      useful: (json['useful'] as num?)?.toDouble() ?? 0.0,
      start: json['start'] as String? ?? '—',
      end: json['end'] as String? ?? '—',
      status: json['status'] as String? ?? 'active',
      sourceSheet: json['sourceSheet'] as String? ?? '',
      capacityNeedsReview: json['capacityNeedsReview'] as bool? ?? false,
    );
  }
}

class TrackUsage {
  final Track track;
  final List<Wagon> wagons;
  final double used;
  final double remaining;
  final int percentage;
  final bool overflow;
  final String? overflowWarning;
  final String? zeroLengthWarning;

  TrackUsage({
    required this.track,
    required this.wagons,
    required this.used,
    required this.remaining,
    required this.percentage,
    required this.overflow,
    this.overflowWarning,
    this.zeroLengthWarning,
  });
}
