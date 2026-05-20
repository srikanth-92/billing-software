import AsyncStorage from '@react-native-async-storage/async-storage';

const SALES_PREFIX = 'sales_';
const WEEKLY_MENU_KEY = 'weekly_menu';

// ── Date helpers ──────────────────────────────────────────────────────────────

export function todayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Returns last N days as 'YYYY-MM-DD' strings, most recent first
export function lastNDays(n = 7) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function saveOrder(order) {
  try {
    const key = `${SALES_PREFIX}${todayDateStr()}`;
    const existing = await AsyncStorage.getItem(key);
    const orders = existing ? JSON.parse(existing) : [];
    orders.unshift({ ...order, savedAt: new Date().toISOString() });
    await AsyncStorage.setItem(key, JSON.stringify(orders));
  } catch (e) {
    console.warn('saveOrder failed:', e);
  }
}

export async function loadTodayOrders() {
  return loadOrdersByDate(todayDateStr());
}

export async function loadOrdersByDate(dateStr) {
  try {
    const data = await AsyncStorage.getItem(`${SALES_PREFIX}${dateStr}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Returns { [dateStr]: order[] } for the last N days
export async function loadOrdersForDays(n = 7) {
  const days = lastNDays(n);
  const entries = await Promise.all(
    days.map(async (d) => [d, await loadOrdersByDate(d)])
  );
  return Object.fromEntries(entries);
}

// ── Weekly menu ───────────────────────────────────────────────────────────────
// Shape: { Breakfast: [{id,name,price,emoji,description,category},...], Lunch: [...], Dinner: [...] }
// Admin saves this once; vendors read it at order time.

export async function saveWeeklyMenu(menu) {
  try {
    await AsyncStorage.setItem(WEEKLY_MENU_KEY, JSON.stringify(menu));
  } catch (e) {
    console.warn('saveWeeklyMenu failed:', e);
  }
}

export async function loadWeeklyMenu() {
  try {
    const data = await AsyncStorage.getItem(WEEKLY_MENU_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
