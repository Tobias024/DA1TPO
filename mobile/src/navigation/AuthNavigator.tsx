import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterStep1Screen from '@/screens/auth/RegisterStep1Screen';
import RegisterWaitingScreen from '@/screens/auth/RegisterWaitingScreen';
import RegisterStep2Screen from '@/screens/auth/RegisterStep2Screen';
import RegisterStep3Screen from '@/screens/auth/RegisterStep3Screen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterStep1" component={RegisterStep1Screen} />
      <Stack.Screen name="RegisterWaiting" component={RegisterWaitingScreen} />
      <Stack.Screen name="RegisterStep2" component={RegisterStep2Screen} />
      <Stack.Screen name="RegisterStep3" component={RegisterStep3Screen} />
    </Stack.Navigator>
  );
}
