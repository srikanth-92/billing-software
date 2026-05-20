import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { THEME } from '../constants/theme';
import { saveOrder, getNextToken } from '../utils/storage';
import { formatCurrency } from '../utils/razorpay';

// This screen is loaded when Razorpay redirects back after payment.
// URL params: razorpay_payment_id, razorpay_order_id, razorpay_signature,
//             orderId, items, subtotal, tax, total (passed via callback_url)
export default function GuestConfirmScreen({ navigation }) {
  const [tokenNumber, setTokenNumber] = useState(null);
  const [total, setTotal] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function confirm() {
      try {
        const params = new URLSearchParams(window.location.search);
        const paymentId = params.get('razorpay_payment_id');
        const orderId = params.get('orderId');
        const subtotal = parseFloat(params.get('subtotal') || '0');
        const tax = parseFloat(params.get('tax') || '0');
        const totalAmt = parseFloat(params.get('total') || '0');
        const items = JSON.parse(decodeURIComponent(params.get('items') || '[]'));

        setTotal(totalAmt);

        if (!paymentId || !orderId) {
          setError('Payment details missing. Please contact staff.');
          return;
        }

        const token = await getNextToken();
        setTokenNumber(token);

        await saveOrder({
          orderId,
          items,
          subtotal,
          tax,
          total: totalAmt,
          employeeName: 'Guest (Self-Order)',
          paymentId,
          paymentMethod: 'razorpay_checkout',
          isGuestOrder: true,
          tokenNumber: token,
          printPending: true,
        });
      } catch (e) {
        setError('Something went wrong. Please show this screen to staff.');
        console.warn('GuestConfirm error:', e);
      }
    }

    confirm();
  }, []);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorHint}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buffet on Wheels</Text>
        <Text style={styles.headerSub}>Payment Confirmed</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.successEmoji}>✅</Text>
        <Text style={styles.successTitle}>Payment Successful!</Text>

        <View style={styles.tokenBox}>
          <Text style={styles.tokenLabel}>YOUR TOKEN NUMBER</Text>
          {tokenNumber
            ? <Text style={styles.tokenNumber}>{tokenNumber}</Text>
            : <ActivityIndicator size="large" color={THEME.navy} style={{ marginVertical: 16 }} />
          }
          <Text style={styles.tokenHint}>Show this at the counter to collect your order</Text>
        </View>

        {total && <Text style={styles.amount}>{formatCurrency(total)} paid</Text>}
        <Text style={styles.sub}>Your bill is being printed at the counter.</Text>

        <TouchableOpacity style={styles.newOrderBtn} onPress={() => window.location.href = '/guest'}>
          <Text style={styles.newOrderText}>+ New Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.offWhite },
  header: {
    backgroundColor: THEME.navy, paddingHorizontal: 16, paddingVertical: 16,
    alignItems: 'center', borderBottomWidth: 1, borderBottomColor: THEME.goldBorder,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: THEME.gold },
  headerSub: { fontSize: 13, color: THEME.slateLight, marginTop: 2 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  successEmoji: { fontSize: 64, marginBottom: 8 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#22c55e', marginBottom: 24 },

  tokenBox: {
    borderWidth: 3, borderColor: THEME.navy, borderRadius: 16,
    paddingHorizontal: 40, paddingVertical: 20, alignItems: 'center',
    marginBottom: 20, width: '100%', maxWidth: 340, backgroundColor: THEME.white,
  },
  tokenLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 2, color: THEME.slate, marginBottom: 4 },
  tokenNumber: { fontSize: 80, fontWeight: 'bold', color: THEME.navy, lineHeight: 90 },
  tokenHint: { fontSize: 13, color: THEME.slate, textAlign: 'center', marginTop: 8 },

  amount: { fontSize: 20, fontWeight: 'bold', color: THEME.navy, marginBottom: 6 },
  sub: { fontSize: 13, color: THEME.slateLight, textAlign: 'center', marginBottom: 24 },

  newOrderBtn: {
    borderWidth: 2, borderColor: THEME.gold, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center',
  },
  newOrderText: { color: THEME.gold, fontWeight: 'bold', fontSize: 15 },

  card: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.navy, marginBottom: 8 },
  errorHint: { fontSize: 14, color: THEME.slate, textAlign: 'center' },
});
