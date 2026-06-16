import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Platform, KeyboardAvoidingView,
} from 'react-native';
import { THEME } from '../constants/theme';
import { RESTAURANT_NAME, RESTAURANT_GSTIN } from '../constants';

const CATERING_PHONE = '9187575078';
const CATERING_ADDRESS = 'Whitefield, Bangalore - 560 067';

let _refCounter = Math.floor(Math.random() * 900) + 100;
function nextRef() { return String(++_refCounter).padStart(4, '0'); }

const SERVICE_STYLES = ['Buffet', 'Sit-down', 'Live Counters', 'High Tea'];

const MENU_SECTIONS = [
  { key: 'welcomeDrink',  label: 'Welcome Drink',   emoji: '🥤' },
  { key: 'soup',          label: 'Soup',             emoji: '🍜' },
  { key: 'starter',       label: 'Starter',          emoji: '🥙' },
  { key: 'paneerGravy',   label: 'Paneer Gravy',     emoji: '🧀' },
  { key: 'drySabzi',      label: 'Dry Sabzi',        emoji: '🥬' },
  { key: 'dal',           label: 'Dal',              emoji: '🫕' },
  { key: 'continental',   label: 'Continental',      emoji: '🥪' },
  { key: 'chinese',       label: 'Chinese',          emoji: '🥡' },
  { key: 'rice',          label: 'Rice / Biryani',   emoji: '🍚' },
  { key: 'breads',        label: 'Breads',           emoji: '🫓' },
  { key: 'salad',         label: 'Salad / Raita',    emoji: '🥗' },
  { key: 'sweets',        label: 'Sweets / Dessert', emoji: '🍮' },
  { key: 'iceCream',      label: 'Ice Cream',        emoji: '🍦' },
  { key: 'accompaniments',label: 'Accompaniments',   emoji: '🫙' },
];

function generateHtml({
  refNo, clientName, clientPhone, eventType, eventDate,
  guestCount, venueAddress, venueContact, venueContactPhone,
  setupTime, serviceStart, serviceEnd, serviceStyle,
  menu, pricePerPlate, extraItems, specialRequests,
  transportationNote, advancePaid, balanceAmt,
}) {
  const guests = parseInt(guestCount, 10) || 0;
  const ppp = parseFloat(pricePerPlate) || 0;
  const foodSubtotal = guests * ppp;

  const extras = extraItems
    .filter((e) => e.name.trim() && e.qty && e.rate)
    .map((e) => ({ ...e, qty: parseInt(e.qty, 10) || 0, rate: parseFloat(e.rate) || 0 }));
  const extrasTotal = extras.reduce((s, e) => s + e.qty * e.rate, 0);

  const taxableAmount = foodSubtotal + extrasTotal;
  const cgst = Math.round(taxableAmount * 0.025 * 100) / 100;
  const sgst = Math.round(taxableAmount * 0.025 * 100) / 100;
  const total = Math.round((taxableAmount + cgst + sgst) * 100) / 100;
  const advanceDisplay = advancePaid.trim() || String(Math.round(total * 0.20));
  const balanceDisplay = balanceAmt.trim() || String(Math.round(total * 0.80));

  const menuRows = MENU_SECTIONS
    .filter((s) => menu[s.key] && menu[s.key].trim())
    .map((s) => `
      <tr>
        <td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340;width:35%">${s.label}</td>
        <td style="padding:6px 10px;border:1px solid #e8d78a;color:#334155">${menu[s.key]}</td>
      </tr>`)
    .join('');

  const extraRows = extras.map((e) => `
    <tr>
      <td style="padding:7px 10px;border:1px solid #e8d78a;color:#64748b">${e.name} (${e.qty} nos × ₹${e.rate.toFixed(2)})</td>
      <td style="padding:7px 10px;border:1px solid #e8d78a;text-align:right;color:#64748b">₹${(e.qty * e.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>`).join('');

  const today = new Date().toLocaleDateString('en-IN');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Catering Order Confirmation — ${RESTAURANT_NAME}</title>
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
  .btn-pdf   { background:#c9a840; color:#0f2340; }
  @media print { .btn-row { display:none; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="btn-row">
    <button class="btn btn-print" onclick="window.print()">🖨️ Print</button>
    <button class="btn btn-pdf"   onclick="downloadPdf()">⬇️ Download PDF</button>
  </div>

  <div class="letterhead">
    <div>
      <div class="lh-name">${RESTAURANT_NAME}</div>
      <div class="lh-sub">Multicuisine Catering &amp; Banquet Services</div>
      <div class="lh-sub" style="margin-top:4px">${CATERING_ADDRESS}</div>
    </div>
    <div class="lh-contact">
      📞 ${CATERING_PHONE}<br/>
      ${RESTAURANT_GSTIN ? 'GSTIN: ' + RESTAURANT_GSTIN : ''}
    </div>
  </div>

  <div class="doc-title">Catering Order Confirmation</div>
  <div class="doc-meta">Date: ${today} &nbsp;|&nbsp; Order Reference: #${refNo}</div>

  <div class="dear">
    Dear <strong>${clientName}</strong>,<br/><br/>
    Thank you for choosing <strong>${RESTAURANT_NAME}</strong> for your upcoming event. We are delighted to confirm the details of your catering order. Please review the summary below and revert with any corrections.
  </div>

  <div class="section-title">📅 Event Overview</div>
  <table>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;width:40%;font-weight:600;color:#0f2340">Event Type</td><td style="padding:6px 10px;border:1px solid #e8d78a">${eventType}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Date of Event</td><td style="padding:6px 10px;border:1px solid #e8d78a">${eventDate}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Guest Count</td><td style="padding:6px 10px;border:1px solid #e8d78a">${guestCount} pax (guaranteed minimum)</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Venue Address</td><td style="padding:6px 10px;border:1px solid #e8d78a">${venueAddress}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Point of Contact at Venue</td><td style="padding:6px 10px;border:1px solid #e8d78a">${venueContact}${venueContactPhone ? ' — ' + venueContactPhone : ''}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Client Phone</td><td style="padding:6px 10px;border:1px solid #e8d78a">+91 ${clientPhone}</td></tr>
  </table>

  <div class="section-title">⏰ Service Timeline</div>
  <table>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;width:40%;font-weight:600;color:#0f2340">Setup Team Arrival</td><td style="padding:6px 10px;border:1px solid #e8d78a">${setupTime}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Service Start Time</td><td style="padding:6px 10px;border:1px solid #e8d78a">${serviceStart}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Service End Time</td><td style="padding:6px 10px;border:1px solid #e8d78a">${serviceEnd}</td></tr>
    <tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Style of Service</td><td style="padding:6px 10px;border:1px solid #e8d78a">${serviceStyle}</td></tr>
  </table>

  ${menuRows ? `
  <div class="section-title">🍽️ Confirmed Menu</div>
  <table>
    <tr><th>Category</th><th>Items</th></tr>
    ${menuRows}
    ${specialRequests ? `<tr><td style="padding:6px 10px;border:1px solid #e8d78a;font-weight:600;color:#7c3aed">Special Requests</td><td style="padding:6px 10px;border:1px solid #e8d78a;color:#334155">${specialRequests}</td></tr>` : ''}
  </table>` : ''}

  <div class="section-title">💰 Financial Summary</div>
  <table>
    <tr><th>Particulars</th><th style="text-align:right">Amount (INR)</th></tr>
    <tr>
      <td style="padding:7px 10px;border:1px solid #e8d78a;font-weight:600;color:#0f2340">Food &amp; Service — ₹${ppp.toFixed(2)} × ${guests} pax</td>
      <td style="padding:7px 10px;border:1px solid #e8d78a;text-align:right">₹${foodSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
    ${extraRows}
    <tr>
      <td style="padding:7px 10px;border:1px solid #e8d78a;color:#64748b">Paneer / Mushroom (if applicable)</td>
      <td style="padding:7px 10px;border:1px solid #e8d78a;text-align:right;color:#64748b">₹30 extra per person</td>
    </tr>
    <tr>
      <td style="padding:7px 10px;border:1px solid #e8d78a;color:#64748b">Transportation &amp; Porter Charges</td>
      <td style="padding:7px 10px;border:1px solid #e8d78a;text-align:right;color:#64748b">${transportationNote.trim() || 'As per actuals'}</td>
    </tr>
    ${extras.length || extrasTotal ? `
    <tr>
      <td style="padding:7px 10px;border:1px solid #e8d78a;font-weight:600;color:#334155">Taxable Amount</td>
      <td style="padding:7px 10px;border:1px solid #e8d78a;text-align:right;font-weight:600">₹${taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>` : ''}
    <tr>
      <td style="padding:7px 10px;border:1px solid #e8d78a;color:#64748b">CGST (@2.5%)</td>
      <td style="padding:7px 10px;border:1px solid #e8d78a;text-align:right;color:#64748b">₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
    <tr>
      <td style="padding:7px 10px;border:1px solid #e8d78a;color:#64748b">SGST (@2.5%)</td>
      <td style="padding:7px 10px;border:1px solid #e8d78a;text-align:right;color:#64748b">₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
    <tr class="total-row">
      <td style="padding:7px 10px;border:1px solid #c9a840">Total Invoice Value</td>
      <td style="padding:7px 10px;border:1px solid #c9a840;text-align:right">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    </tr>
    <tr>
      <td style="padding:7px 10px;border:1px solid #e8d78a;color:#16a34a">Advance Paid</td>
      <td style="padding:7px 10px;border:1px solid #e8d78a;text-align:right;color:#16a34a">₹${parseFloat(advanceDisplay).toLocaleString('en-IN')}</td>
    </tr>
    <tr class="balance-row">
      <td style="padding:7px 10px;border:1px solid #c9a840">Balance — After Event Completion</td>
      <td style="padding:7px 10px;border:1px solid #c9a840;text-align:right">₹${parseFloat(balanceDisplay).toLocaleString('en-IN')}</td>
    </tr>
  </table>
  <p style="font-size:13px;color:#0f2340;margin-top:8px">
    <strong>Payment Terms:</strong> Balance of ₹${parseFloat(balanceDisplay).toLocaleString('en-IN')} to be cleared on or before event day via Bank Transfer / UPI / Cash.<br/>
    <strong>Transportation &amp; Porter:</strong> Booked as per actuals — charges billed separately after event completion.
  </p>

  <div class="section-title">📋 Terms &amp; Conditions</div>
  <div class="terms">
    • <strong>Guest Count:</strong> Final billing based on guaranteed minimum or actual plate count, whichever is higher.<br/>
    • <strong>Extra Plates:</strong> Any plates beyond guaranteed count charged at ₹${ppp.toFixed(2)} + GST per plate.<br/>
    • <strong>Paneer / Mushroom:</strong> Extra items — will be charged at ₹30 per person if applicable (billed separately).<br/>
    • <strong>Food Safety:</strong> Leftover food will not be packed or taken outside unless agreed in writing.<br/>
    • <strong>Power &amp; Water:</strong> Client / venue must provide running water and adequate power supply.<br/>
    • <strong>Transportation &amp; Porter:</strong> Booked by Buffet on Wheels as per actuals; charges billed separately after event completion.<br/>
    • <strong>Buffet Setup:</strong> Buffet tables to be arranged by the client / venue.<br/>
    • <strong>Decoration:</strong> Not included in the package.<br/>
    • <strong>Advance:</strong> 20% advance required; balance on or before event day.<br/>
    • <strong>Payment:</strong> UPI &amp; cash accepted — no discount, no extra charge.
  </div>

  <div class="signoff">
    If you find all details satisfactory, please reply with <strong>"CONFIRMED"</strong> or sign and return a copy.<br/><br/>
    We look forward to making your event a grand success!<br/><br/>
    Warm regards,<br/>
    <strong>${RESTAURANT_NAME}</strong><br/>
    📞 ${CATERING_PHONE}
  </div>

  <div class="sign-block">
    <div class="sign-col">
      <strong>For ${RESTAURANT_NAME}</strong>
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
    filename: 'BOW-Catering-${refNo}.pdf',
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
}

const EMPTY_EXTRA = () => ({ name: '', qty: '', rate: '' });

function Field({ label, required, error, children }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}{required ? <Text style={styles.req}> *</Text> : null}</Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function inputStyle(errors, key) {
  return [styles.input, errors[key] && styles.inputError];
}

export default function CateringBillScreen({ navigation }) {
  const [refNo] = useState(nextRef);

  // Event details
  const [clientName, setClientName]               = useState('');
  const [clientPhone, setClientPhone]             = useState('');
  const [eventType, setEventType]                 = useState('');
  const [eventDate, setEventDate]                 = useState('');
  const [guestCount, setGuestCount]               = useState('');
  const [venueAddress, setVenueAddress]           = useState('');
  const [venueContact, setVenueContact]           = useState('');
  const [venueContactPhone, setVenueContactPhone] = useState('');
  const [setupTime, setSetupTime]                 = useState('');
  const [serviceStart, setServiceStart]           = useState('');
  const [serviceEnd, setServiceEnd]               = useState('');
  const [serviceStyle, setServiceStyle]           = useState('Buffet');

  // Menu
  const [menu, setMenu] = useState({});
  const [specialRequests, setSpecialRequests] = useState('');

  // Pricing
  const [pricePerPlate, setPricePerPlate]       = useState('');
  const [extraItems, setExtraItems]             = useState([EMPTY_EXTRA()]);
  const [transportationNote, setTransportation] = useState('');
  const [advancePaid, setAdvancePaid]           = useState('');
  const [balanceAmt, setBalanceAmt]             = useState('');

  const [errors, setErrors] = useState({});

  function setMenuField(key, val) {
    setMenu((prev) => ({ ...prev, [key]: val }));
  }

  function updateExtra(idx, field, val) {
    setExtraItems((prev) => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  }

  function addExtra() {
    setExtraItems((prev) => [...prev, EMPTY_EXTRA()]);
  }

  function removeExtra(idx) {
    setExtraItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function validate() {
    const e = {};
    if (!clientName.trim())   e.clientName   = 'Required';
    if (!clientPhone.trim())  e.clientPhone  = 'Required';
    if (!eventType.trim())    e.eventType    = 'Required';
    if (!eventDate.trim())    e.eventDate    = 'Required';
    if (!guestCount.trim())   e.guestCount   = 'Required';
    if (parseInt(guestCount, 10) < 25) e.guestCount = 'Min 25 guests';
    if (!venueAddress.trim()) e.venueAddress = 'Required';
    if (!setupTime.trim())    e.setupTime    = 'Required';
    if (!serviceStart.trim()) e.serviceStart = 'Required';
    if (!serviceEnd.trim())   e.serviceEnd   = 'Required';
    if (!pricePerPlate.trim() || isNaN(parseFloat(pricePerPlate))) e.pricePerPlate = 'Enter a valid amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleGenerate() {
    if (!validate()) {
      if (Platform.OS === 'web') window.alert('Please fix the highlighted fields before generating.');
      return;
    }

    const html = generateHtml({
      refNo, clientName, clientPhone, eventType,
      eventDate: new Date(eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }),
      guestCount, venueAddress, venueContact, venueContactPhone,
      setupTime, serviceStart, serviceEnd, serviceStyle,
      menu, pricePerPlate, extraItems, specialRequests,
      transportationNote, advancePaid, balanceAmt,
    });

    if (Platform.OS === 'web') {
      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
    }
  }

  const guests = parseInt(guestCount, 10) || 0;
  const ppp = parseFloat(pricePerPlate) || 0;
  const extras = extraItems.filter((e) => e.name.trim() && e.qty && e.rate);
  const extrasTotal = extras.reduce((s, e) => s + (parseInt(e.qty, 10) || 0) * (parseFloat(e.rate) || 0), 0);
  const taxable = guests * ppp + extrasTotal;
  const total = Math.round(taxable * 1.05 * 100) / 100;
  const advance = Math.round(total * 0.20);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Catering Bill</Text>
        <View style={{ width: 60 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

          {/* ── Client & Event ─────────────────────────────────── */}
          <Text style={styles.sectionTitle}>📋 Client & Event Details</Text>

          <Field label="Client Name" required error={errors.clientName}>
            <TextInput style={inputStyle(errors, 'clientName')} value={clientName} onChangeText={setClientName} placeholder="Full name" placeholderTextColor={THEME.slateLight} />
          </Field>

          <Field label="Client Phone" required error={errors.clientPhone}>
            <TextInput style={inputStyle(errors, 'clientPhone')} value={clientPhone} onChangeText={(v) => setClientPhone(v.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" keyboardType="phone-pad" placeholderTextColor={THEME.slateLight} />
          </Field>

          <Field label="Event Type" required error={errors.eventType}>
            <TextInput style={inputStyle(errors, 'eventType')} value={eventType} onChangeText={setEventType} placeholder="e.g. Wedding, Birthday, Corporate…" placeholderTextColor={THEME.slateLight} />
          </Field>

          <Field label="Date & Time of Event" required error={errors.eventDate}>
            {Platform.OS === 'web' ? (
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', fontSize: 15, border: errors.eventDate ? '1.5px solid #ef4444' : '1.5px solid #e8d78a', borderRadius: 10, backgroundColor: '#f8fafc', color: '#1e293b', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            ) : (
              <TextInput style={inputStyle(errors, 'eventDate')} value={eventDate} onChangeText={setEventDate} placeholder="YYYY-MM-DD HH:MM" placeholderTextColor={THEME.slateLight} />
            )}
          </Field>

          <Field label="Number of Guests (min 25)" required error={errors.guestCount}>
            <TextInput style={inputStyle(errors, 'guestCount')} value={guestCount} onChangeText={(v) => setGuestCount(v.replace(/\D/g, ''))} placeholder="e.g. 50" keyboardType="number-pad" placeholderTextColor={THEME.slateLight} />
          </Field>

          <Field label="Venue Address" required error={errors.venueAddress}>
            <TextInput style={[inputStyle(errors, 'venueAddress'), { minHeight: 72, textAlignVertical: 'top' }]} value={venueAddress} onChangeText={setVenueAddress} placeholder="Full venue address" multiline placeholderTextColor={THEME.slateLight} />
          </Field>

          <Field label="Point of Contact at Venue" error={errors.venueContact}>
            <TextInput style={styles.input} value={venueContact} onChangeText={setVenueContact} placeholder="Contact person name" placeholderTextColor={THEME.slateLight} />
          </Field>

          <Field label="Venue Contact Phone" error={errors.venueContactPhone}>
            <TextInput style={styles.input} value={venueContactPhone} onChangeText={(v) => setVenueContactPhone(v.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit number" keyboardType="phone-pad" placeholderTextColor={THEME.slateLight} />
          </Field>

          {/* ── Timeline ───────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>⏰ Service Timeline</Text>

          <Field label="Setup Team Arrival" required error={errors.setupTime}>
            <TextInput style={inputStyle(errors, 'setupTime')} value={setupTime} onChangeText={setSetupTime} placeholder="e.g. 11:00 AM" placeholderTextColor={THEME.slateLight} />
          </Field>

          <Field label="Service Start Time" required error={errors.serviceStart}>
            <TextInput style={inputStyle(errors, 'serviceStart')} value={serviceStart} onChangeText={setServiceStart} placeholder="e.g. 1:00 PM" placeholderTextColor={THEME.slateLight} />
          </Field>

          <Field label="Service End Time" required error={errors.serviceEnd}>
            <TextInput style={inputStyle(errors, 'serviceEnd')} value={serviceEnd} onChangeText={setServiceEnd} placeholder="e.g. 4:00 PM" placeholderTextColor={THEME.slateLight} />
          </Field>

          <Field label="Style of Service">
            <View style={styles.chipRow}>
              {SERVICE_STYLES.map((s) => (
                <TouchableOpacity key={s} style={[styles.chip, serviceStyle === s && styles.chipActive]} onPress={() => setServiceStyle(s)}>
                  <Text style={[styles.chipText, serviceStyle === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          {/* ── Menu ───────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>🍽️ Menu (fill only what's ordered)</Text>
          {MENU_SECTIONS.map((s) => (
            <Field key={s.key} label={`${s.emoji} ${s.label}`}>
              <TextInput
                style={styles.input}
                value={menu[s.key] || ''}
                onChangeText={(v) => setMenuField(s.key, v)}
                placeholder={`e.g. ${s.key === 'welcomeDrink' ? 'Virgin Mojito' : s.key === 'dal' ? 'Dal Tadka' : s.key === 'breads' ? 'Phulka, Puri' : 'leave blank if not ordered'}`}
                placeholderTextColor={THEME.slateLight}
              />
            </Field>
          ))}

          <Field label="Special Requests / Notes">
            <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]} value={specialRequests} onChangeText={setSpecialRequests} placeholder="Jain food, no onion-garlic, allergies, special arrangements…" multiline placeholderTextColor={THEME.slateLight} />
          </Field>

          {/* ── Pricing ────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>💰 Pricing</Text>

          <Field label="Price per Plate (₹)" required error={errors.pricePerPlate}>
            <TextInput style={inputStyle(errors, 'pricePerPlate')} value={pricePerPlate} onChangeText={setPricePerPlate} placeholder="e.g. 450" keyboardType="decimal-pad" placeholderTextColor={THEME.slateLight} />
          </Field>

          <Text style={styles.subSectionLabel}>Extra / Add-on Items</Text>
          {extraItems.map((ex, idx) => (
            <View key={idx} style={styles.extraRow}>
              <TextInput style={[styles.input, { flex: 3 }]} value={ex.name} onChangeText={(v) => updateExtra(idx, 'name', v)} placeholder="Item name" placeholderTextColor={THEME.slateLight} />
              <TextInput style={[styles.input, { flex: 1, marginLeft: 6 }]} value={ex.qty} onChangeText={(v) => updateExtra(idx, 'qty', v.replace(/\D/g, ''))} placeholder="Qty" keyboardType="number-pad" placeholderTextColor={THEME.slateLight} />
              <TextInput style={[styles.input, { flex: 1.5, marginLeft: 6 }]} value={ex.rate} onChangeText={(v) => updateExtra(idx, 'rate', v)} placeholder="Rate ₹" keyboardType="decimal-pad" placeholderTextColor={THEME.slateLight} />
              {extraItems.length > 1 && (
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeExtra(idx)}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addExtraBtn} onPress={addExtra}>
            <Text style={styles.addExtraText}>+ Add Item</Text>
          </TouchableOpacity>

          <Field label="Transportation & Porter Charges">
            <TextInput
              style={styles.input}
              value={transportationNote}
              onChangeText={setTransportation}
              placeholder="As per actuals (leave blank for default text)"
              placeholderTextColor={THEME.slateLight}
            />
          </Field>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Field label="Advance Paid (₹)">
                <TextInput
                  style={styles.input}
                  value={advancePaid}
                  onChangeText={setAdvancePaid}
                  placeholder={guests > 0 && ppp > 0 ? String(advance) : '0'}
                  keyboardType="decimal-pad"
                  placeholderTextColor={THEME.slateLight}
                />
              </Field>
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              <Field label="Balance Amount (₹)">
                <TextInput
                  style={styles.input}
                  value={balanceAmt}
                  onChangeText={setBalanceAmt}
                  placeholder={guests > 0 && ppp > 0 ? String(total - advance) : '0'}
                  keyboardType="decimal-pad"
                  placeholderTextColor={THEME.slateLight}
                />
              </Field>
            </View>
          </View>

          {/* ── Live estimate ──────────────────────────────────── */}
          {guests > 0 && ppp > 0 && (
            <View style={styles.estimateCard}>
              <Text style={styles.estimateTitle}>Estimate Preview</Text>
              <View style={styles.estimateRow}><Text style={styles.estimateLabel}>₹{ppp.toFixed(2)} × {guests} pax</Text><Text style={styles.estimateVal}>₹{(guests * ppp).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text></View>
              {extrasTotal > 0 && <View style={styles.estimateRow}><Text style={styles.estimateLabel}>Extras</Text><Text style={styles.estimateVal}>₹{extrasTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text></View>}
              <View style={styles.estimateRow}><Text style={styles.estimateLabel}>Transportation</Text><Text style={styles.estimateVal}>As per actuals</Text></View>
              <View style={styles.estimateRow}><Text style={styles.estimateLabel}>GST (5%)</Text><Text style={styles.estimateVal}>₹{Math.round(taxable * 0.05 * 100 / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text></View>
              <View style={[styles.estimateRow, styles.estimateTotalRow]}><Text style={styles.estimateTotalLabel}>Total</Text><Text style={styles.estimateTotalVal}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text></View>
              <View style={styles.estimateRow}><Text style={[styles.estimateLabel, { color: '#16a34a' }]}>Advance Paid</Text><Text style={[styles.estimateVal, { color: '#16a34a', fontWeight: '700' }]}>₹{(parseFloat(advancePaid) || advance).toLocaleString('en-IN')}</Text></View>
              <View style={styles.estimateRow}><Text style={[styles.estimateLabel, { color: '#c9a840' }]}>Balance</Text><Text style={[styles.estimateVal, { color: '#c9a840', fontWeight: '700' }]}>₹{(parseFloat(balanceAmt) || (total - advance)).toLocaleString('en-IN')}</Text></View>
            </View>
          )}

          {/* ── Generate button ────────────────────────────────── */}
          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerate}>
            <Text style={styles.generateBtnText}>Generate Confirmation PDF →</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.offWhite,
    ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' } : {}),
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: THEME.navy, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: THEME.goldBorder,
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: THEME.gold, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.gold },

  body: { padding: 16, paddingBottom: 60 },

  sectionTitle: {
    fontSize: 15, fontWeight: 'bold', color: THEME.navy,
    marginTop: 24, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: THEME.gold,
    paddingLeft: 10,
  },
  subSectionLabel: {
    fontSize: 13, fontWeight: '600', color: THEME.text,
    marginBottom: 8, marginTop: 4,
  },

  fieldWrap: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: THEME.text, marginBottom: 5 },
  req: { color: '#ef4444' },
  input: {
    borderWidth: 1.5, borderColor: THEME.goldBorder, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
    color: THEME.text, backgroundColor: '#fff',
  },
  inputError: { borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginTop: 3 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: {
    borderWidth: 1.5, borderColor: THEME.goldBorder, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7, backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: THEME.navy, borderColor: THEME.navy },
  chipText: { fontSize: 13, fontWeight: '500', color: THEME.slate },
  chipTextActive: { color: THEME.gold, fontWeight: '700' },

  extraRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  removeBtn: { marginLeft: 6, padding: 8, backgroundColor: '#fee2e2', borderRadius: 8 },
  removeBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 13 },
  addExtraBtn: {
    borderWidth: 1.5, borderColor: THEME.goldBorder, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', marginTop: 4,
  },
  addExtraText: { color: THEME.navy, fontWeight: '600', fontSize: 13 },

  estimateCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 20,
    borderWidth: 1.5, borderColor: THEME.goldBorder,
    shadowColor: THEME.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  estimateTitle: { fontSize: 14, fontWeight: 'bold', color: THEME.navy, marginBottom: 10 },
  estimateRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  estimateLabel: { fontSize: 13, color: THEME.slate },
  estimateVal: { fontSize: 13, color: THEME.text },
  estimateTotalRow: { borderTopWidth: 1, borderTopColor: THEME.goldBorder, marginTop: 6, paddingTop: 8 },
  estimateTotalLabel: { fontSize: 15, fontWeight: 'bold', color: THEME.navy },
  estimateTotalVal: { fontSize: 15, fontWeight: 'bold', color: THEME.gold },

  twoCol: { flexDirection: 'row', alignItems: 'flex-start' },

  generateBtn: {
    backgroundColor: THEME.navy, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  generateBtnText: { color: THEME.gold, fontWeight: 'bold', fontSize: 16 },
});
