import * as Print from 'expo-print';
import { RESTAURANT_NAME, RESTAURANT_ADDRESS, RESTAURANT_PHONE, RESTAURANT_GSTIN } from '../constants';
import { formatDateTime } from './razorpay';

export async function printBill({ orderId, items, subtotal, tax, total, employeeName, paymentMode = 'UPI' }) {
  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">₹${item.price.toFixed(2)}</td>
        <td style="text-align:right">₹${(item.price * item.qty).toFixed(2)}</td>
      </tr>`
    )
    .join('');

  const gstRow = RESTAURANT_GSTIN
    ? `<tr><td colspan="3">GST (5%)</td><td style="text-align:right">₹${tax.toFixed(2)}</td></tr>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 13px; width: 300px; padding: 10px; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .big { font-size: 18px; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    th { border-bottom: 1px solid #000; padding: 3px 0; }
    td { padding: 3px 0; }
    .total-row td { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; }
    .footer { margin-top: 10px; font-size: 11px; text-align: center; }
  </style>
</head>
<body>
  <div class="center bold big">${RESTAURANT_NAME}</div>
  <div class="center">${RESTAURANT_ADDRESS}</div>
  <div class="center">Tel: ${RESTAURANT_PHONE}</div>
  ${RESTAURANT_GSTIN ? `<div class="center">GSTIN: ${RESTAURANT_GSTIN}</div>` : ''}
  <div class="divider"></div>
  <div>Bill No: ${orderId}</div>
  <div>Date: ${formatDateTime()}</div>
  <div>Served by: ${employeeName}</div>
  <div>Payment: ${paymentMode}</div>
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th style="text-align:left">Item</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Rate</th>
        <th style="text-align:right">Amt</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
    <tfoot>
      <tr><td colspan="3">Subtotal</td><td style="text-align:right">₹${subtotal.toFixed(2)}</td></tr>
      ${gstRow}
      <tr class="total-row"><td colspan="3">TOTAL</td><td style="text-align:right">₹${total.toFixed(2)}</td></tr>
    </tfoot>
  </table>
  <div class="divider"></div>
  <div class="footer">
    <div>** PAYMENT RECEIVED **</div>
    <div>Thank you for dining with us!</div>
    <div>Please visit again.</div>
  </div>
</body>
</html>`;

  await Print.printAsync({ html });
}
