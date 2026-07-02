import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity, Platform,
} from 'react-native';
import { THEME } from '../constants/theme';
import { saveOrder, getNextToken, getExistingOrder } from '../utils/storage';
import { formatCurrency } from '../utils/razorpay';

// This screen is loaded when Razorpay redirects back after payment.
// URL params: razorpay_payment_id, razorpay_order_id, razorpay_signature,
//             orderId, items, subtotal, tax, total (passed via callback_url)
export default function GuestConfirmScreen({ navigation }) {
  const [tokenNumber, setTokenNumber] = useState(null);
  const [total, setTotal] = useState(null);
  const [error, setError] = useState(null);
  const [cartId, setCartId] = useState('cart1');

  useEffect(() => {
    async function confirm() {
      try {
        const params = new URLSearchParams(window.location.search);
        const paymentId = params.get('razorpay_payment_id');
        const rzpOrderId = params.get('razorpay_order_id');

        // The callback_url only carries orderId + cartId (kept short for mobile
        // browsers). Full order context (items, amounts) lives in sessionStorage,
        // written by GuestPaymentScreen before opening Razorpay.
        // Also read the Razorpay payment params saved by web/index.html before
        // React Navigation could strip them from window.location.search.
        let orderId = params.get('orderId');
        let cartId = params.get('cartId');
        let subtotal = 0, tax = 0, totalAmt = 0, items = [];

        const stored = sessionStorage.getItem('rzp_pending_order');
        if (stored) {
          const saved = JSON.parse(stored);
          if (!orderId) orderId = saved.orderId;
          if (!cartId) cartId = saved.cartId;
          subtotal = saved.subtotal;
          tax = saved.tax;
          totalAmt = saved.total;
          items = saved.items;
        }
        sessionStorage.removeItem('rzp_pending_order');

        // Recover Razorpay payment params captured in index.html before React loaded
        const rzpParamsRaw = sessionStorage.getItem('rzp_payment_params');
        const rzpParams = rzpParamsRaw ? JSON.parse(rzpParamsRaw) : {};
        sessionStorage.removeItem('rzp_payment_params');

        cartId = cartId || 'cart1';
        setCartId(cartId);
        setTotal(totalAmt);

        if (!orderId) {
          setError('Order details missing. Please contact staff.');
          return;
        }

        // CRITICAL: Verify payment was actually completed
        // Don't generate token if there's no payment ID from Razorpay
        const resolvedPaymentId = paymentId || rzpParams.razorpay_payment_id;

        if (!resolvedPaymentId) {
          console.error('[GuestConfirm] No payment ID found - payment was not completed');
          console.error('[GuestConfirm] URL params:', {
            paymentId, rzpOrderId,
            orderId, cartId,
            allParams: window.location.search
          });
          setError('Payment not completed. You may have closed the payment window. Please try ordering again.');

          // Redirect to menu after showing error
          setTimeout(() => {
            navigation.replace('GuestMenu', { cartId });
          }, 5000);
          return;
        }

        console.log('[GuestConfirm] Payment verified, ID:', resolvedPaymentId);

        // Idempotency check — if order already saved, reuse its token
        const existing = await getExistingOrder(orderId);
        if (existing) {
          setTokenNumber(existing.tokenNumber);
          return;
        }

        const token = await getNextToken(cartId);
        setTokenNumber(token);

        await saveOrder({
          orderId,
          items,
          subtotal,
          tax,
          total: totalAmt,
          employeeName: 'Guest (Self-Order)',
          paymentId: resolvedPaymentId,
          paymentMethod: 'razorpay_checkout',
          isGuestOrder: true,
          cartId,
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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
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

        <TouchableOpacity style={styles.newOrderBtn} onPress={() => navigation.replace('GuestMenu', { cartId })}>
          <Text style={styles.newOrderText}>+ New Order</Text>
        </TouchableOpacity>
      </ScrollView>
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
  phoneLine: { fontSize: 14, color: THEME.navy, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
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
