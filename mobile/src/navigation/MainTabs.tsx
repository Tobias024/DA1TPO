import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '@/screens/HomeScreen';
import AuctionsScreen from '@/screens/AuctionsScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import { colors } from '@/theme/colors';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcon = (filled: IconName, outlined: IconName) =>
  ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? filled : outlined} size={22} color={color} />
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
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tab.Screen name="Auctions" component={AuctionsScreen} options={{ tabBarLabel: 'Subastas', tabBarIcon: tabIcon('hammer', 'hammer-outline') }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: 'Alertas', tabBarIcon: tabIcon('notifications', 'notifications-outline') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Perfil', tabBarIcon: tabIcon('person', 'person-outline') }} />
    </Tab.Navigator>
  );
}
