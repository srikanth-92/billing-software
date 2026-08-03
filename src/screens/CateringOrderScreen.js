import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Platform, Linking, Modal,
  KeyboardAvoidingView, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { THEME } from '../constants/theme';
import { openRazorpayCheckout, generateOrderId } from '../utils/razorpay';

const CATERING_PHONE_1 = '9187575078';
const CATERING_ADDRESS = 'Whitefield, Bangalore - 560 067';

const PACKAGES = [
  // ── Vegetarian ──────────────────────────────────────────────
  {
    id: 'choice1',
    label: 'Classic',
    price: 450,
    category: 'veg',
    tagColor: '#16a34a',
    tagBg: '#f0fdf4',
    includes: [
      { label: 'Welcome Drink', qty: 'any one' },
      { label: 'Soup', qty: 'any one' },
      { label: 'Veg Starter', qty: 'any one' },
      { label: 'Paneer Gravy', qty: 'any one' },
      { label: 'Dry Sabzi', qty: 'any one' },
      { label: 'Dal', qty: 'any one' },
      { label: 'Breads', qty: 'any two' },
      { label: 'Rice / Biryani', qty: 'any one' },
      { label: 'Salad', qty: 'any two' },
      { label: 'Sweets', qty: 'any one' },
      { label: 'Ice Cream', qty: 'any one' },
      { label: 'Accompaniments', qty: 'Pappad, Pickle, Raitha & Plain Curd' },
      { label: 'Water Bottle', qty: '200 ml per head' },
    ],
  },
  {
    id: 'choice2',
    label: 'Grand',
    price: 550,
    category: 'veg',
    tagColor: '#b45309',
    tagBg: '#fffbeb',
    includes: [
      { label: 'Welcome Drink', qty: 'any one' },
      { label: 'Soup', qty: 'any two' },
      { label: 'Veg Starter', qty: 'any one' },
      { label: 'Paneer Gravy', qty: 'any one' },
      { label: 'Dry Sabzi', qty: 'any one' },
      { label: 'Dal', qty: 'any one' },
      { label: 'Continental', qty: 'any one' },
      { label: 'Breads', qty: 'any two' },
      { label: 'Rice / Biryani', qty: 'any one' },
      { label: 'Salad', qty: 'any three' },
      { label: 'Sweets', qty: 'any two' },
      { label: 'Ice Cream', qty: 'any one' },
      { label: 'Accompaniments', qty: 'Pappad, Pickle, Raitha & Plain Curd' },
      { label: 'Water Bottle', qty: '200 ml per head' },
    ],
  },
  {
    id: 'choice3',
    label: 'Royal',
    price: 650,
    category: 'veg',
    tagColor: '#7c3aed',
    tagBg: '#f5f3ff',
    includes: [
      { label: 'Welcome Drink', qty: 'any one' },
      { label: 'Soup', qty: 'any two' },
      { label: 'Veg Starter', qty: 'any two' },
      { label: 'Paneer Gravy', qty: 'any two' },
      { label: 'Dry Sabzi', qty: 'any one' },
      { label: 'Dal', qty: 'any one' },
      { label: 'Continental', qty: 'any one' },
      { label: 'Chinese', qty: 'any one' },
      { label: 'Breads', qty: 'any three' },
      { label: 'Rice / Biryani', qty: 'any two' },
      { label: 'Salad', qty: 'any three' },
      { label: 'Sweets', qty: 'any two' },
      { label: 'Ice Cream', qty: 'any two' },
      { label: 'Live Counter', qty: 'any one' },
      { label: 'Accompaniments', qty: 'Pappad, Pickle, Raitha & Plain Curd' },
      { label: 'Water Bottle', qty: '200 ml per head' },
    ],
  },
  // ── Non-Vegetarian (₹50 extra per tier) ─────────────────────
  {
    id: 'nv1',
    label: 'Classic',
    price: 500,
    category: 'nonveg',
    tagColor: '#16a34a',
    tagBg: '#f0fdf4',
    includes: [
      { label: 'Welcome Drink', qty: 'any one' },
      { label: 'Soup', qty: 'any one' },
      { label: 'Veg Starter', qty: 'any one' },
      { label: 'Chicken Gravy', qty: 'any one' },
      { label: 'Dry Sabzi', qty: 'any one' },
      { label: 'Dal', qty: 'any one' },
      { label: 'Breads', qty: 'any two' },
      { label: 'Rice / Biryani', qty: 'any one' },
      { label: 'Salad', qty: 'any two' },
      { label: 'Sweets', qty: 'any one' },
      { label: 'Ice Cream', qty: 'any one' },
      { label: 'Accompaniments', qty: 'Pappad, Pickle, Raitha & Plain Curd' },
      { label: 'Water Bottle', qty: '200 ml per head' },
    ],
  },
  {
    id: 'nv2',
    label: 'Grand',
    price: 600,
    category: 'nonveg',
    tagColor: '#b45309',
    tagBg: '#fffbeb',
    includes: [
      { label: 'Welcome Drink', qty: 'any one' },
      { label: 'Soup', qty: 'any two' },
      { label: 'Veg Starter', qty: 'any one' },
      { label: 'Chicken Gravy', qty: 'any one' },
      { label: 'Paneer Gravy', qty: 'any one' },
      { label: 'Dry Sabzi', qty: 'any one' },
      { label: 'Dal', qty: 'any one' },
      { label: 'Continental', qty: 'any one' },
      { label: 'Breads', qty: 'any two' },
      { label: 'Rice / Biryani', qty: 'any one' },
      { label: 'Salad', qty: 'any three' },
      { label: 'Sweets', qty: 'any two' },
      { label: 'Ice Cream', qty: 'any one' },
      { label: 'Accompaniments', qty: 'Pappad, Pickle, Raitha & Plain Curd' },
      { label: 'Water Bottle', qty: '200 ml per head' },
    ],
  },
  {
    id: 'nv3',
    label: 'Royal',
    price: 700,
    category: 'nonveg',
    tagColor: '#7c3aed',
    tagBg: '#f5f3ff',
    includes: [
      { label: 'Welcome Drink', qty: 'any one' },
      { label: 'Soup', qty: 'any two' },
      { label: 'Veg Starter', qty: 'any two' },
      { label: 'Chicken Gravy', qty: 'any two' },
      { label: 'Paneer Gravy', qty: 'any one' },
      { label: 'Dry Sabzi', qty: 'any one' },
      { label: 'Dal', qty: 'any one' },
      { label: 'Continental', qty: 'any one' },
      { label: 'Chinese', qty: 'any one' },
      { label: 'Breads', qty: 'any three' },
      { label: 'Rice / Biryani', qty: 'any two' },
      { label: 'Salad', qty: 'any three' },
      { label: 'Sweets', qty: 'any two' },
      { label: 'Ice Cream', qty: 'any two' },
      { label: 'Live Counter', qty: 'any one' },
      { label: 'Accompaniments', qty: 'Pappad, Pickle, Raitha & Plain Curd' },
      { label: 'Water Bottle', qty: '200 ml per head' },
    ],
  },
];

const MENU_SECTIONS = [
  {
    title: 'Welcome Drink',
    emoji: '🥤',
    items: [
      'Classic Mint Mojito', 'Watermelon Mojito', 'Green Apple Mojito',
      'Blue Lagoon Mojito', 'Strawberry Mojito', 'Orange Mojito',
      'Litchi Mojito', 'Pineapple Mojito',
    ],
  },
  {
    title: 'Soup',
    emoji: '🍜',
    items: [
      'Tomato Soup', 'Sweet Corn Soup', 'Hot & Sour Soup',
      'Veg Clear Soup', 'Manchow Soup',
    ],
  },
  {
    title: 'Veg Starters',
    emoji: '🥙',
    items: [
      'Hara Bhara Kabab', 'Aloo Tikki',
      'Kachori', 'Samosa', 'Dahi Puri',
    ],
  },
  {
    title: 'Paneer Gravy',
    emoji: '🧀',
    items: [
      'Paneer Butter Masala', 'Palak Paneer', 'Kadai Paneer',
      'Shahi Paneer', 'Matar Paneer', 'Paneer Do Pyaza',
      'Paneer Makhani', 'Paneer Korma', 'Paneer Kofta',
      'Methi Malai Paneer', 'Achari Paneer', 'Paneer Lababdar',
      'Paneer Pasanda', 'Paneer Hara Masala', 'Paneer Jalfrezi',
    ],
  },
  {
    title: 'Chicken Gravy',
    emoji: '🍗',
    items: [
      'Butter Chicken', 'Chicken Curry', 'Kadai Chicken',
      'Chicken Masala', 'Chicken Do Pyaza', 'Chicken Korma',
      'Chicken Kofta', 'Achari Chicken',
      'Chicken Lababdar', 'Chicken Jalfrezi',
    ],
  },
  {
    title: 'Dry Sabzi',
    emoji: '🥬',
    items: [
      'Aloo Jeera', 'Aloo Gobhi', 'Bhindi Masala',
      'Gobhi Masala', 'Aloo Matar', 'Mix Veg', 'Jeera Aloo',
    ],
  },
  {
    title: 'Continental',
    emoji: '🥪',
    items: [
      'Veg Sandwich', 'Grilled Cheese Sandwich', 'Veg Club Sandwich',
      'Veg Burger', 'Cheese Burst Burger', 'Veg Wrap / Frankie',
      'Arrabbiata Pasta', 'Alfredo Pasta', 'Pesto Pasta',
    ],
  },
  {
    title: 'Chinese',
    emoji: '🥡',
    items: [
      'Veg Spring Rolls', 'Veg Momos', 'Fried Momos',
      'Crispy Corn', 'Chilli Potato', 'Veg Lollipop',
      'Gobi Manchurian', 'Baby Corn Chilli', 'Veg Manchurian',
      'Veg Manchurian Gravy', 'Gobi Manchurian Gravy',
      'Baby Corn Schezwan', 'Veg in Chilli Garlic Sauce',
      'Veg Sweet & Sour', 'Veg Hakka Noodles', 'Schezwan Noodles',
      'Singapore Noodles', 'Veg Fried Rice', 'Schezwan Fried Rice',
    ],
  },
  {
    title: 'Dal',
    emoji: '🫕',
    items: [
      'Dal Tadka', 'Dal Fry', 'Dal Makhani',
      'Panchmel Dal', 'Lasooni Dal', 'Chana Masala',
      'Chole', 'Rajma Masala',
    ],
  },
  {
    title: 'Rice & Biryani',
    emoji: '🍚',
    items: [
      'Steamed Rice', 'Jeera Rice', 'Matar Pulao',
      'Veg Pulao', 'Kashmiri Pulao', 'Veg Biryani',
      'Veg Fried Rice', 'Schezwan Fried Rice',
    ],
  },
  {
    title: 'Breads  (tandoor +₹20/plate)',
    emoji: '🫓',
    items: [
      'Roti / Fulka', 'Wheat Paratha', 'Puri', 'Bhature',
      'Tandoori Roti', 'Butter Naan', 'Garlic Naan',
      'Laccha Paratha', 'Missi Roti',
    ],
  },
  {
    title: 'Salad & Raita',
    emoji: '🥗',
    items: [
      'Boondi Raita', 'Cucumber Raita', 'Mixed Raita',
      'Onion Salad', 'Green Salad', 'Papad Fry',
    ],
  },
  {
    title: 'Sweets',
    emoji: '🍮',
    items: ['Gulab Jamun', 'Rasgulla', 'Kheer', 'Jalebi'],
  },
  {
    title: 'Ice Cream',
    emoji: '🍦',
    items: [
      'Vanilla', 'Strawberry', 'Butterscotch',
    ],
  },
  {
    title: 'Live Chaat  (₹50/plate · any 2)',
    emoji: '🍡',
    items: [
      'Pani Puri', 'Bhel Puri', 'Sev Puri',
      'Dahi Puri', 'Papdi Chaat', 'Aloo Tikki Chaat',
    ],
  },
];

const SERVICES = [
  'Wedding', 'Anniversary', 'Birthday', 'Kitty Parties',
  'Farewell', 'Banquet', 'Showers', 'Corporate Conference',
  'Get Together', 'Family Get Together', 'Outdoor Catering',
];

function callPhone(number) {
  const url = `tel:${number}`;
  if (Platform.OS === 'web') {
    window.open(url, '_self');
  } else {
    Linking.openURL(url);
  }
}

function padRef(n) {
  return String(n).padStart(4, '0');
}

let _refCounter = Math.floor(Math.random() * 1000) + 100;
function nextRef() { return padRef(++_refCounter); }

function printConfirmation(data) {
  const {
    refNo, clientName, clientPhone, eventType, eventDate,
    guestCount, venueAddress, venueContact, venueContactPhone,
    setupTime, serviceStart, serviceEnd, serviceStyle,
    menuChoices, pkg, advancePaid, advanceDate, balanceDueDate,
  } = data;

  const guests = parseInt(guestCount, 10) || 0;
  const pricePerPlate = pkg ? pkg.price : 0;
  const subtotal = guests * pricePerPlate;
  const cgst = Math.round(subtotal * 0.025 * 100) / 100;
  const sgst = Math.round(subtotal * 0.025 * 100) / 100;
  const total = subtotal + cgst + sgst;
  const advance = Math.round(total * 0.20);
  const balance = total - advance;

  const specialRequest = menuChoices['__special__'] || '';
  const menuRows = pkg
    ? [
        ...pkg.includes.map((inc) => {
          const val = menuChoices[inc.label];
          const display = Array.isArray(val) && val.length ? val.join(', ') : inc.qty;
          return `<tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">${inc.label}</td><td style="padding:6px 10px;border:1px solid #e8d78a;color:#334155">${display}</td></tr>`;
        }),
        specialRequest ? `<tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#7c3aed">Special Requests</td><td style="padding:6px 10px;border:1px solid #e8d78a;color:#334155">${specialRequest}</td></tr>` : '',
      ].join('')
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Catering Order Confirmation — Buffet on Wheels</title>
<style>
  body { font-family: Georgia, serif; color: #1e293b; background: #fff; margin: 0; padding: 0; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px 48px; }
  .letterhead { border-bottom: 3px solid #c9a840; padding-bottom: 16px; margin-bottom: 24px; display:flex; justify-content:space-between; align-items:flex-end; }
  .lh-name { font-size: 28px; font-weight: bold; color: #0f2340; letter-spacing:1px; }
  .lh-sub  { font-size: 13px; color: #64748b; margin-top:3px; }
  .lh-contact { text-align:right; font-size:12px; color:#64748b; line-height:1.7; }
  .doc-title { font-size:20px; font-weight:bold; color:#0f2340; margin-bottom:4px; }
  .doc-meta  { font-size:13px; color:#64748b; margin-bottom:24px; }
  .dear { font-size:14px; margin-bottom:20px; line-height:1.7; }
  .section-title { font-size:15px; font-weight:bold; color:#0f2340; margin:24px 0 10px; border-left:4px solid #c9a840; padding-left:10px; }
  table { width:100%; border-collapse:collapse; margin-bottom:8px; }
  th { background:#0f2340; color:#c9a840; padding:8px 10px; text-align:left; font-size:13px; }
  td { font-size:13px; }
  .fin-label { font-weight:600; color:#0f2340; }
  .fin-val { text-align:right; color:#1e293b; }
  .total-row td { font-weight:bold; color:#0f2340; background:#fdf6dc; }
  .balance-row td { font-weight:bold; color:#c9a840; background:#0f2340; }
  .terms { background:#f8fafc; border:1px solid #e8d78a; border-radius:8px; padding:14px 18px; margin:20px 0; font-size:12px; line-height:1.9; color:#334155; }
  .signoff { margin-top:28px; font-size:14px; line-height:2; }
  .sign-block { margin-top:32px; border-top:1px solid #e2e8f0; padding-top:20px; display:flex; justify-content:space-between; }
  .sign-col { width:45%; font-size:12px; color:#64748b; }
  .sign-line { border-bottom:1px solid #94a3b8; margin:20px 0 6px; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="page">

  <!-- Letterhead -->
  <div class="letterhead">
    <div>
      <div class="lh-name">Buffet on Wheels</div>
      <div class="lh-sub">Multicuisine Catering &amp; Banquet Services</div>
      <div class="lh-sub" style="margin-top:4px">${CATERING_ADDRESS}</div>
    </div>
    <div class="lh-contact">
      📞 ${CATERING_PHONE_1}
    </div>
  </div>

  <!-- Title -->
  <div class="doc-title">Catering Order Confirmation</div>
  <div class="doc-meta">Date: ${new Date().toLocaleDateString('en-IN')} &nbsp;|&nbsp; Order Reference: #${refNo}</div>

  <div class="dear">
    Dear <strong>${clientName}</strong>,<br/><br/>
    Thank you for choosing <strong>Buffet on Wheels</strong> for your upcoming event. We are delighted to confirm the details of your catering order. Please review the summary below to ensure everything is correct.
  </div>

  <!-- Event Overview -->
  <div class="section-title">📅 Event Overview</div>
  <table>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;width:40%;font-weight:600;color:#0f2340">Event Type</td><td style="padding:6px 10px;border:1px solid #e8d78a">${eventType}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Date of Event</td><td style="padding:6px 10px;border:1px solid #e8d78a">${eventDate}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Guest Count</td><td style="padding:6px 10px;border:1px solid #e8d78a">${guestCount} pax (guaranteed minimum)</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Venue Address</td><td style="padding:6px 10px;border:1px solid #e8d78a">${venueAddress}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Point of Contact at Venue</td><td style="padding:6px 10px;border:1px solid #e8d78a">${venueContact}${venueContactPhone ? ' — ' + venueContactPhone : ''}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Client Phone</td><td style="padding:6px 10px;border:1px solid #e8d78a">+91 ${clientPhone}</td></tr>
  </table>

  <!-- Service Timeline -->
  <div class="section-title">⏰ Service Timeline</div>
  <table>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;width:40%;font-weight:600;color:#0f2340">Setup Team Arrival</td><td style="padding:6px 10px;border:1px solid #e8d78a">${setupTime}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Service Start Time</td><td style="padding:6px 10px;border:1px solid #e8d78a">${serviceStart}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Service End Time</td><td style="padding:6px 10px;border:1px solid #e8d78a">${serviceEnd}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Style of Service</td><td style="padding:6px 10px;border:1px solid #e8d78a">${serviceStyle}</td></tr>
  </table>

  <!-- Menu -->
  <div class="section-title">🍽️ Confirmed Menu — ${pkg ? pkg.label + ' (₹' + pkg.price + '+Tax/person)' : 'Custom'}</div>
  <table>
    <tr><th>Category</th><th>Items / Details</th></tr>
    ${menuRows}
  </table>

  <!-- Financial Summary -->
  <div class="section-title">💰 Financial Summary</div>
  <table>
    <tr><th>Particulars</th><th style="text-align:right">Amount (INR)</th></tr>
    <tr><td class="fin-label" style="padding:7px 10px;border:1px solid #e8d78a">Cost per Plate: ₹${pricePerPlate} × ${guests} pax</td><td class="fin-val" style="padding:7px 10px;border:1px solid #e8d78a">₹${subtotal.toLocaleString('en-IN')}</td></tr>
    <tr><td style="padding:7px 10px;border:1px solid #e8d78a;color:#64748b">CGST (@2.5%)</td><td class="fin-val" style="padding:7px 10px;border:1px solid #e8d78a;color:#64748b">₹${cgst.toLocaleString('en-IN')}</td></tr>
    <tr><td style="padding:7px 10px;border:1px solid #e8d78a;color:#64748b">SGST (@2.5%)</td><td class="fin-val" style="padding:7px 10px;border:1px solid #e8d78a;color:#64748b">₹${sgst.toLocaleString('en-IN')}</td></tr>
    <tr class="total-row"><td style="padding:7px 10px;border:1px solid #c9a840">Total Invoice Value</td><td style="padding:7px 10px;border:1px solid #c9a840;text-align:right">₹${total.toLocaleString('en-IN')}</td></tr>
    <tr><td style="padding:7px 10px;border:1px solid #e8d78a;color:#16a34a">Advance Required (20%)</td><td style="padding:7px 10px;border:1px solid #e8d78a;text-align:right;color:#16a34a">₹${advance.toLocaleString('en-IN')}</td></tr>
    <tr class="balance-row"><td style="padding:7px 10px;border:1px solid #c9a840">Balance — After Event Completion</td><td style="padding:7px 10px;border:1px solid #c9a840;text-align:right">₹${balance.toLocaleString('en-IN')}</td></tr>
  </table>
  ${balanceDueDate ? `<p style="font-size:13px;color:#0f2340;margin-top:8px"><strong>Payment Terms:</strong> The remaining balance of ₹${balance.toLocaleString('en-IN')} is to be cleared on or before <strong>${balanceDueDate}</strong> via Bank Transfer / UPI / Cash.</p>` : ''}

  <!-- T&C -->
  <div class="section-title">📋 Terms &amp; Conditions</div>
  <div class="terms">
    • <strong>Guest Count:</strong> Final billing based on guaranteed minimum or actual plate count, whichever is higher.<br/>
    • <strong>Extra Plates:</strong> Any plates beyond guaranteed count charged at ₹${pricePerPlate}+GST per plate.<br/>
    • <strong>Food Safety:</strong> Leftover food will not be packed or taken outside unless agreed in writing.<br/>
    • <strong>Power &amp; Water:</strong> Client/venue must provide running water and adequate power supply.<br/>
    • <strong>Decoration:</strong> Not included in the package.<br/>
    • <strong>Advance:</strong> 20% advance required; balance on or before event day.
  </div>

  <!-- Sign-off -->
  <div class="signoff">
    If you find all details satisfactory, please reply with <strong>"CONFIRMED"</strong> or sign and return a copy.<br/><br/>
    We look forward to making your event a grand success!<br/><br/>
    Warm regards,<br/>
    <strong>Buffet on Wheels</strong><br/>
    📞 ${CATERING_PHONE_1}
  </div>

  <!-- Sign-off block -->
  <div class="sign-block">
    <div class="sign-col">
      <strong>For Buffet on Wheels</strong>
      <div class="sign-line"></div>
      Srikanth V Parvatikar<br/>Authorised Signatory<br/>Date: _______________
    </div>
    <div class="sign-col">
      <strong>Client Acceptance</strong>
      <div class="sign-line"></div>
      Signature: _______________________<br/>Date: _______________
    </div>
  </div>

</div>
</body>
</html>`;

  if (Platform.OS === 'web') {
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  }
}

function downloadConfirmationPdf(data) {
  if (Platform.OS !== 'web') return;
  // Re-use the same html but inject html2pdf via CDN and auto-trigger download
  const { refNo, clientName } = data;
  const printData = { ...data };
  // Build the html string by calling printConfirmation in a hidden iframe-like approach
  // We'll open the same page and use html2pdf.js to download
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  script.onload = () => {
    printConfirmation(printData); // opens the print window
  };
  // Simpler approach: open print window with html2pdf auto-download injected
  const { clientPhone, eventType, eventDate, guestCount, venueAddress,
    venueContact, venueContactPhone, setupTime, serviceStart, serviceEnd,
    serviceStyle, menuChoices, pkg, advancePaid, advanceDate, balanceDueDate, paymentId } = data;

  const guests = parseInt(guestCount, 10) || 0;
  const pricePerPlate = pkg ? pkg.price : 0;
  const subtotal = guests * pricePerPlate;
  const cgst = Math.round(subtotal * 0.025 * 100) / 100;
  const sgst = Math.round(subtotal * 0.025 * 100) / 100;
  const total = subtotal + cgst + sgst;
  const advance = Math.round(total * 0.20);
  const balance = total - advance;

  const specialRequest = menuChoices['__special__'] || '';
  const menuRows = pkg
    ? [
        ...pkg.includes.map((inc) => {
          const val = menuChoices[inc.label];
          const display = Array.isArray(val) && val.length ? val.join(', ') : inc.qty;
          return `<tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">${inc.label}</td><td style="padding:6px 10px;border:1px solid #e8d78a;color:#334155">${display}</td></tr>`;
        }),
        specialRequest ? `<tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#7c3aed">Special Requests</td><td style="padding:6px 10px;border:1px solid #e8d78a;color:#334155">${specialRequest}</td></tr>` : '',
      ].join('')
    : '';

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Catering Order Confirmation — Buffet on Wheels</title>
<style>
  body { font-family: Georgia, serif; color: #1e293b; background: #fff; margin: 0; padding: 0; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px 48px; }
  .letterhead { border-bottom: 3px solid #c9a840; padding-bottom: 16px; margin-bottom: 24px; display:flex; justify-content:space-between; align-items:flex-end; }
  .lh-name { font-size: 28px; font-weight: bold; color: #0f2340; letter-spacing:1px; }
  .lh-sub  { font-size: 13px; color: #64748b; margin-top:3px; }
  .lh-contact { text-align:right; font-size:12px; color:#64748b; line-height:1.7; }
  .doc-title { font-size:20px; font-weight:bold; color:#0f2340; margin-bottom:4px; }
  .doc-meta  { font-size:13px; color:#64748b; margin-bottom:24px; }
  .dear { font-size:14px; margin-bottom:20px; line-height:1.7; }
  .section-title { font-size:15px; font-weight:bold; color:#0f2340; margin:24px 0 10px; border-left:4px solid #c9a840; padding-left:10px; }
  table { width:100%; border-collapse:collapse; margin-bottom:8px; }
  th { background:#0f2340; color:#c9a840; padding:8px 10px; text-align:left; font-size:13px; }
  td { font-size:13px; }
  .fin-label { font-weight:600; color:#0f2340; }
  .fin-val { text-align:right; color:#1e293b; }
  .total-row td { font-weight:bold; color:#0f2340; background:#fdf6dc; }
  .balance-row td { font-weight:bold; color:#c9a840; background:#0f2340; }
  .terms { background:#f8fafc; border:1px solid #e8d78a; border-radius:8px; padding:14px 18px; margin:20px 0; font-size:12px; line-height:1.9; color:#334155; }
  .signoff { margin-top:28px; font-size:14px; line-height:2; }
  .sign-block { margin-top:32px; border-top:1px solid #e2e8f0; padding-top:20px; display:flex; justify-content:space-between; }
  .sign-col { width:45%; font-size:12px; color:#64748b; }
  .sign-line { border-bottom:1px solid #94a3b8; margin:20px 0 6px; }
  .btn-row { display:flex; gap:12px; margin:20px 0 10px; }
  .btn { padding:10px 24px; border:none; border-radius:8px; font-size:14px; font-weight:bold; cursor:pointer; }
  .btn-print { background:#0f2340; color:#c9a840; }
  .btn-pdf { background:#c9a840; color:#0f2340; }
  @media print { .btn-row { display:none; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="btn-row">
    <button class="btn btn-print" onclick="window.print()">🖨️ Print</button>
    <button class="btn btn-pdf" onclick="downloadPdf()">⬇️ Download PDF</button>
  </div>

  <div class="letterhead">
    <div>
      <div class="lh-name">Buffet on Wheels</div>
      <div class="lh-sub">Multicuisine Catering &amp; Banquet Services</div>
      <div class="lh-sub" style="margin-top:4px">${CATERING_ADDRESS}</div>
    </div>
    <div class="lh-contact">📞 ${CATERING_PHONE_1}</div>
  </div>

  <div class="doc-title">Catering Order Confirmation</div>
  <div class="doc-meta">Date: ${new Date().toLocaleDateString('en-IN')} &nbsp;|&nbsp; Order Reference: #${refNo}${paymentId ? ' &nbsp;|&nbsp; Payment ID: ' + paymentId : ''}</div>

  <div class="dear">Dear <strong>${clientName}</strong>,<br/><br/>Thank you for choosing <strong>Buffet on Wheels</strong> for your upcoming event. We are delighted to confirm the details of your catering order.</div>

  <div class="section-title">📅 Event Overview</div>
  <table>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;width:40%;font-weight:600;color:#0f2340">Event Type</td><td style="padding:6px 10px;border:1px solid #e8d78a">${eventType}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Date of Event</td><td style="padding:6px 10px;border:1px solid #e8d78a">${eventDate}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Guest Count</td><td style="padding:6px 10px;border:1px solid #e8d78a">${guestCount} pax (guaranteed minimum)</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Client Phone</td><td style="padding:6px 10px;border:1px solid #e8d78a">+91 ${clientPhone}</td></tr>
  </table>

  <div class="section-title">🍽️ Confirmed Menu — ${pkg ? pkg.label + ' (₹' + pkg.price + '+Tax/person)' : 'Custom'}</div>
  <table><tr><th>Category</th><th>Items / Details</th></tr>${menuRows}</table>

  <div class="section-title">💰 Financial Summary</div>
  <table>
    <tr><th>Particulars</th><th style="text-align:right">Amount (INR)</th></tr>
    <tr><td class="fin-label" style="padding:7px 10px;border:1px solid #e8d78a">Cost per Plate: ₹${pricePerPlate} × ${guests} pax</td><td class="fin-val" style="padding:7px 10px;border:1px solid #e8d78a">₹${subtotal.toLocaleString('en-IN')}</td></tr>
    <tr><td style="padding:7px 10px;border:1px solid #e8d78a;color:#64748b">CGST (@2.5%)</td><td class="fin-val" style="padding:7px 10px;border:1px solid #e8d78a;color:#64748b">₹${cgst.toLocaleString('en-IN')}</td></tr>
    <tr><td style="padding:7px 10px;border:1px solid #e8d78a;color:#64748b">SGST (@2.5%)</td><td class="fin-val" style="padding:7px 10px;border:1px solid #e8d78a;color:#64748b">₹${sgst.toLocaleString('en-IN')}</td></tr>
    <tr class="total-row"><td style="padding:7px 10px;border:1px solid #c9a840">Total Invoice Value</td><td style="padding:7px 10px;border:1px solid #c9a840;text-align:right">₹${total.toLocaleString('en-IN')}</td></tr>
    <tr><td style="padding:7px 10px;border:1px solid #e8d78a;color:#16a34a">Advance Required (20%)${paymentId ? ' — Paid' : ''}</td><td style="padding:7px 10px;border:1px solid #e8d78a;text-align:right;color:#16a34a">₹${advance.toLocaleString('en-IN')}</td></tr>
    <tr class="balance-row"><td style="padding:7px 10px;border:1px solid #c9a840">Balance — After Event Completion</td><td style="padding:7px 10px;border:1px solid #c9a840;text-align:right">₹${balance.toLocaleString('en-IN')}</td></tr>
  </table>

  <div class="section-title">📋 Terms &amp; Conditions</div>
  <div class="terms">
    • <strong>Guest Count:</strong> Final billing based on guaranteed minimum or actual plate count, whichever is higher.<br/>
    • <strong>Extra Plates:</strong> Any plates beyond guaranteed count charged at ₹${pricePerPlate}+GST per plate.<br/>
    • <strong>Food Safety:</strong> Leftover food will not be packed or taken outside unless agreed in writing.<br/>
    • <strong>Power &amp; Water:</strong> Client/venue must provide running water and adequate power supply.<br/>
    • <strong>Decoration:</strong> Not included in the package.<br/>
    • <strong>Advance:</strong> 20% advance paid; balance after event completion.
  </div>

  <div class="signoff">
    Warm regards,<br/><strong>Buffet on Wheels</strong><br/>📞 ${CATERING_PHONE_1}
  </div>

  <div class="sign-block">
    <div class="sign-col">
      <strong>For Buffet on Wheels</strong>
      <div class="sign-line"></div>
      Srikanth V Parvatikar<br/>Authorised Signatory<br/>Date: _______________
    </div>
    <div class="sign-col">
      <strong>Client Acceptance</strong>
      <div class="sign-line"></div>
      Signature: _______________________<br/>Date: _______________
    </div>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script>
function downloadPdf() {
  var btn = document.querySelector('.btn-row');
  btn.style.display = 'none';
  html2pdf().set({
    margin: 10,
    filename: 'Buffet-on-Wheels-Confirmation-${refNo}.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(document.querySelector('.page')).save().then(function() {
    btn.style.display = 'flex';
  });
}
</script>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(htmlContent);
  win.document.close();
}

// Maps package include labels → MENU_SECTIONS items
const LABEL_TO_ITEMS = {
  'Welcome Drink':    MENU_SECTIONS.find((s) => s.title === 'Welcome Drink')?.items || [],
  'Soup':             MENU_SECTIONS.find((s) => s.title === 'Soup')?.items || [],
  'Veg Starter':      MENU_SECTIONS.find((s) => s.title === 'Veg Starters')?.items || [],
  'Paneer Gravy':     MENU_SECTIONS.find((s) => s.title === 'Paneer Gravy')?.items || [],
  'Chicken Gravy':    MENU_SECTIONS.find((s) => s.title === 'Chicken Gravy')?.items || [],
  'Dry Sabzi':        MENU_SECTIONS.find((s) => s.title === 'Dry Sabzi')?.items || [],
  'Dal':              MENU_SECTIONS.find((s) => s.title === 'Dal')?.items || [],
  'Continental':      MENU_SECTIONS.find((s) => s.title === 'Continental')?.items || [],
  'Chinese':          MENU_SECTIONS.find((s) => s.title === 'Chinese')?.items || [],
  'Breads':           MENU_SECTIONS.find((s) => s.title === 'Breads  (tandoor +₹20/plate)')?.items || [],
  'Rice / Biryani':   MENU_SECTIONS.find((s) => s.title === 'Rice & Biryani')?.items || [],
  'Salad':            MENU_SECTIONS.find((s) => s.title === 'Salad & Raita')?.items || [],
  'Sweets':           MENU_SECTIONS.find((s) => s.title === 'Sweets')?.items || [],
  'Ice Cream':        MENU_SECTIONS.find((s) => s.title === 'Ice Cream')?.items || [],
  'Live Counter':     MENU_SECTIONS.find((s) => s.title === 'Live Chaat  (₹50/plate · any 2)')?.items || [],
  'Accompaniments':   [],
  'Water Bottle':     [],
};

function qtyToMax(qty) {
  if (qty === 'any one')   return 1;
  if (qty === 'any two')   return 2;
  if (qty === 'any three') return 3;
  return 0; // fixed / no selection
}

const SERVICE_STYLES = ['Buffet', 'Sit-down', 'Live Counters', 'High Tea'];

export default function CateringOrderScreen({ navigation }) {
  // 'packages' | 'menuSelect' | 'booking'
  const [page, setPage] = useState('packages');

  const { width: screenWidth } = useWindowDimensions();
  const isWide = screenWidth >= 700;

  const [selectedPkg, setSelectedPkg] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set());

  // menuChoices: { [label]: string[] }
  const [menuChoices, setMenuChoices] = useState({});
  // customNotes: { [label]: string } — free text per category
  const [customNotes, setCustomNotes] = useState({});
  // menuErrors: set of labels that are incomplete
  const [menuErrors, setMenuErrors] = useState(new Set());

  // booking form
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventType, setEventType] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueContact, setVenueContact] = useState('');
  const [venueContactPhone, setVenueContactPhone] = useState('');
  const [setupTime, setSetupTime] = useState('');
  const [serviceStart, setServiceStart] = useState('');
  const [serviceEnd, setServiceEnd] = useState('');
  const [serviceStyle, setServiceStyle] = useState('Buffet');
  const [advancePaid, setAdvancePaid] = useState('');
  const [advanceDate, setAdvanceDate] = useState('');
  const [balanceDueDate, setBalanceDueDate] = useState('');
  const [refNo] = useState(nextRef);
  const [paymentState, setPaymentState] = useState('idle'); // 'idle' | 'loading' | 'paid'
  const [paymentId, setPaymentId] = useState('');

  const pkg = selectedPkg ? PACKAGES.find((p) => p.id === selectedPkg) : null;
  const guests = parseInt(guestCount, 10) || 0;
  const estimate = pkg ? guests * pkg.price : 0;

  function toggleSection(title) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  }

  function toggleItem(label, item, maxAllowed) {
    setMenuChoices((prev) => {
      const cur = prev[label] || [];
      let next;
      if (cur.includes(item)) {
        next = { ...prev, [label]: cur.filter((i) => i !== item) };
      } else if (maxAllowed > 0 && cur.length >= maxAllowed) {
        next = { ...prev, [label]: [...cur.slice(1), item] };
      } else {
        next = { ...prev, [label]: [...cur, item] };
      }
      // clear error for this label if now satisfied
      const newSelected = next[label] || [];
      if (newSelected.length >= maxAllowed) {
        setMenuErrors((e) => { const n = new Set(e); n.delete(label); return n; });
      }
      return next;
    });
  }

  function handleSelectPackage(pkgId) {
    setSelectedPkg(pkgId);
    setMenuChoices({});
    setCustomNotes({});
    setMenuErrors(new Set());
  }

  function handleProceedToMenu() {
    if (!selectedPkg) return;
    setPage('menuSelect');
  }

  function handleMenuDone() {
    if (!pkg) return;
    const errors = new Set();
    pkg.includes.forEach((inc) => {
      const max = qtyToMax(inc.qty);
      if (max === 0) return; // fixed items like Accompaniments
      const selected = menuChoices[inc.label] || [];
      if (selected.length < max) errors.add(inc.label);
    });
    if (errors.size > 0) {
      setMenuErrors(errors);
      // scroll to first error — just open first errored section
      const first = pkg.includes.find((inc) => errors.has(inc.label));
      if (first) setExpandedSections((prev) => { const n = new Set(prev); n.add(first.label); return n; });
      return;
    }
    setMenuErrors(new Set());
    setStep(1);
    setSubmitted(false);
    setPage('booking');
  }

  function handleNext() {
    if (step === 1) {
      if (!contactName.trim() || !contactPhone.trim() || !guestCount.trim() || !eventDate.trim() || !eventType.trim()) {
        if (Platform.OS === 'web') window.alert('Please fill in all required fields.');
        return;
      }
      if (parseInt(guestCount, 10) < 30) {
        if (Platform.OS === 'web') window.alert('Minimum order is 30 guests.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setSubmitted(true);
    }
  }

  async function handlePayAdvance() {
    if (!pkg || !guests) return;
    const total = Math.round(guests * pkg.price * 1.05);
    const advance = Math.round(total * 0.20);
    setPaymentState('loading');
    try {
      const orderId = generateOrderId();
      const response = await openRazorpayCheckout({
        amountRupees: advance,
        orderId,
        prefill: { name: contactName, contact: `+91${contactPhone}` },
      });
      setPaymentId(response.razorpay_payment_id);
      setPaymentState('paid');
    } catch (e) {
      setPaymentState('idle');
      if (e.message !== 'dismissed' && Platform.OS === 'web') {
        window.alert('Payment failed. Please try again.');
      }
    }
  }

  function handlePrint() {
    printConfirmation({
      refNo, clientName: contactName, clientPhone: contactPhone,
      eventType, eventDate, guestCount, venueAddress,
      venueContact, venueContactPhone,
      setupTime, serviceStart, serviceEnd, serviceStyle,
      menuChoices: { ...menuChoices, '__special__': customNotes['__special__'] || '' }, pkg, advancePaid: paymentId ? String(Math.round(guests * pkg?.price * 1.05 * 0.20)) : '', advanceDate: '', balanceDueDate: '',
      paymentId,
    });
  }

  // ── PAGE: Menu Selection ──────────────────────────────────────────────
  if (page === 'menuSelect' && pkg) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => setPage('packages')} style={styles.backBtn}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.headerTitle}>Select Your Menu</Text>
              <View style={[styles.pkgBadge, { backgroundColor: pkg.tagBg, marginTop: 4 }]}>
                <Text style={[styles.pkgBadgeText, { color: pkg.tagColor }]}>{pkg.label} · ₹{pkg.price}+Tax/person</Text>
              </View>
            </View>
            <View style={styles.backBtn} />
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {pkg.includes.map((inc) => {
            const items = LABEL_TO_ITEMS[inc.label] || [];
            const max = qtyToMax(inc.qty);
            const selected = menuChoices[inc.label] || [];
            const open = expandedSections.has(inc.label);
            const countMap = { 'any one': '(1)', 'any two': '(2)', 'any three': '(3)' };
            const countLabel = countMap[inc.qty] || '';

            if (items.length === 0) {
              return (
                <View key={inc.label} style={styles.menuSelectSection}>
                  <View style={styles.menuSelectHeader}>
                    <Text style={styles.menuSelectLabel}>{inc.label}</Text>
                    <Text style={styles.menuSelectQty}>{inc.qty}</Text>
                  </View>
                </View>
              );
            }

            const hasError = menuErrors.has(inc.label) && selected.length < max;
            return (
              <View key={inc.label} style={[styles.menuSelectSection, hasError && { borderColor: '#ef4444', borderWidth: 1.5 }]}>
                {/* Dropdown header */}
                <TouchableOpacity style={styles.menuSelectHeader} onPress={() => toggleSection(inc.label)}>
                  <Text style={[styles.menuSelectLabel, hasError && { color: '#ef4444' }]}>{inc.label} {countLabel}</Text>
                  <Text style={[styles.menuSelectQty, hasError && { color: '#ef4444', fontStyle: 'normal', fontWeight: '600' }]}>
                    {hasError
                      ? `Select ${max - selected.length} more`
                      : selected.length > 0 ? `${selected.length}/${max} chosen` : 'tap to select'}
                  </Text>
                  <Text style={{ fontSize: 11, color: THEME.slate, marginLeft: 6 }}>{open ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {/* Selected summary chips when collapsed */}
                {!open && selected.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingBottom: 10 }}>
                    {selected.map((s) => (
                      <View key={s} style={[styles.itemChip, { backgroundColor: pkg.tagColor, borderColor: pkg.tagColor }]}>
                        <Text style={[styles.itemChipText, { color: '#fff', fontSize: 11 }]}>✓ {s}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Expanded item rows */}
                {open && (
                  <View style={{ borderTopWidth: 1, borderTopColor: THEME.rowBorder }}>
                    {items.map((item) => {
                      const active = selected.includes(item);
                      const noteKey = `${inc.label}::${item}`;
                      return (
                        <View key={item} style={styles.menuItemSelectRow}>
                          <TouchableOpacity
                            style={[styles.menuItemCheckbox, active && { backgroundColor: pkg.tagColor, borderColor: pkg.tagColor }]}
                            onPress={() => toggleItem(inc.label, item, max)}
                          >
                            {active && <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
                          </TouchableOpacity>
                          <Text style={[styles.menuItemSelectName, active && { color: pkg.tagColor, fontWeight: '700' }]}>{item}</Text>
                          <TextInput
                            style={styles.menuItemCustomInput}
                            value={customNotes[noteKey] || ''}
                            onChangeText={(v) => setCustomNotes((prev) => ({ ...prev, [noteKey]: v }))}
                            placeholder="Custom requirement"
                            placeholderTextColor={THEME.slateLight}
                          />
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
          {/* Special Requests */}
          <View style={[styles.menuSelectSection, { marginTop: 4 }]}>
            <View style={styles.menuSelectHeader}>
              <Text style={styles.menuSelectLabel}>Special Requests</Text>
              <Text style={styles.menuSelectQty}>optional</Text>
            </View>
            <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
              <TextInput
                style={[styles.fieldInput, { minHeight: 80, textAlignVertical: 'top' }]}
                value={customNotes['__special__'] || ''}
                onChangeText={(v) => setCustomNotes((prev) => ({ ...prev, '__special__': v }))}
                placeholder="e.g. Jain food, no onion/garlic, allergies, special arrangements..."
                placeholderTextColor={THEME.slateLight}
                multiline
              />
            </View>
          </View>
        </ScrollView>

        {/* Sticky Done button */}
        <View style={styles.stickyBottom}>
          {menuErrors.size > 0 && (
            <Text style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
              Please complete all selections before proceeding
            </Text>
          )}
          <TouchableOpacity style={styles.bookBtn} onPress={handleMenuDone}>
            <Text style={styles.bookBtnText}>Proceed to Book →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── PAGE: Booking Form ────────────────────────────────────────────────
  if (page === 'booking') {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingBottom: 12 }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => { if (submitted) { setSubmitted(false); setStep(2); } else if (step > 1) { setStep(step - 1); } else { setPage('menuSelect'); } }} style={styles.backBtn}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.headerTitle}>
                {submitted ? 'Confirmation' : step === 1 ? 'Contact & Event' : 'Payment'}
              </Text>
            </View>
            <View style={styles.backBtn} />
          </View>
          {/* Step dots */}
          {!submitted && (
            <View style={styles.stepBar}>
              {['Contact', 'Payment'].map((s, i) => (
                <View key={s} style={styles.stepItem}>
                  <View style={[styles.stepDot, step > i + 1 && styles.stepDotDone, step === i + 1 && styles.stepDotActive]}>
                    <Text style={styles.stepDotText}>{step > i + 1 ? '✓' : i + 1}</Text>
                  </View>
                  <Text style={[styles.stepLabel, step === i + 1 && { color: THEME.goldLight, fontWeight: '700' }]}>{s}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

            {submitted ? (
              <View style={styles.successBox}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successTitle}>Order Confirmed!</Text>
                <Text style={styles.successText}>
                  Ref <Text style={{ fontWeight: 'bold' }}>#{refNo}</Text>{'\n'}
                  {contactName} · +91 {contactPhone}{'\n'}
                  {guestCount} guests · {eventType} on {eventDate}{'\n'}
                  {pkg ? `${pkg.label} — ₹${pkg.price}+Tax/person` : ''}
                </Text>
                {/* Menu summary */}
                {pkg && (
                  <View style={{ width: '100%', marginTop: 16 }}>
                    {pkg.includes.map((inc) => {
                      const sel = menuChoices[inc.label];
                      const display = Array.isArray(sel) && sel.length ? sel.join(', ') : inc.qty;
                      return (
                        <View key={inc.label} style={styles.confirmMenuRow}>
                          <Text style={styles.confirmMenuLabel}>{inc.label}</Text>
                          <Text style={styles.confirmMenuVal}>{display}</Text>
                        </View>
                      );
                    })}
                    {customNotes['__special__'] ? (
                      <View style={[styles.confirmMenuRow, { borderTopWidth: 1.5, borderTopColor: THEME.goldBorder, marginTop: 6, paddingTop: 8 }]}>
                        <Text style={[styles.confirmMenuLabel, { color: '#7c3aed' }]}>Special Requests</Text>
                        <Text style={[styles.confirmMenuVal, { color: '#7c3aed' }]}>{customNotes['__special__']}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' }}>
                  <TouchableOpacity style={[styles.bookBtn, { flex: 1 }]} onPress={handlePrint}>
                    <Text style={styles.bookBtnText}>🖨️ Print</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.bookBtn, { flex: 1, backgroundColor: THEME.gold }]} onPress={() => downloadConfirmationPdf({
                    refNo, clientName: contactName, clientPhone: contactPhone,
                    eventType, eventDate, guestCount, venueAddress,
                    venueContact, venueContactPhone,
                    setupTime, serviceStart, serviceEnd, serviceStyle,
                    menuChoices: { ...menuChoices, '__special__': customNotes['__special__'] || '' }, pkg,
                    advancePaid: paymentId ? String(Math.round(guests * (pkg?.price || 0) * 1.05 * 0.20)) : '',
                    advanceDate: '', balanceDueDate: '', paymentId,
                  })}>
                    <Text style={[styles.bookBtnText, { color: THEME.navy }]}>⬇️ Download PDF</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.skipBtn} onPress={() => { setPage('packages'); setSubmitted(false); setStep(1); }}>
                  <Text style={styles.skipBtnText}>Back to Home</Text>
                </TouchableOpacity>
              </View>

            ) : (
              <>
                {pkg && (
                  <View style={[styles.pkgBadge, { backgroundColor: pkg.tagBg, marginBottom: 16, alignSelf: 'flex-start' }]}>
                    <Text style={[styles.pkgBadgeText, { color: pkg.tagColor }]}>{pkg.label} · ₹{pkg.price}+Tax/person</Text>
                  </View>
                )}

                {step === 1 && (
                  <>
                    <Text style={styles.fieldLabel}>Client Name *</Text>
                    <TextInput style={styles.fieldInput} value={contactName} onChangeText={setContactName} placeholder="Full name" placeholderTextColor={THEME.slateLight} />
                    <Text style={styles.fieldLabel}>Mobile Number *</Text>
                    <TextInput style={styles.fieldInput} value={contactPhone} onChangeText={(v) => setContactPhone(v.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" keyboardType="phone-pad" placeholderTextColor={THEME.slateLight} />
                    <Text style={styles.fieldLabel}>Number of Guests * <Text style={{ fontWeight: '400', color: THEME.slateLight }}>(min order 30)</Text></Text>
                    <TextInput
                      style={[styles.fieldInput, guestCount && parseInt(guestCount, 10) < 30 && { borderColor: '#ef4444' }]}
                      value={guestCount}
                      onChangeText={(v) => setGuestCount(v.replace(/\D/g, ''))}
                      placeholder="e.g. 50"
                      keyboardType="number-pad"
                      placeholderTextColor={THEME.slateLight}
                    />
                    {guestCount && parseInt(guestCount, 10) < 30 && (
                      <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>Minimum order is 30 guests</Text>
                    )}
                    <Text style={styles.fieldLabel}>Event Type *</Text>
                    <TextInput style={styles.fieldInput} value={eventType} onChangeText={setEventType} placeholder="e.g. Wedding, Birthday, Corporate, Kitty Party..." placeholderTextColor={THEME.slateLight} />
                    <Text style={styles.fieldLabel}>Event Date & Time *</Text>
                    {Platform.OS === 'web' ? (
                      <input
                        type="datetime-local"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        style={{
                          width: '100%', padding: '12px 14px', fontSize: 15,
                          border: '1.5px solid #e8d78a', borderRadius: 10,
                          backgroundColor: '#f8fafc', color: '#1e293b',
                          boxSizing: 'border-box', fontFamily: 'inherit',
                        }}
                      />
                    ) : (
                      <TextInput style={styles.fieldInput} value={eventDate} onChangeText={setEventDate} placeholder="YYYY-MM-DD HH:MM" placeholderTextColor={THEME.slateLight} />
                    )}
                    {pkg && guests > 0 && (
                      <View style={[styles.estimateTotalRow, { marginTop: 16 }]}>
                        <Text style={styles.estimateTotalLabel}>Estimated Total (excl. tax)</Text>
                        <Text style={styles.estimateTotalVal}>₹{estimate.toLocaleString('en-IN')}</Text>
                      </View>
                    )}
                  </>
                )}

                {step === 2 && (
                  <>
                    {pkg && guests > 0 && (() => {
                      const total = Math.round(estimate * 1.05);
                      const advance = Math.round(total * 0.20);
                      const balance = total - advance;
                      return (
                        <>
                          <View style={styles.finSummary}>
                            <View style={styles.finRow}><Text style={styles.finLabel}>₹{pkg.price} × {guests} pax</Text><Text style={styles.finVal}>₹{estimate.toLocaleString('en-IN')}</Text></View>
                            <View style={styles.finRow}><Text style={styles.finLabel}>CGST (2.5%)</Text><Text style={styles.finVal}>₹{Math.round(estimate * 0.025).toLocaleString('en-IN')}</Text></View>
                            <View style={styles.finRow}><Text style={styles.finLabel}>SGST (2.5%)</Text><Text style={styles.finVal}>₹{Math.round(estimate * 0.025).toLocaleString('en-IN')}</Text></View>
                            <View style={[styles.finRow, styles.finTotalRow]}><Text style={styles.finTotalLabel}>Total Invoice Value</Text><Text style={styles.finTotalVal}>₹{total.toLocaleString('en-IN')}</Text></View>
                            <View style={[styles.finRow, { marginTop: 6 }]}><Text style={[styles.finLabel, { color: '#16a34a' }]}>Advance Required (20%)</Text><Text style={[styles.finVal, { color: '#16a34a', fontWeight: '700' }]}>₹{advance.toLocaleString('en-IN')}</Text></View>
                            <View style={styles.finRow}><Text style={styles.finLabel}>Balance — After Event Completion</Text><Text style={styles.finVal}>₹{balance.toLocaleString('en-IN')}</Text></View>
                          </View>

                          {paymentState === 'paid' ? (
                            <View style={styles.paySuccessBanner}>
                              <Text style={styles.paySuccessText}>✅ Advance Paid — ₹{advance.toLocaleString('en-IN')}</Text>
                              <Text style={styles.paySuccessId}>Payment ID: {paymentId}</Text>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={[styles.payAdvanceBtn, paymentState === 'loading' && { opacity: 0.7 }]}
                              onPress={handlePayAdvance}
                              disabled={paymentState === 'loading'}
                            >
                              {paymentState === 'loading'
                                ? <ActivityIndicator color={THEME.navy} />
                                : <Text style={styles.payAdvanceBtnText}>Pay Advance ₹{advance.toLocaleString('en-IN')} →</Text>
                              }
                            </TouchableOpacity>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}

                <TouchableOpacity
                  style={[styles.bookBtn, { marginTop: 24 }, step === 2 && paymentState !== 'paid' && { opacity: 0.4 }]}
                  onPress={handleNext}
                  disabled={step === 2 && paymentState !== 'paid'}
                >
                  <Text style={styles.bookBtnText}>{step < 2 ? 'Next →' : 'Generate Confirmation'}</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── PAGE: Package Selection (default) ────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {navigation && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Buffet on Wheels</Text>
            <Text style={styles.headerTagline}>Banquet Catering</Text>
            <TouchableOpacity onPress={() => callPhone(CATERING_PHONE_1)}>
              <Text style={styles.headerContact}>Srikanth P  •  📞 +91 {CATERING_PHONE_1}</Text>
            </TouchableOpacity>
          </View>
          {navigation && <View style={styles.backBtn} />}
        </View>
        <View style={styles.servicesRow}>
          {SERVICES.map((s) => (
            <View key={s} style={styles.serviceChip}>
              <Text style={styles.serviceChipText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Banquet Catering Packages</Text>
        <Text style={styles.sectionSub}>Choose a package and we'll help you build your menu</Text>

        {[
          { key: 'veg', heading: '🥗 Vegetarian Packages' },
          { key: 'nonveg', heading: '🍗 Non-Vegetarian Packages' },
        ].map((group) => (
          <View key={group.key}>
            <Text style={styles.pkgGroupHeading}>{group.heading}</Text>
            <View style={isWide ? { flexDirection: 'row', gap: 10 } : { flexDirection: 'column', gap: 10 }}>
            {PACKAGES.filter((p) => p.category === group.key).map((p) => {
              const active = selectedPkg === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.pkgCard, isWide && { flex: 1 }, active && { borderColor: p.tagColor, borderWidth: 2 }]}
                  onPress={() => handleSelectPackage(active ? null : p.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.pkgCardHeader}>
                    <View style={[styles.pkgBadge, { backgroundColor: p.tagBg }]}>
                      <Text style={[styles.pkgBadgeText, { color: p.tagColor }]}>{p.label}</Text>
                    </View>
                    <Text style={styles.pkgPrice}>
                      <Text style={styles.pkgPriceRs}>₹</Text>
                      {p.price.toLocaleString('en-IN')}
                      <Text style={styles.pkgPriceSuffix}> + Tax / person</Text>
                    </Text>
                    <View style={[styles.selectCircle, active && { backgroundColor: p.tagColor, borderColor: p.tagColor }]}>
                      {active && <Text style={styles.selectTick}>✓</Text>}
                    </View>
                  </View>
                  <View style={styles.includesList}>
                    {p.includes.map((inc, i) => {
                      const countMap = { 'any one': '(1)', 'any two': '(2)', 'any three': '(3)' };
                      const display = countMap[inc.qty]
                        ? `${inc.label} ${countMap[inc.qty]}`
                        : `${inc.label}: ${inc.qty}`;
                      return (
                        <View key={i} style={styles.includeRow}>
                          <Text style={[styles.includeDot, { color: p.tagColor }]}>●</Text>
                          <Text style={styles.includeLabel}>{display}</Text>
                        </View>
                      );
                    })}
                  </View>
                  {active && (
                    <TouchableOpacity style={[styles.bookBtn, { marginTop: 14 }]} onPress={handleProceedToMenu}>
                      <Text style={styles.bookBtnText}>Select My Menu →</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
            </View>
          </View>
        ))}

        <View style={styles.qualityCard}>
          <Text style={styles.qualityTitle}>Our Quality Promise</Text>
          <View style={styles.qualityGrid}>
            {[
              { icon: '🥛', text: 'Amul Dairy Products' },
              { icon: '🫙', text: 'Nandini Ghee' },
              { icon: '✅', text: 'FSSAI Certified Kitchen' },
              { icon: '🌿', text: 'Fresh Farm Vegetables' },
              { icon: '🧂', text: 'Iodised & Branded Spices' },
              { icon: '🫧', text: 'RO Purified Water' },
              { icon: '🧤', text: 'Hygiene-Trained Staff' },
              { icon: '❄️', text: 'Cold-Chain Maintained' },
              { icon: '🍽️', text: 'Separate Veg & Non-Veg Prep' },
              { icon: '😋', text: 'Free Tasting Before Booking' },
            ].map((q) => (
              <View key={q.text} style={styles.qualityItem}>
                <Text style={styles.qualityIcon}>{q.icon}</Text>
                <Text style={styles.qualityText}>{q.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.notesCard}>
          <Text style={styles.notesTitle}>Important Notes</Text>
          <Text style={styles.notesItem}>* Minimum 30 pax (persons) per order</Text>
          <Text style={styles.notesItem}>* Tax @ 5% applicable on all packages</Text>
          <Text style={styles.notesItem}>* Strictly separate utensils, sections &amp; areas maintained for veg and non-veg preparation</Text>
          <Text style={styles.notesItem}>* Taste any one curry from the menu free of cost before booking</Text>
          <Text style={styles.notesItem}>* Live Chaats — ₹50 per plate extra (any 2 items)</Text>
          <Text style={styles.notesItem}>* Tandoor Breads — ₹20 per plate extra</Text>
          <Text style={styles.notesItem}>* 20% advance required, balance on or before event</Text>
          <Text style={styles.notesItem}>* Decoration not included</Text>
          <Text style={styles.notesItem}>* UPI &amp; cash accepted — no discount, no extra charge</Text>
          <Text style={styles.notesItem}>* Water bottle (200ml) per head included; extra chargeable</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.offWhite,
    ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' } : {}),
  },

  header: {
    backgroundColor: THEME.navy,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.goldBorder,
  },
  headerTop: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  backBtn: { width: 36, justifyContent: 'center' },
  backBtnText: { color: THEME.gold, fontSize: 22, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.gold, textAlign: 'center' },
  headerTagline: { fontSize: 10, color: '#e8eefc', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginTop: 2 },
  headerContact: { fontSize: 12, color: THEME.gold, textAlign: 'center', marginTop: 4 },
  headerSub: { fontSize: 11, color: THEME.slateLight, marginTop: 2, textAlign: 'center' },
  servicesRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 8, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  serviceChip: {
    backgroundColor: '#1e3a5f', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: THEME.goldBorder,
  },
  serviceChipText: { color: THEME.goldLight, fontSize: 11, fontWeight: '500' },

  content: { padding: 16, paddingBottom: 40 },

  timingsBanner: {
    backgroundColor: THEME.goldPale, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: THEME.goldBorder,
    marginBottom: 20,
  },
  timingsText: { fontSize: 13, color: THEME.navy, fontWeight: '500', textAlign: 'center' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.navy, marginBottom: 4 },
  sectionSub: { fontSize: 12, color: THEME.slate, marginBottom: 14 },
  pkgGroupHeading: { fontSize: 15, fontWeight: '700', color: THEME.navy, marginTop: 6, marginBottom: 10 },

  pkgCard: {
    backgroundColor: THEME.white, borderRadius: 16,
    marginBottom: 14, padding: 16,
    borderWidth: 1.5, borderColor: THEME.divider,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  pkgCardHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, gap: 10,
  },
  pkgBadge: {
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  pkgBadgeText: { fontSize: 13, fontWeight: 'bold' },
  pkgPrice: { flex: 1, fontSize: 20, fontWeight: 'bold', color: THEME.navy },
  pkgPriceRs: { fontSize: 14 },
  pkgPriceSuffix: { fontSize: 12, fontWeight: 'normal', color: THEME.slate },
  selectCircle: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: THEME.divider,
    justifyContent: 'center', alignItems: 'center',
  },
  selectTick: { color: '#fff', fontSize: 13, fontWeight: 'bold' },

  includesList: { gap: 6 },
  includeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  includeDot: { fontSize: 8, marginTop: 5 },
  includeLabel: { fontSize: 12, fontWeight: '500', color: THEME.text, flex: 1 },
  includeQty: { fontSize: 11, color: THEME.slate },

  estimateCard: {
    backgroundColor: THEME.white, borderRadius: 16,
    padding: 16, marginBottom: 14,
    borderWidth: 1.5, borderColor: THEME.goldBorder,
    shadowColor: THEME.gold, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  estimateTitle: { fontSize: 15, fontWeight: 'bold', color: THEME.navy, marginBottom: 12 },
  estimateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  estimateLabel: { fontSize: 14, color: THEME.text },
  guestInput: {
    borderWidth: 1.5, borderColor: THEME.goldBorder, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 16,
    color: THEME.text, textAlign: 'center', minWidth: 80,
    backgroundColor: THEME.offWhite,
  },
  estimateTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: THEME.goldBorder,
  },
  estimateTotalLabel: { fontSize: 13, color: THEME.slate },
  estimateTotalVal: { fontSize: 18, fontWeight: 'bold', color: THEME.gold },

  bookBtn: {
    backgroundColor: THEME.navy, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  bookBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5, borderColor: THEME.navy,
    marginBottom: 14,
  },
  bookBtnText: { color: THEME.gold, fontWeight: 'bold', fontSize: 15 },

  menuSection: {
    backgroundColor: THEME.white, borderRadius: 12,
    marginBottom: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: THEME.divider,
  },
  menuSectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 8,
  },
  menuSectionEmoji: { fontSize: 20 },
  menuSectionTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: THEME.text },
  menuSectionCount: { fontSize: 12, color: THEME.slate },
  menuChevron: { fontSize: 11, color: THEME.slate, marginLeft: 6 },
  menuItemsList: {
    paddingHorizontal: 16, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: THEME.rowBorder,
  },
  menuItemRow: { flexDirection: 'row', paddingVertical: 4, gap: 8 },
  menuItemDot: { color: THEME.gold, fontSize: 16, lineHeight: 22 },
  menuItemText: { flex: 1, fontSize: 13, color: THEME.text, lineHeight: 20 },

  qualityCard: {
    backgroundColor: THEME.navy, borderRadius: 14,
    padding: 16, marginTop: 20, marginBottom: 14,
    borderWidth: 1, borderColor: THEME.goldBorder,
  },
  qualityTitle: {
    fontSize: 14, fontWeight: 'bold', color: THEME.gold,
    marginBottom: 12, textAlign: 'center', letterSpacing: 0.5,
  },
  qualityGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center',
  },
  qualityItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(201,168,64,0.3)',
  },
  qualityIcon: { fontSize: 14 },
  qualityText: { fontSize: 12, color: THEME.goldLight, fontWeight: '500' },

  notesCard: {
    backgroundColor: '#fffbeb', borderRadius: 12,
    padding: 14, marginTop: 20, marginBottom: 14,
    borderWidth: 1, borderColor: THEME.goldBorder,
  },
  notesTitle: { fontSize: 14, fontWeight: 'bold', color: THEME.navy, marginBottom: 8 },
  notesItem: { fontSize: 12, color: '#78350f', lineHeight: 20 },

  contactCard: {
    backgroundColor: THEME.navy, borderRadius: 16,
    padding: 16, marginBottom: 20,
  },
  contactTitle: { fontSize: 16, fontWeight: 'bold', color: THEME.gold, marginBottom: 6 },
  contactAddress: { fontSize: 12, color: THEME.slateLight, lineHeight: 18, marginBottom: 12 },
  callBtn: {
    backgroundColor: THEME.gold, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  callBtnText: { color: THEME.navy, fontWeight: 'bold', fontSize: 14 },

  dropdownWrap: { marginBottom: 4 },
  guestChipsRow: { flexDirection: 'row', gap: 8, paddingVertical: 6 },
  guestChip: {
    borderWidth: 1.5, borderColor: THEME.goldBorder, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, backgroundColor: THEME.white,
  },
  guestChipActive: { backgroundColor: THEME.navy, borderColor: THEME.navy },
  guestChipText: { fontSize: 14, fontWeight: '600', color: THEME.slate },
  guestChipTextActive: { color: THEME.gold },
  guestSelected: { fontSize: 12, color: THEME.slate, marginTop: 4, marginLeft: 4 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: THEME.text, marginBottom: 6, marginTop: 12 },
  fieldInput: {
    borderWidth: 1.5, borderColor: THEME.goldBorder, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: THEME.text, backgroundColor: THEME.offWhite,
  },

  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipBtnText: { color: THEME.slate, fontSize: 14 },

  successBox: { alignItems: 'center', paddingVertical: 10 },
  successIcon: { fontSize: 48, marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: THEME.navy, marginBottom: 10 },
  successText: { fontSize: 14, color: THEME.text, lineHeight: 24, textAlign: 'center' },

  stepBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 3 },
  stepDotActive: { backgroundColor: THEME.gold },
  stepDotDone: { backgroundColor: '#16a34a' },
  stepDotText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  stepLabel: { fontSize: 10, color: THEME.slateLight },

  styleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 8 },
  styleChip: { borderWidth: 1.5, borderColor: THEME.goldBorder, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  styleChipActive: { backgroundColor: THEME.navy, borderColor: THEME.navy },
  styleChipText: { fontSize: 13, color: THEME.slate },
  styleChipTextActive: { color: THEME.gold, fontWeight: '600' },

  finSummary: { backgroundColor: THEME.offWhite, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: THEME.goldBorder },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  finLabel: { fontSize: 13, color: THEME.slate },
  finVal: { fontSize: 13, color: THEME.text },
  finTotalRow: { borderTopWidth: 1, borderTopColor: THEME.goldBorder, marginTop: 6, paddingTop: 8 },
  finTotalLabel: { fontSize: 14, fontWeight: 'bold', color: THEME.navy },
  finTotalVal: { fontSize: 14, fontWeight: 'bold', color: THEME.gold },

  // Menu selection page
  menuSelectSection: {
    backgroundColor: THEME.white, borderRadius: 14,
    marginBottom: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: THEME.divider,
  },
  menuSelectHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  menuSelectLabel: { fontSize: 14, fontWeight: '700', color: THEME.navy, flex: 1 },
  menuSelectQty: { fontSize: 11, color: THEME.slate, fontStyle: 'italic' },
  menuSelectFixed: { fontSize: 13, color: THEME.slateLight, paddingHorizontal: 14, paddingBottom: 10 },
  itemChip: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: THEME.goldBorder, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: THEME.white,
  },
  itemChipTick: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  itemChipText: { fontSize: 12, color: THEME.text },

  menuItemSelectRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: THEME.rowBorder, gap: 10,
  },
  menuItemCheckbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: THEME.goldBorder,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: THEME.white,
  },
  menuItemSelectName: { flex: 1, fontSize: 13, color: THEME.text },
  menuItemCustomInput: {
    width: 140, borderWidth: 1, borderColor: THEME.divider,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
    fontSize: 12, color: THEME.text, backgroundColor: THEME.offWhite,
  },

  stickyBottom: {
    padding: 16, paddingBottom: 28,
    backgroundColor: THEME.white,
    borderTopWidth: 1, borderTopColor: THEME.goldBorder,
    ...(Platform.OS === 'web' ? { position: 'sticky', bottom: 0 } : {}),
  },

  // Confirm page menu summary
  payAdvanceBtn: {
    backgroundColor: THEME.gold, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 16,
  },
  payAdvanceBtnText: { color: THEME.navy, fontWeight: 'bold', fontSize: 16 },
  paySuccessBanner: {
    backgroundColor: '#f0fdf4', borderRadius: 12,
    padding: 14, marginTop: 16,
    borderWidth: 1.5, borderColor: '#16a34a',
    alignItems: 'center',
  },
  paySuccessText: { fontSize: 15, fontWeight: 'bold', color: '#16a34a' },
  paySuccessId: { fontSize: 11, color: THEME.slate, marginTop: 4 },

  confirmMenuRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: THEME.rowBorder,
  },
  confirmMenuLabel: { fontSize: 13, fontWeight: '600', color: THEME.navy, flex: 1 },
  confirmMenuVal: { fontSize: 13, color: THEME.slate, flex: 2, textAlign: 'right' },
});
