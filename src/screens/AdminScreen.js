import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useLayout } from '../utils/dimensions';
import { MENU_ITEMS, RESTAURANT_NAME } from '../constants';
import { saveWeeklyMenu, loadWeeklyMenu, loadOrdersForDays, lastNDays } from '../utils/storage';
import { formatCurrency } from '../utils/razorpay';
import { THEME } from '../constants/theme';

const MEAL_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Beverages'];
const TABS = ['Menu Editor', 'Staff Preview', 'Vendor Dashboard'];

const CATEGORY_META = {
  Breakfast: { emoji: '🌅', color: '#ea580c', bg: '#fff7ed' },
  Lunch:     { emoji: '☀️',  color: '#ca8a04', bg: '#fefce8' },
  Dinner:    { emoji: '🌙', color: '#4f46e5', bg: '#eef2ff' },
  Beverages: { emoji: '☕', color: '#0891b2', bg: '#ecfeff' },
};
const ALL_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Beverages'];

function getMealTabForTime() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins >= 7 * 60 && mins < 10 * 60) return 'Breakfast';
  if (mins >= 12 * 60 + 30 && mins < 14 * 60) return 'Lunch';
  if (mins >= 19 * 60 && mins < 22 * 60) return 'Dinner';
  return 'Breakfast';
}

// Seed from static constants so admin always has a starting point
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

export default function AdminScreen({ navigation, route }) {
  const { employee } = route.params;
  const [activeTab, setActiveTab] = useState('Menu Editor');
  const [activeMeal, setActiveMeal] = useState('Breakfast');

  // ── Menu editor state ─────────────────────────────────────────────────────
  const [menu, setMenu] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', emoji: '', description: '' });

  // ── Dashboard state ───────────────────────────────────────────────────────
  const [ordersByDay, setOrdersByDay] = useState({});
  const [dashLoading, setDashLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [stored, orders] = await Promise.all([
      loadWeeklyMenu(),
      loadOrdersForDays(7),
    ]);
    const seed = seedMenuFromConstants();
    if (!stored) {
      setMenu(seed);
    } else {
      // Backfill any category missing from an older saved menu
      const merged = { ...stored };
      MEAL_CATEGORIES.forEach((cat) => {
        if (!merged[cat] || merged[cat].length === 0) merged[cat] = seed[cat];
      });
      setMenu(merged);
    }
    setOrdersByDay(orders);
    setDashLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Login') },
    ]);
  }

  // ── Menu editor helpers ───────────────────────────────────────────────────

  function updatePrice(cat, id, val) {
    setMenu((prev) => ({
      ...prev,
      [cat]: prev[cat].map((item) =>
        item.id === id ? { ...item, price: parseFloat(val) || 0 } : item
      ),
    }));
  }

  function updateName(cat, id, val) {
    setMenu((prev) => ({
      ...prev,
      [cat]: prev[cat].map((item) =>
        item.id === id ? { ...item, name: val } : item
      ),
    }));
  }

  function removeItem(cat, id) {
    setMenu((prev) => ({ ...prev, [cat]: prev[cat].filter((i) => i.id !== id) }));
  }

  function addItem() {
    const name = newItem.name.trim();
    const price = parseFloat(newItem.price);
    if (!name || isNaN(price) || price <= 0) {
      Alert.alert('Invalid item', 'Please enter a name and a valid price.');
      return;
    }
    const id = `custom_${Date.now()}`;
    setMenu((prev) => ({
      ...prev,
      [activeMeal]: [
        ...prev[activeMeal],
        {
          id,
          name,
          price,
          emoji: newItem.emoji.trim() || '🍽️',
          description: newItem.description.trim(),
          category: activeMeal,
        },
      ],
    }));
    setNewItem({ name: '', price: '', emoji: '', description: '' });
  }

  async function handleSave() {
    setSaving(true);
    await saveWeeklyMenu(menu);
    setSaving(false);
    Alert.alert('Saved', 'Weekly menu has been updated for all vendors.');
  }

  // ── Dashboard helpers ─────────────────────────────────────────────────────

  function buildDashboard() {
    const days = lastNDays(7);
    // Per-day per-vendor revenue
    const rows = days.map((day) => {
      const orders = ordersByDay[day] || [];
      const vendors = {};
      orders.forEach((o) => {
        vendors[o.employeeName] = (vendors[o.employeeName] || 0) + o.total;
      });
      const dayTotal = orders.reduce((s, o) => s + o.total, 0);
      return { day, vendors, dayTotal, orderCount: orders.length };
    });
    // All vendor names seen across all days
    const vendorNames = [...new Set(
      Object.values(ordersByDay).flatMap((os) => os.map((o) => o.employeeName))
    )].sort();
    return { rows, vendorNames };
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const Header = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>{RESTAURANT_NAME}</Text>
        <Text style={styles.headerSub}>Admin · {employee.name}</Text>
      </View>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  const TabBar = () => (
    <View style={styles.tabBar}>
      {TABS.map((t) => (
        <TouchableOpacity
          key={t}
          style={[styles.tab, activeTab === t && styles.tabActive]}
          onPress={() => setActiveTab(t)}
        >
          <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // ── Menu editor ───────────────────────────────────────────────────────────

  const MenuEditor = () => {
    if (!menu) return <ActivityIndicator style={{ marginTop: 60 }} color="#f97316" size="large" />;
    const items = menu[activeMeal] || [];
    return (
      <ScrollView contentContainerStyle={styles.editorContent}>
        {/* Meal selector */}
        <View style={styles.mealTabs}>
          {MEAL_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.mealTab, activeMeal === cat && styles.mealTabActive]}
              onPress={() => setActiveMeal(cat)}
            >
              <Text style={[styles.mealTabText, activeMeal === cat && styles.mealTabTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Existing items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{activeMeal} Items</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.editorRow}>
              <Text style={styles.editorEmoji}>{item.emoji}</Text>
              <TextInput
                style={styles.nameInput}
                value={item.name}
                onChangeText={(v) => updateName(activeMeal, item.id, v)}
                placeholder="Item name"
              />
              <View style={styles.priceInputWrap}>
                <Text style={styles.rupee}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  value={String(item.price)}
                  onChangeText={(v) => updatePrice(activeMeal, item.id, v)}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <TouchableOpacity onPress={() => removeItem(activeMeal, item.id)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Add new item */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Add New Item to {activeMeal}</Text>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.newInput, { width: 44 }]}
              value={newItem.emoji}
              onChangeText={(v) => setNewItem((p) => ({ ...p, emoji: v }))}
              placeholder="🍽️"
            />
            <TextInput
              style={[styles.newInput, { flex: 1 }]}
              value={newItem.name}
              onChangeText={(v) => setNewItem((p) => ({ ...p, name: v }))}
              placeholder="Item name"
            />
            <View style={styles.priceInputWrap}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={styles.priceInput}
                value={newItem.price}
                onChangeText={(v) => setNewItem((p) => ({ ...p, price: v }))}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
          <TextInput
            style={[styles.newInput, { marginTop: 8 }]}
            value={newItem.description}
            onChangeText={(v) => setNewItem((p) => ({ ...p, description: v }))}
            placeholder="Description (optional)"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addItem}>
            <Text style={styles.addBtnText}>+ Add Item</Text>
          </TouchableOpacity>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Menu for All Vendors</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // ── Staff preview ─────────────────────────────────────────────────────────

  const StaffPreview = () => {
    const { isTablet } = useLayout();
    const [previewTab, setPreviewTab] = useState(getMealTabForTime);
    const [cart, setCart] = useState({});

    if (!menu) return <ActivityIndicator style={{ marginTop: 60 }} color="#f97316" size="large" />;

    const allItems = Object.values(menu).flat();
    function increment(id) { setCart((p) => ({ ...p, [id]: (p[id] || 0) + 1 })); }
    function decrement(id) {
      setCart((p) => { const n = { ...p, [id]: (p[id] || 1) - 1 }; if (n[id] <= 0) delete n[id]; return n; });
    }

    const cartItems = allItems.filter((i) => cart[i.id] > 0).map((i) => ({ ...i, qty: cart[i.id] }));
    const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);

    const meta = CATEGORY_META[previewTab] || CATEGORY_META['Breakfast'];
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const MenuPanel = () => (
      <ScrollView style={styles.previewLeft} contentContainerStyle={{ paddingBottom: isTablet ? 40 : 110 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.previewTabBar}>
          {ALL_CATEGORIES.map((cat) => {
            const m = CATEGORY_META[cat];
            const active = cat === previewTab;
            const count = (menu[cat] || []).filter((i) => cart[i.id] > 0).length;
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
          {(menu[previewTab] || []).map((item, idx, arr) => (
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
          {(menu[previewTab] || []).length === 0 && (
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
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
      <View style={styles.previewContainer}>
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

  // ── Vendor dashboard ──────────────────────────────────────────────────────

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
      <ScrollView contentContainerStyle={styles.dashContent}>
        {/* Summary cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.summaryRow}>
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

        {/* Day-by-day table */}
        {rows.filter((r) => r.orderCount > 0).map(({ day, vendors, dayTotal, orderCount }) => (
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
                <Text style={styles.vendorName}>{vname}</Text>
                <Text style={styles.vendorRevenue}>{formatCurrency(vendors[vname])}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <TabBar />
      {activeTab === 'Menu Editor' && <MenuEditor />}
      {activeTab === 'Staff Preview' && <StaffPreview />}
      {activeTab === 'Vendor Dashboard' && <Dashboard />}
    </SafeAreaView>
  );
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.offWhite },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: THEME.navy, paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.white },
  headerSub: { fontSize: 12, color: THEME.slateLight, marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  logoutText: { color: THEME.white, fontSize: 13, fontWeight: '600' },

  tabBar: { flexDirection: 'row', backgroundColor: THEME.white, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: '#f97316' },
  tabText: { fontSize: 14, fontWeight: '600', color: THEME.slateLight },
  tabTextActive: { color: THEME.gold },

  // ── Menu editor ────────────────────────────────────────────────────────────
  editorContent: { padding: 16, paddingBottom: 60 },
  mealTabs: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  mealTab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
    borderColor: THEME.goldBorder, backgroundColor: THEME.white, alignItems: 'center',
  },
  mealTabActive: { backgroundColor: THEME.navy, borderColor: '#f97316' },
  mealTabText: { fontSize: 14, fontWeight: '600', color: THEME.slate },
  mealTabTextActive: { color: THEME.white },

  card: {
    backgroundColor: THEME.white, borderRadius: 14, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: THEME.slate, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },

  editorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  editorEmoji: { fontSize: 24, width: 34 },
  nameInput: {
    flex: 1, borderWidth: 1, borderColor: THEME.goldBorder, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: THEME.text, backgroundColor: THEME.offWhite,
  },
  priceInputWrap: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: THEME.goldBorder,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8, backgroundColor: THEME.offWhite,
  },
  rupee: { fontSize: 14, color: THEME.slate, marginRight: 2 },
  priceInput: { fontSize: 14, color: THEME.text, minWidth: 50 },
  removeBtn: { padding: 6 },
  removeBtnText: { fontSize: 16, color: '#ef4444' },

  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  newInput: {
    borderWidth: 1, borderColor: THEME.goldBorder, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: THEME.text, backgroundColor: THEME.offWhite,
  },
  addBtn: { marginTop: 12, backgroundColor: THEME.navy, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  addBtnText: { color: THEME.white, fontWeight: 'bold', fontSize: 14 },

  saveBtn: { backgroundColor: THEME.navy, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: THEME.white, fontWeight: 'bold', fontSize: 15 },

  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashContent: { padding: 16, paddingBottom: 60 },
  summaryRow: { gap: 12, paddingBottom: 16 },
  summaryCard: {
    backgroundColor: THEME.white, borderRadius: 14, padding: 18, minWidth: 160,
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
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: THEME.rowBorder,
  },
  vendorDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.navy, marginRight: 10 },
  vendorName: { flex: 1, fontSize: 14, color: '#334155' },
  vendorRevenue: { fontSize: 14, fontWeight: '600', color: THEME.text },

  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 16, color: THEME.slateLight },

  // ── Staff preview ──────────────────────────────────────────────────────────
  previewContainer: { flex: 1, backgroundColor: THEME.offWhite },
  previewBanner: {
    backgroundColor: THEME.navy, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center',
  },
  previewBannerText: { color: THEME.slateLight, fontSize: 12, fontWeight: '600' },
  previewBody: { flex: 1, flexDirection: 'row', minHeight: 0 },
  previewLeft: { flex: 1, minHeight: 0 },

  previewTabBar: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  previewTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
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
});
