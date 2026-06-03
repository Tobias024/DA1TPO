import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { usersApi, paymentsApi } from '@/api/services';
import { useSession } from '@/storage/SessionContext';
import type { MedioPago } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'FineDetail'>;

export default function FineDetailScreen() {
  const nav = useNavigation();
  const { params } = useRoute<Rt>();
  const { refreshUser } = useSession();

  const [tieneMulta, setTieneMulta] = useState(true);
  const [monto, setMonto] = useState<number | null>(null);
  const [methods, setMethods] = useState<MedioPago[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    usersApi.me().then((u) => {
      if (cancelled) return;
      setTieneMulta(u.tieneMulta ?? false);
      setMonto(u.montoPendienteMulta ?? null);
    }).catch(() => {});
    paymentsApi.list().then((m) => {
      if (cancelled) return;
      setMethods(m);
      setSelectedMethod(m.find((x) => x.verificado)?.id ?? null);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const pagarMulta = async () => {
    setPaying(true);
    try {
      await usersApi.payFine(selectedMethod ? { medioPagoId: selectedMethod } : {});
      const u = await usersApi.me().catch(() => null);
      if (u) refreshUser(u);
      Alert.alert('Multa regularizada', 'Ya podés volver a participar en subastas.', [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo regularizar la multa.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <View style={styles.head}>
        <Ionicons name="warning" size={48} color={colors.textOnDark} />
        <Text style={styles.title}>{params.titulo}</Text>
      </View>

      <Card style={{ margin: 16 }}>
        <Text style={styles.mensajeLabel}>Detalle</Text>
        <Text style={styles.mensaje}>{params.mensaje}</Text>
        {monto != null ? (
          <Text style={styles.monto}>Monto pendiente: ${monto.toLocaleString('es-AR')}</Text>
        ) : null}
      </Card>

      {tieneMulta ? (
        <>
          <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={styles.bloqueadoTitle}>Acceso restringido</Text>
            <Text style={styles.bloqueadoText}>
              Tenés una multa pendiente equivalente al 10% del valor de tu última oferta. No podrás participar en nuevas subastas hasta regularizar la situación.
            </Text>
            <Text style={styles.plazoText}>
              Debés presentar los fondos necesarios dentro de las 72 hs. de recibida esta notificación. En caso de incumplimiento el caso se deriva a la justicia.
            </Text>
          </Card>

          {methods.length > 0 ? (
            <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>Medio de pago</Text>
              {methods.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.7}
                  disabled={!m.verificado}
                  onPress={() => setSelectedMethod(m.id)}
                  style={[styles.method, selectedMethod === m.id && styles.methodSelected, !m.verificado && { opacity: 0.5 }]}
                >
                  <Ionicons
                    name={selectedMethod === m.id ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={colors.brandPrimary}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.methodTitle}>
                    {m.proveedor}{m.ultimosDigitos ? ` ····${m.ultimosDigitos}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View style={{ marginHorizontal: 16, marginVertical: 16 }}>
            <PrimaryButton title="Regularizar / Pagar multa" onPress={pagarMulta} loading={paying} />
            <PrimaryButton title="Entendido" variant="outlined" style={{ marginTop: 8 }} onPress={() => nav.goBack()} />
          </View>
        </>
      ) : (
        <Card style={{ margin: 16 }}>
          <Text style={styles.bloqueadoTitle}>Sin multas pendientes</Text>
          <Text style={styles.bloqueadoText}>Tu situación está regularizada. Podés participar en subastas.</Text>
          <PrimaryButton title="Volver" style={{ marginTop: 12 }} onPress={() => nav.goBack()} />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: {
    backgroundColor: colors.orangePending,
    padding: 24,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.textOnDark, marginTop: 8, textAlign: 'center' },
  mensajeLabel: { fontSize: 12, color: colors.inputHint, fontWeight: '700', marginBottom: 6 },
  mensaje: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  monto: { fontSize: 16, color: colors.brandPrimary, fontWeight: '700', marginTop: 10 },
  bloqueadoTitle: { fontSize: 16, fontWeight: '700', color: colors.brandPrimary, marginBottom: 8 },
  bloqueadoText: { fontSize: 14, color: colors.textPrimary, lineHeight: 21 },
  plazoText: { fontSize: 13, color: colors.inputHint, marginTop: 10, lineHeight: 19 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  method: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.inputBorder,
    borderRadius: 8, padding: 12, marginBottom: 8,
  },
  methodSelected: { borderColor: colors.brandPrimary, backgroundColor: '#F0E8E8' },
  methodTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});
