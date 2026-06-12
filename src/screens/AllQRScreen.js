import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { THEME } from '../constants/theme';
import { RESTAURANT_NAME, GUEST_ORDER_BASE, EMPLOYEES } from '../constants';
import QRCodeDisplay from '../components/QRCodeDisplay';

const VENDORS = EMPLOYEES.filter((e) => e.role === 'vendor');

export default function AllQRScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Cart QRs</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.subtitle}>{RESTAURANT_NAME} · {VENDORS.length} Carts</Text>

        <View style={styles.grid}>
          {VENDORS.map((vendor) => {
            const cartUrl = `${GUEST_ORDER_BASE}/${vendor.username}/guest`;
            return (
              <View key={vendor.username} style={styles.card}>
                <Text style={styles.cartName}>{vendor.name}</Text>
                <QRCodeDisplay upiString={cartUrl} size={160} />
                <Text style={styles.cartUrl} numberOfLines={1}>{cartUrl}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.navy, ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' } : {}) },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: THEME.goldBorder,
  },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: THEME.gold, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.gold },

  body: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  subtitle: { fontSize: 14, color: THEME.slateLight, marginBottom: 20, textAlign: 'center' },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16,
    ...(Platform.OS === 'web' ? { maxWidth: 900, width: '100%' } : {}),
  },
  card: {
    backgroundColor: THEME.white, borderRadius: 16, padding: 16, alignItems: 'center',
    borderWidth: 1.5, borderColor: THEME.goldBorder,
    width: 220,
    shadowColor: THEME.gold, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  cartName: { fontSize: 16, fontWeight: 'bold', color: THEME.navy, marginBottom: 12 },
  cartUrl: { fontSize: 10, color: THEME.slateLight, marginTop: 8, textAlign: 'center', maxWidth: 190 },
});
