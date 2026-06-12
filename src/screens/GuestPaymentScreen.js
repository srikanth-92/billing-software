import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, SafeAreaView, Platform,
} from 'react-native';
import {
  createRazorpayOrder, openRazorpayCheckout, closeRazorpayCheckout,
  fetchRazorpayOrderStatus, createRazorpayQR, fetchQRPayments,
  buildUpiString, formatCurrency,
} from '../utils/razorpay';
import { saveOrder, getNextToken, getExistingOrder } from '../utils/storage';
import { RESTAURANT_NAME, RESTAURANT_GSTIN } from '../constants';
import { THEME } from '../constants/theme';
import QRCodeDisplay from '../components/QRCodeDisplay';
import OrderSummary from '../components/OrderSummary';
import { useLayout } from '../utils/dimensions';

const POLL_MS = 3000;
const STATE = { CREATING: 'creating', AWAITING: 'awaiting', CONFIRMED: 'confirmed', ERROR: 'error' };

export default function GuestPaymentScreen({ navigation, route }) {
  const { orderId, items, subtotal, tax, total, cartId = 'cart1', phone = '' } = route.params;
  const { isTablet } = useLayout();

  const [state, setState] = useState(STATE.CREATING);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [qrUpiString, setQrUpiString] = useState(null);
  const [qrId, setQrId] = useState(null);
  const [tokenNumber, setTokenNumber] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [rzpOrderId, setRzpOrderId] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (Platform.OS === 'web') {
        try {
          let rzpOId = null;
          try {
            const order = await createRazorpayOrder({ amountRupees: total, orderId });
            rzpOId = order.id;
            if (!cancelled) setRzpOrderId(rzpOId);
          } catch {}
          if (cancelled) return;
          setState(STATE.AWAITING);

          // No redirect mode — handler fires in-page for all payment methods
          // (cards, wallets, netbanking, UPI collect).
          // For UPI QR scanned via Paytm/Google Pay, payment completes on the
          // phone and the browser never receives a redirect; the order-status
          // poller below detects capture and calls handlePaymentSuccess instead.
          openRazorpayCheckout({
            razorpayOrderId: rzpOId, amountRupees: total, orderId,
            prefill: phone ? { contact: phone } : {},
          })
            .then((payment) => {
              if (!cancelled) handlePaymentSuccess(payment.razorpay_payment_id || payment.id);
            })
            .catch(() => {});
        } catch (err) {
          if (!cancelled) { setErrorMsg(err.message || 'Payment failed'); setState(STATE.ERROR); }
        }
      } else {
        try {
          const { qrId: id, imageUrl } = await createRazorpayQR({
            amountRupees: total, orderId,
            description: `${RESTAURANT_NAME} – Order ${orderId}`,
          });
          if (cancelled) return;
          setQrId(id);
          setQrImageUrl(imageUrl);
          setState(STATE.AWAITING);
        } catch {
          if (cancelled) return;
          const upi = buildUpiString({ amountRupees: total, orderId, restaurantName: RESTAURANT_NAME });
          setQrUpiString(upi);
          setState(STATE.AWAITING);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Poll for native QR payment
  useEffect(() => {
    if (state !== STATE.AWAITING || !qrId) return;
    pollRef.current = setInterval(async () => {
      try {
        const payment = await fetchQRPayments(qrId);
        if (payment) {
          clearInterval(pollRef.current);
          setState(STATE.CONFIRMED);
          // Idempotency — check if already saved
          const existing = await getExistingOrder(orderId);
          if (existing) {
            setTokenNumber(existing.tokenNumber);
            return;
          }
          const token = await getNextToken(cartId);
          setTokenNumber(token);
          await saveOrder({
            orderId, items, subtotal, tax, total,
            employeeName: 'Guest (Self-Order)',
            paymentId: payment.id,
            paymentMethod: payment.method || 'upi',
            isGuestOrder: true,
            cartId,
            tokenNumber: token,
            printPending: true,
          });
        }
      } catch {}
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [state, qrId]);

  // Poll Razorpay order status on web — handles the case where the guest pays via
  // Paytm/Google Pay UPI QR inside the Razorpay modal. In that flow the payment
  // completes on the phone but the browser tab never receives the redirect callback.
  // Polling detects the captured payment and shows the token without any redirect.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (state !== STATE.AWAITING || !rzpOrderId) return;
    pollRef.current = setInterval(async () => {
      try {
        const status = await fetchRazorpayOrderStatus(rzpOrderId);
        if (status === 'paid') {
          clearInterval(pollRef.current);
          closeRazorpayCheckout();
          handlePaymentSuccess(rzpOrderId);
        }
      } catch {}
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [state, rzpOrderId]);

  useEffect(() => { return () => clearInterval(pollRef.current); }, []);

  async function handlePaymentSuccess(paymentId = 'manual') {
    setState(STATE.CONFIRMED);
    try {
      // Idempotency — if already saved reuse existing token
      const existing = await getExistingOrder(orderId);
      if (existing) {
        setTokenNumber(existing.tokenNumber);
        return;
      }
      const token = await getNextToken(cartId);
      setTokenNumber(token);
      await saveOrder({
        orderId, items, subtotal, tax, total,
        employeeName: 'Guest (Self-Order)',
        paymentId,
        paymentMethod: 'razorpay_checkout',
        isGuestOrder: true,
        cartId,
        tokenNumber: token,
        printPending: true,
      });
    } catch {
      const fallback = `T${String(Date.now()).slice(-3)}`;
      setTokenNumber(fallback);
    }
  }


  const qrSize = isTablet ? 260 : 220;

  const Panel = () => (
    <>
      {state === STATE.CREATING && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color={THEME.gold} />
          <Text style={styles.cardTitle}>Setting up payment…</Text>
        </View>
      )}

      {state === STATE.AWAITING && Platform.OS === 'web' && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color={THEME.gold} />
          <Text style={styles.cardTitle}>Complete payment in the popup</Text>
          <Text style={styles.cardHint}>Amount: {formatCurrency(total)}</Text>
          <Text style={styles.cardHint}>Screen updates automatically once payment is received</Text>
        </View>
      )}

      {state === STATE.AWAITING && Platform.OS !== 'web' && (
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>Scan & Pay</Text>
          <Text style={styles.qrAmount}>{formatCurrency(total)}</Text>
          <Text style={styles.qrHint}>Scan using any UPI app to pay</Text>
          <QRCodeDisplay imageUrl={qrImageUrl} upiString={qrUpiString} size={qrSize} />
          <View style={styles.waitingRow}>
            <ActivityIndicator size="small" color={THEME.gold} />
            <Text style={styles.waitingText}>Waiting for payment…</Text>
          </View>
        </View>
      )}

      {state === STATE.CONFIRMED && (
        <View style={styles.successCard}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>Payment Confirmed!</Text>
          <View style={styles.tokenBox}>
            <Text style={styles.tokenLabel}>YOUR TOKEN NUMBER</Text>
            {tokenNumber
              ? <Text style={styles.tokenNumber}>{tokenNumber}</Text>
              : <ActivityIndicator size="large" color={THEME.navy} style={{ marginVertical: 12 }} />
            }
            <Text style={styles.tokenHint}>Show this at the counter to collect your order</Text>
          </View>
          <Text style={styles.successAmount}>{formatCurrency(total)}</Text>
          <Text style={styles.successSub}>Your bill is being printed at the counter.</Text>
          <TouchableOpacity style={styles.newOrderBtn} onPress={() => navigation.replace('GuestMenu')}>
            <Text style={styles.newOrderText}>+ New Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === STATE.ERROR && (
        <View style={styles.card}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
          <Text style={styles.cardTitle}>Payment Failed</Text>
          <Text style={styles.cardHint}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {state === STATE.AWAITING || state === STATE.CREATING ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 60 }} />}
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 60 }} />
      </View>

      {isTablet ? (
        <View style={styles.tabletBody}>
          <ScrollView style={styles.tabletLeft} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
            <OrderSummary items={items} subtotal={subtotal} tax={tax} total={total} orderId={orderId} />
          </ScrollView>
          <ScrollView style={styles.tabletRight} contentContainerStyle={{ padding: 24, paddingBottom: 40, alignItems: 'center' }}>
            <Panel />
          </ScrollView>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
          <OrderSummary items={items} subtotal={subtotal} tax={tax} total={total} orderId={orderId} />
          <Panel />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.offWhite, ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' } : {}) },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: THEME.navy, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: THEME.goldBorder,
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: THEME.gold, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.gold },
  content: { padding: 16, paddingBottom: 120 },
  tabletBody: { flex: 1, flexDirection: 'row' },
  tabletLeft: { flex: 1, borderRightWidth: 1, borderRightColor: THEME.goldBorder },
  tabletRight: { flex: 1 },

  card: {
    backgroundColor: THEME.white, borderRadius: 20, padding: 36, alignItems: 'center', marginTop: 12,
    shadowColor: THEME.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: THEME.goldBorder,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.navy, marginTop: 16 },
  cardHint: { fontSize: 13, color: THEME.slate, marginTop: 8, textAlign: 'center' },
  retryBtn: { marginTop: 20, backgroundColor: THEME.gold, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: THEME.navy, fontWeight: 'bold', fontSize: 15 },

  qrSection: { alignItems: 'center', marginTop: 8 },
  qrTitle: { fontSize: 22, fontWeight: 'bold', color: THEME.navy, marginBottom: 4 },
  qrAmount: { fontSize: 32, fontWeight: 'bold', color: THEME.gold, marginBottom: 8 },
  qrHint: { fontSize: 13, color: THEME.slate, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  waitingText: { fontSize: 13, color: THEME.gold, fontWeight: '600' },

  successCard: {
    backgroundColor: THEME.white, borderRadius: 20, padding: 28, alignItems: 'center', marginTop: 12,
    shadowColor: THEME.gold, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4,
    borderWidth: 1, borderColor: THEME.goldBorder,
  },
  successEmoji: { fontSize: 56, marginBottom: 8 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#22c55e', marginBottom: 16 },
  tokenBox: {
    borderWidth: 3, borderColor: THEME.navy, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 16,
    alignItems: 'center', marginBottom: 16, width: '100%',
  },
  tokenLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 2, color: THEME.slate, marginBottom: 4 },
  tokenNumber: { fontSize: 72, fontWeight: 'bold', color: THEME.navy, lineHeight: 80 },
  tokenHint: { fontSize: 12, color: THEME.slate, textAlign: 'center', marginTop: 6 },
  successAmount: { fontSize: 24, fontWeight: 'bold', color: THEME.navy, marginBottom: 6 },
  successSub: { fontSize: 13, color: THEME.slateLight, textAlign: 'center', marginBottom: 20 },
  newOrderBtn: {
    borderWidth: 2, borderColor: THEME.gold, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', width: '100%',
  },
  newOrderText: { color: THEME.gold, fontWeight: 'bold', fontSize: 15 },
});
