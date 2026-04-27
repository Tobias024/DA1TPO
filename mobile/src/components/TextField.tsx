import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { colors } from '@/theme/colors';

type Props = TextInputProps & {
  label?: string;
};

export default function TextField({ label, style, ...props }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.inputHint}
        {...props}
        style={[styles.input, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 44,
  },
});
