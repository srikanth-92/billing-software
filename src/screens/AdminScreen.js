import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useLayout } from '../utils/dimensions';
import { MENU_ITEMS, RESTAURANT_NAME, EMPLOYEES } from '../constants';
import { clearSession, loadSession } from '../utils/session';
import { saveWeeklyMenu, loadWeeklyMenu, loadOrdersForDays, lastNDays, loadAllCartOverrides, saveCartOverrides } from '../utils/storage';
import { formatCurrency } from '../utils/razorpay';
import { THEME } from '../constants/theme';
import DayMenuScreen from './DayMenuScreen';

const MEAL_CATEGORIES = ['Menu'];
const TABS = ["Day's Menu", 'Staff Preview', 'Cart Stock', 'Vendor Dashboard'];
const VENDORS = ['cart1', 'cart2', 'cart3', 'cart4', 'cart5'];

const CATEGORY_META = {
  Menu: { emoji: '🍽️', color: '#ea580c', bg: '#fff7ed' },
};
const ALL_CATEGORIES = ['Menu'];

function getMealTabForTime() {
  return 'Menu';
}

function seedMenuFromConstants() {
  const menu = {};
  MEAL_CATEGORIES.forEach((cat) => {
    menu[cat] = MENU_ITEMS
      .filter((i) => i.category === cat)
      .map(({ id, name, price, emoji, description, category }) => ({
        id, name, price, emoji, description, category,
      }));
  });
  return menu;
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminScreen({ navigation, route }) {
  const session = loadSession();
  const employee = EMPLOYEES.find((e) => e.username === session?.username) || EMPLOYEES[0];
  const [activeTab, setActiveTab] = useState("Day's Menu");
  const [refreshKey, setRefreshKey] = useState(0);

  const [initialMenu, setInitialMenu] = useState(null);

  // ── Dashboard state ────────────────────────────────────────────────────────
  const [ordersByDay, setOrdersByDay] = useState({});
  const [dashLoading, setDashLoading] = useState(true);

  // ── Cart overrides state ───────────────────────────────────────────────────
  // { [cartId]: Set<itemId> } — which items are disabled per cart
  const [cartOverrides, setCartOverrides] = useState({});

  const loadAll = useCallback(async () => {
    const [stored, orders, overrides] = await Promise.all([
      loadWeeklyMenu(),
      loadOrdersForDays(7),
      loadAllCartOverrides(),
    ]);
    const seed = seedMenuFromConstants();
    if (!stored) {
      setInitialMenu(seed);
    } else {
      const merged = { ...stored };
      MEAL_CATEGORIES.forEach((cat) => {
        if (!merged[cat] || merged[cat].length === 0) merged[cat] = seed[cat];
      });
      setInitialMenu(merged);
    }
    setOrdersByDay(orders);
    setDashLoading(false);
    // Convert arrays to Sets for O(1) lookup
    const mapped = {};
    Object.entries(overrides).forEach(([cartId, ids]) => {
      mapped[cartId] = new Set(ids);
    });
    setCartOverrides(mapped);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleRefresh() {
    setInitialMenu(null);
    setDashLoading(true);
    await loadAll();
    setRefreshKey((k) => k + 1);
  }

  async function handleSave(menuData) {
    try {
      await saveWeeklyMenu(menuData);
      setInitialMenu(menuData);
      setRefreshKey((k) => k + 1);
      if (Platform.OS === 'web') window.alert('Weekly menu has been updated for all vendors.');
      else Alert.alert('Saved', 'Weekly menu has been updated for all vendors.');
    } catch (e) {
      if (Platform.OS === 'web') window.alert(e.message || 'Could not save menu. Check your connection.');
      else Alert.alert('Save Failed', e.message || 'Could not save menu. Check your connection.');
    }
  }

  function handleLogout() {
    clearSession();
    navigation.replace('Login');
  }

  // ── Dashboard helpers ──────────────────────────────────────────────────────

  function buildDashboard() {
    const label = (o) => o.isGuestOrder
      ? `Guest · ${(o.cartId || 'cart').toUpperCase()}`
      : o.employeeName;
    const days = lastNDays(7);
    const rows = days.map((day) => {
      const orders = ordersByDay[day] || [];
      const vendors = {};
      const vendorItems = {};
      orders.forEach((o) => {
        const key = label(o);
        vendors[key] = (vendors[key] || 0) + o.total;
        if (!vendorItems[key]) vendorItems[key] = [];
        (o.items || []).forEach((item) => vendorItems[key].push(`${item.name} ×${item.qty}`));
      });
      const dayTotal = orders.reduce((s, o) => s + o.total, 0);
      return { day, vendors, vendorItems, dayTotal, orderCount: orders.length };
    });
    const vendorNames = [...new Set(
      Object.values(ordersByDay).flatMap((os) => os.map(label))
    )].sort();
    return { rows, vendorNames };
  }

  // ── Header ─────────────────────────────────────────────────────────────────

  const Header = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>{RESTAURANT_NAME}</Text>
        <Text style={styles.headerSub}>Admin · {employee.name}</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity onPress={() => navigation.navigate('CateringBill')} style={styles.allQrBtn}>
          <Text style={styles.allQrBtnText}>Catering Bill</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('AllQR')} style={styles.allQrBtn}>
          <Text style={styles.allQrBtnText}>All QRs</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const TabBar = () => (
    <View style={styles.tabBarWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
        <Text style={styles.refreshBtnText}>↺</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Staff preview ──────────────────────────────────────────────────────────

  const StaffPreview = () => {
    const { isTablet } = useLayout();
    const [previewTab, setPreviewTab] = useState(getMealTabForTime);
    const [cart, setCart] = useState({});

    if (!initialMenu) return <ActivityIndicator style={{ marginTop: 60 }} color="#f97316" size="large" />;

    const allItems = Object.values(initialMenu).flat();
    function increment(id) { setCart((p) => ({ ...p, [id]: (p[id] || 0) + 1 })); }
    function decrement(id) {
      setCart((p) => { const n = { ...p, [id]: (p[id] || 1) - 1 }; if (n[id] <= 0) delete n[id]; return n; });
    }

    const cartItems = allItems.filter((i) => cart[i.id] > 0).map((i) => ({ ...i, qty: cart[i.id] }));
    const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);

    const meta = CATEGORY_META[previewTab] || CATEGORY_META['Breakfast'];
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const MenuPanel = () => (
      <ScrollView style={styles.previewLeft} contentContainerStyle={{ paddingBottom: isTablet ? 40 : 110 }} showsVerticalScrollIndicator={true}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }} contentContainerStyle={styles.previewTabBar}>
          {ALL_CATEGORIES.map((cat) => {
            const m = CATEGORY_META[cat];
            const active = cat === previewTab;
            const count = (initialMenu[cat] || []).filter((i) => cart[i.id] > 0).length;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.previewTab, active && { backgroundColor: m.color, borderColor: m.color }]}
                onPress={() => setPreviewTab(cat)}
              >
                <Text style={styles.previewTabEmoji}>{m.emoji}</Text>
                <Text style={[styles.previewTabLabel, active && { color: THEME.white }]}>{cat}</Text>
                {count > 0 && (
                  <View style={[styles.previewTabBadge, { backgroundColor: active ? '#fff' : m.color }]}>
                    <Text style={[styles.previewTabBadgeText, { color: active ? m.color : '#fff' }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={[styles.previewItemsCard, { borderTopColor: meta.color }]}>
          <View style={[styles.previewCategoryHeader, { backgroundColor: meta.bg }]}>
            <Text style={styles.previewCatEmoji}>{meta.emoji}</Text>
            <Text style={[styles.previewCatTitle, { color: meta.color }]}>{previewTab}</Text>
          </View>
          {(initialMenu[previewTab] || []).map((item, idx, arr) => (
            <View key={item.id}>
              <View style={styles.previewItemRow}>
                <Text style={styles.previewItemEmoji}>{item.emoji}</Text>
                <View style={styles.previewItemInfo}>
                  <Text style={styles.previewItemName}>{item.name}</Text>
                  <Text style={styles.previewItemDesc} numberOfLines={1}>{item.description}</Text>
                </View>
                <Text style={styles.previewItemPrice}>{formatCurrency(item.price)}</Text>
                <View style={styles.previewQtyRow}>
                  <TouchableOpacity
                    style={[styles.previewQtyBtn, !cart[item.id] && styles.previewQtyBtnOff]}
                    onPress={() => decrement(item.id)} disabled={!cart[item.id]}
                  >
                    <Text style={styles.previewQtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.previewQtyNum}>{cart[item.id] || 0}</Text>
                  <TouchableOpacity style={styles.previewQtyBtn} onPress={() => increment(item.id)}>
                    <Text style={styles.previewQtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {idx < arr.length - 1 && <View style={styles.previewDivider} />}
            </View>
          ))}
          {(initialMenu[previewTab] || []).length === 0 && (
            <Text style={styles.previewEmpty}>No items configured for this meal.</Text>
          )}
        </View>
      </ScrollView>
    );

    const TabletCartPanel = () => (
      <View style={styles.previewCart}>
        <Text style={styles.previewCartTitle}>Current Order</Text>
        {cartItems.length === 0 ? (
          <View style={styles.previewEmptyCart}>
            <Text style={styles.previewEmptyCartEmoji}>🛒</Text>
            <Text style={styles.previewEmptyCartText}>No items added yet</Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.previewCartRow}>
                <Text style={styles.previewCartEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewCartName}>{item.name}</Text>
                  <Text style={styles.previewCartSub}>{formatCurrency(item.price)} × {item.qty}</Text>
                </View>
                <Text style={styles.previewCartTotal}>{formatCurrency(item.price * item.qty)}</Text>
              </View>
            ))}
          </ScrollView>
        )}
        <View style={styles.previewCartDivider} />
        <View style={styles.previewTotalRow}>
          <Text style={styles.previewTotalLabel}>Total</Text>
          <Text style={styles.previewTotalValue}>{formatCurrency(total)}</Text>
        </View>
        <View style={[styles.previewCheckoutBtn, cartItems.length === 0 && { backgroundColor: THEME.goldLight }]}>
          <Text style={styles.previewCheckoutText}>Proceed to Pay →</Text>
        </View>
      </View>
    );

    return (
      <View style={[styles.previewContainer, { flex: 1 }]}>
        <View style={styles.previewBanner}>
          <Text style={styles.previewBannerText}>👁  Staff view · {timeStr}</Text>
        </View>
        {isTablet ? (
          <View style={styles.previewBody}>
            <MenuPanel />
            <TabletCartPanel />
          </View>
        ) : (
          <>
            <MenuPanel />
            {totalItems > 0 && (
              <View style={styles.previewPhoneBar}>
                <View>
                  <Text style={styles.previewPhoneBarItems}>{totalItems} item{totalItems > 1 ? 's' : ''}</Text>
                  <Text style={styles.previewPhoneBarTotal}>{formatCurrency(total)}</Text>
                </View>
                <View style={styles.previewPhoneBarBtn}>
                  <Text style={styles.previewCheckoutText}>Proceed to Pay →</Text>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  // ── Vendor dashboard ───────────────────────────────────────────────────────

  const Dashboard = () => {
    if (dashLoading) return <ActivityIndicator style={{ marginTop: 60 }} color="#f97316" size="large" />;

    const { rows, vendorNames } = buildDashboard();
    const hasAnyOrders = rows.some((r) => r.orderCount > 0);

    if (!hasAnyOrders) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyText}>No orders in the last 7 days</Text>
        </View>
      );
    }

    return (
      <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={styles.dashContent} showsVerticalScrollIndicator={true}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }} contentContainerStyle={styles.summaryRow}>
          {vendorNames.map((vname) => {
            const total = rows.reduce((s, r) => s + (r.vendors[vname] || 0), 0);
            const orders = Object.values(ordersByDay).flat().filter((o) => o.employeeName === vname).length;
            return (
              <View key={vname} style={styles.summaryCard}>
                <Text style={styles.summaryVendor}>{vname}</Text>
                <Text style={styles.summaryRevenue}>{formatCurrency(total)}</Text>
                <Text style={styles.summaryOrders}>{orders} orders · 7 days</Text>
              </View>
            );
          })}
        </ScrollView>
        {rows.filter((r) => r.orderCount > 0).map(({ day, vendors, vendorItems, dayTotal, orderCount }) => (
          <View key={day} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayDate}>{formatDate(day)}</Text>
              <View style={styles.dayMeta}>
                <Text style={styles.dayOrders}>{orderCount} orders</Text>
                <Text style={styles.dayTotal}>{formatCurrency(dayTotal)}</Text>
              </View>
            </View>
            {vendorNames.filter((v) => vendors[v]).map((vname) => (
              <View key={vname} style={styles.vendorRow}>
                <View style={styles.vendorDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.vendorName}>{vname}</Text>
                  {vendorItems[vname]?.length > 0 && (
                    <Text style={styles.vendorItemList} numberOfLines={2}>
                      {vendorItems[vname].join(', ')}
                    </Text>
                  )}
                </View>
                <Text style={styles.vendorRevenue}>{formatCurrency(vendors[vname])}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  // ── Cart Stock Editor ──────────────────────────────────────────────────────

  const CartStockEditor = () => {
    const [selectedCart, setSelectedCart] = useState(VENDORS[0]);
    const [saving, setSaving] = useState(false);
    const [localDisabled, setLocalDisabled] = useState(
      () => new Set(cartOverrides[VENDORS[0]] || [])
    );

    function selectCart(cartId) {
      setSelectedCart(cartId);
      setLocalDisabled(new Set(cartOverrides[cartId] || []));
    }

    function toggle(itemId) {
      setLocalDisabled((prev) => {
        const next = new Set(prev);
        if (next.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
    }

    async function handleSave() {
      setSaving(true);
      try {
        const ids = [...localDisabled];
        await saveCartOverrides(selectedCart, ids);
        setCartOverrides((prev) => ({ ...prev, [selectedCart]: new Set(ids) }));
        if (Platform.OS === 'web') window.alert(`Stock updated for ${selectedCart}.`);
        else Alert.alert('Saved', `Stock updated for ${selectedCart}.`);
      } catch (e) {
        if (Platform.OS === 'web') window.alert(e.message || 'Could not save.');
        else Alert.alert('Error', e.message || 'Could not save.');
      } finally {
        setSaving(false);
      }
    }

    if (!initialMenu) return <ActivityIndicator style={{ marginTop: 60 }} color="#f97316" size="large" />;

    const allItems = Object.values(initialMenu).flat();
    const byCategory = MEAL_CATEGORIES.reduce((acc, cat) => {
      acc[cat] = allItems.filter((i) => i.category === cat);
      return acc;
    }, {});
    const disabledCount = localDisabled.size;

    return (
      <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={styles.editorContent} showsVerticalScrollIndicator={true}>
        {/* Cart selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }} contentContainerStyle={{ gap: 10, paddingBottom: 16 }}>
          {VENDORS.map((cartId) => {
            const overrideCount = (cartOverrides[cartId] || new Set()).size;
            const active = cartId === selectedCart;
            return (
              <TouchableOpacity
                key={cartId}
                style={[styles.cartChip, active && styles.cartChipActive]}
                onPress={() => selectCart(cartId)}
              >
                <Text style={[styles.cartChipText, active && styles.cartChipTextActive]}>
                  {cartId.toUpperCase()}
                </Text>
                {overrideCount > 0 && (
                  <View style={[styles.cartChipBadge, active && { backgroundColor: '#fff' }]}>
                    <Text style={[styles.cartChipBadgeText, active && { color: '#ef4444' }]}>
                      {overrideCount} off
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Status bar */}
        <View style={styles.stockStatusBar}>
          <Text style={styles.stockStatusText}>
            {selectedCart.toUpperCase()} · {allItems.length - disabledCount} available · {disabledCount} unavailable
          </Text>
        </View>

        {/* Per-category item toggles */}
        {MEAL_CATEGORIES.map((cat) => {
          const items = byCategory[cat] || [];
          const meta = CATEGORY_META[cat];
          return (
            <View key={cat} style={[styles.card, { marginBottom: 16 }]}>
              <View style={[styles.stockCatHeader, { backgroundColor: meta.bg }]}>
                <Text style={styles.catEmoji}>{meta.emoji}</Text>
                <Text style={[styles.cardTitle, { color: meta.color, marginBottom: 0 }]}>{cat}</Text>
              </View>
              {items.map((item, idx) => {
                const isOff = localDisabled.has(item.id);
                return (
                  <View key={item.id}>
                    <TouchableOpacity
                      style={styles.stockRow}
                      onPress={() => toggle(item.id)}
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
          );
        })}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Stock for {selectedCart.toUpperCase()}</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <TabBar />
      <View style={{ flex: 1, minHeight: 0 }}>
        {activeTab === "Day's Menu"      && <DayMenuScreen key={refreshKey} initialMenu={initialMenu} onSave={handleSave} />}
        {activeTab === 'Staff Preview'   && <StaffPreview key={refreshKey} />}
        {activeTab === 'Cart Stock'      && <CartStockEditor key={refreshKey} />}
        {activeTab === 'Vendor Dashboard'&& <Dashboard />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.offWhite, ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' } : {}) },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: THEME.navy, paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.white },
  headerSub: { fontSize: 12, color: THEME.slateLight, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  allQrBtn: { backgroundColor: THEME.gold, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  allQrBtnText: { color: THEME.navy, fontSize: 13, fontWeight: '700' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  logoutText: { color: THEME.white, fontSize: 13, fontWeight: '600' },

  tabBarWrap: { flexDirection: 'row', backgroundColor: THEME.white, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', alignItems: 'stretch' },
  tabBar: { flexDirection: 'row', alignItems: 'center' },
  tab: { paddingHorizontal: 16, paddingVertical: 13, alignItems: 'center', flexShrink: 0 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#f97316' },
  tabText: { fontSize: 14, fontWeight: '600', color: THEME.slateLight, whiteSpace: 'nowrap' },
  tabTextActive: { color: THEME.gold },
  refreshBtn: { paddingHorizontal: 12, paddingVertical: 13, borderLeftWidth: 1, borderLeftColor: '#e2e8f0', flexShrink: 0 },
  refreshBtnText: { fontSize: 16, fontWeight: '600', color: THEME.navy },

  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashContent: { padding: 16, paddingBottom: 120 },
  summaryRow: { gap: 12, paddingBottom: 16 },
  summaryCard: {
    backgroundColor: THEME.white, borderRadius: 14, padding: 18, minWidth: 160, flexShrink: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    borderTopWidth: 3, borderTopColor: '#f97316',
  },
  summaryVendor: { fontSize: 13, fontWeight: '700', color: THEME.slate, marginBottom: 6, textTransform: 'uppercase' },
  summaryRevenue: { fontSize: 24, fontWeight: 'bold', color: THEME.text },
  summaryOrders: { fontSize: 12, color: THEME.slateLight, marginTop: 4 },

  dayCard: {
    backgroundColor: THEME.white, borderRadius: 14, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: THEME.offWhite, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  dayDate: { fontSize: 15, fontWeight: 'bold', color: THEME.text },
  dayMeta: { alignItems: 'flex-end' },
  dayOrders: { fontSize: 11, color: THEME.slateLight },
  dayTotal: { fontSize: 16, fontWeight: 'bold', color: THEME.gold },
  vendorRow: {
    flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: THEME.rowBorder,
  },
  vendorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.navy, marginRight: 10, marginTop: 5 },
  vendorName: { fontSize: 14, color: '#334155', fontWeight: '500' },
  vendorItemList: { fontSize: 12, color: THEME.slateLight, marginTop: 2 },
  vendorRevenue: { fontSize: 14, fontWeight: '600', color: THEME.text, marginLeft: 8 },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 16, color: THEME.slateLight },

  // ── Staff preview ──────────────────────────────────────────────────────────
  previewContainer: { flex: 1, minHeight: 0, backgroundColor: THEME.offWhite },
  previewBanner: {
    backgroundColor: THEME.navy, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center',
  },
  previewBannerText: { color: THEME.slateLight, fontSize: 12, fontWeight: '600' },
  previewBody: { flex: 1, flexDirection: 'row', minHeight: 0 },
  previewLeft: { flex: 1, minHeight: 0 },

  previewTabBar: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  previewTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: THEME.goldBorder, backgroundColor: THEME.white,
  },
  previewTabEmoji: { fontSize: 15 },
  previewTabLabel: { fontSize: 13, fontWeight: '600', color: THEME.slate },
  previewTabBadge: { minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  previewTabBadgeText: { fontSize: 11, fontWeight: 'bold' },

  previewItemsCard: {
    backgroundColor: THEME.white, borderRadius: 16, marginHorizontal: 16,
    borderTopWidth: 3, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  previewCategoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  previewCatEmoji: { fontSize: 20 },
  previewCatTitle: { fontSize: 16, fontWeight: 'bold' },
  previewDivider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 60 },
  previewItemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  previewItemEmoji: { fontSize: 26, marginRight: 12 },
  previewItemInfo: { flex: 1 },
  previewItemName: { fontSize: 14, fontWeight: '600', color: THEME.text },
  previewItemDesc: { fontSize: 12, color: THEME.slateLight, marginTop: 2 },
  previewItemPrice: { fontSize: 13, fontWeight: 'bold', color: THEME.text, marginRight: 10, minWidth: 48, textAlign: 'right' },
  previewQtyRow: { flexDirection: 'row', alignItems: 'center' },
  previewQtyBtn: { backgroundColor: THEME.navy, width: 28, height: 28, borderRadius: 7, justifyContent: 'center', alignItems: 'center' },
  previewQtyBtnOff: { backgroundColor: '#e2e8f0' },
  previewQtyBtnText: { color: THEME.white, fontSize: 17, fontWeight: 'bold', lineHeight: 20 },
  previewQtyNum: { fontSize: 14, fontWeight: 'bold', marginHorizontal: 8, minWidth: 16, textAlign: 'center' },
  previewEmpty: { padding: 20, color: THEME.slateLight, textAlign: 'center', fontSize: 13 },

  previewCart: {
    width: 300, backgroundColor: THEME.white, borderLeftWidth: 1, borderLeftColor: '#e2e8f0',
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20, flexDirection: 'column',
  },
  previewCartTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.text, marginBottom: 14 },
  previewEmptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  previewEmptyCartEmoji: { fontSize: 40, marginBottom: 10 },
  previewEmptyCartText: { fontSize: 13, color: THEME.slateLight },
  previewCartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: THEME.rowBorder },
  previewCartEmoji: { fontSize: 22, marginRight: 10 },
  previewCartName: { fontSize: 13, fontWeight: '600', color: THEME.text },
  previewCartSub: { fontSize: 11, color: THEME.slate, marginTop: 1 },
  previewCartTotal: { fontSize: 13, fontWeight: 'bold', color: THEME.text },
  previewCartDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  previewTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  previewTotalLabel: { fontSize: 16, fontWeight: 'bold', color: THEME.text },
  previewTotalValue: { fontSize: 16, fontWeight: 'bold', color: THEME.gold },
  previewCheckoutBtn: { backgroundColor: THEME.navy, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  previewCheckoutText: { color: THEME.white, fontWeight: 'bold', fontSize: 14 },

  previewPhoneBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: THEME.navy, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: THEME.goldBorder,
  },
  previewPhoneBarItems: { color: THEME.slateLight, fontSize: 12 },
  previewPhoneBarTotal: { color: THEME.gold, fontSize: 18, fontWeight: 'bold' },
  previewPhoneBarBtn: { backgroundColor: THEME.gold, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },

  // ── Cart Stock Editor ──────────────────────────────────────────────────────
  card: {
    backgroundColor: THEME.white, borderRadius: 14, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: THEME.slate, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  divider: { height: 1, backgroundColor: THEME.rowBorder, marginLeft: 42 },
  cartChip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1.5, borderColor: THEME.goldBorder, backgroundColor: THEME.white,
    flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0,
  },
  cartChipActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  cartChipText: { fontSize: 13, fontWeight: '700', color: THEME.slate },
  cartChipTextActive: { color: THEME.white },
  cartChipBadge: { backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  cartChipBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },

  stockStatusBar: {
    backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0',
  },
  stockStatusText: { fontSize: 13, fontWeight: '600', color: THEME.slate },

  stockCatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: -16, marginTop: -16, marginBottom: 8,
    borderTopLeftRadius: 14, borderTopRightRadius: 14,
  },
  catEmoji: { fontSize: 18 },

  stockRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  stockEmoji: { fontSize: 24, width: 32 },
  stockName: { fontSize: 14, fontWeight: '600', color: THEME.text },
  stockPrice: { fontSize: 12, color: THEME.slateLight, marginTop: 2 },
  stockOff: { color: THEME.slateLight, textDecorationLine: 'line-through' },

  stockToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  stockToggleOn: { backgroundColor: '#dcfce7' },
  stockToggleOff: { backgroundColor: '#fee2e2' },
  stockToggleText: { fontSize: 12, fontWeight: '700', color: THEME.text },
});
