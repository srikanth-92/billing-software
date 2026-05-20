import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { loadTodayOrders } from '../utils/storage';
import { formatCurrency, formatDateTime } from '../utils/razorpay';
import { useLayout } from '../utils/dimensions';
import { RESTAURANT_NAME, MENU_ITEMS } from '../constants';

export default function SalesScreen({ navigation, route }) {
  const { employee } = route.params;
  const { isTablet } = useLayout();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null); // orderId of expanded row

  const load = useCallback(async () => {
    const data = await loadTodayOrders();
    setOrders(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  // Aggregated stats
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const itemTotals = {};
  orders.forEach((o) => {
    o.items.forEach((item) => {
      itemTotals[item.name] = (itemTotals[item.name] || 0) + item.qty;
    });
  });
  const topItem = Object.entries(itemTotals).sort((a, b) => b[1] - a[1])[0];

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} employee={employee} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      </SafeAreaView>
    );
  }

  const StatCard = ({ emoji, label, value, sub }) => (
    <View style={[styles.statCard, isTablet && styles.statCardTablet]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );

  const OrderRow = ({ order }) => {
    const isOpen = expanded === order.orderId;
    return (
      <View style={styles.orderCard}>
        <TouchableOpacity
          style={styles.orderHeader}
          onPress={() => setExpanded(isOpen ? null : order.orderId)}
          activeOpacity={0.7}
        >
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderBadge}>#{order.orderId.slice(-8)}</Text>
            <View>
              <Text style={styles.orderTime}>
                {formatDateTime(new Date(order.savedAt))}
              </Text>
              <Text style={styles.orderEmployee}>by {order.employeeName}</Text>
            </View>
          </View>
          <View style={styles.orderHeaderRight}>
            <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
            <Text style={styles.orderChevron}>{isOpen ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.orderBody}>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.orderItemRow}>
                <Text style={styles.orderItemEmoji}>
                  {MENU_ITEMS.find((m) => m.name === item.name)?.emoji || '🍽️'}
                </Text>
                <Text style={styles.orderItemName}>{item.name}</Text>
                <Text style={styles.orderItemQty}>×{item.qty}</Text>
                <Text style={styles.orderItemPrice}>{formatCurrency(item.price * item.qty)}</Text>
              </View>
            ))}
            <View style={styles.orderFooter}>
              <Text style={styles.orderFooterText}>Subtotal: {formatCurrency(order.subtotal)}</Text>
              {order.tax > 0 && (
                <Text style={styles.orderFooterText}>GST (5%): {formatCurrency(order.tax)}</Text>
              )}
              <Text style={styles.orderFooterTotal}>Total: {formatCurrency(order.total)}</Text>
              {order.paymentId && (
                <Text style={styles.orderPayRef}>Razorpay Ref: {order.paymentId}</Text>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} employee={employee} />

      <FlatList
        data={orders}
        keyExtractor={(o) => o.orderId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.dateLabel}>{today}</Text>

            {/* Stat cards row */}
            <View style={[styles.statsRow, isTablet && styles.statsRowTablet]}>
              <StatCard emoji="💰" label="Total Revenue" value={formatCurrency(totalRevenue)} />
              <StatCard emoji="🧾" label="Total Orders" value={String(totalOrders)} />
              {topItem ? (
                <StatCard
                  emoji="🏆"
                  label="Top Item"
                  value={topItem[0]}
                  sub={`${topItem[1]} sold`}
                />
              ) : null}
            </View>

            {/* Per-item breakdown */}
            {Object.keys(itemTotals).length > 0 && (
              <View style={styles.breakdownCard}>
                <Text style={styles.breakdownTitle}>Item Breakdown</Text>
                {Object.entries(itemTotals)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, qty]) => {
                    const menuItem = MENU_ITEMS.find((m) => m.name === name);
                    const revenue = qty * (menuItem?.price || 0);
                    return (
                      <View key={name} style={styles.breakdownRow}>
                        <Text style={styles.breakdownEmoji}>{menuItem?.emoji || '🍽️'}</Text>
                        <Text style={styles.breakdownName}>{name}</Text>
                        <Text style={styles.breakdownQty}>{qty} sold</Text>
                        <Text style={styles.breakdownRevenue}>{formatCurrency(revenue)}</Text>
                      </View>
                    );
                  })}
              </View>
            )}

            <Text style={styles.ordersTitle}>
              {orders.length > 0 ? `All Orders (${orders.length})` : 'No orders yet today'}
            </Text>
          </View>
        }
        renderItem={({ item }) => <OrderRow order={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No orders recorded today.</Text>
            <Text style={styles.emptyHint}>Orders are saved here automatically after payment confirmation.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function Header({ navigation, employee }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View>
        <Text style={styles.headerTitle}>Today's Sales</Text>
        <Text style={styles.headerSub}>{RESTAURANT_NAME}</Text>
      </View>
      <View style={{ width: 60 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 12, color: '#fed7aa', textAlign: 'center' },

  listContent: { paddingBottom: 40 },
  listHeader: { padding: 16 },
  dateLabel: { fontSize: 14, color: '#64748b', marginBottom: 14 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statsRowTablet: { gap: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  statCardTablet: { padding: 20 },
  statEmoji: { fontSize: 26, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 3, textAlign: 'center' },
  statSub: { fontSize: 11, color: '#f97316', fontWeight: '600', marginTop: 2 },

  breakdownCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  breakdownTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  breakdownEmoji: { fontSize: 22, marginRight: 10 },
  breakdownName: { flex: 1, fontSize: 14, color: '#334155' },
  breakdownQty: { fontSize: 13, color: '#64748b', marginRight: 16 },
  breakdownRevenue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },

  ordersTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },

  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  orderHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderBadge: {
    backgroundColor: '#fff7ed',
    color: '#f97316',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  orderTime: { fontSize: 13, color: '#1e293b', fontWeight: '600' },
  orderEmployee: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  orderHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderTotal: { fontSize: 16, fontWeight: 'bold', color: '#f97316' },
  orderChevron: { fontSize: 11, color: '#94a3b8' },

  orderBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  orderItemEmoji: { fontSize: 18, marginRight: 8 },
  orderItemName: { flex: 1, fontSize: 13, color: '#334155' },
  orderItemQty: { fontSize: 12, color: '#64748b', marginRight: 12 },
  orderItemPrice: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  orderFooter: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  orderFooterText: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  orderFooterTotal: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginTop: 4 },
  orderPayRef: { fontSize: 11, color: '#94a3b8', marginTop: 4 },

  emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  emptyHint: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
});
