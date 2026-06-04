import React from 'react';
import { View, StyleSheet } from 'react-native';
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

// Pantalla vacía: el tab "+" no muestra contenido, intercepta el press y navega
// a "Nueva solicitud" (ConsignmentForm, en el stack padre).
function NoopScreen() {
  return null;
}

function PlusButton() {
  return (
    <View style={styles.plus}>
      <Ionicons name="add" size={30} color={colors.onPrimary} />
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.inputHint,
        tabBarStyle: { backgroundColor: colors.surfaceWhite, borderTopColor: colors.inputBorder },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tab.Screen name="Auctions" component={AuctionsScreen} options={{ tabBarIcon: tabIcon('search', 'search-outline') }} />
      <Tab.Screen
        name="NuevaSolicitud"
        component={NoopScreen}
        options={{ tabBarIcon: () => <PlusButton /> }}
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
