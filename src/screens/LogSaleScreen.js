import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { THEME } from '../constants/theme';
import { RESTAURANT_NAME, PRESET_SALE_ITEMS, EMPLOYEES } from '../constants';
import { saveDailySale, updateDailySale, deleteDailySale, subscribeTodayDailySales } from '../utils/storage';
import { formatCurrency, formatDateTime } from '../utils/razorpay';
import { loadSession } from '../utils/session';

const CARTS = ['cart1', 'cart2', 'cart3', 'cart4', 'cart5'];
const PRESET_NAMES = new Set(PRESET_SALE_ITEMS.map((i) => i.name));

export default function LogSaleScreen({ navigation }) {
  const session = loadSession();
  const employee = EMPLOYEES.find((e) => e.username === session?.username) || EMPLOYEES[0];
  const isAdmin = employee.role === 'admin';
  // Vendors can only log sales for their own cart; admin may log on behalf of any cart.
  const ownCart = CARTS.includes(employee.username) ? employee.username : CARTS[0];

  const [selectedCart, setSelectedCart] = useState(isAdmin ? CARTS[0] : ownCart);
  const [qtyByItem, setQtyByItem] = useState({}); // { [itemName]: qty }
  const [customItems, setCustomItems] = useState([]); // [{ name, price, qty }]
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState(null);
  const [toast, setToast] = useState(null);
  const [todaySales, setTodaySales] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeTodayDailySales(setTodaySales);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const todayForCart = todaySales.filter((s) => s.cartId === selectedCart);
  const todayQty = todayForCart.reduce((s, i) => s + i.totalQty, 0);
  const todayAmount = todayForCart.reduce((s, i) => s + i.totalAmount, 0);

  function increment(name) {
    setQtyByItem((p) => ({ ...p, [name]: (p[name] || 0) + 1 }));
  }
  function decrement(name) {
    setQtyByItem((p) => {
      const next = { ...p, [name]: (p[name] || 1) - 1 };
      if (next[name] <= 0) delete next[name];
      return next;
    });
  }

  function addCustomItem() {
    const name = customName.trim();
    const price = parseFloat(customPrice);
    if (!name) {
      Alert.alert('Missing name', 'Enter an item name.');
      return;
    }
    if (!price || price <= 0) {
      Alert.alert('Invalid price', 'Enter a valid price greater than 0.');
      return;
    }
    setCustomItems((p) => [...p, { name, price, qty: 1 }]);
    setCustomName('');
    setCustomPrice('');
  }

  function incrementCustom(idx) {
    setCustomItems((p) => p.map((it, i) => i === idx ? { ...it, qty: it.qty + 1 } : it));
  }
  function decrementCustom(idx) {
    setCustomItems((p) => {
      const next = p.map((it, i) => i === idx ? { ...it, qty: it.qty - 1 } : it).filter((it) => it.qty > 0);
      return next;
    });
  }
  function removeCustom(idx) {
    setCustomItems((p) => p.filter((_, i) => i !== idx));
  }

  const lineItems = [
    ...PRESET_SALE_ITEMS.filter((i) => qtyByItem[i.name] > 0).map((i) => ({
      name: i.name, price: i.price, qty: qtyByItem[i.name],
    })),
    ...customItems,
  ];
  const totalQty = lineItems.reduce((s, i) => s + i.qty, 0);
  const totalAmount = lineItems.reduce((s, i) => s + i.price * i.qty, 0);

  function resetForm() {
    setQtyByItem({});
    setCustomItems([]);
    setEditingSaleId(null);
  }

  async function handleSubmit() {
    if (lineItems.length === 0) {
      Alert.alert('No items', 'Add at least one item before submitting.');
      return;
    }
    setSaving(true);
    try {
      if (editingSaleId) {
        await updateDailySale(editingSaleId, {
          cartId: selectedCart,
          items: lineItems,
          totalQty,
          totalAmount,
        });
        setToast('Entry updated');
      } else {
        await saveDailySale({
          cartId: selectedCart,
          employeeName: employee.name,
          employeeUsername: employee.username,
          items: lineItems,
          totalQty,
          totalAmount,
          loggedAt: new Date().toISOString(),
        });
        setToast('Sale logged');
      }
      resetForm();
    } catch (e) {
      const msg = e.message || 'Could not save sale.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  }

  function editEntry(entry) {
    if (!entry.saleId) return;
    setEditingSaleId(entry.saleId);
    setSelectedCart(entry.cartId);
    const presetQty = {};
    const custom = [];
    entry.items.forEach((item) => {
      if (PRESET_NAMES.has(item.name)) presetQty[item.name] = item.qty;
      else custom.push(item);
    });
    setQtyByItem(presetQty);
    setCustomItems(custom);
  }

  function cancelEdit() {
    resetForm();
  }

  function confirmDelete(entry) {
    if (!entry.saleId) return;
    const doDelete = async () => {
      try {
        await deleteDailySale(entry.saleId);
        if (editingSaleId === entry.saleId) resetForm();
        setToast('Entry deleted');
      } catch (e) {
        const msg = e.message || 'Could not delete entry.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Error', msg);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this entry?')) doDelete();
    } else {
      Alert.alert('Delete entry?', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Log Sale</Text>
          <Text style={styles.headerSub}>{RESTAURANT_NAME}</Text>
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Cart selector — vendors are locked to their own cart; admin may pick any */}
        <Text style={styles.sectionLabel}>Which cart?</Text>
        {isAdmin ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
            {CARTS.map((cartId) => {
              const active = cartId === selectedCart;
              return (
                <TouchableOpacity
                  key={cartId}
                  style={[styles.cartChip, active && styles.cartChipActive]}
                  onPress={() => setSelectedCart(cartId)}
                >
                  <Text style={[styles.cartChipText, active && styles.cartChipTextActive]}>
                    {cartId.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={[styles.cartChip, styles.cartChipActive, styles.cartChipLocked]}>
            <Text style={[styles.cartChipText, styles.cartChipTextActive]}>
              {selectedCart.toUpperCase()}
            </Text>
          </View>
        )}

        {/* Today's running total for the selected cart */}
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>Today · {selectedCart.toUpperCase()}</Text>
          <Text style={styles.todayValue}>{todayQty} items · {formatCurrency(todayAmount)}</Text>
        </View>

        {/* Preset items */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>What did you sell?</Text>
        <View style={styles.card}>
          {PRESET_SALE_ITEMS.map((item, idx) => {
            const qty = qtyByItem[item.name] || 0;
            return (
              <View key={item.name}>
                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                  </View>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, !qty && styles.qtyBtnOff]}
                      onPress={() => decrement(item.name)}
                      disabled={!qty}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyNum}>{qty}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => increment(item.name)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {idx < PRESET_SALE_ITEMS.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        {/* Custom items */}
        <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Custom item (optional)</Text>
        <View style={styles.card}>
          <View style={styles.customInputRow}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Item name"
              placeholderTextColor="#94a3b8"
              value={customName}
              onChangeText={setCustomName}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Price ₹"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={customPrice}
              onChangeText={setCustomPrice}
            />
            <TouchableOpacity style={styles.addBtn} onPress={addCustomItem}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {customItems.map((item, idx) => (
            <View key={`${item.name}-${idx}`} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => decrementCustom(idx)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{item.qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => incrementCustom(idx)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => removeCustom(idx)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Summary */}
        {lineItems.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>This entry</Text>
            {lineItems.map((item, idx) => (
              <View key={`${item.name}-${idx}`} style={styles.summaryRow}>
                <Text style={styles.summaryItemName}>{item.name} ×{item.qty}</Text>
                <Text style={styles.summaryItemAmount}>{formatCurrency(item.price * item.qty)}</Text>
              </View>
            ))}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total ({totalQty} items)</Text>
              <Text style={styles.summaryTotalValue}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        )}

        <View style={styles.submitRow}>
          {editingSaleId && (
            <TouchableOpacity style={styles.cancelEditBtn} onPress={cancelEdit} disabled={saving}>
              <Text style={styles.cancelEditBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.submitBtn, lineItems.length === 0 && styles.submitBtnDisabled, editingSaleId && { flex: 1 }]}
            onPress={handleSubmit}
            disabled={saving || lineItems.length === 0}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : (
                <Text style={styles.submitBtnText}>
                  {editingSaleId ? 'Update Entry' : `Log Sale for ${selectedCart.toUpperCase()}`}
                </Text>
              )}
          </TouchableOpacity>
        </View>

        {/* Today's logged entries for this cart — editable/deletable */}
        {todayForCart.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.sectionLabel}>Logged today for {selectedCart.toUpperCase()}</Text>
            {todayForCart.map((entry) => (
              <View
                key={entry.saleId}
                style={[styles.recentCard, editingSaleId === entry.saleId && styles.recentCardEditing]}
              >
                <View style={styles.recentHeader}>
                  <Text style={styles.recentCart}>{entry.employeeName}</Text>
                  <Text style={styles.recentTime}>{formatDateTime(new Date(entry.loggedAt))}</Text>
                </View>
                <Text style={styles.recentItems} numberOfLines={2}>
                  {entry.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}
                </Text>
                <View style={styles.recentFooter}>
                  <Text style={styles.recentTotal}>{formatCurrency(entry.totalAmount)}</Text>
                  <View style={styles.recentActions}>
                    <TouchableOpacity onPress={() => editEntry(entry)} style={styles.recentActionBtn}>
                      <Text style={styles.recentActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(entry)} style={styles.recentActionBtn}>
                      <Text style={[styles.recentActionText, styles.recentActionDelete]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.offWhite, ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' } : {}) },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: THEME.navy, paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { paddingVertical: 4, paddingRight: 8, width: 60 },
  backText: { color: THEME.white, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.white },
  headerSub: { fontSize: 12, color: THEME.slateLight },

  content: { padding: 16, paddingBottom: 60 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: THEME.slate, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },

  cartChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1.5, borderColor: THEME.goldBorder, backgroundColor: THEME.white,
  },
  cartChipActive: { backgroundColor: THEME.navy, borderColor: THEME.navy },
  cartChipLocked: { alignSelf: 'flex-start' },
  cartChipText: { fontSize: 14, fontWeight: '700', color: THEME.slate },
  cartChipTextActive: { color: THEME.gold },

  todayCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: THEME.goldPale, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    marginTop: 14, borderWidth: 1, borderColor: THEME.goldBorder,
  },
  todayLabel: { fontSize: 12, fontWeight: '700', color: THEME.navy },
  todayValue: { fontSize: 13, fontWeight: '700', color: THEME.navy },

  card: {
    backgroundColor: THEME.white, borderRadius: 14, padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  itemName: { fontSize: 14, fontWeight: '600', color: THEME.text },
  itemPrice: { fontSize: 12, color: THEME.slateLight, marginTop: 2 },
  divider: { height: 1, backgroundColor: THEME.rowBorder, marginLeft: 14 },

  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { backgroundColor: THEME.navy, width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  qtyBtnOff: { backgroundColor: '#e2e8f0' },
  qtyBtnText: { color: THEME.white, fontSize: 18, fontWeight: 'bold', lineHeight: 20 },
  qtyNum: { fontSize: 15, fontWeight: 'bold', marginHorizontal: 10, minWidth: 18, textAlign: 'center' },

  customInputRow: { flexDirection: 'row', gap: 8, padding: 10 },
  input: {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 9, fontSize: 14, color: THEME.text, backgroundColor: THEME.offWhite,
  },
  addBtn: { backgroundColor: THEME.gold, borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  addBtnText: { color: THEME.navy, fontWeight: '700', fontSize: 13 },
  removeBtn: { padding: 6 },
  removeBtnText: { color: '#ef4444', fontSize: 14, fontWeight: 'bold' },

  summaryCard: {
    backgroundColor: THEME.white, borderRadius: 14, padding: 16, marginTop: 20,
    borderWidth: 1, borderColor: THEME.goldBorder,
  },
  summaryTitle: { fontSize: 14, fontWeight: 'bold', color: THEME.text, marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryItemName: { fontSize: 13, color: THEME.slate },
  summaryItemAmount: { fontSize: 13, fontWeight: '600', color: THEME.text },
  summaryDivider: { height: 1, backgroundColor: THEME.rowBorder, marginVertical: 8 },
  summaryTotalLabel: { fontSize: 15, fontWeight: 'bold', color: THEME.text },
  summaryTotalValue: { fontSize: 15, fontWeight: 'bold', color: THEME.gold },

  submitRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  submitBtn: { flex: 2, backgroundColor: THEME.navy, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: THEME.slateLight },
  submitBtnText: { color: THEME.white, fontWeight: 'bold', fontSize: 15 },
  cancelEditBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: THEME.slateLight,
  },
  cancelEditBtnText: { color: THEME.slate, fontWeight: '700', fontSize: 15 },

  recentCard: {
    backgroundColor: THEME.white, borderRadius: 12, padding: 12, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: THEME.gold,
  },
  recentCardEditing: { borderLeftColor: THEME.navy, backgroundColor: THEME.goldPale },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  recentCart: { fontSize: 12, fontWeight: '700', color: THEME.navy },
  recentTime: { fontSize: 11, color: THEME.slateLight },
  recentItems: { fontSize: 12, color: THEME.slate },
  recentFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  recentTotal: { fontSize: 14, fontWeight: 'bold', color: THEME.gold },
  recentActions: { flexDirection: 'row', gap: 14 },
  recentActionBtn: { paddingVertical: 2, paddingHorizontal: 4 },
  recentActionText: { fontSize: 12, fontWeight: '700', color: THEME.navy },
  recentActionDelete: { color: '#ef4444' },

  toast: {
    position: 'absolute', bottom: 24, left: 24, right: 24, alignItems: 'center',
  },
  toastText: {
    backgroundColor: THEME.navy, color: THEME.white, fontSize: 13, fontWeight: '600',
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, overflow: 'hidden',
  },
});
