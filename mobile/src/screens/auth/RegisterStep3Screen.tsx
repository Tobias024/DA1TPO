import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import PrimaryButton from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { paymentsApi } from '@/api/services';
import { session } from '@/storage/session';
import { useSession } from '@/storage/SessionContext';
import type { TipoMedioPago } from '@/types/api';

const OPCIONES: { value: TipoMedioPago; label: string; hint: string }[] = [
  { value: 'CUENTA_BANCARIA', label: 'Cuenta bancaria', hint: 'Nacional o extranjera' },
  { value: 'TARJETA_CREDITO', label: 'Tarjeta de crédito', hint: 'Nacional o internacional' },
  { value: 'CHEQUE_CERTIFICADO', label: 'Cheque certificado', hint: 'Monto reservado para subastas' },
];

export default function RegisterStep3Screen() {
  const { signIn, refreshUser } = useSession();
  const [tipo, setTipo] = useState<TipoMedioPago>('CUENTA_BANCARIA');
  const [tyc, setTyc] = useState(false);
  const [loading, setLoading] = useState(false);

  const finalize = async () => {
    if (!tyc) {
      Alert.alert('Términos y Condiciones', 'Debés aceptar los Términos y Condiciones.');
      return;
    }
    setLoading(true);
    try {
      // Crea el medio de pago inicial. La verificación la hace la empresa.
      await paymentsApi.add({ tipo, proveedor: '—' });
    } catch {
      // No bloqueamos el alta de la cuenta si falla; el usuario puede agregarlo luego.
    } finally {
      setLoading(false);
      // step2 ya guardó tokens y usuario en AsyncStorage; ahora levantamos la sesión
      // del context para que RootNavigator monte Main.
      const [token, refresh, u] = await Promise.all([
        session.getAccessToken(),
        session.getRefreshToken(),
        session.getUser(),
      ]);
      if (token && u) {
        await signIn(token, refresh ?? '', u);
      } else {
        // Fallback: forzamos a refrescar usuario y avisamos.
        if (u) refreshUser(u);
      }
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <View style={styles.form}>
        <Text style={styles.kicker}>Confirmación 2 / 2</Text>
        <Text style={styles.title}>Método de Pago</Text>
        <Text style={styles.intro}>
          Seleccioná tu medio de pago inicial. Podés agregar más desde tu perfil cuando quieras.
        </Text>

        {OPCIONES.map((o) => {
          const selected = tipo === o.value;
          return (
            <Pressable
              key={o.value}
              onPress={() => setTipo(o.value)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <View style={[styles.radio, selected && styles.radioSelected]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.optLabel}>{o.label}</Text>
                <Text style={styles.optHint}>{o.hint}</Text>
              </View>
            </Pressable>
          );
        })}

        <View style={styles.divider} />

        <Pressable onPress={() => setTyc((v) => !v)} style={styles.tycRow}>
          <View style={[styles.checkbox, tyc && styles.checkboxOn]}>
            {tyc ? <Text style={styles.checkboxTick}>✓</Text> : null}
          </View>
          <Text style={styles.tycText}>Acepto los Términos y Condiciones</Text>
        </Pressable>

        <PrimaryButton title="FINALIZAR REGISTRO" onPress={finalize} loading={loading} style={{ marginTop: 24 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { padding: 24, paddingTop: 48 },
  kicker: { fontSize: 14, color: colors.inputHint, marginBottom: 6 },
  title: { fontSize: 32, color: colors.brandPrimary, fontWeight: '700', marginBottom: 8 },
  intro: { fontSize: 14, color: colors.textPrimary, marginBottom: 20 },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceWhite,
    borderColor: colors.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  optionSelected: { borderColor: colors.brandPrimary },
  optLabel: { fontSize: 16, color: colors.textPrimary, fontWeight: '500' },
  optHint: { fontSize: 12, color: colors.inputHint, marginTop: 2 },
  radio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: colors.inputBorder, marginRight: 12,
  },
  radioSelected: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimary,
  },

  divider: { height: 1, backgroundColor: colors.inputBorder, marginVertical: 20 },

  tycRow: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 22, height: 22, borderRadius: 4,
    borderWidth: 1.5, borderColor: colors.inputBorder, marginRight: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimary,
  },
  checkboxTick: { color: colors.onPrimary, fontWeight: '700' },
  tycText: { color: colors.textPrimary, fontSize: 15 },
});
