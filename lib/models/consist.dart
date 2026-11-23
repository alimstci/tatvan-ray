import 'wagon.dart';

class ConsistResult {
  final List<Wagon> wagons;
  final double totalLength;
  final double totalGross;
  final List<String> warnings;

  ConsistResult({
    required this.wagons,
    required this.totalLength,
    required this.totalGross,
    required this.warnings,
  });
}
