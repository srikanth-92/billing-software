import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import MenuScreen from './src/screens/MenuScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import SalesScreen from './src/screens/SalesScreen';
import AdminScreen from './src/screens/AdminScreen';
import GuestMenuScreen from './src/screens/GuestMenuScreen';
import GuestPaymentScreen from './src/screens/GuestPaymentScreen';
import GuestConfirmScreen from './src/screens/GuestConfirmScreen';
import GuestQRScreen from './src/screens/GuestQRScreen';

const Stack = createStackNavigator();

const linking = {
  prefixes: ['https://buffet-on-wheels-ba58b.web.app', 'buffetonwheels://'],
  config: {
    screens: {
      GuestMenu: 'guest',
      GuestConfirm: 'guest-confirm',
      Login: '',
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="Sales" component={SalesScreen} />
        <Stack.Screen name="GuestMenu" component={GuestMenuScreen} />
        <Stack.Screen name="GuestPayment" component={GuestPaymentScreen} />
        <Stack.Screen name="GuestConfirm" component={GuestConfirmScreen} />
        <Stack.Screen name="GuestQR" component={GuestQRScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
