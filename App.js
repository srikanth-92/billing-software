import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import { saveSession, clearSession, loadSession, touchSession, INACTIVITY_MS } from './src/utils/session';

import LoginScreen from './src/screens/LoginScreen';
import MenuScreen from './src/screens/MenuScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import SalesScreen from './src/screens/SalesScreen';
import AdminScreen from './src/screens/AdminScreen';
import GuestMenuScreen from './src/screens/GuestMenuScreen';
import GuestPaymentScreen from './src/screens/GuestPaymentScreen';
import GuestConfirmScreen from './src/screens/GuestConfirmScreen';
import GuestQRScreen from './src/screens/GuestQRScreen';
import AllQRScreen from './src/screens/AllQRScreen';
import CateringOrderScreen from './src/screens/CateringOrderScreen';
import CateringBillScreen from './src/screens/CateringBillScreen';
import KidsMenuScreen from './src/screens/KidsMenuScreen';
import LogSaleScreen from './src/screens/LogSaleScreen';

const Stack = createStackNavigator();
export const navigationRef = createNavigationContainerRef();

const linking = {
  prefixes: ['https://buffet-on-wheels-ba58b.web.app', 'buffetonwheels://'],
  config: {
    screens: {
      Login: '',
      Admin: 'admin',
      Menu: 'menu',
      Payment: 'payment',
      Sales: 'sales',
      GuestQR: 'guest-qr',
      AllQR: 'all-qr',
      GuestMenu: {
        path: ':cartId/guest',
        parse: {
          cartId: (cartId) => cartId,
        },
      },
      GuestPayment: 'guest-payment',
      GuestConfirm: 'guest-confirm',
      CateringOrder: 'catering',
      CateringBill: 'catering-bill',
      KidsMenu: 'kids-menu',
      LogSale: 'log-sale',
    },
  },
};

export default function App() {
  const inactivityTimer = useRef(null);

  function resetInactivityTimer() {
    if (Platform.OS !== 'web') return;
    touchSession();
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      clearSession();
      if (navigationRef.isReady()) {
        navigationRef.resetRoot({ index: 0, routes: [{ name: 'Login' }] });
      }
    }, INACTIVITY_MS);
  }

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer, true));
    resetInactivityTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer, true));
      clearTimeout(inactivityTimer.current);
    };
  }, []);

  const savedEmployee = loadSession();
  const initialRouteName = savedEmployee
    ? (savedEmployee.role === 'admin' ? 'Admin' : 'Menu')
    : 'Login';
  const initialParams = savedEmployee ? { employeeUsername: savedEmployee.username } : undefined;

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRouteName}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} initialParams={initialParams} />
        <Stack.Screen name="Menu" component={MenuScreen} initialParams={initialParams} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="Sales" component={SalesScreen} />
        <Stack.Screen name="GuestMenu" component={GuestMenuScreen} />
        <Stack.Screen name="GuestPayment" component={GuestPaymentScreen} />
        <Stack.Screen name="GuestConfirm" component={GuestConfirmScreen} />
        <Stack.Screen name="GuestQR" component={GuestQRScreen} />
        <Stack.Screen name="AllQR" component={AllQRScreen} />
        <Stack.Screen name="CateringOrder" component={CateringOrderScreen} />
        <Stack.Screen name="CateringBill" component={CateringBillScreen} />
        <Stack.Screen name="KidsMenu" component={KidsMenuScreen} />
        <Stack.Screen name="LogSale" component={LogSaleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
