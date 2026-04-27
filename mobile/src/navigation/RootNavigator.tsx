import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '@/screens/SplashScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { useSession } from '@/storage/SessionContext';
import { colors } from '@/theme/colors';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { bootstrapping, loggedIn } = useSession();

  if (bootstrapping) {
    return (
      <View style={styles.splashWrap}>
        <SplashScreen />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {loggedIn ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splashWrap: { flex: 1, backgroundColor: colors.brandPrimary },
});
