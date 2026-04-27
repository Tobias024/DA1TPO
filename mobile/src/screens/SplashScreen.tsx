import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';

export default function SplashScreen() {
  return (
    <View style={styles.wrap}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>S</Text>
      </View>
      <Text style={styles.brand}>SubastAR</Text>
      <Text style={styles.tagline}>Sistema de Subastas</Text>
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logoText: {
    color: colors.brandPrimary,
    fontSize: 64,
    fontWeight: '700',
  },
  brand: {
    color: colors.textOnDark,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  tagline: {
    color: colors.onPrimary,
    fontSize: 14,
    marginTop: 8,
  },
});
