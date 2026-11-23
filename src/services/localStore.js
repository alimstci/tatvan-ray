const AsyncStorage = require('@react-native-async-storage/async-storage').default;

const WAGONS_KEY = '@tatvan-ray/wagons-v1';
const YARD_KEY = '@tatvan-ray/yard-v1';

async function loadWagons(fallback = []) {
  try {
    const raw = await AsyncStorage.getItem(WAGONS_KEY);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

async function saveWagons(wagons) {
  await AsyncStorage.setItem(WAGONS_KEY, JSON.stringify(wagons));
}

async function loadYard(fallback) {
  try {
    const raw = await AsyncStorage.getItem(YARD_KEY);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

async function saveYard(yard) {
  await AsyncStorage.setItem(YARD_KEY, JSON.stringify(yard));
}

async function clearLocalData() {
  await AsyncStorage.multiRemove([WAGONS_KEY, YARD_KEY]);
}

module.exports = { loadWagons, saveWagons, loadYard, saveYard, clearLocalData, WAGONS_KEY, YARD_KEY };

