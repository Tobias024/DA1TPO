import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '@/screens/HomeScreen';
import AuctionsScreen from '@/screens/AuctionsScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import { colors } from '@/theme/colors';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcon = (label: string) => ({ color }: { color: string }) => (
  <Text style={{ fontSize: 18, color }}>{label}</Text>
);

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.inputHint,
        tabBarStyle: { backgroundColor: colors.surfaceWhite, borderTopColor: colors.inputBorder },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home', tabBarIcon: tabIcon('🏠') }} />
      <Tab.Screen name="Auctions" component={AuctionsScreen} options={{ tabBarLabel: 'Subastas', tabBarIcon: tabIcon('🔨') }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: 'Alertas', tabBarIcon: tabIcon('🔔') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil', tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}
