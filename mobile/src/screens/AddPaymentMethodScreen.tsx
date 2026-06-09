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
  const [tipo, setTipo] = useState<TipoMedioPago>('TARJETA_CREDITO');
  // tarjeta
  const [titular, setTitular] = useState('');
  const [numero, setNumero] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  // cuenta
  const [banco, setBanco] = useState('');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [cbu, setCbu] = useState('');
  // cheque
  const [numeroCheque, setNumeroCheque] = useState('');
  const [garantia, setGarantia] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (tipo === 'TARJETA_CREDITO' && (!titular || !numero)) {
      Alert.alert('Faltan datos', 'Completá titular y los últimos 4 dígitos.');
      return;
    }
    if (tipo === 'CUENTA_BANCARIA' && (!banco || !numeroCuenta)) {
      Alert.alert('Faltan datos', 'Completá banco y número de cuenta.');
      return;
    }
    if (tipo === 'CHEQUE_CERTIFICADO') {
      const montoNum = Number(garantia);
      if (!banco || !garantia || isNaN(montoNum) || montoNum <= 0) {
        Alert.alert('Datos inválidos', 'Completá banco y un monto de garantía mayor a cero.');
        return;
      }
    }
    setLoading(true);
    try {
      await paymentsApi.add({
        tipo,
        titular: titular || undefined,
        numeroTarjeta: numero || undefined,
        vencimiento: vencimiento || undefined,
        banco: banco || undefined,
        numeroCuenta: numeroCuenta || undefined,
        cbu: cbu || undefined,
        numeroCheque: numeroCheque || undefined,
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
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text style={styles.title}>Agregar Medio de Pago</Text>

      <Text style={styles.label}>Tipo</Text>
      <View style={styles.tipos}>
        {TIPOS.map((t) => {
          const sel = tipo === t.v;
          return (
            <Pressable key={t.v} onPress={() => setTipo(t.v)} style={[styles.tipoChip, sel && styles.tipoChipSel]}>
              <Text style={[styles.tipoText, sel && styles.tipoTextSel]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {tipo === 'TARJETA_CREDITO' ? (
        <>
          <TextField label="Titular" value={titular} onChangeText={setTitular} placeholder="Nombre como figura en la tarjeta" />
          <TextField label="Últimos 4 dígitos" value={numero} onChangeText={setNumero} keyboardType="numeric" maxLength={4} />
          <TextField label="Vencimiento (MM/AA)" value={vencimiento} onChangeText={setVencimiento} placeholder="12/30" />
        </>
      ) : null}

      {tipo === 'CUENTA_BANCARIA' ? (
        <>
          <TextField label="Banco" value={banco} onChangeText={setBanco} placeholder="Ej: Banco Nación" />
          <TextField label="Número de cuenta" value={numeroCuenta} onChangeText={setNumeroCuenta} keyboardType="numeric" />
          <TextField label="CBU" value={cbu} onChangeText={setCbu} keyboardType="numeric" />
        </>
      ) : null}

      {tipo === 'CHEQUE_CERTIFICADO' ? (
        <>
          <TextField label="Banco" value={banco} onChangeText={setBanco} placeholder="Ej: Banco Provincia" />
          <TextField label="Número de cheque" value={numeroCheque} onChangeText={setNumeroCheque} />
          <TextField label="Monto de garantía" value={garantia} onChangeText={setGarantia} keyboardType="numeric" />
        </>
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
