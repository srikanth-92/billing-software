import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import {
  createRazorpayQR,
  createRazorpayOrder,
  openRazorpayCheckout,
  fetchQRPayments,
  buildUpiString,
  formatCurrency,
} from '../utils/razorpay';
import { printBill } from '../utils/bill';
import { saveOrder } from '../utils/storage';
import { RESTAURANT_NAME } from '../constants';
import { THEME } from '../constants/theme';
import QRCodeDisplay from '../components/QRCodeDisplay';
import OrderSummary from '../components/OrderSummary';
import { useLayout } from '../utils/dimensions';

const POLL_INTERVAL_MS = 3000;

// Payment screen states
const STATE = {
  CREATING_QR: 'creating_qr',   // calling Razorpay API to create QR
  AWAITING:    'awaiting',       // QR shown, waiting for customer to pay
  CONFIRMED:   'confirmed',      // Razorpay confirmed payment captured
  ERROR:       'error',          // QR creation failed
};

export default function PaymentScreen({ navigation, route }) {
  const { orderId, items, subtotal, tax, total, employee } = route.params;

  const [state, setState]         = useState(STATE.CREATING_QR);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [qrUpiString, setQrUpiString] = useState(null); // fallback when Razorpay API is CORS-blocked
  const [qrId, setQrId]           = useState(null);
  const [errorMsg, setErrorMsg]   = useState('');
  const [printing, setPrinting]   = useState(false);
  const [capturedPayment, setCapturedPayment] = useState(null);
  const { isTablet } = useLayout();
  const pollRef = useRef(null);

  // On web: open Razorpay Checkout modal directly.
  // On native: create a QR code for UPI scanning.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (Platform.OS === 'web') {
        // Web: create a Razorpay Order then open the hosted checkout modal
        try {
          let rzpOrderId = null;
          try {
            const order = await createRazorpayOrder({ amountRupees: total, orderId });
            rzpOrderId = order.id;
          } catch {
            // Order creation failed (likely test keys / CORS) — open modal without order_id
          }

          if (cancelled) return;
          setState(STATE.AWAITING);

          const payment = await openRazorpayCheckout({
            razorpayOrderId: rzpOrderId,
            amountRupees: total,
            orderId,
          });

          if (cancelled) return;
          setCapturedPayment(payment);
          setState(STATE.CONFIRMED);
          await saveOrder({
            orderId,
            items,
            subtotal,
            tax,
            total,
            employeeName: employee.name,
            paymentId: payment.razorpay_payment_id || payment.id,
            paymentMethod: 'razorpay_checkout',
          });
        } catch (err) {
          if (cancelled) return;
          if (err?.message === 'dismissed') {
            // User closed the modal — go back so they can adjust the order
            navigation.goBack();
          } else {
            setErrorMsg(err.message || 'Payment failed');
            setState(STATE.ERROR);
          }
        }
      } else {
        // Native: generate UPI QR code
        try {
          const { qrId: id, imageUrl } = await createRazorpayQR({
            amountRupees: total,
            orderId,
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

  // Start polling once QR is ready; stop when payment confirmed or component unmounts
  useEffect(() => {
    if (state !== STATE.AWAITING || !qrId) return;

    pollRef.current = setInterval(async () => {
      try {
        const payment = await fetchQRPayments(qrId);
        if (payment) {
          clearInterval(pollRef.current);
          setCapturedPayment(payment);
          setState(STATE.CONFIRMED);
          await saveOrder({
            orderId,
            items,
            subtotal,
            tax,
            total,
            employeeName: employee.name,
            paymentId: payment.id,
            paymentMethod: payment.method || 'upi',
          });
        }
      } catch {
        // silent — keep polling
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [state, qrId]);

  // Stop polling when we leave the screen
  useEffect(() => {
    return () => clearInterval(pollRef.current);
  }, []);

  async function handlePrintBill() {
    setPrinting(true);
    try {
      await printBill({
        orderId,
        items,
        subtotal,
        tax,
        total,
        employeeName: employee.name,
        paymentMode: `UPI / Razorpay (${capturedPayment?.method || 'UPI'})`,
      });
    } catch (err) {
      Alert.alert('Print Error', err.message || 'Could not print the bill.');
    } finally {
      setPrinting(false);
    }
  }

  function handleNewOrder() {
    navigation.replace('Menu', { employee });
  }

  function handleRetry() {
    setState(STATE.CREATING_QR);
    setErrorMsg('');
    setQrId(null);
    setQrImageUrl(null);
    setQrUpiString(null);
  }

  // Shared QR + status panel content (used in both phone and tablet)
  const qrSize = isTablet ? 260 : 220;

  const QRPanel = () => (
    <>
      {state === STATE.CREATING_QR && (
        <View style={styles.centeredCard}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.statusTitle}>Creating payment QR…</Text>
          <Text style={styles.statusHint}>Connecting to Razorpay</Text>
        </View>
      )}

      {state === STATE.AWAITING && Platform.OS === 'web' && (
        <View style={styles.centeredCard}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.statusTitle}>Complete payment in the popup</Text>
          <Text style={styles.statusHint}>
            Amount: {formatCurrency(total)}{'\n'}Order: {orderId}
          </Text>
        </View>
      )}

      {state === STATE.AWAITING && Platform.OS !== 'web' && (
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>Scan & Pay</Text>
          <Text style={styles.qrAmount}>{formatCurrency(total)}</Text>
          <Text style={styles.qrHint}>Ask the customer to scan using any UPI app</Text>
          <QRCodeDisplay imageUrl={qrImageUrl} upiString={qrUpiString} size={qrSize} />
          <Text style={styles.orderId}>Order ID: {orderId}</Text>
          <View style={styles.waitingRow}>
            <ActivityIndicator size="small" color="#f97316" />
            <Text style={styles.waitingText}>Waiting for payment confirmation…</Text>
          </View>
          <Text style={styles.autoHint}>
            {qrId
              ? 'Screen updates automatically when Razorpay confirms payment.'
              : 'On device, Razorpay confirms automatically.'}
          </Text>
        </View>
      )}

      {state === STATE.CONFIRMED && (
        <View style={styles.successCard}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>Payment Confirmed!</Text>
          <Text style={styles.successOrderId}>Order: {orderId}</Text>
          <Text style={styles.successAmount}>{formatCurrency(total)}</Text>
          {capturedPayment?.id && (
            <Text style={styles.paymentRef}>Ref: {capturedPayment.id}</Text>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, styles.printBtn]}
            onPress={handlePrintBill}
            disabled={printing}
          >
            {printing ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>🖨️  Print Bill</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.newOrderBtn]} onPress={handleNewOrder}>
            <Text style={[styles.actionBtnText, { color: '#f97316' }]}>+ New Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {state === STATE.ERROR && (
        <View style={styles.centeredCard}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.statusTitle}>QR Creation Failed</Text>
          <Text style={styles.statusHint}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {state === STATE.AWAITING || state === STATE.CREATING_QR ? (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 60 }} />
      </View>

      {isTablet ? (
        // Tablet: order summary left, QR right — side by side
        <View style={styles.tabletBody}>
          <ScrollView style={styles.tabletLeft} contentContainerStyle={styles.tabletLeftContent}>
            <OrderSummary items={items} subtotal={subtotal} tax={tax} total={total} orderId={orderId} />
          </ScrollView>
          <ScrollView style={styles.tabletRight} contentContainerStyle={styles.tabletRightContent}>
            <QRPanel />
          </ScrollView>
        </View>
      ) : (
        // Phone: stacked
        <ScrollView contentContainerStyle={styles.content}>
          <OrderSummary items={items} subtotal={subtotal} tax={tax} total={total} orderId={orderId} />
          <QRPanel />
        </ScrollView>
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
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: THEME.gold, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.gold },
  content: { padding: 16, paddingBottom: 40 },
  tabletBody: { flex: 1, flexDirection: 'row' },
  tabletLeft: { flex: 1, borderRightWidth: 1, borderRightColor: THEME.goldBorder },
  tabletLeftContent: { padding: 24, paddingBottom: 40 },
  tabletRight: { flex: 1 },
  tabletRightContent: { padding: 24, paddingBottom: 40, alignItems: 'center' },

  centeredCard: {
    backgroundColor: THEME.white, borderRadius: 20, padding: 36, alignItems: 'center', marginTop: 12,
    shadowColor: THEME.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: THEME.goldBorder,
  },
  statusTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.navy, marginTop: 16 },
  statusHint: { fontSize: 13, color: THEME.slate, marginTop: 8, textAlign: 'center' },
  errorEmoji: { fontSize: 48 },
  retryBtn: { marginTop: 20, backgroundColor: THEME.gold, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: THEME.navy, fontWeight: 'bold', fontSize: 15 },

  qrSection: { alignItems: 'center', marginTop: 8 },
  qrTitle: { fontSize: 22, fontWeight: 'bold', color: THEME.navy, marginBottom: 4 },
  qrAmount: { fontSize: 32, fontWeight: 'bold', color: THEME.gold, marginBottom: 8 },
  qrHint: { fontSize: 13, color: THEME.slate, textAlign: 'center', marginBottom: 20, paddingHorizontal: 20 },
  orderId: { fontSize: 12, color: THEME.slateLight, marginTop: 14, marginBottom: 8 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 8 },
  waitingText: { fontSize: 13, color: THEME.gold, fontWeight: '600' },
  autoHint: { fontSize: 11, color: THEME.slateLight, textAlign: 'center', paddingHorizontal: 30, lineHeight: 16, marginTop: 4 },

  successCard: {
    backgroundColor: THEME.white, borderRadius: 20, padding: 28, alignItems: 'center', marginTop: 12,
    shadowColor: THEME.gold, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 4,
    borderWidth: 1, borderColor: THEME.goldBorder,
  },
  successEmoji: { fontSize: 64, marginBottom: 12 },
  successTitle: { fontSize: 24, fontWeight: 'bold', color: '#22c55e', marginBottom: 6 },
  successOrderId: { fontSize: 13, color: THEME.slateLight, marginBottom: 4 },
  successAmount: { fontSize: 28, fontWeight: 'bold', color: THEME.navy, marginBottom: 6 },
  paymentRef: { fontSize: 11, color: THEME.slateLight, marginBottom: 20 },
  actionBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 12 },
  printBtn: { backgroundColor: THEME.gold },
  newOrderBtn: { backgroundColor: THEME.white, borderWidth: 2, borderColor: THEME.gold },
  actionBtnText: { fontSize: 16, fontWeight: 'bold', color: THEME.navy },
});
