import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/wagon.dart';
import '../models/track.dart';
import '../data/station_data.dart';

class LocalStoreService {
  static const String _keyWagons = 'tatvan_ray_wagons';
  static const String _keyTracks = 'tatvan_ray_tracks';
  static const String _keyImportInfo = 'tatvan_ray_import_info';

  static Future<void> saveYardState({
    required List<Wagon> wagons,
    required List<Track> tracks,
    required Map<String, dynamic> importInfo,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final wagonsJson = jsonEncode(wagons.map((w) => w.toJson()).toList());
    final tracksJson = jsonEncode(tracks.map((t) => t.toJson()).toList());
    final infoJson = jsonEncode(importInfo);

    await prefs.setString(_keyWagons, wagonsJson);
    await prefs.setString(_keyTracks, tracksJson);
    await prefs.setString(_keyImportInfo, infoJson);
  }

  static Future<Map<String, dynamic>> loadYardState() async {
    final prefs = await SharedPreferences.getInstance();
    final wagonsRaw = prefs.getString(_keyWagons);
    final tracksRaw = prefs.getString(_keyTracks);
    final infoRaw = prefs.getString(_keyImportInfo);

    final wagons = <Wagon>[];
    if (wagonsRaw != null) {
      final list = jsonDecode(wagonsRaw) as List<dynamic>;
      for (final item in list) {
        wagons.add(Wagon.fromJson(item as Map<String, dynamic>));
      }
    }

    final tracks = <Track>[];
    if (tracksRaw != null) {
      final list = jsonDecode(tracksRaw) as List<dynamic>;
      for (final item in list) {
        tracks.add(Track.fromJson(item as Map<String, dynamic>));
      }
    } else {
      tracks.addAll(stationTracks);
    }

    final importInfo = infoRaw != null ? jsonDecode(infoRaw) as Map<String, dynamic> : <String, dynamic>{};

    return {
      'wagons': wagons,
      'tracks': tracks,
      'importInfo': importInfo,
    };
  }

  static Future<void> clearYardState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyWagons);
    await prefs.remove(_keyTracks);
    await prefs.remove(_keyImportInfo);
  }
}
