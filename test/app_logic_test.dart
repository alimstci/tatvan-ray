import 'package:flutter_test/flutter_test.dart';
import 'package:tatvan_ray/models/wagon.dart';
import 'package:tatvan_ray/models/track.dart';
import 'package:tatvan_ray/services/planner_service.dart';
import 'package:tatvan_ray/services/ocr_parser_service.dart';
import 'package:tatvan_ray/services/xlsx_importer_service.dart';

void main() {
  group('XlsxImporterService tests', () {
    test('asciiKey normalizes Turkish characters', () {
      expect(XlsxImporterService.asciiKey('FERİBOT SAHASI'), 'FERIBOT SAHASI');
      expect(XlsxImporterService.asciiKey('ATÖLYE3'), 'ATOLYE3');
      expect(XlsxImporterService.asciiKey('TAMİR YOLU'), 'TAMIR YOLU');
    });

    test('fullWagonNumber joins H and I columns', () {
      final row = ['1', 'TATVAN', '4', '14', 'EA', '33', '96', '5430', '556-6'];
      expect(XlsxImporterService.fullWagonNumber(row), '33 96 5430 556-6');
    });

    test('fullWagonNumber returns empty when I is missing', () {
      final row = ['1', 'TATVAN', '4', '14', 'EA', '31', '75', '7834', ''];
      expect(XlsxImporterService.fullWagonNumber(row), '');
    });

    test('isPartialWagon detects partial records', () {
      final row = List<dynamic>.filled(9, '');
      row[7] = '7834';
      row[8] = '';
      expect(XlsxImporterService.isPartialWagon(row), true);
    });
  });

  group('PlannerService tests', () {
    test('track usage calculates used, remaining, percentage correctly', () {
      final track = Track(id: 'a', group: 'G', name: 'A', normal: 100, useful: 100, start: '-', end: '-');
      final wagons = [
        Wagon(id: '1', number: '1', trackId: 'a', positionFromDepot: 1, length: 25),
        Wagon(id: '2', number: '2', trackId: 'a', positionFromDepot: 2, length: 35),
      ];
      final usage = getTrackUsage('a', [track], wagons);
      expect(usage, isNotNull);
      expect(usage!.used, 60.0);
      expect(usage.remaining, 40.0);
      expect(usage.percentage, 60);
      expect(usage.overflow, false);
      expect(usage.overflowWarning, isNull);
    });

    test('track usage generates overflowWarning on overflow', () {
      final track = Track(id: 'b', group: 'G', name: 'B', normal: 50, useful: 50, start: '-', end: '-');
      final wagons = [
        Wagon(id: '1', number: '1', trackId: 'b', positionFromDepot: 1, length: 30),
        Wagon(id: '2', number: '2', trackId: 'b', positionFromDepot: 2, length: 30),
      ];
      final usage = getTrackUsage('b', [track], wagons);
      expect(usage!.overflow, true);
      expect(usage.overflowWarning, contains('taşma'));
    });

    test('consist places safety wagons at both ends', () {
      final wagons = [
        Wagon(id: '1', number: '1', trackId: 'a', positionFromDepot: 1, safety: true, destination: 'Van', coupling: 'Manuel', length: 10, gross: 20),
        Wagon(id: '2', number: '2', trackId: 'a', positionFromDepot: 2, safety: false, destination: 'İran', coupling: 'Manuel', length: 12, gross: 40),
        Wagon(id: '3', number: '3', trackId: 'a', positionFromDepot: 3, safety: true, destination: 'Van', coupling: 'Manuel', length: 10, gross: 20),
      ];
      final result = buildConsist(wagons, destinationOrder: ['Van', 'İran']);
      expect(result.wagons.first.safety, true);
      expect(result.wagons.last.safety, true);
      expect(result.totalLength, 32.0);
      expect(result.warnings.isEmpty, true);
    });
  });

  group('OcrParserService tests', () {
    test('normalizes full UIC wagon number', () {
      expect(OcrParserService.normalizeWagonNumber('31 75 3547 120 - 3'), '31 75 3547 120-3');
    });

    test('normalizes 8-digit short wagon number', () {
      expect(OcrParserService.normalizeWagonNumber('3547 120-3'), '3547 120-3');
    });

    test('detectDestination prioritizes Tatvan over Van', () {
      expect(OcrParserService.detectDestination('TATVAN CIKIS'), 'Tatvan');
      expect(OcrParserService.detectDestination('VAN ISTASYONU'), 'Van');
      expect(OcrParserService.detectDestination('IRAN GUMRUKLU'), 'İran');
      expect(OcrParserService.detectDestination('ELAZIG'), 'Elazığ');
      expect(OcrParserService.detectDestination('MERSIN'), 'Mersin');
    });

    test('parseOcrDocument extracts wagons and handles mismatch warnings', () {
      const text = 'Vagon 3 Dingil 12 GÜMRÜKLÜ İRAN 31 75 3547 120-3 EMNİYET VAN 31 75 6641 306-5';
      final result = OcrParserService.parseOcrDocument(text);
      expect(result.wagons.length, 2);
      expect(result.declaredWagons, 3);
      expect(result.warnings.any((w) => w.contains('3 vagon')), true);
    });
  });
}
