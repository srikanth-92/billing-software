import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl, Modal,
  ScrollView, Platform,
} from 'react-native';
import Svg, { Path, G, Text as SvgText, Polyline, Line, Circle } from 'react-native-svg';
import { subscribeTodayOrders, loadOrdersByDate, loadOrdersForRange } from '../utils/storage';
import { THEME } from '../constants/theme';
import { formatCurrency, formatDateTime } from '../utils/razorpay';
import { useLayout } from '../utils/dimensions';
import { RESTAURANT_NAME, MENU_ITEMS, EMPLOYEES } from '../constants';
import { loadSession } from '../utils/session';

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Beverages'];
const CAT_COLORS = { Breakfast: '#ea580c', Lunch: '#ca8a04', Dinner: '#4f46e5', Beverages: '#0891b2' };
const CAT_EMOJI  = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Beverages: '☕' };

const VENDOR_COLORS = ['#f97316','#8b5cf6','#10b981','#3b82f6','#ec4899','#14b8a6'];

// ── helpers ───────────────────────────────────────────────────────────────────

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}

function startOfMonth(year, month) { return new Date(year, month, 1); }

function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

// ── SVG Donut Pie ─────────────────────────────────────────────────────────────

function PieChart({ slices, size = 200, onPress }) {
  const cx = size / 2, cy = size / 2, r = size * 0.38, ri = size * 0.20;
  let start = -Math.PI / 2;
  const paths = slices.map((s) => {
    const angle = s.pct * 2 * Math.PI;
    const end = start + angle;
    const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end);
    const ix1 = cx + ri * Math.cos(start), iy1 = cy + ri * Math.sin(start);
    const ix2 = cx + ri * Math.cos(end),   iy2 = cy + ri * Math.sin(end);
    const large = angle > Math.PI ? 1 : 0;
    const mid = start + angle / 2;
    const lx = cx + r * 0.7 * Math.cos(mid), ly = cy + r * 0.7 * Math.sin(mid);
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ri} ${ri} 0 ${large} 0 ${ix1} ${iy1} Z`;
    start = end;
    return { ...s, d, lx, ly };
  });
  return (
    <Svg width={size} height={size}>
      {paths.map((p) => (
        <G key={p.label} onPress={() => onPress && onPress(p.label)}>
          <Path d={p.d} fill={p.color} opacity={p.active ? 1 : 0.45} />
          {p.pct > 0.06 && (
            <SvgText x={p.lx} y={p.ly} textAnchor="middle" alignmentBaseline="middle"
              fontSize={size * 0.075} fontWeight="bold" fill="#fff">
              {Math.round(p.pct * 100)}%
            </SvgText>
          )}
        </G>
      ))}
    </Svg>
  );
}

// ── SVG Line / Trend Chart ────────────────────────────────────────────────────

function TrendChart({ series, labels, width = 320, height = 160 }) {
  const PAD = { top: 16, right: 16, bottom: 32, left: 48 };
  const W = width - PAD.left - PAD.right;
  const H = height - PAD.top - PAD.bottom;

  const allValues = series.flatMap((s) => s.data);
  const maxVal = Math.max(...allValues, 1);
  const steps = labels.length;

  function px(i) { return PAD.left + (i / Math.max(steps - 1, 1)) * W; }
  function py(v) { return PAD.top + H - (v / maxVal) * H; }

  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <Svg width={width} height={height}>
      {/* Grid lines */}
      {yTicks.map((t) => (
        <G key={t}>
          <Line x1={PAD.left} y1={py(t)} x2={PAD.left + W} y2={py(t)}
            stroke="#e2e8f0" strokeWidth={1} />
          <SvgText x={PAD.left - 6} y={py(t) + 4} textAnchor="end"
            fontSize={9} fill="#94a3b8">
            {t > 999 ? `₹${(t/1000).toFixed(1)}k` : `₹${t}`}
          </SvgText>
        </G>
      ))}

      {/* X labels — show every other label to avoid crowding */}
      {labels.map((l, i) => (
        i % Math.ceil(steps / 7) === 0 ? (
          <SvgText key={i} x={px(i)} y={height - 6} textAnchor="middle"
            fontSize={8} fill="#94a3b8">
            {l}
          </SvgText>
        ) : null
      ))}

      {/* Series lines + dots */}
      {series.map((s) => {
        const pts = s.data.map((v, i) => `${px(i)},${py(v)}`).join(' ');
        return (
          <G key={s.label}>
            <Polyline points={pts} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
            {s.data.map((v, i) => v > 0 ? (
              <Circle key={i} cx={px(i)} cy={py(v)} r={3} fill={s.color} />
            ) : null)}
          </G>
        );
      })}
    </Svg>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────────────

function CalendarModal({ visible, onClose, onSelectDate, revenueByDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const minDate = addDays(today, -90);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    const now = new Date();
    if (viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth >= now.getMonth())) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const firstDay = startOfMonth(viewYear, viewMonth).getDay(); // 0=Sun
  const totalDays = daysInMonth(viewYear, viewMonth);
  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.calendarSheet}>
          {/* Month navigation */}
          <View style={styles.calMonthRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
              <Text style={styles.calNavText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.calMonthLabel}>{monthName}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
              <Text style={styles.calNavText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day-of-week headers */}
          <View style={styles.calWeekRow}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <Text key={d} style={styles.calWeekDay}>{d}</Text>
            ))}
          </View>

          {/* Day cells */}
          <View style={styles.calGrid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e${idx}`} style={styles.calCell} />;
              const date = new Date(viewYear, viewMonth, day);
              const ds = toDateStr(date);
              const isToday = ds === toDateStr(today);
              const isFuture = date > today;
              const isPast90 = date < minDate;
              const disabled = isFuture || isPast90;
              const revenue = revenueByDate[ds] || 0;
              const hasOrders = revenue > 0;
              return (
                <TouchableOpacity
                  key={ds}
                  style={[styles.calCell, isToday && styles.calCellToday, disabled && styles.calCellDisabled]}
                  onPress={() => { if (!disabled) { onSelectDate(ds); onClose(); } }}
                  disabled={disabled}
                >
                  <Text style={[styles.calDayNum, isToday && styles.calDayNumToday, disabled && styles.calDayDisabled]}>
                    {day}
                  </Text>
                  {hasOrders && !disabled && (
                    <View style={[styles.calDot, { backgroundColor: revenue > 500 ? THEME.gold : '#10b981' }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.calLegend}>
            <View style={styles.calLegendItem}>
              <View style={[styles.calDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.calLegendText}>Has sales</Text>
            </View>
            <View style={styles.calLegendItem}>
              <View style={[styles.calDot, { backgroundColor: THEME.gold }]} />
              <Text style={styles.calLegendText}>High revenue (₹500+)</Text>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SalesScreen({ navigation, route }) {
  const session = loadSession();
  const employee = EMPLOYEES.find((e) => e.username === session?.username) || EMPLOYEES[0];
  const { isTablet } = useLayout();
  const isAdmin = employee.role === 'admin';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  // Calendar / history
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // null = today
  const [historyOrders, setHistoryOrders] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Revenue-by-date index for calendar dots (last 90 days)
  const [revenueByDate, setRevenueByDate] = useState({});

  // Admin trend data
  const [trendData, setTrendData] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);

  // Live listener for today
  useEffect(() => {
    const unsub = subscribeTodayOrders((data) => {
      setOrders(data);
      setLoading(false);
      setRefreshing(false);
    });
    return () => unsub();
  }, []);

  // Load 90-day revenue index once (for calendar dots)
  useEffect(() => {
    const to = new Date();
    const from = addDays(to, -90);
    loadOrdersForRange(toDateStr(from), toDateStr(to)).then((byDate) => {
      const rev = {};
      Object.entries(byDate).forEach(([ds, ords]) => {
        rev[ds] = ords.reduce((s, o) => s + o.total, 0);
      });
      setRevenueByDate(rev);
    });
  }, []);

  // Load trend data for admin (last 14 days per cart)
  useEffect(() => {
    if (!isAdmin) return;
    setTrendLoading(true);
    const to = new Date();
    const from = addDays(to, -13);
    loadOrdersForRange(toDateStr(from), toDateStr(to)).then((byDate) => {
      const days = Array.from({ length: 14 }, (_, i) => toDateStr(addDays(from, i)));
      const vendors = EMPLOYEES.filter(e => e.role === 'vendor').map(e => e.name);
      const series = vendors.map((name, idx) => ({
        label: name,
        color: VENDOR_COLORS[idx % VENDOR_COLORS.length],
        data: days.map((ds) => {
          const ords = byDate[ds] || [];
          return ords.filter(o => o.employeeName === name).reduce((s, o) => s + o.total, 0);
        }),
      }));
      const labels = days.map(ds => ds.slice(5)); // MM-DD
      setTrendData({ series, labels });
      setTrendLoading(false);
    });
  }, [isAdmin]);

  // Load history when a past date is selected
  useEffect(() => {
    if (!selectedDate) return;
    setHistoryLoading(true);
    loadOrdersByDate(selectedDate).then((data) => {
      setHistoryOrders(data);
      setHistoryLoading(false);
    });
  }, [selectedDate]);

  function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }

  // Use live orders for today, history orders for selected past date
  const displayOrders = selectedDate ? historyOrders : orders;
  const displayLoading = selectedDate ? historyLoading : loading;

  // ── Aggregation ─────────────────────────────────────────────────────────────
  const itemTotals = {};
  const catTotals = {};
  CATEGORIES.forEach(c => { catTotals[c] = 0; });
  displayOrders.forEach((o) => {
    o.items.forEach((item) => {
      const cat = item.category || MENU_ITEMS.find(m => m.name === item.name)?.category || 'Breakfast';
      if (!itemTotals[item.name]) itemTotals[item.name] = { qty: 0, category: cat };
      itemTotals[item.name].qty += item.qty;
      if (catTotals[cat] !== undefined) catTotals[cat] += item.qty;
    });
  });
  const grandTotal = Object.values(catTotals).reduce((s, v) => s + v, 0);
  const slices = CATEGORIES.map((cat) => ({
    label: cat, color: CAT_COLORS[cat],
    pct: grandTotal > 0 ? catTotals[cat] / grandTotal : 0,
    qty: catTotals[cat],
    active: activeCategory === null || activeCategory === cat,
  })).filter(s => s.qty > 0);

  const drillItems = activeCategory
    ? Object.entries(itemTotals)
        .filter(([, v]) => v.category === activeCategory)
        .sort((a, b) => b[1].qty - a[1].qty)
    : [];

  const totalRevenue = displayOrders.reduce((s, o) => s + o.total, 0);
  const topItem = Object.entries(itemTotals).sort((a, b) => b[1].qty - a[1].qty)[0];

  const displayDateLabel = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ── Sub-components ──────────────────────────────────────────────────────────

  const StatCard = ({ emoji, label, value, sub }) => (
    <View style={[styles.statCard, isTablet && styles.statCardTablet]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );

  const CategoryChart = () => {
    if (grandTotal === 0) return null;
    const pieSize = isTablet ? 220 : 190;
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Sales by Category</Text>
        <Text style={styles.chartHint}>Tap a slice to see items</Text>
        <View style={styles.chartBody}>
          <PieChart slices={slices} size={pieSize}
            onPress={(cat) => setActiveCategory(activeCategory === cat ? null : cat)} />
          <View style={styles.legend}>
            {slices.map(s => (
              <TouchableOpacity key={s.label} style={styles.legendRow}
                onPress={() => setActiveCategory(activeCategory === s.label ? null : s.label)}>
                <View style={[styles.legendDot, { backgroundColor: s.color, opacity: s.active ? 1 : 0.4 }]} />
                <Text style={[styles.legendLabel, !s.active && { color: THEME.slateLight }]}>
                  {CAT_EMOJI[s.label]} {s.label}
                </Text>
                <Text style={[styles.legendQty, !s.active && { color: THEME.slateLight }]}>{s.qty}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {activeCategory && drillItems.length > 0 && (
          <View style={styles.drillDown}>
            <View style={styles.drillHeader}>
              <View style={[styles.drillDot, { backgroundColor: CAT_COLORS[activeCategory] }]} />
              <Text style={[styles.drillTitle, { color: CAT_COLORS[activeCategory] }]}>
                {CAT_EMOJI[activeCategory]} {activeCategory} — Items Sold
              </Text>
            </View>
            {drillItems.map(([name, { qty }], idx) => {
              const menuItem = MENU_ITEMS.find(m => m.name === name);
              const barPct = qty / drillItems[0][1].qty;
              return (
                <View key={name} style={styles.drillRow}>
                  <Text style={styles.drillRank}>{idx + 1}</Text>
                  <Text style={styles.drillEmoji}>{menuItem?.emoji || '🍽️'}</Text>
                  <View style={styles.drillInfo}>
                    <View style={styles.drillNameRow}>
                      <Text style={styles.drillName}>{name}</Text>
                      <Text style={styles.drillQty}>{qty} sold</Text>
                    </View>
                    <View style={styles.drillBarBg}>
                      <View style={[styles.drillBar, { width: `${Math.round(barPct * 100)}%`, backgroundColor: CAT_COLORS[activeCategory] }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        {activeCategory && drillItems.length === 0 && (
          <Text style={styles.drillEmpty}>No {activeCategory} items sold on this date.</Text>
        )}
      </View>
    );
  };

  const AdminTrendChart = () => {
    if (!isAdmin) return null;
    return (
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Revenue Trend — Last 14 Days</Text>
        <Text style={styles.chartHint}>Per cart daily revenue</Text>
        {trendLoading || !trendData ? (
          <ActivityIndicator color={THEME.gold} style={{ marginVertical: 24 }} />
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }}>
              <TrendChart
                series={trendData.series}
                labels={trendData.labels}
                width={Math.max(320, trendData.labels.length * 28)}
                height={180}
              />
            </ScrollView>
            {/* Legend */}
            <View style={styles.trendLegend}>
              {trendData.series.map(s => (
                <View key={s.label} style={styles.trendLegendItem}>
                  <View style={[styles.trendLegendDot, { backgroundColor: s.color }]} />
                  <Text style={styles.trendLegendLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    );
  };

  const OrderRow = ({ order }) => {
    const isOpen = expanded === order.orderId;
    return (
      <View style={styles.orderCard}>
        <TouchableOpacity style={styles.orderHeader}
          onPress={() => setExpanded(isOpen ? null : order.orderId)} activeOpacity={0.7}>
          <View style={styles.orderHeaderLeft}>
            <Text style={styles.orderBadge}>#{order.orderId.slice(-8)}</Text>
            <View>
              <Text style={styles.orderTime}>{formatDateTime(new Date(order.savedAt))}</Text>
              <Text style={styles.orderEmployee}>by {order.employeeName}</Text>
            </View>
          </View>
          <View style={styles.orderHeaderRight}>
            <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
            <Text style={styles.orderChevron}>{isOpen ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>
        {isOpen && (
          <View style={styles.orderBody}>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.orderItemRow}>
                <Text style={styles.orderItemEmoji}>{MENU_ITEMS.find(m => m.name === item.name)?.emoji || '🍽️'}</Text>
                <Text style={styles.orderItemName}>{item.name}</Text>
                <Text style={styles.orderItemQty}>×{item.qty}</Text>
                <Text style={styles.orderItemPrice}>{formatCurrency(item.price * item.qty)}</Text>
              </View>
            ))}
            <View style={styles.orderFooter}>
              <Text style={styles.orderFooterText}>Subtotal: {formatCurrency(order.subtotal)}</Text>
              {order.tax > 0 && <Text style={styles.orderFooterText}>GST (5%): {formatCurrency(order.tax)}</Text>}
              <Text style={styles.orderFooterTotal}>Total: {formatCurrency(order.total)}</Text>
              {order.paymentId && <Text style={styles.orderPayRef}>Razorpay Ref: {order.paymentId}</Text>}
            </View>
          </View>
        )}
      </View>
    );
  };

  if (displayLoading && displayOrders.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Header navigation={navigation} onCalendar={() => setShowCalendar(true)} selectedDate={selectedDate} onClearDate={() => setSelectedDate(null)} />
        <View style={styles.loadingWrap}><ActivityIndicator size="large" color="#f97316" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header navigation={navigation} onCalendar={() => setShowCalendar(true)} selectedDate={selectedDate} onClearDate={() => setSelectedDate(null)} />

      <FlatList
        data={displayOrders}
        keyExtractor={o => o.orderId}
        refreshControl={!selectedDate ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" /> : undefined}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.dateLabel}>{displayDateLabel}</Text>

            <View style={[styles.statsRow, isTablet && styles.statsRowTablet]}>
              <StatCard emoji="💰" label="Total Revenue" value={formatCurrency(totalRevenue)} />
              <StatCard emoji="🧾" label="Total Orders" value={String(displayOrders.length)} />
              {topItem ? <StatCard emoji="🏆" label="Top Item" value={topItem[0]} sub={`${topItem[1].qty} sold`} /> : null}
            </View>

            <CategoryChart />
            <AdminTrendChart />

            <Text style={styles.ordersTitle}>
              {displayOrders.length > 0 ? `All Orders (${displayOrders.length})` : 'No orders on this date'}
            </Text>
          </View>
        }
        renderItem={({ item }) => <OrderRow order={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No orders recorded.</Text>
            <Text style={styles.emptyHint}>Orders appear here automatically after payment.</Text>
          </View>
        }
      />

      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onSelectDate={(ds) => { setSelectedDate(ds); setExpanded(null); setActiveCategory(null); }}
        revenueByDate={revenueByDate}
      />
    </SafeAreaView>
  );
}

function Header({ navigation, onCalendar, selectedDate, onClearDate }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={{ alignItems: 'center' }}>
        <Text style={styles.headerTitle}>
          {selectedDate ? 'Historical Sales' : "Today's Sales"}
        </Text>
        <Text style={styles.headerSub}>{RESTAURANT_NAME}</Text>
      </View>
      <View style={styles.headerRight}>
        {selectedDate && (
          <TouchableOpacity onPress={onClearDate} style={styles.todayBtn}>
            <Text style={styles.todayBtnText}>Today</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onCalendar} style={styles.calBtn}>
          <Text style={styles.calBtnText}>📅</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.offWhite, ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' } : {}) },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: THEME.navy, paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { paddingVertical: 4, paddingRight: 8, width: 60 },
  backText: { color: THEME.white, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.white, textAlign: 'center' },
  headerSub: { fontSize: 12, color: THEME.slateLight, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 60, justifyContent: 'flex-end' },
  calBtn: { padding: 4 },
  calBtnText: { fontSize: 22 },
  todayBtn: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  todayBtnText: { color: THEME.gold, fontSize: 12, fontWeight: '600' },

  listContent: { paddingBottom: 120 },
  listHeader: { padding: 16 },
  dateLabel: { fontSize: 14, color: THEME.slate, marginBottom: 14 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statsRowTablet: { gap: 16 },
  statCard: {
    flex: 1, backgroundColor: THEME.white, borderRadius: 14, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  statCardTablet: { padding: 20 },
  statEmoji: { fontSize: 26, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: THEME.text, textAlign: 'center' },
  statLabel: { fontSize: 11, color: THEME.slate, marginTop: 3, textAlign: 'center' },
  statSub: { fontSize: 11, color: THEME.gold, fontWeight: '600', marginTop: 2 },

  // ── Chart card ──────────────────────────────────────────────────────────────
  chartCard: {
    backgroundColor: THEME.white, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  chartTitle: { fontSize: 16, fontWeight: 'bold', color: THEME.text, marginBottom: 2 },
  chartHint: { fontSize: 12, color: THEME.slateLight, marginBottom: 14 },
  chartBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  legend: { flex: 1, gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: THEME.text },
  legendQty: { fontSize: 13, fontWeight: 'bold', color: THEME.slate },

  drillDown: { marginTop: 16, borderTopWidth: 1, borderTopColor: THEME.rowBorder, paddingTop: 14 },
  drillHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  drillDot: { width: 10, height: 10, borderRadius: 5 },
  drillTitle: { fontSize: 14, fontWeight: 'bold' },
  drillRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, gap: 8 },
  drillRank: { fontSize: 12, fontWeight: 'bold', color: THEME.slateLight, width: 18, textAlign: 'center' },
  drillEmoji: { fontSize: 20, width: 28 },
  drillInfo: { flex: 1 },
  drillNameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  drillName: { fontSize: 13, fontWeight: '600', color: THEME.text, flex: 1 },
  drillQty: { fontSize: 12, fontWeight: 'bold', color: THEME.slate },
  drillBarBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  drillBar: { height: 6, borderRadius: 3 },
  drillEmpty: { marginTop: 12, fontSize: 13, color: THEME.slateLight, textAlign: 'center' },

  // ── Trend chart ─────────────────────────────────────────────────────────────
  trendLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  trendLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendLegendDot: { width: 10, height: 10, borderRadius: 5 },
  trendLegendLabel: { fontSize: 12, color: THEME.slate, fontWeight: '600' },

  ordersTitle: { fontSize: 16, fontWeight: 'bold', color: THEME.text, marginBottom: 8 },

  // ── Order rows ──────────────────────────────────────────────────────────────
  orderCard: {
    backgroundColor: THEME.white, borderRadius: 14, marginHorizontal: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  orderHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderBadge: {
    backgroundColor: THEME.goldPale, color: THEME.gold, fontSize: 11, fontWeight: 'bold',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden',
  },
  orderTime: { fontSize: 13, color: THEME.text, fontWeight: '600' },
  orderEmployee: { fontSize: 11, color: THEME.slateLight, marginTop: 2 },
  orderHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderTotal: { fontSize: 16, fontWeight: 'bold', color: THEME.gold },
  orderChevron: { fontSize: 11, color: THEME.slateLight },
  orderBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  orderItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  orderItemEmoji: { fontSize: 18, marginRight: 8 },
  orderItemName: { flex: 1, fontSize: 13, color: '#334155' },
  orderItemQty: { fontSize: 12, color: THEME.slate, marginRight: 12 },
  orderItemPrice: { fontSize: 13, fontWeight: '600', color: THEME.text },
  orderFooter: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  orderFooterText: { fontSize: 12, color: THEME.slate, marginBottom: 2 },
  orderFooterTotal: { fontSize: 14, fontWeight: 'bold', color: THEME.text, marginTop: 4 },
  orderPayRef: { fontSize: 11, color: THEME.slateLight, marginTop: 4 },

  emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: 'bold', color: THEME.text, marginBottom: 8 },
  emptyHint: { fontSize: 13, color: THEME.slateLight, textAlign: 'center', lineHeight: 20 },

  // ── Calendar modal ──────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  calendarSheet: {
    backgroundColor: THEME.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  calMonthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calNavBtn: { padding: 8 },
  calNavText: { fontSize: 28, color: THEME.navy, fontWeight: 'bold', lineHeight: 30 },
  calMonthLabel: { fontSize: 17, fontWeight: 'bold', color: THEME.navy },
  calWeekRow: { flexDirection: 'row', marginBottom: 8 },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: THEME.slate },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
  },
  calCellToday: { backgroundColor: THEME.navy, borderRadius: 20 },
  calCellDisabled: { opacity: 0.25 },
  calDayNum: { fontSize: 14, color: THEME.text, fontWeight: '500' },
  calDayNumToday: { color: THEME.gold, fontWeight: 'bold' },
  calDayDisabled: { color: THEME.slateLight },
  calDot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  calLegend: { flexDirection: 'row', gap: 20, marginTop: 16, justifyContent: 'center' },
  calLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calLegendText: { fontSize: 12, color: THEME.slate },
});
