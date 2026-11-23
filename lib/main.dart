import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';

import 'models/wagon.dart';
import 'models/track.dart';
import 'models/consist.dart';
import 'data/station_data.dart';
import 'services/xlsx_importer_service.dart';
import 'services/planner_service.dart';
import 'services/ocr_parser_service.dart';
import 'services/local_store_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const TatvanRayApp());
}

class TatvanRayApp extends StatelessWidget {
  const TatvanRayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Tatvan Ray',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1E3A8A),
          primary: const Color(0xFF1E3A8A),
          secondary: const Color(0xFFD97706),
        ),
        useMaterial3: true,
      ),
      home: const MainNavigationScreen(),
    );
  }
}

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  List<Wagon> _wagons = [];
  List<Track> _tracks = List.from(stationTracks);
  Map<String, dynamic> _importInfo = {};
  bool _isLoading = true;

  // OCR ile okunan hedef vagonlar
  List<Wagon> _targetWagons = [];

  @override
  void initState() {
    super.initState();
    _loadState();
  }

  Future<void> _loadState() async {
    setState(() => _isLoading = true);
    final data = await LocalStoreService.loadYardState();
    setState(() {
      _wagons = data['wagons'] as List<Wagon>;
      _tracks = data['tracks'] as List<Track>;
      _importInfo = data['importInfo'] as Map<String, dynamic>;
      _isLoading = false;
    });
  }

  Future<void> _pickAndImportExcel() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['xlsx', 'xls'],
      withData: true,
    );

    if (result != null && result.files.isNotEmpty) {
      final fileBytes = result.files.first.bytes ??
          (result.files.first.path != null
              ? await File(result.files.first.path!).readAsBytes()
              : null);

      if (fileBytes != null) {
        setState(() => _isLoading = true);
        try {
          final importResult = XlsxImporterService.parseBytes(fileBytes, _tracks);
          final newInfo = {
            'fileName': result.files.first.name,
            'importDate': DateTime.now().toIso8601String(),
            ...importResult.summary.toJson(),
            'warnings': importResult.warnings,
          };

          await LocalStoreService.saveYardState(
            wagons: importResult.wagons,
            tracks: importResult.tracks,
            importInfo: newInfo,
          );

          setState(() {
            _wagons = importResult.wagons;
            _tracks = importResult.tracks;
            _importInfo = newInfo;
            _isLoading = false;
          });

          if (mounted) {
            _showWarningsDialog(importResult.warnings);
          }
        } catch (e) {
          setState(() => _isLoading = false);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Excel okuma hatası: $e')),
            );
          }
        }
      }
    }
  }

  void _showWarningsDialog(List<String> warnings) {
    if (warnings.isEmpty) return;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.orange),
            SizedBox(width: 8),
            Text('İçe Aktarma Bildirimleri'),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: warnings.length,
            itemBuilder: (ctx, i) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text('• ${warnings[i]}', style: const TextStyle(fontSize: 13)),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Anladım'),
          ),
        ],
      ),
    );
  }

  Future<void> _clearAllData() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tüm Verileri Sil?'),
        content: const Text('Aktif günlük saha envanteri ve vagon kayıtları temizlenecek. Sabit yol tanımları korunur.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Vazgeç')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Sil'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await LocalStoreService.clearYardState();
      setState(() {
        _wagons = [];
        _tracks = List.from(stationTracks);
        _importInfo = {};
        _targetWagons = [];
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Saha envanteri temizlendi.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final screens = [
      _buildDailyScreen(),
      _buildTracksScreen(),
      _buildScanScreen(),
      _buildConsistScreen(),
      _buildRulesScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tatvan Ray — Teşkil & Envanter'),
        backgroundColor: const Color(0xFF1E3A8A),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Verileri Sıfırla',
            onPressed: _wagons.isNotEmpty ? _clearAllData : null,
          ),
        ],
      ),
      body: screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Günlük'),
          NavigationDestination(icon: Icon(Icons.alt_route), label: 'Yollar'),
          NavigationDestination(icon: Icon(Icons.document_scanner), label: 'Tara'),
          NavigationDestination(icon: Icon(Icons.view_timeline), label: 'Dizi'),
          NavigationDestination(icon: Icon(Icons.rule_folder_outlined), label: 'Kurallar'),
        ],
      ),
    );
  }

  // --- 1. GÜNLÜK EKRANI ---
  Widget _buildDailyScreen() {
    final dupes = _importInfo['duplicateCount'] as int? ?? 0;
    final skipped = _importInfo['skippedCount'] as int? ?? 0;
    final zeroLen = _importInfo['zeroLengthCount'] as int? ?? 0;
    final activeTracksCount = _wagons.map((w) => w.trackId).toSet().length;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            color: const Color(0xFFEFF6FF),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Icon(Icons.cloud_upload_outlined, size: 48, color: Color(0xFF1E3A8A)),
                  const SizedBox(height: 8),
                  const Text('Günlük GAR SAHA YOLLARI Exceli', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(
                    _importInfo['fileName'] != null
                        ? 'Son Yüklenen: ${_importInfo['fileName']}'
                        : 'Henüz dosya seçilmedi',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: _pickAndImportExcel,
                    icon: const Icon(Icons.upload_file),
                    label: const Text('Günlük Excel\'i Seç'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1E3A8A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _metricCard('Vagon', '${_wagons.length}', Icons.train, Colors.blue)),
              const SizedBox(width: 8),
              Expanded(child: _metricCard('Dolu Yol', '$activeTracksCount', Icons.alt_route, Colors.green)),
              const SizedBox(width: 8),
              Expanded(child: _metricCard('Tanımlı Yol', '${_tracks.length}', Icons.layers, Colors.purple)),
            ],
          ),
          if (dupes > 0 || skipped > 0 || zeroLen > 0) ...[
            const SizedBox(height: 16),
            Card(
              color: const Color(0xFFFFFBEB),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Color(0xFFFDE68A)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706)),
                        SizedBox(width: 8),
                        Text('Saha Veri Uyarıları', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF92400E))),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (dupes > 0) Text('• $dupes mükerrer vagon kaydı tespit edildi (farklı yollarda çakışma).', style: const TextStyle(fontSize: 13)),
                    if (skipped > 0) Text('• $skipped satır eksik UIC kontrol numarası (I sütunu boş) nedeniyle atlandı.', style: const TextStyle(fontSize: 13)),
                    if (zeroLen > 0) Text('• $zeroLen vagonun uzunluğu bulunamadı; kapasite hesabı eksik.', style: const TextStyle(fontSize: 13)),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _metricCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text(title, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  // --- 2. YOLLAR EKRANI ---
  Widget _buildTracksScreen() {
    final activeOnly = _wagons.isNotEmpty;
    final displayTracks = activeOnly
        ? _tracks.where((t) => _wagons.any((w) => w.trackId == t.id)).toList()
        : _tracks;

    if (displayTracks.isEmpty) {
      return const Center(child: Text('Henüz yüklü yol verisi bulunmuyor.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: displayTracks.length,
      itemBuilder: (ctx, i) {
        final track = displayTracks[i];
        final usage = getTrackUsage(track.id, _tracks, _wagons);
        final trackWagons = _wagons.where((w) => w.trackId == track.id).toList();

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ExpansionTile(
            title: Text(track.name, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(
              '${track.group} • ${trackWagons.length} vagon • ${usage?.used.toStringAsFixed(1) ?? '0'}m / ${track.useful}m (${usage?.percentage ?? 0}%)',
              style: const TextStyle(fontSize: 12),
            ),
            children: [
              if (usage?.overflowWarning != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                  child: Text(usage!.overflowWarning!, style: const TextStyle(color: Colors.red, fontSize: 12)),
                ),
              if (trackWagons.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Bu yolda vagon yok.', style: TextStyle(color: Colors.grey)),
                )
              else
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: SizedBox(
                    height: 110,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: trackWagons.length,
                      itemBuilder: (ctx, wIndex) {
                        final wagon = trackWagons[wIndex];
                        return Container(
                          width: 140,
                          margin: const EdgeInsets.only(right: 8),
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            border: Border.all(color: const Color(0xFFCBD5E1)),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(wagon.number, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 2),
                              Text('Seri: ${wagon.series} | ${wagon.length}m', style: const TextStyle(fontSize: 10)),
                              Text('Depo: ${wagon.positionFromDepot}. | Rahva: ${wagon.positionFromRahva ?? '-'}.', style: const TextStyle(fontSize: 10, color: Color(0xFF1E3A8A))),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  // --- 3. TARA (OCR) EKRANI ---
  Widget _buildScanScreen() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _pickAndRunOcr(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Fotoğraf Çek'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _pickAndRunOcr(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library),
                  label: const Text('Galeriden Seç'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_targetWagons.isNotEmpty) ...[
            Text('Bulunan Hedef Vagonlar (${_targetWagons.length})', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _targetWagons.length,
              itemBuilder: (ctx, i) {
                final w = _targetWagons[i];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: w.safety ? Colors.red.shade100 : Colors.blue.shade100,
                      child: Icon(w.safety ? Icons.shield : Icons.train, color: w.safety ? Colors.red : Colors.blue),
                    ),
                    title: Text(w.number, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('Varış: ${w.destination} • Yük: ${w.cargo}'),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete, color: Colors.grey),
                      onPressed: () => setState(() => _targetWagons.removeAt(i)),
                    ),
                  ),
                );
              },
            ),
          ] else
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 40),
                child: Text('Tren teşkil bildirimi okutmak için yukarıdaki butonları kullanın.', style: TextStyle(color: Colors.grey)),
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _pickAndRunOcr(ImageSource source) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source);
    if (picked == null) return;

    if (kIsWeb) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('ML Kit OCR mobil cihaz üzerinde çalışır.')),
      );
      return;
    }

    final inputImage = InputImage.fromFilePath(picked.path);
    final textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);

    try {
      final recognizedText = await textRecognizer.processImage(inputImage);
      final ocrResult = OcrParserService.parseOcrDocument(recognizedText.text);

      setState(() {
        _targetWagons = ocrResult.wagons;
      });

      if (mounted) {
        _showWarningsDialog(ocrResult.warnings);
      }
    } finally {
      await textRecognizer.close();
    }
  }

  // --- 4. DİZİ EKRANI ---
  Widget _buildConsistScreen() {
    final wagonsToPlan = _targetWagons.isNotEmpty ? _targetWagons : _wagons.take(20).toList();
    final consist = buildConsist(wagonsToPlan);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            color: const Color(0xFFF8FAFC),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Taslak Tren Dizisi Özeti', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 8),
                  Text('Vagon Sayısı: ${consist.wagons.length} adet'),
                  Text('Toplam Boy: ${consist.totalLength.toStringAsFixed(1)} metre'),
                  Text('Toplam Brüt: ${consist.totalGross.toStringAsFixed(1)} ton'),
                ],
              ),
            ),
          ),
          if (consist.warnings.isNotEmpty) ...[
            const SizedBox(height: 12),
            Card(
              color: const Color(0xFFFEF2F2),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: consist.warnings.map((w) => Text('• $w', style: const TextStyle(color: Colors.red, fontSize: 12))).toList(),
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          const Text('Dizi Sırası (Lokomotiften Kuyruğa)', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: consist.wagons.length,
            itemBuilder: (ctx, i) {
              final w = consist.wagons[i];
              return ListTile(
                dense: true,
                leading: CircleAvatar(
                  radius: 14,
                  child: Text('${i + 1}', style: const TextStyle(fontSize: 11)),
                ),
                title: Text(w.number, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('${w.series} • ${w.destination} • ${w.length}m'),
                trailing: w.safety ? const Chip(label: Text('Emniyet', style: TextStyle(fontSize: 10))) : null,
              );
            },
          ),
        ],
      ),
    );
  }

  // --- 5. KURALLAR EKRANI ---
  Widget _buildRulesScreen() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: operationalRules.length,
      itemBuilder: (ctx, i) {
        final rule = operationalRules[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(rule.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    Chip(
                      label: Text(rule.level, style: const TextStyle(fontSize: 11)),
                      backgroundColor: rule.level == 'Kritik' ? Colors.red.shade50 : Colors.blue.shade50,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(rule.detail, style: const TextStyle(fontSize: 13, color: Colors.black87)),
              ],
            ),
          ),
        );
      },
    );
  }
}
