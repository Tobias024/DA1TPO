import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import RootNavigator from '@/navigation/RootNavigator';
import { SessionProvider } from '@/storage/SessionContext';
import { colors } from '@/theme/colors';

const bg = require('./src/assets/background.png');
const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: 'transparent' } };

export default function App() {
  return (
    <SafeAreaProvider>
      <ImageBackground source={bg} style={styles.bg} resizeMode="cover">
        <SessionProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" backgroundColor={colors.brandPrimary} />
            <RootNavigator />
          </NavigationContainer>
        </SessionProvider>
      </ImageBackground>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
});