import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

type Props = {
  title: string;
  subtitle?: string;
};

/** Header bordó SubastAR con safe-area top. */
export default function ScreenHeader({ title, subtitle }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 24 }]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    color: colors.textOnDark,
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.onPrimary,
    fontSize: 14,
    marginTop: 4,
  },
});
