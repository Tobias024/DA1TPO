import React, { useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import { colors } from '@/theme/colors';
import { paymentsApi } from '@/api/services';
import type { TipoMedioPago } from '@/types/api';

const TIPOS: { v: TipoMedioPago; label: string }[] = [
  { v: 'CUENTA_BANCARIA', label: 'Cuenta bancaria' },
  { v: 'TARJETA_CREDITO', label: 'Tarjeta de crédito' },
  { v: 'CHEQUE_CERTIFICADO', label: 'Cheque certificado' },
];

export default function AddPaymentMethodScreen() {
  const nav = useNavigation();
  const [tipo, setTipo] = useState<TipoMedioPago>('CUENTA_BANCARIA');
  const [proveedor, setProveedor] = useState('');
  const [ultimos, setUltimos] = useState('');
  const [garantia, setGarantia] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!proveedor) { Alert.alert('Falta proveedor'); return; }
    if (tipo === 'CHEQUE_CERTIFICADO') {
      const montoNum = Number(garantia);
      if (!garantia || isNaN(montoNum) || montoNum <= 0) {
        Alert.alert('Monto inválido', 'El monto de garantía del cheque debe ser mayor a cero.');
        return;
      }
    }
    setLoading(true);
    try {
      await paymentsApi.add({
        tipo,
        proveedor,
        ultimosDigitos: ultimos || undefined,
        montoGarantia: tipo === 'CHEQUE_CERTIFICADO' ? Number(garantia) : undefined,
      });
      Alert.alert('Listo', 'Medio de pago agregado correctamente.', [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo agregar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Agregar Medio de Pago</Text>

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.tipos}>
        {TIPOS.map((t) => {
          const sel = tipo === t.v;
          return (
            <Pressable
              key={t.v}
              onPress={() => setTipo(t.v)}
              style={[styles.tipoChip, sel && styles.tipoChipSel]}
            >
              <Text style={[styles.tipoText, sel && styles.tipoTextSel]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <TextField label="Proveedor" value={proveedor} onChangeText={setProveedor} placeholder="Ej: MasterCard, Banco Nación, Mercado Pago" />
      <TextField label="Últimos 4 dígitos" value={ultimos} onChangeText={setUltimos} keyboardType="numeric" maxLength={4} />
      {tipo === 'CHEQUE_CERTIFICADO' ? (
        <TextField label="Monto de garantía" value={garantia} onChangeText={setGarantia} keyboardType="numeric" />
      ) : null}

      <PrimaryButton title="Agregar" onPress={submit} loading={loading} style={{ marginTop: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.brandPrimary, marginBottom: 16 },
  label: { fontSize: 14, color: colors.textPrimary, marginBottom: 6 },
  tipos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tipoChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
  },
  tipoChipSel: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  tipoText: { fontSize: 13, color: colors.inputHint },
  tipoTextSel: { color: colors.onPrimary },
});
