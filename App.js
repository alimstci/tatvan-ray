import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView, StatusBar as NativeStatusBar, StyleSheet, Text, View, ScrollView,
  Pressable, TextInput, Modal, Platform, Image, ActivityIndicator, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
const { tracks, sampleWagons, operationalRules } = require('./src/data/stationData');
const { getTrackUsage, buildConsist } = require('./src/utils/planner');
const { parseOcrDocument } = require('./src/utils/ocrParser');
const { loadYard, saveYard, clearLocalData } = require('./src/services/localStore');
const { importXlsxBase64, importXlsxArrayBuffer } = require('./src/utils/xlsxImporter');

const C = {
  ink: '#14213D', forest: '#1D3557', cream: '#F4F7FB', paper: '#FFFFFF',
  orange: '#F26B38', gold: '#E9B949', muted: '#64748B', line: '#DDE5EF',
  red: '#C63D4F', green: '#187D66', blue: '#2563A9', pale: '#EAF0F7',
};

function Icon({ name, size = 20, color = C.ink }) {
  const symbols = { home: '⌂', rail: '═', train: '▰', scan: '▣', shield: '◇', search: '⌕', plus: '+', arrow: '›', close: '×', check: '✓', alert: '!', map: '⌁', camera: '◉' };
  return <Text style={{ fontSize: size, lineHeight: size + 3, color, fontWeight: '800' }}>{symbols[name] || '•'}</Text>;
}

function Header({ eyebrow, title, right }) {
  return (
    <View style={s.header}>
      <View style={{ flex: 1 }}>
        <Text style={s.eyebrow}>{eyebrow}</Text>
        <Text style={s.title}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

function Pill({ children, tone = 'green' }) {
  const tones = {
    green: { bg: '#E1EEE8', text: C.green }, orange: { bg: '#FCE8DE', text: C.orange },
    gray: { bg: '#EDF0ED', text: C.muted }, red: { bg: '#F6E2DE', text: C.red }, blue: { bg: '#E3ECF2', text: C.blue },
  };
  return <View style={[s.pill, { backgroundColor: tones[tone].bg }]}><Text style={[s.pillText, { color: tones[tone].text }]}>{children}</Text></View>;
}

function Stat({ value, label, accent }) {
  return (
    <View style={s.stat}>
      <View style={[s.statMark, { backgroundColor: accent }]} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function Dashboard({ wagons, yardTracks, setTab }) {
  const usedTracks = new Set(wagons.map((item) => item.trackId)).size;
  const consist = buildConsist(wagons);
  const busiest = yardTracks.map((item) => getTrackUsage(item.id, yardTracks, wagons)).sort((a, b) => b.percentage - a.percentage).slice(0, 4);
  return (
    <ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>
      <Header eyebrow="TATVAN • 28 EKİM 2026" title="Operasyon merkezi" right={<View style={s.avatar}><Text style={s.avatarText}>TT</Text></View>} />

      <View style={s.hero}>
        <View style={s.heroTop}><Pill tone="orange">CANLI ENVANTER</Pill><Text style={s.heroTime}>17:42</Text></View>
        <Text style={s.heroTitle}>Saha hazır, plan sende.</Text>
        <Text style={s.heroText}>Yol doluluklarını izle, vagonları topla ve güvenli diziyi tek ekranda oluştur.</Text>
        <Pressable style={s.heroButton} onPress={() => setTab('consist')}><Text style={s.heroButtonText}>Yeni dizi oluştur</Text><Icon name="arrow" color="#fff" /></Pressable>
        <View style={s.heroRail}><View style={s.heroTrain} /><View style={s.heroTrain} /><View style={s.heroTrain} /><View style={s.heroTrain} /></View>
      </View>

      <View style={s.statsRow}>
        <Stat value={yardTracks.length} label="Kayıtlı yol" accent={C.green} />
        <Stat value={wagons.length} label="Aktif vagon" accent={C.orange} />
        <Stat value={usedTracks} label="Dolu yol" accent={C.gold} />
      </View>

      <View style={s.sectionHead}><Text style={s.sectionTitle}>Yoğun yollar</Text><Pressable onPress={() => setTab('tracks')}><Text style={s.link}>Tüm yollar</Text></Pressable></View>
      {busiest.map((track) => <TrackCompact key={track.id} track={track} />)}

      <View style={s.sectionHead}><Text style={s.sectionTitle}>Dizi kontrolü</Text><Pill tone={consist.warnings.length ? 'orange' : 'green'}>{consist.warnings.length ? `${consist.warnings.length} UYARI` : 'HAZIR'}</Pill></View>
      <View style={s.summaryCard}>
        <View style={s.summaryIcon}><Icon name="train" size={24} color={C.orange} /></View>
        <View style={{ flex: 1 }}><Text style={s.cardTitle}>{consist.wagons.length} vagonluk taslak</Text><Text style={s.cardSub}>{consist.totalLength.toFixed(1)} m • {consist.totalGross} ton brüt</Text></View>
        <Icon name="arrow" color={C.muted} />
      </View>
      <View style={s.notice}><Icon name="shield" color={C.gold} /><Text style={s.noticeText}>Bu uygulama karar desteğidir. Resmî evrak, fren ve hareket onayı yerine geçmez.</Text></View>
    </ScrollView>
  );
}

function TrackCompact({ track }) {
  return (
    <View style={s.trackCompact}>
      <View style={{ flex: 1 }}>
        <View style={s.rowBetween}><Text style={s.trackName}>{track.name}</Text><Text style={s.capacity}>{track.used.toFixed(1)} / {track.useful} m</Text></View>
        <View style={s.bar}><View style={[s.barFill, { width: `${track.percentage}%`, backgroundColor: track.percentage > 85 ? C.red : track.percentage > 60 ? C.orange : C.green }]} /></View>
        <Text style={s.trackMeta}>{track.group} • {track.wagons.length} vagon • %{track.percentage}</Text>
      </View>
    </View>
  );
}

function Tracks({ wagons, yardTracks }) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('Tümü');
  const [onlyOccupied, setOnlyOccupied] = useState(true);
  const [expandedTrack, setExpandedTrack] = useState(null);
  const groups = ['Tümü', ...new Set(yardTracks.map((item) => item.group))];
  const trackRows = yardTracks.map((item) => ({ item, usage: getTrackUsage(item.id, yardTracks, wagons) }));
  const occupiedCount = trackRows.filter(({ usage }) => usage.wagons.length > 0).length;
  const filtered = trackRows.filter(({ item, usage }) => (!onlyOccupied || usage.wagons.length > 0) && (group === 'Tümü' || item.group === group) && `${item.name} ${item.group}`.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')));
  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>
        <Header eyebrow="DEPO → RAHVA" title="Saha yolları" right={<View style={s.countBadge}><Text style={s.countText}>{yardTracks.length}</Text></View>} />
        <View style={s.search}><Icon name="search" color={C.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Yol veya grup ara" placeholderTextColor="#8B948F" style={s.searchInput} /></View>
        <View style={s.visibilitySwitch}><Pressable onPress={() => setOnlyOccupied(true)} style={[s.visibilityOption, onlyOccupied && s.visibilityOptionActive]}><Text style={[s.visibilityText, onlyOccupied && s.visibilityTextActive]}>Dolu yollar ({occupiedCount})</Text></Pressable><Pressable onPress={() => setOnlyOccupied(false)} style={[s.visibilityOption, !onlyOccupied && s.visibilityOptionActive]}><Text style={[s.visibilityText, !onlyOccupied && s.visibilityTextActive]}>Tüm yollar ({yardTracks.length})</Text></Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {groups.map((item) => <Pressable key={item} onPress={() => setGroup(item)} style={[s.filter, group === item && s.filterActive]}><Text style={[s.filterText, group === item && s.filterTextActive]}>{item}</Text></Pressable>)}
        </ScrollView>
        <Text style={s.result}>{filtered.length} yol gösteriliyor</Text>
        {filtered.map(({ item, usage }) => {
          const expanded = expandedTrack === item.id;
          return <View key={item.id} style={[s.trackCard, !expanded && s.trackCardCollapsed]}>
            <Pressable onPress={() => setExpandedTrack(expanded ? null : item.id)} style={s.trackCardButton}><View style={{ flex: 1 }}><Text style={s.trackCardTitle}>{item.name}</Text><Text style={s.trackGroup}>{item.group} • {usage.wagons.length ? `${usage.wagons.length} vagon` : 'Boş'} • {usage.remaining.toFixed(1)} m kalan</Text></View><View style={s.trackCardRight}><Pill tone={usage.wagons.length ? 'orange' : 'green'}>{usage.wagons.length ? `${usage.wagons.length} VAGON` : 'BOŞ'}</Pill><Text style={s.expandMark}>{expanded ? '−' : '+'}</Text></View></Pressable>
            {expanded && <><View style={s.metricRow}><View><Text style={s.metricLabel}>NORMAL</Text><Text style={s.metricValue}>{item.normal} m</Text></View><View><Text style={s.metricLabel}>FAYDALI</Text><Text style={s.metricValue}>{item.useful} m</Text></View><View><Text style={s.metricLabel}>KALAN</Text><Text style={s.metricValue}>{usage.remaining.toFixed(1)} m</Text></View></View>
            <View style={s.bar}><View style={[s.barFill, { width: `${usage.percentage}%`, backgroundColor: usage.percentage > 85 ? C.red : C.green }]} /></View>
            {usage.wagons.length > 0 && <View><View style={s.directionRow}><Text style={s.directionText}>DEPO</Text><Text style={s.directionLine}>────────→</Text><Text style={s.directionText}>RAHVA</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.wagonStrip}>{[...usage.wagons].sort((a, b) => (a.positionFromDepot || 999) - (b.positionFromDepot || 999)).map((wagon) => <View key={wagon.id} style={s.miniWagon}><Text style={s.miniPosition}>{wagon.positionFromDepot || '?'}</Text><Text style={s.miniNumber}>{wagon.number}</Text><Text style={s.miniMeta}>R:{wagon.positionFromRahva || '?'}</Text></View>)}</ScrollView></View>}
            <View style={s.kmRow}><Text style={s.kmText}>{item.start}</Text><View style={s.kmLine}><View style={s.dot} /><View style={s.line} /><View style={s.dot} /></View><Text style={s.kmText}>{item.end}</Text></View></>}
          </View>;
        })}
      </ScrollView>
    </View>
  );
}

function Consist({ wagons, setWagons }) {
  const [selected, setSelected] = useState(wagons.map((item) => item.id));
  const [modal, setModal] = useState(false);
  const planned = useMemo(() => buildConsist(wagons.filter((item) => selected.includes(item.id)), ['Tatvan', 'Van', 'İran']), [wagons, selected]);
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return (
    <ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>
      <Header eyebrow="MANEVRA PLANI" title="Tren dizisi" right={<Pressable style={s.addButton} onPress={() => setModal(true)}><Icon name="plus" color="#fff" /></Pressable>} />
      <View style={s.planSummary}>
        <View><Text style={s.planBig}>{planned.wagons.length}</Text><Text style={s.planLabel}>VAGON</Text></View><View style={s.vDivider} /><View><Text style={s.planBig}>{planned.totalLength.toFixed(1)}</Text><Text style={s.planLabel}>METRE</Text></View><View style={s.vDivider} /><View><Text style={s.planBig}>{planned.totalGross}</Text><Text style={s.planLabel}>BRÜT TON</Text></View>
      </View>

      <View style={s.sectionHead}><Text style={s.sectionTitle}>Dizi sırası</Text><Pill tone="gray">LOKOMOTİF → KUYRUK</Pill></View>
      <View style={s.loco}><View style={s.locoFace} /><Text style={s.locoText}>LOKOMOTİF</Text></View>
      {planned.wagons.map((wagon, index) => <View key={wagon.id} style={s.wagonRow}>
        <View style={s.order}><Text style={s.orderText}>{index + 1}</Text></View>
        <View style={[s.wagonCard, wagon.safety && { borderColor: C.gold, backgroundColor: '#FFF9E9' }]}>
          <View style={s.rowBetween}><Text style={s.wagonNo}>{wagon.number}</Text>{wagon.safety ? <Pill tone="orange">EMNİYET</Pill> : <Pill tone={wagon.coupling === 'Otomatik' ? 'blue' : 'gray'}>{wagon.coupling.toUpperCase()}</Pill>}</View>
          <Text style={s.wagonMeta}>{wagon.series} • {wagon.cargo} • {wagon.destination}</Text>
          <Text style={s.wagonMeasure}>{wagon.length} m  ·  {wagon.gross} t</Text>
        </View>
      </View>)}

      {planned.warnings.length > 0 && <View style={s.warningBox}><View style={s.warningTitle}><Icon name="alert" color={C.orange} /><Text style={s.warningHeading}>Kontrol gerekenler</Text></View>{planned.warnings.map((item) => <Text key={item} style={s.warningText}>• {item}</Text>)}</View>}

      <Text style={[s.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Havuzdaki vagonlar</Text>
      {wagons.map((wagon) => <Pressable key={wagon.id} onPress={() => toggle(wagon.id)} style={[s.poolRow, !selected.includes(wagon.id) && { opacity: .45 }]}><View style={[s.checkbox, selected.includes(wagon.id) && s.checkboxActive]}>{selected.includes(wagon.id) && <Icon name="check" size={14} color="#fff" />}</View><View style={{ flex: 1 }}><Text style={s.poolTitle}>{wagon.number}</Text><Text style={s.poolSub}>{wagon.trackId} • {wagon.destination}</Text></View><Text style={s.poolMeasure}>{wagon.length} m</Text></Pressable>)}
      <AddWagonModal visible={modal} onClose={() => setModal(false)} onAdd={(wagon) => { setWagons((current) => [...current, wagon]); setSelected((current) => [...current, wagon.id]); setModal(false); }} />
    </ScrollView>
  );
}

function AddWagonModal({ visible, onClose, onAdd }) {
  const [number, setNumber] = useState(''); const [destination, setDestination] = useState('Van'); const [length, setLength] = useState('14');
  const submit = () => {
    if (!number.trim()) return;
    onAdd({ id: `W-${Date.now()}`, number: number.trim(), series: '—', destination, trackId: 'gar-1', length: Number(length) || 0, gross: 0, coupling: 'Manuel', cargo: 'Belirtilmedi', safety: false });
    setNumber('');
  };
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}><View style={s.modalShade}><View style={s.modalCard}>
    <View style={s.rowBetween}><View><Text style={s.eyebrow}>HIZLI KAYIT</Text><Text style={s.modalTitle}>Vagon ekle</Text></View><Pressable onPress={onClose} style={s.close}><Icon name="close" /></Pressable></View>
    <Text style={s.inputLabel}>VAGON NUMARASI</Text><TextInput style={s.input} placeholder="Örn. 3547 120-3" value={number} onChangeText={setNumber} />
    <Text style={s.inputLabel}>VARIŞ</Text><View style={s.choiceRow}>{['Van', 'İran'].map((item) => <Pressable key={item} onPress={() => setDestination(item)} style={[s.choice, destination === item && s.choiceActive]}><Text style={[s.choiceText, destination === item && { color: '#fff' }]}>{item}</Text></Pressable>)}</View>
    <Text style={s.inputLabel}>UZUNLUK (METRE)</Text><TextInput keyboardType="decimal-pad" style={s.input} value={length} onChangeText={setLength} />
    <Pressable style={s.submit} onPress={submit}><Text style={s.submitText}>Vagonu havuza ekle</Text></Pressable>
  </View></View></Modal>;
}

function DuplicatePanel({ groups = [] }) {
  const [expanded, setExpanded] = useState(false);
  const pairCounts = groups.reduce((result, group) => {
    const pair = group.occurrences.map((item) => item.sheetName).join(' ↔ ');
    result[pair] = (result[pair] || 0) + 1;
    return result;
  }, {});
  return <View style={s.conflictPanel}>
    <View style={s.conflictHeader}><View style={s.conflictIcon}><Text style={s.conflictIconText}>!</Text></View><View style={{ flex: 1 }}><Text style={s.conflictTitle}>{groups.length} vagonun yolu çakışıyor</Text><Text style={s.conflictLead}>Excel aynı vagonu iki ayrı yol sayfasında gösteriyor. Bu vagonların gerçek yolu sahada doğrulanmalı.</Text></View></View>
    <View style={s.pairSummary}>{Object.entries(pairCounts).map(([pair, count]) => <View key={pair} style={s.pairChip}><Text style={s.pairCount}>{count}</Text><Text style={s.pairText}>{pair}</Text></View>)}</View>
    <Pressable style={s.conflictToggle} onPress={() => setExpanded((current) => !current)}><Text style={s.conflictToggleText}>{expanded ? 'Ayrıntıları gizle' : 'Çakışan vagonları göster'}</Text><Text style={s.conflictChevron}>{expanded ? '⌃' : '⌄'}</Text></Pressable>
    {expanded && <View style={s.conflictList}>{groups.map((group, index) => <View key={group.number} style={s.conflictCard}>
      <View style={s.conflictCardTop}><View style={s.conflictOrder}><Text style={s.conflictOrderText}>{index + 1}</Text></View><View style={{ flex: 1 }}><Text style={s.duplicateNumber}>{group.number}</Text><Text style={s.conflictReason}>Bu numara Excel’de aşağıdaki iki konumda kayıtlı:</Text></View></View>
      <View style={s.locationRow}>{group.occurrences.map((item, occurrenceIndex) => <React.Fragment key={`${item.sheetName}-${item.row}`}><View style={s.locationCard}><Text style={s.locationLabel}>OLASI KONUM {occurrenceIndex + 1}</Text><Text style={s.locationTrack}>{item.sheetName}</Text><Text style={s.locationMeta}>Excel satırı {item.row}</Text><Text style={s.locationMeta}>Depo’dan {item.positionFromDepot}. • Rahva’dan {item.positionFromRahva}.</Text></View>{occurrenceIndex === 0 && <View style={s.orBadge}><Text style={s.orText}>VEYA</Text></View>}</React.Fragment>)}</View>
      <View style={s.actionHint}><Text style={s.actionHintText}>Yapılacak: Sahadaki doğru yolu belirle; diğer sayfadaki kayıt eski veya hatalı olabilir.</Text></View>
    </View>)}</View>}
  </View>;
}

function DailyYard({ wagons, yardTracks, importInfo, onImport, onClear, setTab }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pickWorkbook = async () => {
    setBusy(true); setError('');
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', copyToCacheDirectory: true, multiple: false });
      if (picked.canceled) return;
      const asset = picked.assets[0];
      let parsed;
      if (Platform.OS === 'web') {
        const arrayBuffer = asset.file
          ? await asset.file.arrayBuffer()
          : await (await fetch(asset.uri)).arrayBuffer();
        parsed = importXlsxArrayBuffer(arrayBuffer, tracks);
      } else {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        parsed = importXlsxBase64(base64, tracks);
      }
      onImport(parsed, { fileName: asset.name, fileSize: asset.size || null, importedAt: new Date().toISOString(), importMode: 'replace', ...parsed.summary });
    } catch (cause) {
      setError(`Excel okunamadı: ${cause?.message || 'Bilinmeyen hata'}`);
    } finally { setBusy(false); }
  };
  const occupied = new Set(wagons.map((wagon) => wagon.trackId)).size;
  const requestClear = () => {
    const execute = () => onClear().catch((cause) => setError(`Veriler silinemedi: ${cause?.message || 'Bilinmeyen hata'}`));
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('Telefondaki günlük saha ve vagon kayıtları tamamen silinsin mi? Bu işlem geri alınamaz.')) execute();
      return;
    }
    Alert.alert('Tüm yerel verileri sil', 'Günlük saha, vagon ve içe aktarma kayıtları silinecek. Bu işlem geri alınamaz.', [{ text: 'Vazgeç', style: 'cancel' }, { text: 'Verileri sil', style: 'destructive', onPress: execute }]);
  };
  return <ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>
    <Header eyebrow="GÜNLÜK VAZİYET" title="Sahayı yükle" right={<View style={s.summaryIcon}><Icon name="rail" color={C.orange} /></View>} />
    <View style={s.dailyHero}><Text style={s.dailyTitle}>Hareket memurundan gelen Excel’i seç.</Text><Text style={s.dailyText}>Yol sayfaları ve vagon sıraları cihazda okunur. Soldan sağa sıralama Depo → Rahva olarak kaydedilir.</Text><Pressable style={s.heroButton} onPress={pickWorkbook} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <><Text style={s.heroButtonText}>Günlük Excel’i seç</Text><Icon name="arrow" color="#fff" /></>}</Pressable></View>
    {!!error && <View style={s.warningBox}><Text style={s.warningText}>{error}</Text></View>}
    <View style={s.statsRow}><Stat value={wagons.length} label="Sahadaki vagon" accent={C.orange} /><Stat value={occupied} label="Dolu yol" accent={C.green} /><Stat value={yardTracks.length} label="Tanımlı yol" accent={C.gold} /></View>
    {importInfo ? <><View style={s.importCard}><View style={s.rowBetween}><Text style={s.cardTitle}>Son yüklenen vaziyet</Text><Pill tone="green">CİHAZDA</Pill></View><Text style={s.importFile}>{importInfo.fileName}</Text><Text style={s.cardSub}>{importInfo.wagonCount} vagon • {importInfo.sheetCount} Excel sayfası • {importInfo.roadSheetCount} dolu yol</Text><View style={s.replaceNotice}><Icon name="check" size={14} color={C.green} /><Text style={s.replaceNoticeText}>Yeni Excel, önceki saha listesinin yerine kaydedildi; vagonlar eski listeye eklenmedi.</Text></View></View>{importInfo.duplicateCount > 0 && <DuplicatePanel groups={importInfo.duplicateGroups || []} />}</> : <View style={s.notice}><Icon name="alert" color={C.gold} /><Text style={s.noticeText}>Henüz günlük Excel yüklenmedi. Örnek vagonlar gösteriliyor.</Text></View>}
    <View style={s.sectionHead}><Text style={s.sectionTitle}>Sonraki işlem</Text></View>
    <Pressable style={s.workflowCard} onPress={() => setTab('tracks')}><View style={s.workflowNo}><Text style={s.workflowNoText}>1</Text></View><View style={{ flex: 1 }}><Text style={s.cardTitle}>Yol sıralarını kontrol et</Text><Text style={s.cardSub}>Vagonları Depo → Rahva düzeninde görüntüle.</Text></View><Icon name="arrow" color={C.muted} /></Pressable>
    <Pressable style={s.workflowCard} onPress={() => setTab('scan')}><View style={s.workflowNo}><Text style={s.workflowNoText}>2</Text></View><View style={{ flex: 1 }}><Text style={s.cardTitle}>Tren görevini tara</Text><Text style={s.cardSub}>Hedef vagon listesini fotoğraftan oku.</Text></View><Icon name="arrow" color={C.muted} /></Pressable>
    <View style={s.dataControls}><View style={{ flex: 1 }}><Text style={s.dataControlTitle}>Yerel veri yönetimi</Text><Text style={s.dataControlText}>Yüklenen günlük saha ve vagon kayıtlarını bu cihazdan temizler.</Text></View><Pressable style={s.deleteButton} onPress={requestClear}><Text style={s.deleteButtonText}>Tümünü sil</Text></Pressable></View>
  </ScrollView>;
}

function ScanDocument({ onImport }) {
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const acquire = async (camera) => {
    setError('');
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(camera ? 'Kamera izni verilmedi.' : 'Fotoğraf erişim izni verilmedi.');
      return;
    }
    const options = { mediaTypes: ['images'], quality: 1, allowsEditing: false };
    const picked = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!picked.canceled && picked.assets?.[0]?.uri) {
      setImageUri(picked.assets[0].uri);
      setResult(null);
    }
  };

  const recognize = async () => {
    if (!imageUri) return;
    if (Platform.OS === 'web') {
      setError('Çevrimdışı OCR yalnız Android/iOS geliştirme APK’sında çalışır.');
      return;
    }
    setBusy(true); setError('');
    try {
      const TextRecognition = require('@react-native-ml-kit/text-recognition').default;
      const nativeResult = await TextRecognition.recognize(imageUri);
      setResult(parseOcrDocument(nativeResult.text || ''));
    } catch (cause) {
      setError(`OCR çalıştırılamadı: ${cause?.message || 'Bilinmeyen hata'}`);
    } finally {
      setBusy(false);
    }
  };

  const updateWagon = (id, field, value) => setResult((current) => ({
    ...current,
    wagons: current.wagons.map((wagon) => wagon.id === id ? { ...wagon, [field]: value } : wagon),
  }));

  const confirmAll = () => setResult((current) => ({ ...current, wagons: current.wagons.map((wagon) => ({ ...wagon, confirmed: true })) }));
  const importConfirmed = () => {
    const confirmed = result?.wagons.filter((wagon) => wagon.confirmed) || [];
    if (!confirmed.length) return Alert.alert('Onay gerekli', 'En az bir vagon satırını onaylayın.');
    onImport(confirmed);
    Alert.alert('Yerel kayıt tamamlandı', `${confirmed.length} vagon cihazdaki envantere aktarıldı.`);
  };

  return <ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>
    <Header eyebrow="TAMAMEN ÇEVRİMDIŞI" title="Belgeyi tara" right={<View style={s.summaryIcon}><Icon name="scan" color={C.orange} /></View>} />
    <View style={s.ruleIntro}><Text style={s.ruleIntroTitle}>Fotoğraf cihazdan çıkmaz.</Text><Text style={s.ruleIntroText}>Belge yerel ML Kit modeliyle okunur. Sonuçlar siz onaylamadan vagon envanterine eklenmez.</Text></View>
    <View style={s.scanActions}>
      <Pressable style={s.scanAction} onPress={() => acquire(true)}><Icon name="camera" color={C.orange} size={25} /><Text style={s.scanActionTitle}>Fotoğraf çek</Text><Text style={s.scanActionSub}>Belgeyi düz ve tam kadraj alın</Text></Pressable>
      <Pressable style={s.scanAction} onPress={() => acquire(false)}><Icon name="scan" color={C.green} size={25} /><Text style={s.scanActionTitle}>Galeriden seç</Text><Text style={s.scanActionSub}>Mevcut resmi içeri aktarın</Text></Pressable>
    </View>
    {imageUri && <View style={s.previewCard}><Image source={{ uri: imageUri }} resizeMode="contain" style={s.previewImage} /><Pressable style={s.submit} disabled={busy} onPress={recognize}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Çevrimdışı OCR’ı çalıştır</Text>}</Pressable></View>}
    {!!error && <View style={s.warningBox}><Text style={s.warningText}>{error}</Text></View>}
    {result && <View>
      <View style={s.sectionHead}><Text style={s.sectionTitle}>Okuma sonucu</Text><Pill tone={result.warnings.length ? 'orange' : 'green'}>{result.wagons.length} VAGON</Pill></View>
      <View style={s.ocrHeader}><Text style={s.cardSub}>Başlık vagon: <Text style={s.ocrStrong}>{result.header.declaredWagons ?? 'Okunamadı'}</Text></Text><Text style={s.cardSub}>Başlık dingil: <Text style={s.ocrStrong}>{result.header.declaredAxles ?? 'Okunamadı'}</Text></Text></View>
      {result.warnings.map((warning) => <View key={warning} style={s.ocrWarning}><Icon name="alert" color={C.orange} /><Text style={s.ocrWarningText}>{warning}</Text></View>)}
      <View style={s.rowBetween}><Text style={[s.sectionTitle, { marginVertical: 14 }]}>Satır doğrulama</Text><Pressable onPress={confirmAll}><Text style={s.link}>Tümünü onayla</Text></Pressable></View>
      {result.wagons.map((wagon, index) => <View key={wagon.id} style={[s.ocrRow, wagon.confirmed && s.ocrRowConfirmed]}>
        <View style={s.rowBetween}><Text style={s.ocrIndex}>{index + 1}. SATIR</Text><Pressable onPress={() => updateWagon(wagon.id, 'confirmed', !wagon.confirmed)} style={[s.checkbox, wagon.confirmed && s.checkboxActive]}>{wagon.confirmed && <Icon name="check" size={14} color="#fff" />}</Pressable></View>
        <Text style={s.inputLabel}>VAGON NUMARASI</Text><TextInput style={s.input} value={wagon.number} onChangeText={(value) => updateWagon(wagon.id, 'number', value)} />
        <View style={s.ocrChoices}>{['Van', 'İran', 'Bilinmiyor'].map((item) => <Pressable key={item} onPress={() => updateWagon(wagon.id, 'destination', item)} style={[s.ocrChoice, wagon.destination === item && s.choiceActive]}><Text style={[s.choiceText, wagon.destination === item && { color: '#fff' }]}>{item}</Text></Pressable>)}</View>
        <View style={s.ocrChoices}>{['Manuel', 'Otomatik', 'Bilinmiyor'].map((item) => <Pressable key={item} onPress={() => updateWagon(wagon.id, 'coupling', item)} style={[s.ocrChoice, wagon.coupling === item && s.choiceActive]}><Text style={[s.choiceText, wagon.coupling === item && { color: '#fff' }]}>{item}</Text></Pressable>)}</View>
        <Pressable onPress={() => updateWagon(wagon.id, 'safety', !wagon.safety)} style={s.safetyToggle}><View style={[s.checkbox, wagon.safety && { backgroundColor: C.gold, borderColor: C.gold }]}>{wagon.safety && <Icon name="check" size={14} color="#fff" />}</View><Text style={s.poolTitle}>Emniyet vagonu</Text></Pressable>
      </View>)}
      <Pressable style={s.submit} onPress={importConfirmed}><Text style={s.submitText}>Onaylananları yerel envantere aktar</Text></Pressable>
      <View style={s.notice}><Icon name="shield" color={C.gold} /><Text style={s.noticeText}>OCR sonucu taslaktır. Vagon numarası, yol, yük, koşum ve teknik uygunluk sahada doğrulanmalıdır.</Text></View>
    </View>}
  </ScrollView>;
}

function Rules() {
  return <ScrollView contentContainerStyle={s.screen} showsVerticalScrollIndicator={false}>
    <Header eyebrow="KARAR DESTEĞİ" title="Kontrol kuralları" right={<View style={s.summaryIcon}><Icon name="shield" color={C.orange} /></View>} />
    <View style={s.ruleIntro}><Text style={s.ruleIntroTitle}>Önce emniyet, sonra hız.</Text><Text style={s.ruleIntroText}>Aşağıdaki maddeler sohbet ve saha anlatımından çıkarılmış taslak kurallardır. Kurum mevzuatıyla onaylanmadan otomatik hareket emri üretmez.</Text></View>
    {operationalRules.map((rule, index) => <View key={rule.id} style={s.ruleCard}><View style={s.ruleIndex}><Text style={s.ruleIndexText}>0{index + 1}</Text></View><View style={{ flex: 1 }}><View style={s.rowBetween}><Text style={s.ruleTitle}>{rule.title}</Text><Pill tone={rule.level === 'Kritik' ? 'red' : 'gray'}>{rule.level.toUpperCase()}</Pill></View><Text style={s.ruleDetail}>{rule.detail}</Text></View></View>)}
    <View style={s.sourceCard}><Icon name="map" color={C.gold} size={28} /><View style={{ flex: 1 }}><Text style={s.cardTitle}>Veri kaynakları</Text><Text style={s.cardSub}>Tatvan normal/faydalı yol uzunlukları (13.05.2026), saha şeması ve paylaşılan Gemini konuşması.</Text></View></View>
  </ScrollView>;
}

function BottomNav({ tab, setTab }) {
  const items = [['daily', 'home', 'Günlük'], ['tracks', 'rail', 'Yollar'], ['scan', 'scan', 'Tara'], ['consist', 'train', 'Dizi'], ['rules', 'shield', 'Kurallar']];
  return <View style={s.nav}>{items.map(([id, icon, label]) => <Pressable key={id} onPress={() => setTab(id)} style={s.navItem}><View style={[s.navIcon, tab === id && s.navIconActive]}><Icon name={icon} color={tab === id ? '#fff' : C.muted} /></View><Text style={[s.navLabel, tab === id && s.navLabelActive]}>{label}</Text></Pressable>)}</View>;
}

export default function App() {
  const [tab, setTab] = useState('daily');
  const [wagons, setWagons] = useState([]);
  const [yardTracks, setYardTracks] = useState(tracks);
  const [importInfo, setImportInfo] = useState(null);
  const hydrated = useRef(false);
  useEffect(() => {
    loadYard({ wagons: [], tracks, importInfo: null }).then((stored) => {
      setWagons(stored.wagons || []);
      setYardTracks(stored.tracks || tracks);
      setImportInfo(stored.importInfo || null);
      hydrated.current = true;
    });
  }, []);
  useEffect(() => {
    if (hydrated.current) saveYard({ wagons, tracks: yardTracks, importInfo }).catch(() => {});
  }, [wagons, yardTracks, importInfo]);
  const importDailyYard = (parsed, info) => {
    setWagons(parsed.wagons);
    setYardTracks(parsed.tracks);
    setImportInfo({ ...info, warnings: parsed.warnings });
  };
  const clearAllData = async () => {
    await clearLocalData();
    hydrated.current = false;
    setWagons([]);
    setYardTracks(tracks);
    setImportInfo(null);
    setTimeout(() => { hydrated.current = true; }, 0);
  };
  const importScanned = (items) => setWagons((current) => {
    const known = new Set(current.map((wagon) => wagon.number));
    return [...current, ...items.filter((wagon) => !known.has(wagon.number))];
  });
  const pages = {
    daily: <DailyYard wagons={wagons} yardTracks={yardTracks} importInfo={importInfo} onImport={importDailyYard} onClear={clearAllData} setTab={setTab} />,
    tracks: <Tracks wagons={wagons} yardTracks={yardTracks} />,
    scan: <ScanDocument onImport={importScanned} />,
    consist: <Consist wagons={wagons} setWagons={setWagons} />,
    rules: <Rules />,
  };
  return <SafeAreaView style={s.safe}><StatusBar style="dark" /><NativeStatusBar barStyle="dark-content" backgroundColor={C.cream} /><View style={s.app}>{pages[tab]}<BottomNav tab={tab} setTab={setTab} /></View></SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream, paddingTop: Platform.OS === 'android' ? 8 : 0 }, app: { flex: 1, width: '100%', maxWidth: 680, alignSelf: 'center', backgroundColor: C.cream },
  screen: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 120 }, header: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 }, eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8, color: C.orange, marginBottom: 5 }, title: { fontSize: 29, lineHeight: 33, fontWeight: '900', color: C.ink, letterSpacing: -.7 },
  avatar: { width: 44, height: 44, borderRadius: 16, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontWeight: '900' }, countBadge: { minWidth: 44, height: 44, paddingHorizontal: 10, borderRadius: 15, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' }, countText: { color: C.ink, fontWeight: '900', fontSize: 17 },
  hero: { overflow: 'hidden', backgroundColor: C.ink, borderRadius: 25, padding: 22, marginBottom: 16 }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, heroTime: { color: '#B9CBC3', fontSize: 12, fontWeight: '700' }, heroTitle: { color: '#fff', fontSize: 27, fontWeight: '900', marginTop: 20, letterSpacing: -.5 }, heroText: { color: '#C7D6D0', lineHeight: 20, marginTop: 8, maxWidth: 390 }, heroButton: { alignSelf: 'flex-start', flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 22, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: C.orange, borderRadius: 13 }, heroButtonText: { color: '#fff', fontWeight: '800' }, heroRail: { marginTop: 24, borderBottomWidth: 2, borderColor: '#577068', flexDirection: 'row', gap: 5, paddingLeft: 30 }, heroTrain: { width: 47, height: 18, borderRadius: 4, backgroundColor: '#3D6257', borderBottomWidth: 3, borderColor: C.gold },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 }, pillText: { fontSize: 9, fontWeight: '900', letterSpacing: .6 }, statsRow: { flexDirection: 'row', gap: 9, marginBottom: 28 }, stat: { flex: 1, backgroundColor: C.paper, borderRadius: 17, padding: 14, borderWidth: 1, borderColor: '#E8E7E1' }, statMark: { width: 18, height: 4, borderRadius: 9, marginBottom: 9 }, statValue: { color: C.ink, fontSize: 22, fontWeight: '900' }, statLabel: { color: C.muted, fontSize: 11, marginTop: 2 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3, marginBottom: 12 }, sectionTitle: { color: C.ink, fontSize: 18, fontWeight: '900' }, link: { color: C.orange, fontSize: 12, fontWeight: '800' }, trackCompact: { backgroundColor: C.paper, borderRadius: 16, padding: 15, marginBottom: 9, borderWidth: 1, borderColor: '#E7E7E1' }, rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, trackName: { color: C.ink, fontWeight: '800', fontSize: 14 }, capacity: { color: C.muted, fontSize: 11, fontWeight: '700' }, bar: { height: 6, borderRadius: 9, backgroundColor: '#E5E9E6', overflow: 'hidden', marginVertical: 10 }, barFill: { height: '100%', borderRadius: 9 }, trackMeta: { color: C.muted, fontSize: 11 },
  summaryCard: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: C.paper, borderWidth: 1, borderColor: '#E7E7E1', marginBottom: 12 }, summaryIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: '#FBE9DF', justifyContent: 'center', alignItems: 'center' }, cardTitle: { color: C.ink, fontSize: 15, fontWeight: '900' }, cardSub: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 3 }, notice: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 14, backgroundColor: '#F5EDDA' }, noticeText: { flex: 1, color: '#715F39', fontSize: 11, lineHeight: 16 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.paper, borderRadius: 15, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, height: 50, marginBottom: 12 }, searchInput: { flex: 1, color: C.ink, fontSize: 14 }, visibilitySwitch: { flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: '#E8EEF6', marginBottom: 13 }, visibilityOption: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 }, visibilityOptionActive: { backgroundColor: C.paper, shadowColor: '#0F172A', shadowOpacity: .08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, visibilityText: { color: C.muted, fontSize: 11, fontWeight: '800' }, visibilityTextActive: { color: C.ink }, filter: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: C.paper }, filterActive: { backgroundColor: C.ink, borderColor: C.ink }, filterText: { color: C.muted, fontSize: 11, fontWeight: '700' }, filterTextActive: { color: '#fff' }, result: { color: C.muted, fontSize: 11, marginVertical: 12 }, trackCard: { backgroundColor: C.paper, borderRadius: 18, padding: 17, marginBottom: 10, borderWidth: 1, borderColor: C.line }, trackCardCollapsed: { paddingVertical: 13 }, trackCardButton: { flexDirection: 'row', alignItems: 'center', gap: 10 }, trackCardRight: { flexDirection: 'row', alignItems: 'center', gap: 9 }, expandMark: { width: 27, height: 27, borderRadius: 9, backgroundColor: C.pale, color: C.blue, fontSize: 20, lineHeight: 25, textAlign: 'center', fontWeight: '700' }, trackCardTitle: { color: C.ink, fontSize: 17, fontWeight: '900' }, trackGroup: { color: C.muted, fontSize: 11, marginTop: 3 }, metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 17, paddingRight: 8 }, metricLabel: { color: C.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, metricValue: { color: C.ink, fontSize: 15, fontWeight: '800', marginTop: 3 }, kmRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, kmText: { color: C.muted, fontSize: 9 }, kmLine: { flex: 1, flexDirection: 'row', alignItems: 'center' }, dot: { width: 5, height: 5, borderRadius: 5, backgroundColor: C.gold }, line: { height: 1, flex: 1, backgroundColor: C.line },
  directionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }, directionText: { color: C.orange, fontSize: 9, fontWeight: '900', letterSpacing: .8 }, directionLine: { flex: 1, color: C.line, textAlign: 'center', marginHorizontal: 7 }, wagonStrip: { gap: 6, paddingVertical: 9 }, miniWagon: { width: 105, minHeight: 61, borderRadius: 11, backgroundColor: C.pale, borderWidth: 1, borderColor: '#D6DDD8', padding: 8 }, miniPosition: { color: C.orange, fontSize: 9, fontWeight: '900' }, miniNumber: { color: C.ink, fontSize: 10, fontWeight: '900', marginTop: 3 }, miniMeta: { color: C.muted, fontSize: 9, marginTop: 3 },
  addButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.orange, justifyContent: 'center', alignItems: 'center' }, planSummary: { backgroundColor: C.ink, borderRadius: 21, padding: 19, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 24 }, planBig: { color: '#fff', fontSize: 23, fontWeight: '900', textAlign: 'center' }, planLabel: { color: '#9FB4AC', fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginTop: 3 }, vDivider: { width: 1, height: 32, backgroundColor: '#45645B' }, loco: { height: 45, backgroundColor: C.orange, borderRadius: 13, flexDirection: 'row', alignItems: 'center', padding: 11, gap: 10, marginBottom: 8 }, locoFace: { width: 21, height: 21, borderWidth: 3, borderColor: '#fff', borderRadius: 5 }, locoText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 }, wagonRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 }, order: { width: 29, height: 29, borderRadius: 9, backgroundColor: C.pale, justifyContent: 'center', alignItems: 'center' }, orderText: { color: C.ink, fontWeight: '900', fontSize: 11 }, wagonCard: { flex: 1, borderRadius: 15, borderWidth: 1, borderColor: C.line, backgroundColor: C.paper, padding: 13 }, wagonNo: { color: C.ink, fontSize: 15, fontWeight: '900' }, wagonMeta: { color: C.muted, fontSize: 11, marginTop: 6 }, wagonMeasure: { color: C.ink, fontSize: 10, fontWeight: '800', marginTop: 5 }, warningBox: { backgroundColor: '#FFF2E9', borderRadius: 17, padding: 15, marginTop: 12, borderLeftWidth: 4, borderLeftColor: C.orange }, warningTitle: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 7 }, warningHeading: { color: C.ink, fontWeight: '900' }, warningText: { color: '#744B38', fontSize: 11, lineHeight: 17, marginTop: 3 }, poolRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, backgroundColor: C.paper, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E7E7E1' }, checkbox: { width: 23, height: 23, borderRadius: 7, borderWidth: 1.5, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }, checkboxActive: { backgroundColor: C.green, borderColor: C.green }, poolTitle: { color: C.ink, fontWeight: '800', fontSize: 13 }, poolSub: { color: C.muted, fontSize: 10, marginTop: 2 }, poolMeasure: { color: C.muted, fontWeight: '800', fontSize: 11 },
  modalShade: { flex: 1, backgroundColor: 'rgba(12,31,26,.45)', justifyContent: 'flex-end' }, modalCard: { backgroundColor: C.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 23, paddingBottom: 36 }, modalTitle: { color: C.ink, fontSize: 25, fontWeight: '900' }, close: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.pale, justifyContent: 'center', alignItems: 'center' }, inputLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 19, marginBottom: 7 }, input: { height: 49, borderRadius: 13, borderWidth: 1, borderColor: C.line, backgroundColor: C.paper, paddingHorizontal: 14, color: C.ink }, choiceRow: { flexDirection: 'row', gap: 8 }, choice: { flex: 1, borderRadius: 13, borderWidth: 1, borderColor: C.line, alignItems: 'center', padding: 13, backgroundColor: C.paper }, choiceActive: { backgroundColor: C.ink, borderColor: C.ink }, choiceText: { color: C.ink, fontWeight: '800' }, submit: { backgroundColor: C.orange, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 }, submitText: { color: '#fff', fontWeight: '900' },
  ruleIntro: { backgroundColor: C.ink, padding: 20, borderRadius: 21, marginBottom: 16 }, ruleIntroTitle: { color: '#fff', fontSize: 21, fontWeight: '900' }, ruleIntroText: { color: '#BED0C9', fontSize: 12, lineHeight: 18, marginTop: 8 }, ruleCard: { flexDirection: 'row', gap: 13, backgroundColor: C.paper, borderRadius: 17, padding: 15, borderWidth: 1, borderColor: '#E7E7E1', marginBottom: 9 }, ruleIndex: { width: 34, height: 34, borderRadius: 10, backgroundColor: C.pale, justifyContent: 'center', alignItems: 'center' }, ruleIndexText: { color: C.green, fontSize: 11, fontWeight: '900' }, ruleTitle: { color: C.ink, fontSize: 14, fontWeight: '900', flex: 1 }, ruleDetail: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 8 }, sourceCard: { flexDirection: 'row', gap: 14, backgroundColor: '#F5EDDA', borderRadius: 17, padding: 17, marginTop: 12, alignItems: 'center' },
  scanActions: { flexDirection: 'row', gap: 10, marginBottom: 14 }, scanAction: { flex: 1, minHeight: 125, backgroundColor: C.paper, borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 15, justifyContent: 'center' }, scanActionTitle: { color: C.ink, fontWeight: '900', fontSize: 14, marginTop: 9 }, scanActionSub: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 4 }, previewCard: { backgroundColor: C.paper, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: C.line, marginBottom: 16 }, previewImage: { width: '100%', height: 290, borderRadius: 12, backgroundColor: '#EEF0EC' }, ocrHeader: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: C.paper, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.line, marginBottom: 9 }, ocrStrong: { color: C.ink, fontWeight: '900' }, ocrWarning: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, padding: 11, backgroundColor: '#FFF2E9', borderRadius: 12, marginBottom: 7 }, ocrWarningText: { flex: 1, color: '#744B38', fontSize: 11, lineHeight: 16 }, ocrRow: { backgroundColor: C.paper, borderRadius: 17, borderWidth: 1, borderColor: C.line, padding: 14, marginBottom: 10 }, ocrRowConfirmed: { borderColor: C.green, backgroundColor: '#F4FAF6' }, ocrIndex: { color: C.orange, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, ocrChoices: { flexDirection: 'row', gap: 6, marginTop: 9 }, ocrChoice: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: C.line, alignItems: 'center', paddingVertical: 9, paddingHorizontal: 2, backgroundColor: C.paper }, safetyToggle: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 },
  dailyHero: { backgroundColor: C.ink, borderRadius: 23, padding: 21, marginBottom: 16, shadowColor: '#0F172A', shadowOpacity: .12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }, dailyTitle: { color: '#fff', fontSize: 23, lineHeight: 28, fontWeight: '900' }, dailyText: { color: '#CBD5E1', fontSize: 12, lineHeight: 18, marginTop: 9 }, importCard: { backgroundColor: C.paper, borderRadius: 18, padding: 17, borderWidth: 1, borderColor: C.line, marginBottom: 13 }, importFile: { color: C.ink, fontSize: 14, fontWeight: '900', marginTop: 12 }, replaceNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: '#EAF7F2', borderRadius: 10, padding: 10, marginTop: 12 }, replaceNoticeText: { flex: 1, color: '#176451', fontSize: 10, lineHeight: 15 }, duplicateNumber: { color: C.ink, fontSize: 13, fontWeight: '900' },
  conflictPanel: { backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F1C8CE', padding: 16, marginBottom: 22, shadowColor: '#8B1E2D', shadowOpacity: .07, shadowRadius: 14, shadowOffset: { width: 0, height: 5 } }, conflictHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, conflictIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FDECEF', alignItems: 'center', justifyContent: 'center' }, conflictIconText: { color: C.red, fontSize: 20, fontWeight: '900' }, conflictTitle: { color: C.ink, fontSize: 17, fontWeight: '900' }, conflictLead: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 4 }, pairSummary: { gap: 7, marginTop: 14 }, pairChip: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#F6F8FB', borderRadius: 11, padding: 10, borderWidth: 1, borderColor: C.line }, pairCount: { minWidth: 25, height: 25, borderRadius: 8, backgroundColor: '#FDECEF', color: C.red, textAlign: 'center', textAlignVertical: 'center', lineHeight: 25, fontSize: 11, fontWeight: '900' }, pairText: { color: C.ink, fontSize: 12, fontWeight: '800' }, conflictToggle: { marginTop: 13, height: 43, borderRadius: 12, backgroundColor: C.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, conflictToggleText: { color: '#FFF', fontSize: 12, fontWeight: '900' }, conflictChevron: { color: '#FFF', fontSize: 17, fontWeight: '900' }, conflictList: { marginTop: 13, gap: 10 }, conflictCard: { borderRadius: 15, padding: 13, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: C.line }, conflictCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, conflictOrder: { width: 27, height: 27, borderRadius: 8, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' }, conflictOrderText: { color: '#FFF', fontSize: 10, fontWeight: '900' }, conflictReason: { color: C.muted, fontSize: 10, marginTop: 3 }, locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 11, gap: 5 }, locationCard: { flex: 1, minHeight: 88, borderRadius: 11, padding: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: C.line }, locationLabel: { color: C.blue, fontSize: 7, fontWeight: '900', letterSpacing: .7 }, locationTrack: { color: C.ink, fontSize: 14, fontWeight: '900', marginTop: 4 }, locationMeta: { color: C.muted, fontSize: 9, marginTop: 3 }, orBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FDECEF', alignItems: 'center', justifyContent: 'center', marginHorizontal: -2, zIndex: 2 }, orText: { color: C.red, fontSize: 7, fontWeight: '900' }, actionHint: { backgroundColor: '#FFF8E7', borderRadius: 9, padding: 9, marginTop: 9, borderLeftWidth: 3, borderLeftColor: C.gold }, actionHintText: { color: '#755B18', fontSize: 9, lineHeight: 14 }, workflowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, backgroundColor: C.paper, borderRadius: 17, borderWidth: 1, borderColor: C.line, marginBottom: 9 }, workflowNo: { width: 35, height: 35, borderRadius: 11, backgroundColor: '#E8F2FF', alignItems: 'center', justifyContent: 'center' }, workflowNoText: { color: C.blue, fontSize: 13, fontWeight: '900' },
  dataControls: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 24, padding: 15, borderRadius: 16, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#F1C8CE' }, dataControlTitle: { color: C.ink, fontSize: 13, fontWeight: '900' }, dataControlText: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 3 }, deleteButton: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FDECEF' }, deleteButtonText: { color: C.red, fontSize: 10, fontWeight: '900' },
  nav: { position: 'absolute', left: 12, right: 12, bottom: Platform.OS === 'ios' ? 9 : 12, height: 73, borderRadius: 22, backgroundColor: C.paper, flexDirection: 'row', borderWidth: 1, borderColor: '#DDDFDA', shadowColor: '#142D27', shadowOpacity: .13, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 9, paddingHorizontal: 7, paddingVertical: 7 }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 }, navIcon: { width: 32, height: 32, borderRadius: 11, justifyContent: 'center', alignItems: 'center' }, navIconActive: { backgroundColor: C.ink }, navLabel: { fontSize: 9, color: C.muted, fontWeight: '700' }, navLabelActive: { color: C.ink, fontWeight: '900' },
});
