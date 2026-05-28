import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, Platform,
} from 'react-native';
import { THEME } from '../constants/theme';
import { JUNE_MENU, JUNE_MENU_MAP, JUNE_SUNDAYS } from '../constants/juneMenu';

// ── Calendar helpers ──────────────────────────────────────────────────────────
const JUNE_DAYS = 30;
const JUNE_START_DOW = 1; // June 1, 2026 is a Monday (0=Sun)
const DAY_LABELS = ['S','M','T','W','T','F','S'];

const COURSE_COLORS = {
  'Welcome ♦':    { bg: '#FCE4EC', text: '#880E4F' },
  'Salad':        { bg: '#F9FBE7', text: '#33691E' },
  'Starter':      { bg: '#FFF3E0', text: '#E65100' },
  'Chapati':      { bg: '#FFF8E1', text: '#F57F17' },
  'Rice':         { bg: '#E8F5E9', text: '#1B5E20' },
  'Raita':        { bg: '#E0F7FA', text: '#006064' },
  'Dal':          { bg: '#EDE7F6', text: '#4A148C' },
  'Chinese Gravy':{ bg: '#FBE9E7', text: '#BF360C' },
  'Dry Sabzi':    { bg: '#F3E5F5', text: '#6A1B9A' },
  'Gravy ★':      { bg: '#FFEBEE', text: '#B71C1C' },
  'Dessert':      { bg: '#F3E5F5', text: '#6A1B9A' },
  'Hot Drink':    { bg: '#FFF3E0', text: '#BF360C' },
  'Fruit':        { bg: '#F9FBE7', text: '#558B2F' },
  'Fixed':        { bg: '#FFF8E1', text: '#795548' },
  'Rice Item':    { bg: '#E8F5E9', text: '#2E7D32' },
  'Floating':     { bg: '#E3F2FD', text: '#0D47A1' },
  'Main':         { bg: '#FFF3E0', text: '#E65100' },
  'Sabzi':        { bg: '#F9FBE7', text: '#33691E' },
  'Dip':          { bg: '#FCE4EC', text: '#880E4F' },
  'Side':         { bg: '#ECEFF1', text: '#546E7A' },
};

const MEAL_HEADER = {
  breakfast: { bg: '#BF360C', label: 'BREAKFAST' },
  lunch:     { bg: '#2E7D32', label: 'LUNCH' },
  dinner:    { bg: '#1565C0', label: 'DINNER' },
};

function courseStyle(course) {
  return COURSE_COLORS[course] || { bg: '#F5F5F5', text: '#424242' };
}

function priceText(row) {
  if (row.half !== undefined) return `₹${row.half} / ₹${row.full}`;
  if (row.price !== undefined) return `₹${row.price}`;
  return '';
}

// ── Components ────────────────────────────────────────────────────────────────
function MealSection({ label, rows, headerBg }) {
  const [open, setOpen] = useState(true);
  return (
    <View style={styles.mealCard}>
      <TouchableOpacity
        style={[styles.mealHeader, { backgroundColor: headerBg }]}
        onPress={() => setOpen((o) => !o)}
        activeOpacity={0.85}
      >
        <Text style={styles.mealHeaderText}>{label}</Text>
        <Text style={styles.mealToggle}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View>
          {/* Column header */}
          <View style={styles.colHeader}>
            <Text style={[styles.colCourse, { color: '#78909C' }]}>COURSE</Text>
            <Text style={[styles.colItem,   { color: '#78909C' }]}>ITEM</Text>
            <Text style={[styles.colPrice,  { color: '#78909C' }]}>PRICE (₹)</Text>
          </View>
          {rows.map((row, idx) => {
            const cs = courseStyle(row.course);
            return (
              <View
                key={idx}
                style={[styles.itemRow, { backgroundColor: cs.bg },
                  idx < rows.length - 1 && styles.itemRowBorder]}
              >
                <View style={[styles.coursePill, { backgroundColor: cs.text + '22' }]}>
                  <Text style={[styles.courseText, { color: cs.text }]} numberOfLines={2}>
                    {row.course}
                  </Text>
                </View>
                <Text style={[styles.itemName, row.isPaneer && styles.paneerText]} numberOfLines={2}>
                  {row.item}
                </Text>
                <Text style={styles.priceText}>{priceText(row)}</Text>
              </View>
            );
          })}
          {label === 'LUNCH' && (
            <View style={styles.halfFullNote}>
              <Text style={styles.halfFullNoteText}>
                Half / Full portions available for Starters, Dal, Dry Sabzi & Paneer Gravy
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function Calendar({ selectedKey, onSelect }) {
  const cells = [];
  // Leading blanks
  for (let i = 0; i < JUNE_START_DOW; i++) cells.push(null);
  for (let d = 1; d <= JUNE_DAYS; d++) cells.push(d);

  return (
    <View style={styles.calendar}>
      <Text style={styles.calMonthLabel}>June 2026</Text>
      {/* Day-of-week headers */}
      <View style={styles.calDowRow}>
        {DAY_LABELS.map((l, i) => (
          <Text key={i} style={[styles.calDow, i === 0 || i === 6 ? styles.calDowWeekend : null]}>{l}</Text>
        ))}
      </View>
      {/* Date grid */}
      <View style={styles.calGrid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e${idx}`} style={styles.calCell} />;
          const dateKey = `2026-06-${String(day).padStart(2, '0')}`;
          const isSunday = JUNE_SUNDAYS.includes(dateKey);
          const hasMenu = !!JUNE_MENU_MAP[dateKey];
          const isSelected = selectedKey === dateKey;
          const isToday = dateKey === new Date().toISOString().slice(0, 10);
          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.calCell,
                hasMenu && styles.calCellActive,
                isSunday && styles.calCellSunday,
                isSelected && styles.calCellSelected,
                isToday && styles.calCellToday,
              ]}
              onPress={() => hasMenu && onSelect(dateKey)}
              disabled={!hasMenu}
              activeOpacity={hasMenu ? 0.7 : 1}
            >
              <Text style={[
                styles.calDayText,
                hasMenu && styles.calDayTextActive,
                isSunday && styles.calDayTextSunday,
                isSelected && styles.calDayTextSelected,
              ]}>{day}</Text>
              {isSunday && <Text style={styles.calClosedDot}>✕</Text>}
              {hasMenu && !isSunday && <View style={styles.calDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Legend */}
      <View style={styles.calLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: THEME.navy }]} />
          <Text style={styles.legendText}>Open day</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Sunday (closed)</Text>
        </View>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function DayMenuScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const defaultKey = JUNE_MENU_MAP[today] ? today : JUNE_MENU[0].dateKey;
  const [selectedKey, setSelectedKey] = useState(defaultKey);

  const dayData = JUNE_MENU_MAP[selectedKey];
  const isSunday = JUNE_SUNDAYS.includes(selectedKey);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Day's Menu</Text>
        <Text style={styles.pageSubtitle}>June 2026 · 150 Pax · Mon–Sat</Text>
      </View>

      <View style={styles.body}>
        {/* ── Calendar side panel ── */}
        <View style={styles.sidePanel}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Calendar selectedKey={selectedKey} onSelect={setSelectedKey} />
            {dayData && (
              <View style={styles.selectedInfo}>
                <Text style={styles.selectedDate}>{dayData.date}</Text>
                <View style={[styles.bfTagBadge,
                  dayData.bfTag.includes('✦') ? styles.bfTagFloating : styles.bfTagKarnataka]}>
                  <Text style={styles.bfTagText}>{dayData.bfTag}</Text>
                </View>
                <Text style={styles.selectedInfoNote}>Week {dayData.week}</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* ── Day menu detail ── */}
        <ScrollView style={styles.detail} contentContainerStyle={styles.detailContent}>
          {isSunday ? (
            <View style={styles.closedCard}>
              <Text style={styles.closedEmoji}>🔒</Text>
              <Text style={styles.closedTitle}>Closed — Sunday</Text>
              <Text style={styles.closedSub}>Select a Mon–Sat date from the calendar.</Text>
            </View>
          ) : dayData ? (
            <>
              <MealSection
                label={`BREAKFAST  [${dayData.bfTag}]`}
                rows={dayData.breakfast}
                headerBg={MEAL_HEADER.breakfast.bg}
              />
              <MealSection
                label="LUNCH"
                rows={dayData.lunch}
                headerBg={MEAL_HEADER.lunch.bg}
              />
              <MealSection
                label="DINNER"
                rows={dayData.dinner}
                headerBg={MEAL_HEADER.dinner.bg}
              />
              <View style={styles.footerNote}>
                <Text style={styles.footerText}>
                  ★ Paneer items shown in red · ♦ Mapro Welcome Drink · Chapati ₹15/pc · Raita added with Biryani
                </Text>
                <Text style={styles.footerText}>
                  Half/Full: Starter · Dal · Dry Sabzi · Paneer Gravy = ₹80 / ₹150
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.closedCard}>
              <Text style={styles.closedEmoji}>📅</Text>
              <Text style={styles.closedTitle}>Select a date</Text>
              <Text style={styles.closedSub}>Pick any open day from the calendar.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CAL_CELL = 36;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.offWhite },

  pageHeader: {
    backgroundColor: THEME.navy, paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: THEME.goldBorder,
  },
  pageTitle:    { fontSize: 18, fontWeight: 'bold', color: THEME.white },
  pageSubtitle: { fontSize: 12, color: THEME.slateLight, marginTop: 2 },

  body: { flex: 1, flexDirection: 'row', minHeight: 0 },

  // ── Side panel ─────────────────────────────────────────────────────────────
  sidePanel: {
    width: Platform.OS === 'web' ? 280 : 230,
    backgroundColor: THEME.white,
    borderRightWidth: 1, borderRightColor: '#e2e8f0',
    flexShrink: 0,
  },

  calendar: { padding: 12 },
  calMonthLabel: {
    fontSize: 13, fontWeight: '700', color: THEME.navy,
    textAlign: 'center', marginBottom: 8,
  },
  calDowRow: { flexDirection: 'row', marginBottom: 4 },
  calDow: {
    width: CAL_CELL, textAlign: 'center', fontSize: 10,
    fontWeight: '700', color: THEME.slate,
  },
  calDowWeekend: { color: '#ef4444' },
  calGrid:  { flexDirection: 'row', flexWrap: 'wrap' },
  calCell:  {
    width: CAL_CELL, height: CAL_CELL + 6,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, marginBottom: 2,
  },
  calCellActive:   { backgroundColor: '#EEF2FF' },
  calCellSunday:   { backgroundColor: '#FEF2F2' },
  calCellSelected: { backgroundColor: THEME.navy },
  calCellToday:    { borderWidth: 2, borderColor: THEME.gold },
  calDayText:      { fontSize: 12, color: '#CBD5E1', fontWeight: '500' },
  calDayTextActive:   { color: THEME.navy, fontWeight: '700' },
  calDayTextSunday:   { color: '#ef4444' },
  calDayTextSelected: { color: THEME.white },
  calClosedDot: { fontSize: 7, color: '#ef4444', marginTop: 1 },
  calDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: THEME.navy, marginTop: 2,
  },

  calLegend: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: THEME.slateLight },

  selectedInfo: {
    margin: 12, padding: 12, backgroundColor: '#F8FAFC',
    borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0',
  },
  selectedDate: { fontSize: 13, fontWeight: '700', color: THEME.navy, marginBottom: 6 },
  bfTagBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 4 },
  bfTagKarnataka: { backgroundColor: '#E8F5E9' },
  bfTagFloating:  { backgroundColor: '#FFF3E0' },
  bfTagText: { fontSize: 11, fontWeight: '600', color: THEME.navy },
  selectedInfoNote: { fontSize: 11, color: THEME.slateLight },

  // ── Detail panel ───────────────────────────────────────────────────────────
  detail: { flex: 1 },
  detailContent: { padding: 12, paddingBottom: 40 },

  mealCard: {
    backgroundColor: THEME.white, borderRadius: 12, marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  mealHeaderText: { fontSize: 13, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  mealToggle: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  colHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 5,
    backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  colCourse: { width: 90, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  colItem:   { flex: 1,   fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  colPrice:  { width: 80, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textAlign: 'right' },

  itemRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 7, minHeight: 40,
  },
  itemRowBorder: { borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' },

  coursePill: {
    width: 82, marginRight: 8,
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, alignSelf: 'center',
  },
  courseText: { fontSize: 9, fontWeight: '700', textAlign: 'center' },

  itemName:   { flex: 1, fontSize: 12, fontWeight: '600', color: THEME.text, marginRight: 4 },
  paneerText: { color: '#B71C1C' },
  priceText:  { width: 80, fontSize: 11, fontWeight: '700', color: '#B71C1C', textAlign: 'right' },

  halfFullNote: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#FFF8E1', borderTopWidth: 0.5, borderTopColor: '#e2e8f0',
  },
  halfFullNoteText: { fontSize: 10, color: '#795548', fontStyle: 'italic' },

  footerNote: {
    padding: 12, backgroundColor: '#FAFAFA',
    borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 4,
  },
  footerText: { fontSize: 10, color: THEME.slateLight, marginBottom: 2 },

  closedCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80,
  },
  closedEmoji: { fontSize: 48, marginBottom: 12 },
  closedTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.slate, marginBottom: 6 },
  closedSub:   { fontSize: 13, color: THEME.slateLight },
});
