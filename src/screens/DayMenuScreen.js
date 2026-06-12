import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { THEME } from '../constants/theme';
import { JUNE_MENU, JUNE_MENU_MAP, JUNE_SUNDAYS } from '../constants/juneMenu';

// ── Calendar helpers ──────────────────────────────────────────────────────────
const JUNE_DAYS = 30;
const JUNE_START_DOW = 1; // June 1, 2026 is a Monday (0=Sun)
const DAY_LABELS = ['S','M','T','W','T','F','S'];
const MEAL_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Beverages'];

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
  breakfast: { bg: '#BF360C' },
  lunch:     { bg: '#2E7D32' },
  dinner:    { bg: '#1565C0' },
};

const CATEGORY_META = {
  Breakfast: { emoji: '🌅', color: '#ea580c', bg: '#fff7ed' },
  Lunch:     { emoji: '☀️',  color: '#ca8a04', bg: '#fefce8' },
  Dinner:    { emoji: '🌙', color: '#4f46e5', bg: '#eef2ff' },
  Beverages: { emoji: '☕', color: '#0891b2', bg: '#ecfeff' },
};

function courseStyle(course) {
  return COURSE_COLORS[course] || { bg: '#F5F5F5', text: '#424242' };
}

function priceText(row) {
  if (row.half !== undefined) return `₹${row.half} / ₹${row.full}`;
  if (row.price !== undefined) return `₹${row.price}`;
  return '';
}

// ── Day View Components ───────────────────────────────────────────────────────
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
  for (let i = 0; i < JUNE_START_DOW; i++) cells.push(null);
  for (let d = 1; d <= JUNE_DAYS; d++) cells.push(d);

  return (
    <View style={styles.calendar}>
      <Text style={styles.calMonthLabel}>June 2026</Text>
      <View style={styles.calDowRow}>
        {DAY_LABELS.map((l, i) => (
          <Text key={i} style={[styles.calDow, (i === 0 || i === 6) && styles.calDowWeekend]}>{l}</Text>
        ))}
      </View>
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
export default function DayMenuScreen({ initialMenu, onSave }) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultKey = JUNE_MENU_MAP[today] ? today : JUNE_MENU[0].dateKey;
  const [selectedKey, setSelectedKey] = useState(defaultKey);

  // right panel mode
  const [rightMode, setRightMode] = useState('view'); // 'view' | 'edit'

  // edit mode state
  const [editMenu, setEditMenu] = useState(null);
  const [activeMeal, setActiveMeal] = useState('Breakfast');
  const [newItem, setNewItem] = useState({ name: '', price: '', emoji: '', description: '' });
  const [addError, setAddError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialMenu && !editMenu) setEditMenu(initialMenu);
  }, [initialMenu]);

  const dayData = JUNE_MENU_MAP[selectedKey];
  const isSunday = JUNE_SUNDAYS.includes(selectedKey);

  // ── Edit mode handlers ─────────────────────────────────────────────────────
  function updateName(cat, id, val) {
    setEditMenu((prev) => ({
      ...prev,
      [cat]: prev[cat].map((item) => item.id === id ? { ...item, name: val } : item),
    }));
  }

  function updatePrice(cat, id, val) {
    setEditMenu((prev) => ({
      ...prev,
      [cat]: prev[cat].map((item) => item.id === id ? { ...item, price: val } : item),
    }));
  }

  function removeItem(cat, id) {
    setEditMenu((prev) => ({ ...prev, [cat]: prev[cat].filter((i) => i.id !== id) }));
  }

  function addItem() {
    const name = newItem.name.trim();
    const price = parseFloat(newItem.price);
    if (!name || isNaN(price) || price <= 0) {
      setAddError('Please enter a name and a valid price.');
      return;
    }
    setAddError('');
    const id = `custom_${Date.now()}`;
    setEditMenu((prev) => ({
      ...prev,
      [activeMeal]: [
        ...(prev[activeMeal] || []),
        {
          id, name, price,
          emoji: newItem.emoji.trim() || '🍽️',
          description: newItem.description.trim(),
          category: activeMeal,
        },
      ],
    }));
    setNewItem({ name: '', price: '', emoji: '', description: '' });
  }

  async function handleSave() {
    if (!editMenu) return;
    const processed = {};
    Object.keys(editMenu).forEach((cat) => {
      processed[cat] = editMenu[cat].map((item) => ({
        ...item,
        price: typeof item.price === 'string' ? (parseFloat(item.price) || 0) : item.price,
      }));
    });
    setSaving(true);
    await onSave(processed);
    setSaving(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Day's Menu</Text>
        <Text style={styles.pageSubtitle}>June 2026 · 150 Pax · Mon–Sat</Text>
      </View>

      <View style={styles.body}>

        {/* Left: calendar side panel */}
        <View style={styles.sidePanel}>
          <ScrollView style={styles.sideScroll} showsVerticalScrollIndicator={true}>
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

        {/* Right: mode toggle + content */}
        <View style={styles.rightPanel}>

          {/* Sub-tab bar */}
          <View style={styles.rightTabBar}>
            <TouchableOpacity
              style={[styles.rightTab, rightMode === 'view' && styles.rightTabActive]}
              onPress={() => setRightMode('view')}
            >
              <Text style={[styles.rightTabText, rightMode === 'view' && styles.rightTabTextActive]}>
                📋  Day View
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rightTab, rightMode === 'edit' && styles.rightTabActive]}
              onPress={() => setRightMode('edit')}
            >
              <Text style={[styles.rightTabText, rightMode === 'edit' && styles.rightTabTextActive]}>
                ✏️  Edit Prices
              </Text>
            </TouchableOpacity>
          </View>

          {/* Day View */}
          {rightMode === 'view' && (
            <ScrollView
              style={styles.detail}
              contentContainerStyle={styles.detailContent}
              showsVerticalScrollIndicator={true}
            >
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
                      ★ Paneer items shown in red · Chapati ₹15/pc · Raita added with Biryani
                    </Text>
                    <Text style={styles.footerText}>
                      Half / Full: Starter · Dal · Dry Sabzi · Paneer Gravy = ₹80 / ₹150
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
          )}

          {/* Edit Prices */}
          {rightMode === 'edit' && (
            editMenu ? (
              <ScrollView
                style={styles.detail}
                contentContainerStyle={styles.editorContent}
                showsVerticalScrollIndicator={true}
              >
                {/* Meal category tabs */}
                <View style={styles.mealTabs}>
                  {MEAL_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.mealTab, activeMeal === cat && styles.mealTabActive]}
                      onPress={() => setActiveMeal(cat)}
                    >
                      <Text style={[styles.mealTabText, activeMeal === cat && styles.mealTabTextActive]}>
                        {CATEGORY_META[cat].emoji} {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Existing items */}
                <View style={styles.editorCard}>
                  <Text style={styles.editorCardTitle}>{activeMeal} Items</Text>
                  {(editMenu[activeMeal] || []).map((item) => (
                    <View key={item.id} style={styles.editorRow}>
                      <Text style={styles.editorEmoji}>{item.emoji}</Text>
                      <TextInput
                        style={styles.nameInput}
                        value={item.name}
                        onChangeText={(v) => updateName(activeMeal, item.id, v)}
                        placeholder="Item name"
                      />
                      <View style={styles.priceInputWrap}>
                        <Text style={styles.rupee}>₹</Text>
                        <TextInput
                          style={styles.priceInput}
                          value={String(item.price)}
                          onChangeText={(v) => updatePrice(activeMeal, item.id, v)}
                          keyboardType="numeric"
                          placeholder="0"
                        />
                      </View>
                      <TouchableOpacity onPress={() => removeItem(activeMeal, item.id)} style={styles.removeBtn}>
                        <Text style={styles.removeBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {/* Add new item */}
                <View style={styles.editorCard}>
                  <Text style={styles.editorCardTitle}>Add New Item to {activeMeal}</Text>
                  <View style={styles.addRow}>
                    <TextInput
                      style={[styles.newInput, { width: 44 }]}
                      value={newItem.emoji}
                      onChangeText={(v) => setNewItem((p) => ({ ...p, emoji: v }))}
                      placeholder="🍽️"
                    />
                    <TextInput
                      style={[styles.newInput, { flex: 1 }]}
                      value={newItem.name}
                      onChangeText={(v) => { setAddError(''); setNewItem((p) => ({ ...p, name: v })); }}
                      placeholder="Item name"
                    />
                    <View style={styles.priceInputWrap}>
                      <Text style={styles.rupee}>₹</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={newItem.price}
                        onChangeText={(v) => { setAddError(''); setNewItem((p) => ({ ...p, price: v })); }}
                        keyboardType="numeric"
                        placeholder="0"
                      />
                    </View>
                  </View>
                  <TextInput
                    style={[styles.newInput, { marginTop: 8 }]}
                    value={newItem.description}
                    onChangeText={(v) => setNewItem((p) => ({ ...p, description: v }))}
                    placeholder="Description (optional)"
                  />
                  {addError ? <Text style={styles.addError}>{addError}</Text> : null}
                  <TouchableOpacity style={styles.addBtn} onPress={addItem}>
                    <Text style={styles.addBtnText}>+ Add Item to {activeMeal}</Text>
                  </TouchableOpacity>
                </View>

                {/* Save */}
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.saveBtnText}>Save Menu for All Vendors</Text>}
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={THEME.navy} size="large" />
              </View>
            )
          )}

        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const CAL_CELL = 36;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: THEME.offWhite,
  },

  pageHeader: {
    backgroundColor: THEME.navy,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.goldBorder,
  },
  pageTitle:    { fontSize: 18, fontWeight: 'bold', color: THEME.white },
  pageSubtitle: { fontSize: 12, color: THEME.slateLight, marginTop: 2 },

  body: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'row',
  },

  sidePanel: {
    width: Platform.OS === 'web' ? 280 : 230,
    minHeight: 0,
    backgroundColor: THEME.white,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  sideScroll: {
    flex: 1,
    minHeight: 0,
  },

  rightPanel: {
    flex: 1,
    minHeight: 0,
    flexDirection: 'column',
  },

  // ── Right panel sub-tabs ───────────────────────────────────────────────────
  rightTabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  rightTab: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  rightTabActive: {
    borderBottomColor: THEME.navy,
  },
  rightTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.slateLight,
  },
  rightTabTextActive: {
    color: THEME.navy,
  },

  detail: {
    flex: 1,
    minHeight: 0,
  },
  detailContent: {
    padding: 12,
    paddingBottom: 40,
  },

  // ── Calendar ────────────────────────────────────────────────────────────────
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
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: CAL_CELL, height: CAL_CELL + 6,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, marginBottom: 2,
  },
  calCellActive:      { backgroundColor: '#EEF2FF' },
  calCellSunday:      { backgroundColor: '#FEF2F2' },
  calCellSelected:    { backgroundColor: THEME.navy },
  calCellToday:       { borderWidth: 2, borderColor: THEME.gold },
  calDayText:         { fontSize: 12, color: '#CBD5E1', fontWeight: '500' },
  calDayTextActive:   { color: THEME.navy, fontWeight: '700' },
  calDayTextSunday:   { color: '#ef4444' },
  calDayTextSelected: { color: THEME.white },
  calClosedDot: { fontSize: 7, color: '#ef4444', marginTop: 1 },
  calDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: THEME.navy, marginTop: 2,
  },
  calLegend: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: 8, paddingTop: 8,
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: THEME.slateLight },

  selectedInfo: {
    margin: 12, padding: 12,
    backgroundColor: '#F8FAFC', borderRadius: 10,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  selectedDate:     { fontSize: 13, fontWeight: '700', color: THEME.navy, marginBottom: 6 },
  bfTagBadge:       { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginBottom: 4 },
  bfTagKarnataka:   { backgroundColor: '#E8F5E9' },
  bfTagFloating:    { backgroundColor: '#FFF3E0' },
  bfTagText:        { fontSize: 11, fontWeight: '600', color: THEME.navy },
  selectedInfoNote: { fontSize: 11, color: THEME.slateLight },

  // ── Meal cards (day view) ──────────────────────────────────────────────────
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
  mealToggle:     { color: 'rgba(255,255,255,0.7)', fontSize: 12 },

  colHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 5,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
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
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 6, alignSelf: 'center',
  },
  courseText: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  itemName:   { flex: 1, fontSize: 12, fontWeight: '600', color: THEME.text, marginRight: 4 },
  paneerText: { color: '#B71C1C' },
  priceText:  { width: 80, fontSize: 11, fontWeight: '700', color: '#B71C1C', textAlign: 'right' },

  halfFullNote: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: '#FFF8E1',
    borderTopWidth: 0.5, borderTopColor: '#e2e8f0',
  },
  halfFullNoteText: { fontSize: 10, color: '#795548', fontStyle: 'italic' },

  footerNote: {
    padding: 12, backgroundColor: '#FAFAFA',
    borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 4,
  },
  footerText: { fontSize: 10, color: THEME.slateLight, marginBottom: 2 },

  closedCard: { alignItems: 'center', paddingTop: 80 },
  closedEmoji: { fontSize: 48, marginBottom: 12 },
  closedTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.slate, marginBottom: 6 },
  closedSub:   { fontSize: 13, color: THEME.slateLight },

  // ── Edit prices (editor view) ──────────────────────────────────────────────
  editorContent: { padding: 16, paddingBottom: 60 },

  mealTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  mealTab: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5,
    borderColor: THEME.goldBorder, backgroundColor: THEME.white,
  },
  mealTabActive: { backgroundColor: THEME.navy, borderColor: THEME.navy },
  mealTabText: { fontSize: 13, fontWeight: '600', color: THEME.slate },
  mealTabTextActive: { color: THEME.white },

  editorCard: {
    backgroundColor: THEME.white, borderRadius: 14, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  editorCardTitle: {
    fontSize: 13, fontWeight: '700', color: THEME.slate,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },

  editorRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  editorEmoji: { fontSize: 22, width: 30, flexShrink: 0 },
  nameInput: {
    flex: 1, minWidth: 80, borderWidth: 1, borderColor: THEME.goldBorder, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: THEME.text, backgroundColor: THEME.offWhite,
  },
  priceInputWrap: {
    flexShrink: 0, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: THEME.goldBorder,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8, backgroundColor: THEME.offWhite,
  },
  rupee: { fontSize: 13, color: THEME.slate, marginRight: 2 },
  priceInput: { fontSize: 13, color: THEME.text, width: 52 },
  removeBtn: { padding: 6, flexShrink: 0 },
  removeBtnText: { fontSize: 16, color: '#ef4444' },

  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  newInput: {
    borderWidth: 1, borderColor: THEME.goldBorder, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: THEME.text, backgroundColor: THEME.offWhite,
  },
  addError: { color: '#ef4444', fontSize: 12, marginTop: 6 },
  addBtn: { marginTop: 10, backgroundColor: THEME.navy, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  addBtnText: { color: THEME.white, fontWeight: 'bold', fontSize: 13 },

  saveBtn: { backgroundColor: THEME.navy, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: THEME.white, fontWeight: 'bold', fontSize: 15 },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
