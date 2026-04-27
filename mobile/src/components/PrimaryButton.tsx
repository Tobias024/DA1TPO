import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outlined';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Botón SubastAR — Button Danger del CSS.md (bordó, 8 px radio). */
export default function PrimaryButton({
  title, onPress, variant = 'primary', loading, disabled, style,
}: Props) {
  const isOutlined = variant === 'outlined';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isOutlined ? styles.outlined : styles.filled,
        (pressed || disabled || loading) && { opacity: 0.7 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutlined ? colors.brandPrimary : colors.onPrimary} />
      ) : (
        <Text style={[styles.text, isOutlined ? styles.textOutlined : styles.textFilled]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filled: {
    backgroundColor: colors.brandPrimary,
  },
  outlined: {
    backgroundColor: colors.surfaceCream,
    borderColor: colors.brandPrimary,
    borderWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  textFilled: { color: colors.onPrimary },
  textOutlined: { color: colors.brandPrimary },
});
