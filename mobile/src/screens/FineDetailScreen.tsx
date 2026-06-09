import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { usersApi, paymentsApi } from '@/api/services';
import { useSession } from '@/storage/SessionContext';
import type { MedioPago, Fine } from '@/types/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'FineDetail'>;
type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function FineDetailScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { refreshUser } = useSession();
  const insets = useSafeAreaInsets();

  const [fine, setFine] = useState<Fine | null>(null);
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<MedioPago[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const load = () => {
    setLoading(true);
    usersApi.fines().then((fines) => {
      // Resolver la multa: la del ventaId (notif / lista), o la primera pendiente.
      const f = (params.ventaId ? fines.find((x) => x.ventaId === params.ventaId) : undefined)
        ?? fines.find((x) => x.estado === 'PENDIENTE')
        ?? fines[0]
        ?? null;
      setFine(f);
    }).catch(() => setFine(null)).finally(() => setLoading(false));
    paymentsApi.list().then((m) => {
      setMethods(m);
      setSelectedMethod(m.find((x) => x.verificado)?.id ?? null);
    }).catch(() => {});
  };

  useEffect(() => { load(); }, [params.ventaId]);

  const pagada = fine?.estado === 'PAGADA';
  const pendiente = fine?.estado === 'PENDIENTE';

  // El título del header del navegador refleja el estado.
  useEffect(() => {
    nav.setOptions({ title: pagada ? 'Multa pagada' : 'Multa aplicada' });
  }, [nav, pagada]);

  const pagarMulta = async () => {
    setPaying(true);
    try {
      await usersApi.payFine(selectedMethod ? { medioPagoId: selectedMethod } : {});
      const u = await usersApi.me().catch(() => null);
      if (u) refreshUser(u);
      Alert.alert(
        'Multa regularizada',
        'Ya podés volver a participar. Tenés 72 hs para pagar el producto adjudicado: vas a ver el plazo en "Mis Compras".',
        [{ text: 'OK', onPress: () => nav.goBack() }],
      );
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo regularizar la multa.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;
  }

  const headColor = pagada ? colors.greenLive : colors.orangePending;
  const headIcon = pagada ? 'checkmark-circle' : 'warning';
  const headTitle = pagada ? 'Multa pagada' : (params.titulo ?? 'Multa aplicada');
  const monto = fine?.monto ?? null;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom }}>
      <View style={[styles.head, { backgroundColor: headColor }]}>
        <Ionicons name={headIcon} size={48} color={colors.textOnDark} />
        <Text style={styles.title}>{headTitle}</Text>
      </View>

      {/* ── PAGADA: comprobante ── */}
      {pagada ? (
        <>
          <Card style={{ margin: 16 }}>
            <View style={styles.comprobanteRow}>
              <Ionicons name="receipt-outline" size={18} color={colors.greenLive} style={{ marginRight: 8 }} />
              <Text style={styles.comprobanteTitle}>Comprobante de multa</Text>
            </View>
            {fine?.descripcion ? <Text style={styles.itemDesc}>{fine.descripcion}</Text> : null}
            {monto != null ? (
              <Text style={styles.montoPagado}>{fine?.moneda ?? '$'} {monto.toLocaleString('es-AR')}</Text>
            ) : null}
            <View style={styles.pagadaBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.greenLive} style={{ marginRight: 6 }} />
              <Text style={styles.pagadaBadgeText}>Multa pagada</Text>
            </View>
          </Card>
          <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Text style={styles.bloqueadoText}>
              Regularizaste esta multa. El producto adjudicado volvió a quedar disponible para pagar dentro de las 72 hs — lo encontrás en "Mis Compras".
            </Text>
          </Card>
          <View style={{ marginHorizontal: 16, marginVertical: 8 }}>
            <PrimaryButton title="Volver" onPress={() => nav.goBack()} />
          </View>
        </>
      ) : pendiente ? (
        /* ── PENDIENTE: pago ── */
        <>
          <Card style={{ margin: 16 }}>
            <Text style={styles.mensajeLabel}>Detalle</Text>
            <Text style={styles.mensaje}>
              {params.mensaje ?? 'Se aplicó una multa del 10% por no pagar un ítem adjudicado dentro del plazo.'}
            </Text>
            {monto != null ? (
              <Text style={styles.monto}>Monto pendiente: {fine?.moneda ?? '$'} {monto.toLocaleString('es-AR')}</Text>
            ) : null}
          </Card>

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
        /* ── Sin multa ── */
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  head: { padding: 24, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: colors.textOnDark, marginTop: 8, textAlign: 'center' },
  mensajeLabel: { fontSize: 12, color: colors.inputHint, fontWeight: '700', marginBottom: 6 },
  mensaje: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  monto: { fontSize: 16, color: colors.brandPrimary, fontWeight: '700', marginTop: 10 },
  comprobanteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  comprobanteTitle: { fontSize: 14, fontWeight: '700', color: colors.greenLive },
  itemDesc: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  montoPagado: { fontSize: 24, color: colors.textPrimary, fontWeight: '700', marginTop: 8 },
  pagadaBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  pagadaBadgeText: { color: colors.greenLive, fontWeight: '700', fontSize: 14 },
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
