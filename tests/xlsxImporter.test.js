const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { tracks } = require('../src/data/stationData');
const { asciiKey, fullWagonNumber, partialWagonInfo, buildSeriesLengthMap, importXlsxBuffer, importXlsxArrayBuffer } = require('../src/utils/xlsxImporter');
const XLSX = require('xlsx');

const fixture = 'C:/Users/win/Downloads/Kopya GAR SAHA YOLLARI.xlsx';
const uploadedFixture = 'C:/Users/win/.gemini/antigravity/brain/018c4da6-0548-4c22-829c-d0fb9cde54b6/.user_uploaded/media_1795454950274_faed1716.xlsx';
// Yüklenen dosyayı tercih et, yoksa indirilenlerden dene
const resolvedFixture = fs.existsSync(uploadedFixture) ? uploadedFixture : fixture;
const hasFixture = fs.existsSync(resolvedFixture);

// --- Birim testleri (Excel dosyası gerekmez) ---

test('asciiKey Türkçe karakterleri normalleştirir', () => {
  assert.equal(asciiKey('FERİBOT SAHASI'), 'FERIBOT SAHASI');
  assert.equal(asciiKey('ATÖLYE3'), 'ATOLYE3');
  assert.equal(asciiKey('TAMİR YOLU'), 'TAMIR YOLU');
});

test('fullWagonNumber H ve I sütunlarını birleştirir', () => {
  // row[5]=F, row[6]=G, row[7]=H, row[8]=I
  const row = ['1', 'TATVAN', '4', '14', 'EA', '33', '96', '5430', '556-6'];
  assert.equal(fullWagonNumber(row), '33 96 5430 556-6');
});

test('fullWagonNumber I sütunu boşsa boş string döner', () => {
  const row = ['1', 'TATVAN', '4', '14', 'EA', '31', '75', '7834', ''];
  assert.equal(fullWagonNumber(row), '');
});

test('partialWagonInfo H var I yok → partial:true', () => {
  const row = Array(9).fill('');
  row[7] = '7834'; // H dolu
  row[8] = '';     // I boş
  const info = partialWagonInfo(row);
  assert.equal(info.partial, true);
});

test('partialWagonInfo ikisi de boşsa partial:false', () => {
  const row = Array(9).fill('');
  const info = partialWagonInfo(row);
  assert.equal(info.partial, false);
});

// --- Entegrasyon testleri (Excel dosyası gerekir) ---

test('imports daily yard workbook in Depot to Rahva order', { skip: !hasFixture }, () => {
  const result = importXlsxBuffer(fs.readFileSync(resolvedFixture), tracks);
  assert.equal(result.summary.sheetCount, 25);
  assert.equal(result.summary.wagonCount, 224);
  const rampa3 = result.wagons.filter((wagon) => wagon.trackId === 'askeri-3');
  assert.equal(rampa3.length, 14);
  assert.equal(rampa3[0].positionFromDepot, 1);
  assert.equal(rampa3[0].positionFromRahva, 14);
  assert.equal(rampa3.at(-1).positionFromRahva, 1);
});

test('imports the workbook through the browser ArrayBuffer path', { skip: !hasFixture }, () => {
  const bytes = fs.readFileSync(resolvedFixture);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const result = importXlsxArrayBuffer(arrayBuffer, tracks);
  assert.equal(result.summary.wagonCount, 224);
});

test('eksik UIC satırları atlanarak skippedCount raporlanır', { skip: !hasFixture }, () => {
  const result = importXlsxBuffer(fs.readFileSync(resolvedFixture), tracks);
  // FERİBOT SAHASI (7) + 2 YOL (3) + 8 YOL (3) = en az 10 atlanan satır
  assert.ok(result.summary.skippedCount >= 10, `Beklenen ≥10, bulunan: ${result.summary.skippedCount}`);
  // Uyarı metninde eksik UIC ifadesi var mı?
  assert.ok(result.warnings.some((w) => w.includes('eksik UIC')));
});

test('mükerrer vagon sayısı 15 olarak raporlanır', { skip: !hasFixture }, () => {
  const result = importXlsxBuffer(fs.readFileSync(resolvedFixture), tracks);
  assert.equal(result.summary.duplicateCount, 15);
});

test('varış bilinmiyor uyarısı üretilir', { skip: !hasFixture }, () => {
  const result = importXlsxBuffer(fs.readFileSync(resolvedFixture), tracks);
  assert.ok(result.warnings.some((w) => w.includes('varış istasyonu')));
  assert.ok(result.summary.unknownDestinationCount > 200);
});

test('vagonlar sayfasından seri→uzunluk haritası oluşur', { skip: !hasFixture }, () => {
  const workbook = XLSX.readFile(resolvedFixture, { cellFormula: false });
  const map = buildSeriesLengthMap(workbook);
  assert.ok(map.size > 0, 'Harita boş olmamalı');
  // Ea serisi haritada olmalı (yaygın seri)
  const hasEa = map.has('Ea') || map.has('EA') || map.has('ea');
  assert.ok(hasEa, 'Ea serisi haritada bulunmalı');
});

test('uzunluğu 0 olan vagonlar için uyarı üretilir', { skip: !hasFixture }, () => {
  const result = importXlsxBuffer(fs.readFileSync(resolvedFixture), tracks);
  // Referanstan tamamlanamayan vagonlar varsa uyarı verilmeli;
  // yoksa (referanstan hepsi tamamlandıysa) zeroLengthCount=0 olabilir — test esnek
  if (result.summary.zeroLengthCount > 0) {
    assert.ok(result.warnings.some((w) => w.includes('uzunluğu') && w.includes('bulunamadı')));
  }
});
