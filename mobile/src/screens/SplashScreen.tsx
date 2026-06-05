import React from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';

export default function SplashScreen() {
  return (
    <View style={styles.wrap}>
      <Image source={require('../assets/splash.png')} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator color={colors.onPrimary} style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 500,
    height: 700,
  },
});