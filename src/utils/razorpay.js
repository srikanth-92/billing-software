import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RESTAURANT_NAME } from '../constants';

const BASE = 'https://api.razorpay.com/v1';

// Basic auth header using Key ID + Secret
function authHeader() {
  const creds = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
  return { Authorization: `Basic ${creds}`, 'Content-Type': 'application/json' };
}

/**
 * Creates a Razorpay Order (required before opening Checkout.js).
 * Returns the full order object including { id, amount, currency }.
 */
export async function createRazorpayOrder({ amountRupees, orderId }) {
  const res = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify({
      amount: Math.round(amountRupees * 100),
      currency: 'INR',
      receipt: orderId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.description || `Razorpay error ${res.status}`);
  }
  return res.json();
}

let _rzpInstance = null;

/**
 * Loads checkout.js (if not already loaded) then opens the Razorpay payment modal.
 * Web-only. Resolves with the payment response on success, rejects on dismiss/error.
 */
export function openRazorpayCheckout({ razorpayOrderId, amountRupees, orderId, prefill = {}, callbackUrl = null }) {
  return new Promise((resolve, reject) => {
    function launch() {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: Math.round(amountRupees * 100),
        currency: 'INR',
        name: RESTAURANT_NAME,
        description: `Order ${orderId}`,
        ...(razorpayOrderId ? { order_id: razorpayOrderId } : {}),
        prefill,
        theme: { color: '#c9a840' },
        handler: resolve,
        modal: { ondismiss: () => reject(new Error('dismissed')) },
        ...(callbackUrl ? { callback_url: callbackUrl, redirect: true } : {}),
      };
      _rzpInstance = new window.Razorpay(options);
      _rzpInstance.open();
    }

    if (window.Razorpay) {
      launch();
    } else {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = launch;
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
      document.head.appendChild(script);
    }
  });
}

/** Close the Razorpay modal programmatically. */
export function closeRazorpayCheckout() {
  try { _rzpInstance?.close(); } catch {}
  _rzpInstance = null;
}

/**
 * Fetch a Razorpay Order by ID and return its status.
 * Returns 'paid' once payment is captured.
 */
export async function fetchRazorpayOrderStatus(razorpayOrderId) {
  try {
    const res = await fetch(`${BASE}/orders/${razorpayOrderId}`, { headers: authHeader() });
    if (!res.ok) return null;
    const data = await res.json();
    return data.status; // 'created' | 'attempted' | 'paid'
  } catch {
    return null;
  }
}

/**
 * Creates a Razorpay QR Code for the given amount.
 * Returns { id, image_url } from Razorpay's response.
 * Razorpay amount is in paise (1 INR = 100 paise).
 */
export async function createRazorpayQR({ amountRupees, orderId, description }) {
  const body = {
    type: 'upi_qr',
    name: description,
    usage: 'single_use',
    fixed_amount: true,
    payment_amount: Math.round(amountRupees * 100), // paise
    description,
    close_by: Math.floor(Date.now() / 1000) + 600, // expires in 10 min
  };

  const res = await fetch(`${BASE}/payments/qr-codes`, {
    method: 'POST',
    headers: authHeader(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.description || `Razorpay error ${res.status}`);
  }

  const data = await res.json();
  // data.id        — QR Code ID (qr_XXXXXX)
  // data.image_url — hosted PNG to display
  return { qrId: data.id, imageUrl: data.image_url };
}

/**
 * Polls the payments made against a QR Code.
 * Returns the captured payment object if found, otherwise null.
 */
export async function fetchQRPayments(qrId) {
  const res = await fetch(`${BASE}/payments/qr-codes/${qrId}/payments`, {
    headers: authHeader(),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const payments = data.items || [];
  // A payment is confirmed when its status is 'captured'
  return payments.find((p) => p.status === 'captured') || null;
}

// Builds a UPI deep-link string for local QR generation (fallback when Razorpay API is CORS-blocked in browser)
export function buildUpiString({ amountRupees, orderId, restaurantName, vpa = 'myrestaurant@razorpay' }) {
  return `upi://pay?pa=${vpa}&pn=${encodeURIComponent(restaurantName)}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(`Order ${orderId}`)}&tr=${orderId}`;
}

export function generateOrderId() {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${ts}${rand}`;
}

export function formatCurrency(amount) {
  return `₹${amount.toFixed(2)}`;
}

export function formatDateTime(date = new Date()) {
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
