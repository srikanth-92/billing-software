'use strict';

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret, defineString } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');

const WHATSAPP_ACCESS_TOKEN = defineSecret('WHATSAPP_ACCESS_TOKEN');
const WHATSAPP_PHONE_NUMBER_ID = defineString('WHATSAPP_PHONE_NUMBER_ID');
const WHATSAPP_RECIPIENT_NUMBER = defineString('WHATSAPP_RECIPIENT_NUMBER');

function formatCurrency(n) {
  return `₹${Number(n).toFixed(2)}`;
}

function formatDateTime(date) {
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

function buildSaleMessage(sale) {
  const lines = (sale.items || []).map(
    (i) => `• ${i.name} ×${i.qty} — ${formatCurrency(i.price * i.qty)}`
  );
  return [
    `🧾 *Sale Logged — ${String(sale.cartId).toUpperCase()}*`,
    `By: ${sale.employeeName}`,
    `Time: ${formatDateTime(new Date(sale.loggedAt))}`,
    '',
    ...lines,
    '',
    `*Total: ${formatCurrency(sale.totalAmount)}*`,
  ].join('\n');
}

// Fires whenever a cart logs a sale (dailySales/{saleId} created) and relays it to the
// owner's WhatsApp via the Meta Cloud API — staff never see or send from this number.
exports.sendSaleWhatsApp = onDocumentCreated(
  {
    document: 'dailySales/{saleId}',
    region: 'asia-south1',
    secrets: [WHATSAPP_ACCESS_TOKEN],
  },
  async (event) => {
    const sale = event.data?.data();
    if (!sale) return;

    const phoneNumberId = WHATSAPP_PHONE_NUMBER_ID.value();
    const recipient = WHATSAPP_RECIPIENT_NUMBER.value();
    if (!phoneNumberId || !recipient) {
      logger.error('WhatsApp not configured: missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_RECIPIENT_NUMBER');
      return;
    }

    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN.value()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'text',
        text: { body: buildSaleMessage(sale) },
      }),
    });

    if (!res.ok) {
      logger.error('WhatsApp send failed', { status: res.status, body: await res.text() });
    } else {
      logger.info('WhatsApp sale notification sent', { saleId: event.params.saleId });
    }
  }
);
