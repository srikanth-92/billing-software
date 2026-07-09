import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, SafeAreaView, ActivityIndicator, Platform,
} from 'react-native';
import { MENU_ITEMS, RESTAURANT_NAME, RESTAURANT_GSTIN, EMPLOYEES } from '../constants';
import { clearSession } from '../utils/session';
import { THEME } from '../constants/theme';
import { formatCurrency } from '../utils/razorpay';
import {
  loadWeeklyMenu, subscribeGuestOrders, markOrderPrinted,
  subscribeCartPendingOrders, markOrderServed,
  loadCartOverrides, saveCartOverrides,
} from '../utils/storage';
import { printBill } from '../utils/bill';

const CATEGORIES = ['Menu'];
const CATEGORY_TIMES = {
  Menu: 'All Day',
};
const CATEGORY_META = {
  Menu: { emoji: '🍽️', color: '#ea580c', bg: '#fff7ed' },
};

const TABS = ['Orders', 'Stock'];

export default function MenuScreen({ navigation, route }) {
  const employee = EMPLOYEES.find((e) => e.username === route.params?.employeeUsername) || EMPLOYEES[1];
  const [activeTab, setActiveTab] = useState('Orders');
  const [menuData, setMenuData] = useState(null);
  const [disabledItems, setDisabledItems] = useState(new Set());
  const [localDisabled, setLocalDisabled] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);

  // Subscribe to pending (unserved) guest orders for this cart
  useEffect(() => {
    const unsub = subscribeCartPendingOrders(employee.username, setPendingOrders);
    return () => unsub();
  }, []);

  // Alert + print on new guest order
  useEffect(() => {
    const unsub = subscribeGuestOrders(employee.username, async (order) => {
      Alert.alert(
        `🎫 Token ${order.tokenNumber} — Guest Order`,
        `${order.items.map((i) => `${i.name} ×${i.qty}`).join('\n')}\n\nTotal: ₹${order.total.toFixed(2)}`,
        [
          {
            text: 'Print Bill',
            onPress: async () => {
              try {
                await printBill({
                  orderId: order.orderId, items: order.items,
                  subtotal: order.subtotal, tax: order.tax, total: order.total,
                  employeeName: 'Guest (Self-Order)', paymentMode: 'UPI / Razorpay',
                  tokenNumber: order.tokenNumber,
                });
                await markOrderPrinted(order.orderId);
              } catch (e) {
                Alert.alert('Print Error', e.message || 'Could not print.');
              }
            },
          },
          { text: 'Dismiss', style: 'cancel' },
        ]
      );
    });
    return () => unsub();
  }, []);

  // Load menu + this cart's disabled items
  useEffect(() => {
    Promise.all([loadWeeklyMenu(), loadCartOverrides(employee.username)]).then(([saved, disabledIds]) => {
      const disabled = new Set(disabledIds);
      setDisabledItems(disabled);
      setLocalDisabled(new Set(disabled));
      const defaults = {};
      CATEGORIES.forEach((cat) => { defaults[cat] = MENU_ITEMS.filter((i) => i.category === cat); });
      if (!saved) { setMenuData(defaults); return; }
      const merged = { ...saved };
      CATEGORIES.forEach((cat) => { if (!merged[cat]?.length) merged[cat] = defaults[cat]; });
      setMenuData(merged);
    });
  }, []);

  function toggleItem(itemId) {
    setLocalDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  }

  async function handleSaveStock() {
    setSaving(true);
    try {
      const ids = [...localDisabled];
      await saveCartOverrides(employee.username, ids);
      setDisabledItems(new Set(ids));
      if (Platform.OS === 'web') window.alert('Stock updated.');
      else Alert.alert('Saved', 'Stock updated.');
    } catch (e) {
      if (Platform.OS === 'web') window.alert(e.message || 'Could not save.');
      else Alert.alert('Error', e.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearSession();
    navigation.replace('Login');
  }

  // ── Orders tab ────────────────────────────────────────────────────────────
  const OrdersTab = () => (
    <View style={styles.ordersContainer}>
      <View style={styles.ordersHeader}>
        <Text style={styles.ordersTitle}>🎫 Pending Orders</Text>
        {pendingOrders.length > 0 && (
          <View style={styles.ordersBadge}>
            <Text style={styles.ordersBadgeText}>{pendingOrders.length}</Text>
          </View>
        )}
      </View>
      {pendingOrders.length === 0 ? (
        <View style={styles.ordersEmpty}>
          <Text style={styles.ordersEmptyEmoji}>✅</Text>
          <Text style={styles.ordersEmptyText}>All orders served</Text>
          <Text style={styles.ordersEmptyHint}>New guest orders will appear here automatically</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.ordersGrid}
          showsVerticalScrollIndicator={false}
        >
          {pendingOrders.map((order) => (
            <View key={order.orderId} style={styles.orderCard}>
              <View style={styles.orderTokenBox}>
                <Text style={styles.orderTokenLabel}>TOKEN</Text>
                <Text style={styles.orderTokenNum}>{order.tokenNumber}</Text>
              </View>
              <View style={styles.orderBody}>
                {order.items.map((item, i) => (
                  <View key={i} style={styles.orderItemRow}>
                    <Text style={styles.orderItemEmoji}>{item.emoji}</Text>
                    <Text style={styles.orderItemName}>{item.name}</Text>
                    <Text style={styles.orderItemQty}>×{item.qty}</Text>
                  </View>
                ))}
                <View style={styles.orderDivider} />
                <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
                {order.phone ? (
                  <Text style={styles.orderPhone}>📱 {order.phone}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.serveBtn}
                onPress={() => markOrderServed(order.orderId)}
              >
                <Text style={styles.serveBtnText}>✓ Served</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );

  // ── Stock tab ─────────────────────────────────────────────────────────────
  const StockTab = () => {
    const [stockCat, setStockCat] = useState(CATEGORIES[0]);
    if (!menuData) return <ActivityIndicator style={{ marginTop: 60 }} size="large" color={THEME.gold} />;
    const allItems = Object.values(menuData).flat();
    const offCount = localDisabled.size;
    const meta = CATEGORY_META[stockCat];
    const items = menuData[stockCat] || [];
    return (
      <View style={{ flex: 1 }}>
        {/* Status bar */}
        <Text style={styles.stockStatus}>
          {employee.name} · {allItems.length - offCount} available · {offCount} unavailable
        </Text>
        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.stockTabBar}>
          {CATEGORIES.map((cat) => {
            const m = CATEGORY_META[cat];
            const active = cat === stockCat;
            const offInCat = (menuData[cat] || []).filter((i) => localDisabled.has(i.id)).length;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.stockCatTab, active && { backgroundColor: m.color, borderColor: m.color }]}
                onPress={() => setStockCat(cat)}
              >
                <Text style={styles.stockCatTabEmoji}>{m.emoji}</Text>
                <View>
                  <Text style={[styles.stockCatTabLabel, active && { color: '#fff' }]}>{cat}</Text>
                  <Text style={[styles.stockCatTabTime, active && { color: 'rgba(255,255,255,0.8)' }]}>{CATEGORY_TIMES[cat]}</Text>
                </View>
                {offInCat > 0 && (
                  <View style={[styles.stockCatTabBadge, { backgroundColor: active ? '#fff' : '#ef4444' }]}>
                    <Text style={[styles.stockCatTabBadgeText, { color: active ? '#ef4444' : '#fff' }]}>{offInCat}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {/* Items for selected category */}
        <ScrollView
          style={[{ flex: 1 }, Platform.OS === 'web' && { height: 0 }]}
          contentContainerStyle={styles.stockContent}
        >
          <View style={[styles.stockCard, { borderTopColor: meta.color }]}>
            <View style={[styles.stockCatHeader, { backgroundColor: meta.bg }]}>
              <Text style={styles.stockCatEmoji}>{meta.emoji}</Text>
              <Text style={[styles.stockCatTitle, { color: meta.color }]}>{stockCat}</Text>
            </View>
            {items.map((item, idx) => {
              const isOff = localDisabled.has(item.id);
              return (
                <View key={item.id}>
                  <TouchableOpacity
                    style={styles.stockRow}
                    onPress={() => toggleItem(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.stockEmoji, isOff && styles.stockOff]}>{item.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stockName, isOff && styles.stockOff]}>{item.name}</Text>
                      <Text style={styles.stockPrice}>₹{item.price}</Text>
                    </View>
                    <View style={[styles.stockToggle, isOff ? styles.stockToggleOff : styles.stockToggleOn]}>
                      <Text style={styles.stockToggleText}>{isOff ? 'Out of Stock' : 'Available'}</Text>
                    </View>
                  </TouchableOpacity>
                  {idx < items.length - 1 && <View style={styles.divider} />}
                </View>
              );
            })}
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveStock} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Save Stock</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{RESTAURANT_NAME}</Text>
          <Text style={styles.headerSub}>Logged in as {employee.name}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('GuestQR')} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Guest QR</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Sales')} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Sales</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            {t === 'Orders' && pendingOrders.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingOrders.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1, minHeight: 0 }}>
        {activeTab === 'Orders' && <OrdersTab />}
        {activeTab === 'Stock' && <StockTab />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.offWhite, ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' } : {}) },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: THEME.navy, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: THEME.goldBorder,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.gold },
  headerSub: { fontSize: 12, color: THEME.slateLight, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: {
    backgroundColor: 'rgba(201,168,64,0.18)', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1, borderColor: THEME.goldBorder,
  },
  headerBtnText: { color: THEME.gold, fontSize: 13, fontWeight: '600' },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
  },
  logoutText: { color: THEME.white, fontSize: 13, fontWeight: '600' },

  // ── Tab bar ───────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row', backgroundColor: THEME.white,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 14, flexShrink: 0,
  },
  tabActive: { borderBottomWidth: 3, borderBottomColor: THEME.gold },
  tabText: { fontSize: 14, fontWeight: '600', color: THEME.slateLight },
  tabTextActive: { color: THEME.navy },
  tabBadge: { backgroundColor: '#ea580c', borderRadius: 9, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  tabBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  // ── Orders tab ────────────────────────────────────────────────────────────
  ordersContainer: { flex: 1 },
  ordersHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  ordersTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.navy },
  ordersBadge: { backgroundColor: '#ea580c', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  ordersBadgeText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  ordersEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  ordersEmptyEmoji: { fontSize: 56, marginBottom: 12 },
  ordersEmptyText: { fontSize: 18, fontWeight: 'bold', color: THEME.navy, marginBottom: 6 },
  ordersEmptyHint: { fontSize: 13, color: THEME.slateLight, textAlign: 'center', paddingHorizontal: 40 },
  ordersGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16,
    paddingHorizontal: 16, paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: THEME.white, borderRadius: 16, width: 220,
    borderLeftWidth: 4, borderLeftColor: THEME.gold,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    overflow: 'hidden',
  },
  orderTokenBox: {
    backgroundColor: THEME.navy, alignItems: 'center', paddingVertical: 14,
  },
  orderTokenLabel: { fontSize: 10, color: THEME.slateLight, letterSpacing: 2, fontWeight: '600' },
  orderTokenNum: { fontSize: 48, fontWeight: 'bold', color: THEME.gold, lineHeight: 56 },
  orderBody: { padding: 14 },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  orderItemEmoji: { fontSize: 16, marginRight: 8, width: 22 },
  orderItemName: { flex: 1, fontSize: 13, color: THEME.text },
  orderItemQty: { fontSize: 13, fontWeight: 'bold', color: THEME.navy },
  orderDivider: { height: 1, backgroundColor: THEME.rowBorder, marginVertical: 10 },
  orderTotal: { fontSize: 16, fontWeight: 'bold', color: THEME.navy },
  orderPhone: { fontSize: 12, color: THEME.slate, marginTop: 4 },
  serveBtn: { backgroundColor: '#22c55e', margin: 12, marginTop: 0, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  serveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // ── Stock tab ─────────────────────────────────────────────────────────────
  stockTabBar: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  stockCatTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: THEME.goldBorder, backgroundColor: THEME.white,
  },
  stockCatTabEmoji: { fontSize: 15 },
  stockCatTabLabel: { fontSize: 13, fontWeight: '600', color: THEME.slate },
  stockCatTabTime: { fontSize: 10, color: THEME.slateLight, marginTop: 1 },
  stockCatTabBadge: { minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  stockCatTabBadgeText: { fontSize: 11, fontWeight: 'bold' },
  stockContent: { padding: 16, paddingBottom: 40 },
  stockStatus: {
    fontSize: 13, fontWeight: '600', color: THEME.slate,
    backgroundColor: THEME.white, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14,
  },
  stockCard: {
    backgroundColor: THEME.white, borderRadius: 14, marginBottom: 14,
    borderTopWidth: 3, overflow: 'hidden',
    shadowColor: THEME.gold, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  stockCatHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  stockCatEmoji: { fontSize: 18 },
  stockCatTitle: { fontSize: 14, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: THEME.rowBorder, marginLeft: 56 },
  stockRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  stockEmoji: { fontSize: 24, width: 28 },
  stockName: { fontSize: 14, fontWeight: '600', color: THEME.text },
  stockPrice: { fontSize: 12, color: THEME.slateLight, marginTop: 2 },
  stockOff: { color: THEME.slateLight, textDecorationLine: 'line-through' },
  stockToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  stockToggleOn: { backgroundColor: '#dcfce7' },
  stockToggleOff: { backgroundColor: '#fee2e2' },
  stockToggleText: { fontSize: 12, fontWeight: '700', color: THEME.text },
  saveBtn: { backgroundColor: THEME.navy, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: THEME.white, fontWeight: 'bold', fontSize: 15 },
});
