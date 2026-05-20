import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCurrency } from '../utils/razorpay';
import { RESTAURANT_GSTIN } from '../constants';

export default function OrderSummary({ items, subtotal, tax, total, orderId }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Order Summary</Text>
        <Text style={styles.orderId}>#{orderId}</Text>
      </View>

      {items.map((item) => (
        <View key={item.id} style={styles.itemRow}>
          <Text style={styles.itemEmoji}>{item.emoji}</Text>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemQty}>×{item.qty}</Text>
          <Text style={styles.itemPrice}>{formatCurrency(item.price * item.qty)}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <View style={styles.subtotalRow}>
        <Text style={styles.subtotalLabel}>Subtotal</Text>
        <Text style={styles.subtotalValue}>{formatCurrency(subtotal)}</Text>
      </View>

      {RESTAURANT_GSTIN ? (
        <View style={styles.subtotalRow}>
          <Text style={styles.subtotalLabel}>GST (5%)</Text>
          <Text style={styles.subtotalValue}>{formatCurrency(tax)}</Text>
        </View>
      ) : null}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  orderId: { fontSize: 12, color: '#94a3b8' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemEmoji: { fontSize: 20, marginRight: 8 },
  itemName: { flex: 1, fontSize: 14, color: '#334155' },
  itemQty: { fontSize: 13, color: '#64748b', marginRight: 12 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subtotalLabel: { fontSize: 13, color: '#64748b' },
  subtotalValue: { fontSize: 13, color: '#64748b' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#f97316' },
});
