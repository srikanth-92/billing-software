import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { MENU_ITEMS, RESTAURANT_NAME, RESTAURANT_GSTIN } from '../constants';
import { THEME } from '../constants/theme';
import { generateOrderId, formatCurrency } from '../utils/razorpay';
import { loadWeeklyMenu, subscribeCartOverrides } from '../utils/storage';

// Force open in system browser when scanned from ANY in-app WebView.
//
// Android: redirect if NOT a known standalone browser.
// iOS:     WKWebView (used by every in-app scanner — Paytm, PhonePe, WhatsApp,
//          Instagram, etc.) spoofs Safari UA but OMITS "Version/X Safari/" tokens
//          that real Safari always includes. We use that to detect it reliably.
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  var ua = navigator.userAgent || '';
  var isAndroid = /Android/i.test(ua);
  var isIOS = /iPhone|iPad|iPod/i.test(ua);

  var isInAppBrowser = false;

  if (isAndroid) {
    // Standalone browsers include their own token and do NOT set the wv flag
    var isStandaloneAndroid =
      (/Chrome\/\d/.test(ua) && !/wv\b/.test(ua)) ||  // Chrome (real)
      /SamsungBrowser\/\d/.test(ua) ||
      /Firefox\/\d/.test(ua) ||
      /OPR\/\d/.test(ua) ||
      /EdgA\/\d/.test(ua) ||
      /Brave\//.test(ua) ||
      /DuckDuckGo\//.test(ua) ||
      /Vivaldi\//.test(ua);
    isInAppBrowser = !isStandaloneAndroid;
  } else if (isIOS) {
    // Real Safari always has both "Version/X.X" AND "Safari/" in the UA.
    // WKWebView (every in-app browser on iOS) has neither — it just says "Mobile/XXXX".
    var isRealSafari = /Version\/[\d.]+ .*Safari\//.test(ua);
    // Chrome for iOS identifies itself with CriOS
    var isChromeiOS = /CriOS\/\d/.test(ua);
    // Firefox for iOS
    var isFirefoxiOS = /FxiOS\/\d/.test(ua);
    // Edge for iOS
    var isEdgeiOS = /EdgiOS\/\d/.test(ua);
    isInAppBrowser = !isRealSafari && !isChromeiOS && !isFirefoxiOS && !isEdgeiOS;
  }

  if (isInAppBrowser) {
    var url = window.location.href;
    var urlNoScheme = url.replace(/^https?:\/\//, '');

    if (isAndroid) {
      // Chrome intent; falls back to system browser chooser if Chrome not installed
      window.location.href =
        'intent://' + urlNoScheme +
        '#Intent;scheme=https;package=com.android.chrome;' +
        'S.browser_fallback_url=' + encodeURIComponent(
          'intent://' + urlNoScheme +
          '#Intent;scheme=https;action=android.intent.action.VIEW;' +
          'category=android.intent.category.BROWSABLE;end'
        ) + ';end';
    } else {
      // iOS: try Chrome first via URL scheme.
      // If Chrome isn't installed, open in the system default browser via window.open(_blank)
      // which WKWebView always hands off to the OS default browser.
      var pageLeft = false;
      window.addEventListener('pagehide', function () { pageLeft = true; });
      window.addEventListener('blur', function () { pageLeft = true; });
      window.location.href = 'googlechromes://' + urlNoScheme;
      setTimeout(function () {
        if (!pageLeft) {
          // Chrome not installed — open in OS default browser (Safari or user's default)
          var a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body ? document.body.appendChild(a) : document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(a); });
          a.click();
        }
      }, 600);
    }
  }
}

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner'];
const CATEGORY_TIMES = {
  Breakfast: '7:00–10:00 AM',
  Lunch:     '12:30–2:30 PM',
  Dinner:    '7:30–10:30 PM',
};
const CATEGORY_META = {
  Breakfast: { emoji: '🌅', color: '#ea580c', bg: '#fff7ed' },
  Lunch:     { emoji: '☀️',  color: '#ca8a04', bg: '#fefce8' },
  Dinner:    { emoji: '🌙', color: '#4f46e5', bg: '#eef2ff' },
  Beverages: { emoji: '☕', color: '#0891b2', bg: '#ecfeff' },
};

function getMealTab() {
  const mins = new Date().getHours() * 60 + new Date().getMinutes();
  if (mins >= 7 * 60 && mins < 10 * 60) return 'Breakfast';
  if (mins >= 12 * 60 + 30 && mins < 14 * 60) return 'Lunch';
  if (mins >= 19 * 60 && mins < 22 * 60) return 'Dinner';
  return 'Breakfast';
}

export default function GuestMenuScreen({ navigation, route }) {
  const [menuData, setMenuData] = useState(null);
  const [disabledItems, setDisabledItems] = useState(new Set());
  const [cart, setCart] = useState({});
  const [activeTab, setActiveTab] = useState(getMealTab);

  const cartId = route?.params?.cartId || 'cart1';

  useEffect(() => {
    loadWeeklyMenu().then((saved) => {
      const defaults = {};
      CATEGORIES.forEach((cat) => { defaults[cat] = MENU_ITEMS.filter((i) => i.category === cat); });
      if (!saved) { setMenuData(defaults); return; }
      const merged = { ...saved };
      CATEGORIES.forEach((cat) => { if (!merged[cat] || !merged[cat].length) merged[cat] = defaults[cat]; });
      setMenuData(merged);
    });
  }, []);

  // Live subscription — updates instantly when vendor toggles stock
  useEffect(() => {
    const unsub = subscribeCartOverrides(cartId, (ids) => setDisabledItems(new Set(ids)));
    return () => unsub();
  }, [cartId]);

  const allItems = (menuData ? Object.values(menuData).flat() : MENU_ITEMS)
    .filter((item) => !disabledItems.has(item.id));
  const cartItems = allItems.filter((i) => cart[i.id] > 0).map((i) => ({ ...i, qty: cart[i.id] }));
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = RESTAURANT_GSTIN ? Math.round(subtotal * 0.05 * 100) / 100 : 0;
  const total = subtotal + tax;
  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0);

  function increment(id) { setCart((p) => ({ ...p, [id]: (p[id] || 0) + 1 })); }
  function decrement(id) {
    setCart((p) => { const n = { ...p, [id]: (p[id] || 1) - 1 }; if (n[id] <= 0) delete n[id]; return n; });
  }

  function handleCheckout() {
    if (!cartItems.length) {
      if (Platform.OS === 'web') window.alert('Please add at least one item.');
      else Alert.alert('Empty Cart', 'Please add at least one item.');
      return;
    }
    navigation.navigate('GuestPayment', {
      orderId: generateOrderId(),
      items: cartItems,
      subtotal,
      tax,
      total,
      cartId,
      phone: '',
    });
  }

  if (!menuData) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{RESTAURANT_NAME}</Text>
        <Text style={styles.headerSub}>Self-Order Menu</Text>
        <TouchableOpacity
          style={styles.cateringBanner}
          onPress={() => navigation.navigate('CateringOrder')}
        >
          <Text style={styles.cateringBannerText}>🍽️ Catering &amp; Banquet Orders — Tap to Enquire</Text>
        </TouchableOpacity>
      </View>
      <ActivityIndicator style={{ marginTop: 60 }} size="large" color={THEME.gold} />
    </SafeAreaView>
  );

  const meta = CATEGORY_META[activeTab];
  const visibleItems = (menuData[activeTab] || []).filter((i) => !disabledItems.has(i.id));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{RESTAURANT_NAME}</Text>
        <Text style={styles.headerSub}>Self-Order Menu</Text>
        <TouchableOpacity
          style={styles.cateringBanner}
          onPress={() => navigation.navigate('CateringOrder')}
        >
          <Text style={styles.cateringBannerText}>🍽️ Catering &amp; Banquet Orders — Tap to Enquire</Text>
        </TouchableOpacity>
      </View>

      {/* Extra bottom padding so sticky bar never covers content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, totalItems > 0 && { paddingBottom: 100 }]}>

        {/* Category tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }} contentContainerStyle={styles.tabBar}>
          {CATEGORIES.map((cat) => {
            const m = CATEGORY_META[cat];
            const active = cat === activeTab;
            const count = (menuData[cat] || []).filter((i) => !disabledItems.has(i.id) && cart[i.id] > 0).length;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.tab, active && { backgroundColor: m.color, borderColor: m.color }]}
                onPress={() => setActiveTab(cat)}
              >
                <Text style={styles.tabEmoji}>{m.emoji}</Text>
                <View>
                  <Text style={[styles.tabLabel, active && { color: '#fff' }]}>{cat}</Text>
                  <Text style={[styles.tabTime, active && { color: 'rgba(255,255,255,0.8)' }]}>{CATEGORY_TIMES[cat]}</Text>
                </View>
                {count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: active ? '#fff' : m.color }]}>
                    <Text style={[styles.tabBadgeText, { color: active ? m.color : '#fff' }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Items */}
        <View style={[styles.itemsCard, { borderTopColor: meta.color }]}>
          <View style={[styles.catHeader, { backgroundColor: meta.bg }]}>
            <Text style={styles.catEmoji}>{meta.emoji}</Text>
            <Text style={[styles.catTitle, { color: meta.color }]}>{activeTab}</Text>
          </View>
          {visibleItems.length === 0 && <Text style={styles.empty}>No items available.</Text>}
          {visibleItems.map((item, idx) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                </View>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, !cart[item.id] && styles.qtyBtnOff]}
                    onPress={() => decrement(item.id)} disabled={!cart[item.id]}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyNum}>{cart[item.id] || 0}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => increment(item.id)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {idx < visibleItems.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Cart summary — visible when scrolled down */}
        {cartItems.length > 0 && (
          <View style={styles.cartSummary}>
            <Text style={styles.cartTitle}>Your Order</Text>
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartRow}>
                <Text style={styles.cartEmoji}>{item.emoji}</Text>
                <Text style={styles.cartName}>{item.name} ×{item.qty}</Text>
                <Text style={styles.cartAmt}>{formatCurrency(item.price * item.qty)}</Text>
              </View>
            ))}
            <View style={styles.cartDivider} />
            {RESTAURANT_GSTIN && (
              <View style={styles.totalLine}>
                <Text style={styles.totalLineLabel}>GST (5%)</Text>
                <Text style={styles.totalLineVal}>{formatCurrency(tax)}</Text>
              </View>
            )}
            <View style={[styles.totalLine, styles.grandLine]}>
              <Text style={styles.grandLabel}>Total</Text>
              <Text style={styles.grandVal}>{formatCurrency(total)}</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Sticky Pay Now bar — fixed on web so it's always visible on iPhone */}
      {totalItems > 0 && (
        <View style={styles.stickyBar}>
          <View>
            <Text style={styles.stickyItems}>{totalItems} item{totalItems > 1 ? 's' : ''} · {formatCurrency(total)}</Text>
            {subtotal !== total && (
              <Text style={styles.stickyTax}>incl. GST {formatCurrency(tax)}</Text>
            )}
          </View>
          <TouchableOpacity style={styles.payBtn} onPress={handleCheckout}>
            <Text style={styles.payBtnText}>Pay Now →</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.offWhite, ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' } : {}) },
  header: {
    backgroundColor: THEME.navy, paddingHorizontal: 16, paddingVertical: 16,
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: THEME.goldBorder,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: THEME.gold },
  headerSub: { fontSize: 13, color: THEME.slateLight, marginTop: 2 },
  cateringBanner: {
    marginTop: 10, backgroundColor: THEME.gold,
    borderRadius: 8, paddingHorizontal: 16, paddingVertical: 7,
    width: '100%',
  },
  cateringBannerText: { color: THEME.navy, fontWeight: '700', fontSize: 13, textAlign: 'center' },

  content: { paddingBottom: 120 },
  tabBar: { paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: THEME.goldBorder, backgroundColor: THEME.white,
  },
  tabEmoji: { fontSize: 16 },
  tabLabel: { fontSize: 14, fontWeight: '600', color: THEME.slate },
  tabTime: { fontSize: 10, color: THEME.slateLight, marginTop: 1 },
  tabBadge: { minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  tabBadgeText: { fontSize: 11, fontWeight: 'bold' },

  itemsCard: {
    backgroundColor: THEME.white, borderRadius: 16, marginHorizontal: 16,
    borderTopWidth: 3, overflow: 'hidden',
    shadowColor: THEME.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  catEmoji: { fontSize: 20 },
  catTitle: { fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: THEME.rowBorder, marginLeft: 60 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  itemEmoji: { fontSize: 28, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: THEME.text },
  itemDesc: { fontSize: 12, color: THEME.slateLight, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: THEME.navy, marginRight: 12, minWidth: 52, textAlign: 'right' },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { backgroundColor: THEME.gold, width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  qtyBtnOff: { backgroundColor: THEME.divider },
  qtyBtnText: { color: THEME.navy, fontSize: 20, fontWeight: 'bold', lineHeight: 24 },
  qtyNum: { fontSize: 15, fontWeight: 'bold', marginHorizontal: 10, minWidth: 20, textAlign: 'center', color: THEME.text },
  empty: { padding: 20, color: THEME.slateLight, textAlign: 'center' },

  cartSummary: {
    backgroundColor: THEME.white, borderRadius: 16, marginHorizontal: 16, marginTop: 16,
    padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cartTitle: { fontSize: 15, fontWeight: 'bold', color: THEME.text, marginBottom: 12 },
  cartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  cartEmoji: { fontSize: 18, marginRight: 8 },
  cartName: { flex: 1, fontSize: 13, color: THEME.text },
  cartAmt: { fontSize: 13, fontWeight: '600', color: THEME.text },
  cartDivider: { height: 1, backgroundColor: THEME.rowBorder, marginVertical: 10 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalLineLabel: { fontSize: 13, color: THEME.slate },
  totalLineVal: { fontSize: 13, color: THEME.slate },
  grandLine: { marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: THEME.goldBorder },
  grandLabel: { fontSize: 16, fontWeight: 'bold', color: THEME.navy },
  grandVal: { fontSize: 16, fontWeight: 'bold', color: THEME.gold },

  // Sticky bar — position fixed on web so it stays visible regardless of scroll
  stickyBar: {
    ...(Platform.OS === 'web'
      ? { position: 'fixed', bottom: 0, left: 0, right: 0 }
      : { position: 'absolute', bottom: 0, left: 0, right: 0 }),
    backgroundColor: THEME.navy,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28,
    borderTopWidth: 1, borderTopColor: THEME.goldBorder,
  },
  stickyItems: { color: THEME.gold, fontSize: 15, fontWeight: 'bold' },
  stickyTax: { color: THEME.slateLight, fontSize: 11, marginTop: 2 },
  payBtn: { backgroundColor: THEME.gold, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  payBtnText: { color: THEME.navy, fontWeight: 'bold', fontSize: 15 },

  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetWrap: { backgroundColor: THEME.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheet: { padding: 24, paddingBottom: 40 },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.navy, marginBottom: 8 },
  sheetHint: { fontSize: 14, color: THEME.slate, marginBottom: 20, lineHeight: 20 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  countryCode: {
    borderWidth: 1.5, borderColor: THEME.goldBorder, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, backgroundColor: THEME.offWhite,
  },
  countryCodeText: { fontSize: 15, fontWeight: '600', color: THEME.text },
  phoneInput: {
    flex: 1, borderWidth: 1.5, borderColor: THEME.goldBorder, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: THEME.text,
    backgroundColor: THEME.offWhite,
  },
  phoneError: { color: '#ef4444', fontSize: 13, marginBottom: 8 },
  confirmPayBtn: {
    backgroundColor: THEME.gold, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  confirmPayBtnText: { color: THEME.navy, fontWeight: 'bold', fontSize: 16 },
  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipBtnText: { color: THEME.slate, fontSize: 14 },
});
