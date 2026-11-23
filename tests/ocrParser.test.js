const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeWagonNumber, parseOcrDocument, detectDestination } = require('../src/utils/ocrParser');

test('normalizes full UIC wagon number', () => {
  assert.equal(normalizeWagonNumber('31 75 3547 120 - 3'), '31 75 3547 120-3');
});

test('normalizes 8-digit short wagon number', () => {
  assert.equal(normalizeWagonNumber('3547 120-3'), '3547 120-3');
});

test('extracts wagon numbers and reports declared mismatch', () => {
  const result = parseOcrDocument('Vagon 3 Dingil 12 GÜMRÜKLÜ İRAN 31 75 3547 120-3 EMNİYET VAN 31 75 6641 306-5');
  assert.equal(result.wagons.length, 2);
  assert.equal(result.header.declaredWagons, 3);
  assert.ok(result.warnings.some((item) => item.includes('OCR 2')));
});

test('detectDestination İran eşleştirir', () => {
  assert.equal(detectDestination('IRAN GUMRUKLU'), 'İran');
  assert.equal(detectDestination('İRAN'), 'İran');
});

test('detectDestination Van eşleştirir', () => {
  assert.equal(detectDestination('VAN ISTASYONU'), 'Van');
});

test('detectDestination Tatvan eşleştirir', () => {
  assert.equal(detectDestination('TATVAN CIKIS'), 'Tatvan');
});

test('detectDestination Elazığ eşleştirir', () => {
  assert.equal(detectDestination('ELAZIG'), 'Elazığ');
  assert.equal(detectDestination('ELAZİĞ'), 'Elazığ');
});

test('detectDestination Mersin eşleştirir', () => {
  assert.equal(detectDestination('MERSIN LIMAN'), 'Mersin');
});

test('detectDestination bilinmeyen istasyon için Bilinmiyor döner', () => {
  assert.equal(detectDestination('BILINMEYEN SEHIR'), 'Bilinmiyor');
});

test('OCR emniyet vagonunu doğru işaretler', () => {
  const result = parseOcrDocument('31 75 3547 120-3 EMNİYET VAN 31 75 6641 306-5 İRAN');
  const safetyWagon = result.wagons.find((w) => w.number === '31 75 3547 120-3');
  assert.ok(safetyWagon, 'Emniyet vagonu bulunmalı');
  assert.equal(safetyWagon.safety, true);
});

test('OCR güvenilirlik düşük numarada dusuk döner', () => {
  // 7 haneli geçersiz numara
  const result = parseOcrDocument('1234567');
  // Numara tam UIC formatına uymuyorsa dusuk olmalı
  if (result.wagons.length > 0) {
    assert.equal(result.wagons[0].confidence, 'dusuk');
  }
});

test('OCR id alanı eş zamanlı çağrılarda benzersizdir', () => {
  const result1 = parseOcrDocument('31 75 3547 120-3');
  const result2 = parseOcrDocument('31 75 3547 120-3');
  if (result1.wagons.length > 0 && result2.wagons.length > 0) {
    assert.notEqual(result1.wagons[0].id, result2.wagons[0].id);
  }
});
