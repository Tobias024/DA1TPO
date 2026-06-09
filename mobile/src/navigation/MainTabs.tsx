import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

// Pantalla vacía: el tab "+" no muestra contenido, intercepta el press y navega
// a "Nueva solicitud" (ConsignmentForm, en el stack padre).
function NoopScreen() {
  return null;
}

function PlusButton({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.plus, focused && styles.plusFocused]}>
      <Ionicons name="add" size={26} color={colors.onPrimary} />
    </View>
  );
}

export default function MainTabs() {
  // Sumamos el inset inferior (barra de navegación de Android / home indicator de
  // iOS) para que el tab bar no quede pisado por los botones del sistema. El alto
  // varía por dispositivo (gestos vs 3 botones), por eso no puede ser fijo.
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.inputHint,
        tabBarStyle: {
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tab.Screen name="Auctions" component={AuctionsScreen} options={{ tabBarIcon: tabIcon('search', 'search-outline') }} />
      <Tab.Screen
        name="NuevaSolicitud"
        component={NoopScreen}
        options={{ tabBarIcon: ({ focused }) => <PlusButton focused={focused} /> }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // ConsignmentForm vive en el stack padre; navigate burbujea hacia arriba.
            navigation.navigate('ConsignmentForm' as never);
          },
        })}
      />
      <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarIcon: tabIcon('notifications', 'notifications-outline') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('person', 'person-outline') }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  plus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusFocused: {
    backgroundColor: colors.brandPrimaryDim,
  },
});
