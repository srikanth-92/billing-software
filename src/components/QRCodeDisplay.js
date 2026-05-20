import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

// imageUrl   — hosted PNG from Razorpay (production, on-device)
// upiString  — local UPI deep-link for local QR rendering (web preview / CORS fallback)
export default function QRCodeDisplay({ imageUrl, upiString, size = 220 }) {
  return (
    <View style={styles.qrContainer}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      ) : upiString ? (
        <QRCode
          value={upiString}
          size={size}
          color="#1e293b"
          backgroundColor="#ffffff"
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size }]}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.placeholderText}>Generating QR…</Text>
        </View>
      )}
      <View style={styles.upiRow}>
        <Text style={styles.upiText}>🔒 Secured by Razorpay • UPI</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  qrContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  placeholderText: { marginTop: 12, fontSize: 13, color: '#94a3b8' },
  upiRow: { marginTop: 12 },
  upiText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
});
