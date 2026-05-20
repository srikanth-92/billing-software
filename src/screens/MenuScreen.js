import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { MENU_ITEMS, RESTAURANT_NAME, RESTAURANT_GSTIN } from '../constants';
import { THEME } from '../constants/theme';
import { generateOrderId, formatCurrency } from '../utils/razorpay';
import { loadWeeklyMenu } from '../utils/storage';
import { useLayout } from '../utils/dimensions';

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Beverages'];

function getMealTabForCurrentTime() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const mins = h * 60 + m;
  if (mins >= 7 * 60 && mins < 10 * 60) return 'Breakfast';
  if (mins >= 12 * 60 + 30 && mins < 14 * 60) return 'Lunch';
  if (mins >= 19 * 60 && mins < 22 * 60) return 'Dinner';
  return 'Breakfast'; // default outside meal hours
}

const CATEGORY_META = {
  Breakfast: { emoji: '🌅', color: '#ea580c', bg: '#fff7ed' },
  Lunch:     { emoji: '☀️',  color: '#ca8a04', bg: '#fefce8' },
  Dinner:    { emoji: '🌙', color: '#4f46e5', bg: '#eef2ff' },
  Beverages: { emoji: '☕', color: '#0891b2', bg: '#ecfeff' },
};

export default function MenuScreen({ navigation, route }) {
  const { employee } = route.params;
  const { isTablet } = useLayout();
  const [cart, setCart] = useState({});
  const [activeTab, setActiveTab] = useState(getMealTabForCurrentTime);
  const [menuData, setMenuData] = useState(null); // loaded from storage

  useEffect(() => {
    loadWeeklyMenu().then((saved) => {
      // Build full default grouped menu from constants (all categories)
      const allCats = [...CATEGORIES, 'Beverages'];
      const defaults = {};
      allCats.forEach((cat) => { defaults[cat] = MENU_ITEMS.filter((i) => i.category === cat); });

      if (!saved) {
        setMenuData(defaults);
      } else {
        // Backfill missing categories (e.g. Beverages added after menu was saved)
        const merged = { ...saved };
        allCats.forEach((cat) => {
          if (!merged[cat] || merged[cat].length === 0) merged[cat] = defaults[cat];
        });
        setMenuData(merged);
      }
    });
  }, []);

  const allMenuItems = menuData ? Object.values(menuData).flat() : MENU_ITEMS;
  const cartItems = allMenuItems.filter((item) => cart[item.id] > 0).map((item) => ({
    ...item,
    qty: cart[item.id],
  }));

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = RESTAURANT_GSTIN ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
  const total = subtotal + tax;
  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);

  function increment(id) {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  function decrement(id) {
    setCart((prev) => {
      const next = { ...prev, [id]: (prev[id] || 1) - 1 };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  }

  function clearCart() {
    Alert.alert('Clear Cart', 'Remove all items?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setCart({}) },
    ]);
  }

  function handleCheckout() {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add at least one item to proceed.');
      return;
    }
    const orderId = generateOrderId();
    navigation.navigate('Payment', { orderId, items: cartItems, subtotal, tax, total, employee });
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Login') },
    ]);
  }

  // ── Item row ──────────────────────────────────────────────────────────────
  const ItemRow = ({ item }) => (
    <View style={styles.itemRow}>
      <Text style={styles.itemEmoji}>{item.emoji}</Text>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
      </View>
      <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
      <View style={styles.qtyRow}>
        <TouchableOpacity
          style={[styles.qtyBtn, !cart[item.id] && styles.qtyBtnDisabled]}
          onPress={() => decrement(item.id)}
          disabled={!cart[item.id]}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyNum}>{cart[item.id] || 0}</Text>
        <TouchableOpacity style={styles.qtyBtn} onPress={() => increment(item.id)}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Tab bar + item list ───────────────────────────────────────────────────
  const MenuContent = () => {
    if (!menuData) {
      return <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#f97316" />;
    }
    const meta = CATEGORY_META[activeTab];
    const visibleItems = menuData[activeTab] || [];
    // Flatten all items for badge counting
    const allItems = Object.values(menuData).flat();
    return (
      <>
        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {CATEGORIES.map((cat) => {
            const m = CATEGORY_META[cat];
            const active = cat === activeTab;
            const catItems = menuData[cat] || [];
            const catCount = catItems.filter((i) => cart[i.id] > 0).length;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.tab, active && { backgroundColor: m.color, borderColor: m.color }]}
                onPress={() => setActiveTab(cat)}
              >
                <Text style={styles.tabEmoji}>{m.emoji}</Text>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{cat}</Text>
                {catCount > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: active ? '#fff' : m.color }]}>
                    <Text style={[styles.tabBadgeText, { color: active ? m.color : '#fff' }]}>{catCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active meal items */}
        <View style={[styles.itemsCard, { borderTopColor: meta.color }]}>
          <View style={[styles.categoryHeader, { backgroundColor: meta.bg }]}>
            <Text style={styles.categoryHeaderEmoji}>{meta.emoji}</Text>
            <Text style={[styles.categoryHeaderTitle, { color: meta.color }]}>{activeTab}</Text>
          </View>
          {visibleItems.length === 0 && (
            <Text style={styles.emptyMenu}>No items in this category yet.</Text>
          )}
          {visibleItems.map((item, idx) => (
            <View key={item.id}>
              <ItemRow item={item} />
              {idx < visibleItems.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

      </>
    );
  };

  // ── Cart panel (tablet right side / phone bottom bar) ─────────────────────
  const CartPanel = () => (
    <View style={styles.tabletCart}>
      <Text style={styles.cartPanelTitle}>Current Order</Text>
      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyCartEmoji}>🛒</Text>
          <Text style={styles.emptyCartText}>No items added yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.cartScroll} showsVerticalScrollIndicator={false}>
          {cartItems.map((item) => (
            <View key={item.id} style={styles.cartRow}>
              <Text style={styles.cartEmoji}>{item.emoji}</Text>
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemSub}>{formatCurrency(item.price)} × {item.qty}</Text>
              </View>
              <Text style={styles.cartItemTotal}>{formatCurrency(item.price * item.qty)}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={styles.cartDivider} />
      <View style={styles.cartTotals}>
        <View style={styles.totalLine}>
          <Text style={styles.totalLineLabel}>Subtotal</Text>
          <Text style={styles.totalLineValue}>{formatCurrency(subtotal)}</Text>
        </View>
        {RESTAURANT_GSTIN ? (
          <View style={styles.totalLine}>
            <Text style={styles.totalLineLabel}>GST (5%)</Text>
            <Text style={styles.totalLineValue}>{formatCurrency(tax)}</Text>
          </View>
        ) : null}
        <View style={[styles.totalLine, styles.grandTotalLine]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>
      <View style={styles.cartActions}>
        {cartItems.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.checkoutBtnTablet, cartItems.length === 0 && styles.checkoutBtnDisabled]}
          onPress={handleCheckout}
          disabled={cartItems.length === 0}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Pay →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Header ────────────────────────────────────────────────────────────────
  const Header = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>{RESTAURANT_NAME}</Text>
        <Text style={styles.headerSub}>Logged in as {employee.name}</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Sales', { employee })}
          style={styles.salesBtn}
        >
          <Text style={styles.salesBtnText}>{isTablet ? "📊  Today's Sales" : '📊'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isTablet) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.tabletBody}>
          <ScrollView style={styles.tabletLeft} contentContainerStyle={styles.tabletLeftContent}>
            <MenuContent />
          </ScrollView>
          <CartPanel />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView contentContainerStyle={styles.phoneContent}>
        <MenuContent />
      </ScrollView>
      {totalItems > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={styles.cartItemsText}>{totalItems} item{totalItems > 1 ? 's' : ''}</Text>
            <Text style={styles.cartTotal}>{formatCurrency(total)}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutText}>Proceed to Pay →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.offWhite },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: THEME.navy, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: THEME.goldBorder,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.gold },
  headerSub: { fontSize: 12, color: THEME.slateLight, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  salesBtn: { backgroundColor: 'rgba(201,168,64,0.18)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: THEME.goldBorder },
  salesBtnText: { color: THEME.gold, fontSize: 13, fontWeight: '600' },
  logoutBtn: { backgroundColor: 'rgba(201,168,64,0.18)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: THEME.goldBorder },
  logoutText: { color: THEME.gold, fontSize: 13, fontWeight: '600' },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabBar: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: THEME.goldBorder, backgroundColor: THEME.white,
  },
  tabEmoji: { fontSize: 16 },
  tabLabel: { fontSize: 14, fontWeight: '600', color: THEME.slate },
  tabLabelActive: { color: THEME.navy },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 11, fontWeight: 'bold' },

  // ── Items card ────────────────────────────────────────────────────────────
  itemsCard: {
    backgroundColor: THEME.white, borderRadius: 16, marginHorizontal: 16,
    borderTopWidth: 3, overflow: 'hidden',
    shadowColor: THEME.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  categoryHeaderEmoji: { fontSize: 20 },
  categoryHeaderTitle: { fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: THEME.rowBorder, marginLeft: 60 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  itemEmoji: { fontSize: 28, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: THEME.text },
  itemDesc: { fontSize: 12, color: THEME.slateLight, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: THEME.navy, marginRight: 12, minWidth: 52, textAlign: 'right' },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { backgroundColor: THEME.gold, width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  qtyBtnDisabled: { backgroundColor: THEME.divider },
  qtyBtnText: { color: THEME.navy, fontSize: 18, fontWeight: 'bold', lineHeight: 22 },
  qtyNum: { fontSize: 15, fontWeight: 'bold', marginHorizontal: 10, minWidth: 18, textAlign: 'center', color: THEME.text },
  emptyMenu: { padding: 20, color: THEME.slateLight, textAlign: 'center', fontSize: 14 },

  // ── Phone ─────────────────────────────────────────────────────────────────
  phoneContent: { paddingBottom: 110 },
  cartBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: THEME.navy,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: THEME.goldBorder,
  },
  cartItemsText: { color: THEME.slateLight, fontSize: 12 },
  cartTotal: { color: THEME.gold, fontSize: 18, fontWeight: 'bold' },
  checkoutBtn: { backgroundColor: THEME.gold, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  checkoutText: { color: THEME.navy, fontWeight: 'bold', fontSize: 14 },

  // ── Tablet ────────────────────────────────────────────────────────────────
  tabletBody: { flex: 1, flexDirection: 'row', minHeight: 0 },
  tabletLeft: { flex: 1, minHeight: 0 },
  tabletLeftContent: { paddingBottom: 40 },
  tabletCart: {
    width: 320, backgroundColor: THEME.white, borderLeftWidth: 1, borderLeftColor: THEME.goldBorder,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, flexDirection: 'column',
  },
  cartPanelTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.navy, marginBottom: 16 },
  emptyCart: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCartEmoji: { fontSize: 48, marginBottom: 12 },
  emptyCartText: { fontSize: 14, color: THEME.slateLight },
  cartScroll: { flex: 1 },
  cartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: THEME.rowBorder },
  cartEmoji: { fontSize: 24, marginRight: 10 },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '600', color: THEME.text },
  cartItemSub: { fontSize: 12, color: THEME.slate, marginTop: 2 },
  cartItemTotal: { fontSize: 14, fontWeight: 'bold', color: THEME.text },
  cartDivider: { height: 1, backgroundColor: THEME.goldBorder, marginVertical: 14 },
  cartTotals: { marginBottom: 16 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLineLabel: { fontSize: 14, color: THEME.slate },
  totalLineValue: { fontSize: 14, color: THEME.slate },
  grandTotalLine: { marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: THEME.goldBorder },
  grandTotalLabel: { fontSize: 18, fontWeight: 'bold', color: THEME.navy },
  grandTotalValue: { fontSize: 18, fontWeight: 'bold', color: THEME.gold },
  cartActions: { flexDirection: 'row', gap: 10 },
  clearBtn: { borderWidth: 1.5, borderColor: THEME.goldBorder, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center' },
  clearBtnText: { color: THEME.slate, fontWeight: '600', fontSize: 14 },
  checkoutBtnTablet: { flex: 1, backgroundColor: THEME.gold, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  checkoutBtnDisabled: { backgroundColor: THEME.goldLight },
  checkoutBtnText: { color: THEME.navy, fontWeight: 'bold', fontSize: 15 },
});
