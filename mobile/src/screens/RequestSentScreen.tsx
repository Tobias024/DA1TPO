import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import PrimaryButton from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';

export default function RequestSentScreen() {
  const nav = useNavigation();
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>✓</Text>
      <Text style={styles.title}>Solicitud Enviada</Text>
      <Text style={styles.msg}>
        Tu artículo está siendo revisado. Te contactaremos a la brevedad por mail.
      </Text>
      <PrimaryButton
        title="Volver"
        onPress={() =>
          nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' as never }] }))
        }
        style={{ alignSelf: 'stretch', marginTop: 24 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1, backgroundColor: colors.surfaceCream,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  icon: { fontSize: 80, color: colors.brandPrimary, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: colors.brandPrimary, marginBottom: 12 },
  msg: { fontSize: 16, color: colors.textPrimary, textAlign: 'center' },
});
