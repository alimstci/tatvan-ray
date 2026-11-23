const test = require('node:test');
const assert = require('node:assert/strict');
const { buildConsist, getTrackUsage } = require('../src/utils/planner');

test('track usage uses useful length', () => {
  const result = getTrackUsage('a', [{ id: 'a', useful: 100 }], [
    { trackId: 'a', length: 25 }, { trackId: 'a', length: 35 },
  ]);
  assert.equal(result.used, 60);
  assert.equal(result.remaining, 40);
  assert.equal(result.percentage, 60);
  assert.equal(result.overflow, false);
  assert.equal(result.overflowWarning, null);
});

test('track usage taşma durumunda overflowWarning üretir', () => {
  const result = getTrackUsage('b', [{ id: 'b', useful: 50 }], [
    { trackId: 'b', length: 30 }, { trackId: 'b', length: 30 },
  ]);
  assert.equal(result.overflow, true);
  assert.ok(result.overflowWarning !== null);
  assert.ok(result.overflowWarning.includes('taşma'));
});

test('track usage uzunluğu 0 olan vagon için zeroLengthWarning üretir', () => {
  const result = getTrackUsage('c', [{ id: 'c', useful: 100 }], [
    { trackId: 'c', length: 20, number: '1234 567-8' },
    { trackId: 'c', length: 0,  number: '9999 000-1' },
  ]);
  assert.ok(result.zeroLengthWarning !== null);
  assert.ok(result.zeroLengthWarning.includes('9999 000-1'));
});

test('consist places available safety wagons at both ends', () => {
  const wagons = [
    { id: '1', safety: true,  destination: 'Van',  coupling: 'Manuel', length: 10, gross: 20, cargo: 'Boş', series: 'Ea' },
    { id: '2', safety: false, destination: 'İran', coupling: 'Manuel', length: 12, gross: 40, cargo: 'Yük', series: 'Ea' },
    { id: '3', safety: true,  destination: 'Van',  coupling: 'Manuel', length: 10, gross: 20, cargo: 'Boş', series: 'Ea' },
  ];
  const result = buildConsist(wagons, ['Van', 'İran']);
  assert.equal(result.wagons[0].safety, true);
  assert.equal(result.wagons.at(-1).safety, true);
  assert.equal(result.totalLength, 32);
  assert.equal(result.warnings.length, 0);
});

test('consist emniyet wagonu eksikse uyarı verir', () => {
  const wagons = [
    { id: '1', safety: false, destination: 'Van',  coupling: 'Manuel', length: 14, gross: 30, cargo: 'Yük', series: 'Ea' },
    { id: '2', safety: false, destination: 'İran', coupling: 'Manuel', length: 14, gross: 40, cargo: 'Yük', series: 'Ea' },
  ];
  const result = buildConsist(wagons);
  assert.ok(result.warnings.some((w) => w.includes('emniyet vagonu')));
});

test('consist varış sırasına göre doğru sıralar (ilk bırakılan kuyrukta)', () => {
  // destinationOrder = ['Van', 'İran'] → Van önce bırakılacak → kuyruğa yakın
  // Sort: rank(İran)=1 > rank(Van)=0 → İran yüksek rank = öne geliyor
  const wagons = [
    { id: '1', safety: false, destination: 'Van',  coupling: 'Manuel', length: 14, gross: 30, cargo: 'Yük', series: 'Ea' },
    { id: '2', safety: false, destination: 'İran', coupling: 'Manuel', length: 14, gross: 40, cargo: 'Yük', series: 'Ea' },
  ];
  const result = buildConsist(wagons, ['Van', 'İran']);
  // İran yüksek rank → dizinin başında (lokomotife yakın)
  assert.equal(result.wagons[0].destination, 'İran');
});

test('consist uzunluğu 0 olan vagon için uyarı üretir', () => {
  const wagons = [
    { id: '1', safety: true,  destination: 'Van',  coupling: 'Manuel', length: 10, gross: 20, cargo: 'Boş', series: 'Ea' },
    { id: '2', safety: false, destination: 'İran', coupling: 'Manuel', length: 0,  gross: 30, cargo: 'Yük', series: 'Ea', number: '1234 567-8' },
    { id: '3', safety: true,  destination: 'Van',  coupling: 'Manuel', length: 10, gross: 20, cargo: 'Boş', series: 'Ea' },
  ];
  const result = buildConsist(wagons, ['Van', 'İran']);
  assert.ok(result.warnings.some((w) => w.includes('uzunluğu bilinmiyor')));
});

test('consist koşum geçişini doğru tespit eder', () => {
  const wagons = [
    { id: '1', safety: true,  destination: 'Van',  coupling: 'Manuel',   length: 10, gross: 20, cargo: 'Boş', series: 'Ea' },
    { id: '2', safety: false, destination: 'Van',  coupling: 'Manuel',   length: 14, gross: 30, cargo: 'Yük', series: 'Ea' },
    { id: '3', safety: false, destination: 'Van',  coupling: 'Otomatik', length: 14, gross: 30, cargo: 'Yük', series: 'Ea' },
    { id: '4', safety: true,  destination: 'Van',  coupling: 'Manuel',   length: 10, gross: 20, cargo: 'Boş', series: 'Ea' },
  ];
  const result = buildConsist(wagons, ['Van']);
  assert.ok(result.warnings.some((w) => w.includes('koşum geçişi')));
});
