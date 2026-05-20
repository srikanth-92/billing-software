import {
  collection, doc, setDoc, getDoc, getDocs,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

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
// Firestore path: orders/{orderId}
// Each document is one order with a `dateStr` field for day-based queries.

export async function saveOrder(order) {
  try {
    const ref = doc(collection(db, 'orders'), order.orderId);
    await setDoc(ref, {
      ...order,
      dateStr: todayDateStr(),
      savedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('saveOrder failed:', e);
  }
}

export async function loadTodayOrders() {
  return loadOrdersByDate(todayDateStr());
}

export async function loadOrdersByDate(dateStr) {
  try {
    const q = query(
      collection(db, 'orders'),
      where('dateStr', '==', dateStr),
      orderBy('savedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (e) {
    console.warn('loadOrdersByDate failed:', e);
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
// Firestore path: config/weekly_menu
// Single document shared across all devices — admin writes, vendors read.

export async function saveWeeklyMenu(menu) {
  try {
    await setDoc(doc(db, 'config', 'weekly_menu'), { menu });
  } catch (e) {
    console.warn('saveWeeklyMenu failed:', e);
  }
}

export async function loadWeeklyMenu() {
  try {
    const snap = await getDoc(doc(db, 'config', 'weekly_menu'));
    if (!snap.exists()) return null;
    return snap.data().menu;
  } catch (e) {
    console.warn('loadWeeklyMenu failed:', e);
    return null;
  }
}
