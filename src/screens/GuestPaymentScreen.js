import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, SafeAreaView, Platform, Alert,
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
        // Check if in-app browser
        const ua = navigator.userAgent || '';
        const isInAppBrowser = (
          /Instagram/i.test(ua) ||
          /FBAN|FBAV/i.test(ua) ||
          /WhatsApp/i.test(ua) ||
          /Paytm/i.test(ua) ||
          (/Android/i.test(ua) && /wv/.test(ua)) ||
          (/iPhone|iPad|iPod/i.test(ua) && !/Version\/[\d.]+ .*Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua))
        );

        console.log('[GuestPaymentScreen] Browser detection:', { isInAppBrowser, ua });

        // In-app browsers: Use Razorpay redirect mode (hosted payment page)
        if (isInAppBrowser) {
          console.log('[GuestPaymentScreen] In-app browser detected - using Razorpay redirect mode');
          if (cancelled) return;

          setState(STATE.AWAITING);

          // Save order context for GuestConfirmScreen
          sessionStorage.setItem('rzp_pending_order', JSON.stringify({
            orderId, items, subtotal, tax, total, cartId, phone,
          }));

          // Use redirect mode - opens Razorpay hosted page
          const callbackUrl = `${window.location.origin}/guest-confirm`;

          openRazorpayCheckout({
            razorpayOrderId: null,
            amountRupees: total,
            orderId,
            callbackUrl, // Redirect mode
            prefill: {},
          })
            .catch((err) => {
              console.error('[GuestPaymentScreen] Razorpay init error:', err);
              if (!cancelled) {
                setState(STATE.ERROR);
                setErrorMsg(err.message || 'Could not open payment page');
              }
            });

          return;
        }

        // Regular browser: Use Razorpay modal
        try {
          if (cancelled) return;
          setState(STATE.AWAITING);

          // Stash order context before opening Razorpay so GuestConfirmScreen
          // can recover it after the redirect (React Navigation strips query params).
          sessionStorage.setItem('rzp_pending_order', JSON.stringify({
            orderId, items, subtotal, tax, total, cartId, phone,
          }));

          console.log('[GuestPaymentScreen] Opening Razorpay checkout');

          // Use NON-redirect mode (handler mode) - modal stays in same page
          // This works better in in-app browsers
          openRazorpayCheckout({
            razorpayOrderId: null, // No order_id - direct payment
            amountRupees: total,
            orderId,
            callbackUrl: null, // No redirect - use handler mode
            prefill: {},
          })
            .then(async (payment) => {
              // Payment successful!
              console.log('[GuestPaymentScreen] Payment successful:', payment);
              if (cancelled) return;

              setState(STATE.CONFIRMED);

              // Check if already saved
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
                paymentId: payment.razorpay_payment_id || payment.id,
                paymentMethod: 'razorpay_checkout',
                isGuestOrder: true,
                cartId,
                tokenNumber: token,
                printPending: true,
              });
            })
            .catch((err) => {
              // Payment dismissed or failed
              console.error('[GuestPaymentScreen] Payment error:', err);
              console.error('[GuestPaymentScreen] Error message:', err.message);
              console.error('[GuestPaymentScreen] Error stack:', err.stack);
              sessionStorage.removeItem('rzp_pending_order');

              if (!cancelled) {
                if (err.message === 'dismissed') {
                  // User closed modal - go back to menu
                  navigation.goBack();
                } else {
                  // Real error - could be Razorpay configuration issue
                  setState(STATE.ERROR);
                  const errorDetails = err.message || 'Payment failed';
                  setErrorMsg(
                    'Payment could not be processed. ' +
                    'This may be due to Razorpay account setup. ' +
                    'Please contact support.\n\n' +
                    `Error: ${errorDetails}`
                  );
                }
              }
            });
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

  // On web: poll order status every 3 s AND check immediately when the browser
  // tab becomes visible again (user returns from Paytm/Google Pay).
  // setInterval is suspended while Chrome is backgrounded, so without the
  // visibilitychange hook the user returns to a frozen "waiting" screen.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (state !== STATE.AWAITING || !rzpOrderId) return;

    let done = false;
    async function checkStatus() {
      if (done) return;
      try {
        const status = await fetchRazorpayOrderStatus(rzpOrderId);
        console.log('[GuestPaymentScreen] Polling - Order status:', status, 'for order:', rzpOrderId);
        if (status === 'paid') {
          console.log('[GuestPaymentScreen] Polling detected paid status - calling handlePaymentSuccess');
          done = true;
          clearInterval(pollRef.current);
          document.removeEventListener('visibilitychange', onVisible);
          closeRazorpayCheckout();
          handlePaymentSuccess(rzpOrderId);
        }
      } catch (err) {
        console.error('[GuestPaymentScreen] Polling error:', err);
      }
    }

    function onVisible() {
      if (!document.hidden) checkStatus();
    }

    document.addEventListener('visibilitychange', onVisible);
    pollRef.current = setInterval(checkStatus, POLL_MS);
    return () => {
      clearInterval(pollRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [state, rzpOrderId]);

  useEffect(() => { return () => clearInterval(pollRef.current); }, []);

  async function handlePaymentSuccess(paymentId = 'manual') {
    console.log('[GuestPaymentScreen] handlePaymentSuccess called with paymentId:', paymentId);

    // CRITICAL: Verify payment before confirming
    if (rzpOrderId && paymentId !== 'manual') {
      try {
        const status = await fetchRazorpayOrderStatus(rzpOrderId);
        console.log('[GuestPaymentScreen] Payment verification - status:', status);

        if (status !== 'paid') {
          console.warn('[GuestPaymentScreen] Payment not confirmed, status:', status);
          // Don't confirm yet - keep waiting for polling to detect 'paid' status
          return;
        }
      } catch (err) {
        console.error('[GuestPaymentScreen] Payment verification failed:', err);
        return;
      }
    }

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

      {state === STATE.AWAITING && Platform.OS === 'web' && !qrUpiString && (
        <View style={styles.card}>
          <ActivityIndicator size="large" color={THEME.gold} />
          <Text style={styles.cardTitle}>Complete payment in the popup</Text>
          <Text style={styles.cardHint}>Amount: {formatCurrency(total)}</Text>
          <Text style={styles.cardHint}>Screen updates automatically once payment is received</Text>
        </View>
      )}

      {state === STATE.AWAITING && (Platform.OS !== 'web' || qrUpiString) && (
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>Scan QR to Pay</Text>
          <Text style={styles.qrAmount}>{formatCurrency(total)}</Text>

          <View style={styles.instructionBox}>
            <Text style={styles.instructionTitle}>📱 How to Pay:</Text>
            <Text style={styles.instructionStep}>1. Open any UPI app (GPay, PhonePe, Paytm, etc.)</Text>
            <Text style={styles.instructionStep}>2. Scan the QR code below</Text>
            <Text style={styles.instructionStep}>3. Complete the payment</Text>
            <Text style={styles.instructionStep}>4. Your token will appear here automatically</Text>
          </View>

          {qrUpiString && <QRCodeDisplay upiString={qrUpiString} size={qrSize} />}
          {qrImageUrl && <QRCodeDisplay imageUrl={qrImageUrl} upiString={null} size={qrSize} />}

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>✨ Stay on this screen</Text>
            <Text style={styles.warningSubtext}>Token will appear automatically once payment is complete</Text>
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
  container: {
    flex: 1,
    backgroundColor: THEME.offWhite,
    // Remove position:fixed on web to prevent blocking Razorpay modal
  },
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
  upiPayButton: {
    backgroundColor: THEME.gold,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginVertical: 20,
    shadowColor: THEME.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  upiPayText: {
    color: THEME.navy,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  instructionBox: {
    backgroundColor: THEME.white,
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
    width: '90%',
    borderWidth: 2,
    borderColor: THEME.gold,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.navy,
    marginBottom: 12,
  },
  instructionStep: {
    fontSize: 14,
    color: THEME.slate,
    marginBottom: 8,
    lineHeight: 20,
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    width: '90%',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  warningSubtext: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  returnPrompt: {
    backgroundColor: THEME.navy,
    borderRadius: 16,
    padding: 32,
    marginTop: 20,
    width: '90%',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: THEME.gold,
  },
  returnEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  returnTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.gold,
    marginBottom: 12,
    textAlign: 'center',
  },
  returnText: {
    fontSize: 16,
    color: THEME.white,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  returnSteps: {
    width: '100%',
    backgroundColor: 'rgba(201, 168, 64, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  returnStep: {
    fontSize: 15,
    color: THEME.gold,
    marginBottom: 12,
    fontWeight: '600',
    lineHeight: 22,
  },

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
