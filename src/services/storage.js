import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_KEY = '@salaryway_data_v1';

// In-memory fallback for testing or non-storage environments
let memoryStorage = {};

export async function loadData() {
  try {
    if (typeof AsyncStorage !== 'undefined' && AsyncStorage?.getItem) {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : null;
    }
    const mem = memoryStorage[STORE_KEY];
    return mem ? JSON.parse(mem) : null;
  } catch (e) {
    console.warn('Storage load error:', e);
    const mem = memoryStorage[STORE_KEY];
    return mem ? JSON.parse(mem) : null;
  }
}

export async function saveData(data) {
  try {
    const serialized = JSON.stringify(data);
    memoryStorage[STORE_KEY] = serialized;
    if (typeof AsyncStorage !== 'undefined' && AsyncStorage?.setItem) {
      await AsyncStorage.setItem(STORE_KEY, serialized);
    }
  } catch (e) {
    console.warn('Storage save error:', e);
  }
}

export async function clearData() {
  try {
    memoryStorage = {};
    if (typeof AsyncStorage !== 'undefined' && AsyncStorage?.removeItem) {
      await AsyncStorage.removeItem(STORE_KEY);
    }
  } catch (e) {
    console.warn('Storage clear error:', e);
  }
}
