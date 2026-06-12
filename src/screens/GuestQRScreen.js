import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { THEME } from '../constants/theme';
import { RESTAURANT_NAME, GUEST_ORDER_BASE, EMPLOYEES } from '../constants';
import QRCodeDisplay from '../components/QRCodeDisplay';

export default function GuestQRScreen({ navigation, route }) {
  const employee = EMPLOYEES.find((e) => e.username === route.params?.employeeUsername) || EMPLOYEES[1];
  const cartUrl = `${GUEST_ORDER_BASE}/${employee.username}/guest`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer QR</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        <Text style={styles.title}>{RESTAURANT_NAME}</Text>
        <Text style={styles.subtitle}>{employee.name} — Show this QR to customers</Text>

        <View style={styles.qrCard}>
          <QRCodeDisplay upiString={cartUrl} size={260} />
          <Text style={styles.qrLabel}>Scan to self-order & pay</Text>
          <Text style={styles.cartTag}>{employee.name}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoRow}>📱  Customer scans QR</Text>
          <Text style={styles.infoRow}>🛒  Selects items & pays</Text>
          <Text style={styles.infoRow}>🎫  Gets token for this cart</Text>
          <Text style={styles.infoRow}>🖨️  Bill prints automatically</Text>
        </View>

        <Text style={styles.urlText}>{cartUrl}</Text>
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

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: THEME.gold, textAlign: 'center' },
  subtitle: { fontSize: 14, color: THEME.slateLight, marginTop: 4, marginBottom: 24, textAlign: 'center' },

  qrCard: {
    backgroundColor: THEME.white, borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 2, borderColor: THEME.goldBorder,
    shadowColor: THEME.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  qrLabel: { fontSize: 13, color: THEME.slate, marginTop: 12, fontWeight: '600' },
  cartTag: { fontSize: 12, color: THEME.gold, fontWeight: 'bold', marginTop: 4, letterSpacing: 1 },

  infoCard: {
    marginTop: 24, backgroundColor: 'rgba(201,168,64,0.1)', borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: THEME.goldBorder, width: '100%',
  },
  infoRow: { fontSize: 14, color: THEME.goldLight, paddingVertical: 5 },

  urlText: { fontSize: 11, color: THEME.slateLight, marginTop: 16, textAlign: 'center' },
});
