import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { EMPLOYEES, RESTAURANT_NAME } from '../constants';
import { THEME } from '../constants/theme';
import { saveSession, loadSession } from '../utils/session';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If session still valid (e.g. browser back button from Menu/Payment), redirect immediately
  useFocusEffect(
    React.useCallback(() => {
      const employee = loadSession();
      if (employee) {
        if (employee.role === 'admin') {
          navigation.replace('Admin', { employeeUsername: employee.username });
        } else {
          navigation.replace('Menu', { employeeUsername: employee.username });
        }
      }
    }, [])
  );

  function handleLogin() {
    const trimmedUser = username.trim().toLowerCase();
    const employee = EMPLOYEES.find(
      (e) => e.username.toLowerCase() === trimmedUser && e.password === password
    );
    if (!employee) {
      Alert.alert('Login Failed', 'Invalid username or password. Please try again.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      saveSession(employee);
      if (employee.role === 'admin') {
        navigation.replace('Admin', { employeeUsername: employee.username });
      } else {
        navigation.replace('Menu', { employeeUsername: employee.username });
      }
    }, 500);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.card}>
        <Text style={styles.emoji}>🍽️</Text>
        <Text style={styles.restaurantName}>{RESTAURANT_NAME}</Text>
        <Text style={styles.subtitle}>Staff Login</Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter password"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginBtnText}>{loading ? 'Logging in...' : 'Login'}</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Contact admin if you forgot your credentials.</Text>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.navy,
    ...(Platform.OS === 'web' ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' } : {}),
  },
  card: {
    backgroundColor: THEME.navyLight,
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.goldBorder,
    shadowColor: THEME.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  emoji: { fontSize: 56, marginBottom: 8 },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.gold,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: { fontSize: 14, color: THEME.slateLight, marginBottom: 28 },
  inputWrapper: { width: '100%', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: THEME.goldLight, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: THEME.goldBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: THEME.white,
    backgroundColor: THEME.navy,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12 },
  eyeText: { fontSize: 18 },
  loginBtn: {
    backgroundColor: THEME.gold,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  loginBtnDisabled: { backgroundColor: THEME.goldLight },
  loginBtnText: { color: THEME.navy, fontSize: 16, fontWeight: 'bold' },
  hint: { fontSize: 12, color: THEME.slateLight, textAlign: 'center' },
});
