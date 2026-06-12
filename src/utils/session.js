import { Platform } from 'react-native';

const SESSION_KEY = 'bow_session';
export const INACTIVITY_MS = 2 * 60 * 60 * 1000;

export function saveSession(employee) {
  if (Platform.OS !== 'web') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ employee, lastActive: Date.now() }));
}

export function clearSession() {
  if (Platform.OS !== 'web') return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function loadSession() {
  if (Platform.OS !== 'web') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { employee, lastActive } = JSON.parse(raw);
    if (Date.now() - lastActive > INACTIVITY_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return employee;
  } catch {
    return null;
  }
}

export function touchSession() {
  if (Platform.OS !== 'web') return;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    data.lastActive = Date.now();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {}
}
