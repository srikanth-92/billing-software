import {
  collection, doc, setDoc, getDoc, getDocs, updateDoc,
  query, where, runTransaction, onSnapshot,
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
  const ref = doc(collection(db, 'orders'), order.orderId);
  await setDoc(ref, {
    ...order,
    dateStr: todayDateStr(),
    savedAt: new Date().toISOString(),
  });
}

// Returns existing order data if already saved, otherwise null
export async function getExistingOrder(orderId) {
  try {
    const snap = await getDoc(doc(db, 'orders', orderId));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

export async function loadTodayOrders() {
  return loadOrdersByDate(todayDateStr());
}

export async function loadOrdersByDate(dateStr) {
  try {
    const q = query(
      collection(db, 'orders'),
      where('dateStr', '==', dateStr)
    );
    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => d.data());
    return docs.sort((a, b) => (b.savedAt > a.savedAt ? 1 : -1));
  } catch (e) {
    console.warn('loadOrdersByDate failed:', e.code, e.message);
    return [];
  }
}

// Real-time listener for today's orders — calls cb(orders[]) on every change
export function subscribeTodayOrders(cb) {
  const q = query(
    collection(db, 'orders'),
    where('dateStr', '==', todayDateStr())
  );
  return onSnapshot(
    q,
    (snap) => {
      const docs = snap.docs.map((d) => d.data());
      cb(docs.sort((a, b) => (b.savedAt > a.savedAt ? 1 : -1)));
    },
    (err) => console.warn('subscribeTodayOrders error:', err.code, err.message)
  );
}

// Returns { [dateStr]: order[] } for the last N days
export async function loadOrdersForDays(n = 7) {
  const days = lastNDays(n);
  const entries = await Promise.all(
    days.map(async (d) => [d, await loadOrdersByDate(d)])
  );
  return Object.fromEntries(entries);
}

// Returns { [dateStr]: order[] } for all dates in [fromDateStr, toDateStr]
export async function loadOrdersForRange(fromDateStr, toDateStr) {
  try {
    const q = query(
      collection(db, 'orders'),
      where('dateStr', '>=', fromDateStr),
      where('dateStr', '<=', toDateStr)
    );
    const snap = await getDocs(q);
    const byDate = {};
    snap.docs.forEach((d) => {
      const o = d.data();
      if (!byDate[o.dateStr]) byDate[o.dateStr] = [];
      byDate[o.dateStr].push(o);
    });
    return byDate;
  } catch (e) {
    console.warn('loadOrdersForRange failed:', e.code, e.message);
    return {};
  }
}

// ── Token counter ─────────────────────────────────────────────────────────────
// Firestore path: tokens/{cartId}_{dateStr} → { counter: N }
// Each cart has its own daily token sequence (T001, T002 …).

export async function getNextToken(cartId = 'cart') {
  const dateStr = todayDateStr();
  const ref = doc(db, 'tokens', `${cartId}_${dateStr}`);
  const token = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const next = snap.exists() ? snap.data().counter + 1 : 1;
    tx.set(ref, { counter: next });
    return next;
  });
  return `T${String(token).padStart(3, '0')}`;
}

// Mark a guest order's print job as done
export async function markOrderPrinted(orderId) {
  try {
    await updateDoc(doc(db, 'orders', orderId), { printPending: false });
  } catch (e) {
    console.warn('markOrderPrinted failed:', e);
  }
}

// Mark a guest order as served by the vendor
export async function markOrderServed(orderId) {
  try {
    await updateDoc(doc(db, 'orders', orderId), { served: true });
  } catch (e) {
    console.warn('markOrderServed failed:', e);
  }
}

// Subscribe to NEW unprinted guest orders for a specific cart — fires cb(order) for each
export function subscribeGuestOrders(cartId, cb) {
  const q = query(
    collection(db, 'orders'),
    where('cartId', '==', cartId),
    where('isGuestOrder', '==', true),
    where('printPending', '==', true)
  );
  return onSnapshot(q, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === 'added') cb(change.doc.data());
    });
  });
}

// Subscribe to all pending (unserved) guest orders for a cart today — calls cb(orders[])
export function subscribeCartPendingOrders(cartId, cb) {
  const q = query(
    collection(db, 'orders'),
    where('cartId', '==', cartId),
    where('isGuestOrder', '==', true)
  );
  return onSnapshot(q, (snap) => {
    const today = todayDateStr();
    const pending = snap.docs
      .map((d) => d.data())
      .filter((o) => o.dateStr === today && !o.served)
      .sort((a, b) => (a.savedAt > b.savedAt ? 1 : -1));
    cb(pending);
  });
}

// ── Cart-level availability overrides ────────────────────────────────────────
// Firestore path: config/cart_overrides
// Shape: { [cartId]: string[] } — disabled item IDs per cart.

export async function loadAllCartOverrides() {
  try {
    const snap = await getDoc(doc(db, 'config', 'cart_overrides'));
    if (!snap.exists()) return {};
    return snap.data();
  } catch (e) {
    console.warn('loadAllCartOverrides failed:', e);
    return {};
  }
}

export async function loadCartOverrides(cartId) {
  const all = await loadAllCartOverrides();
  return all[cartId] || [];
}

export async function saveCartOverrides(cartId, disabledIds) {
  await setDoc(doc(db, 'config', 'cart_overrides'), { [cartId]: disabledIds }, { merge: true });
}

// Real-time listener for a single cart's disabled item IDs
export function subscribeCartOverrides(cartId, cb) {
  return onSnapshot(
    doc(db, 'config', 'cart_overrides'),
    (snap) => cb(snap.exists() ? (snap.data()[cartId] || []) : []),
    (err) => console.warn('subscribeCartOverrides error:', err.message)
  );
}

// ── Weekly menu ───────────────────────────────────────────────────────────────
// Firestore path: config/weekly_menu
// Single document shared across all devices — admin writes, vendors read.

export async function saveWeeklyMenu(menu) {
  await setDoc(doc(db, 'config', 'weekly_menu'), { menu });
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
