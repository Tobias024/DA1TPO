import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { salesApi, paymentsApi } from '@/api/services';
import type { Sale, CheckoutDetail, MedioPago } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'Acquisition'>;
type Nav = NativeStackNavigationProp<MainStackParamList>;
type DeliveryOption = 'envio' | 'retiro';

export default function AcquisitionScreen() {
  const { params } = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const piezaId = params.piezaId;

  const [loading, setLoading] = useState(true);
  const [checkout, setCheckout] = useState<CheckoutDetail | null>(null);
  const [sale, setSale] = useState<Sale | null>(null); // modo lectura (compra ya pagada)
  const [methods, setMethods] = useState<MedioPago[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryOption>('envio');
  const [direccion, setDireccion] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (piezaId) {
      Promise.all([
        salesApi.checkout(piezaId).catch(() => null),
        paymentsApi.list().catch(() => [] as MedioPago[]),
      ]).then(([c, m]) => {
        if (cancelled) return;
        setCheckout(c);
        if (c && c.estadoPago === 'PAGADO') {
          // Ya pagada: mostramos la compra desde el historial.
          salesApi.list()
            .then((all) => { if (!cancelled) setSale(all.find((s) => s.piezaId === piezaId) ?? null); })
            .finally(() => { if (!cancelled) setLoading(false); });
        } else {
          setMethods(m ?? []);
          const firstVerified = (m ?? []).find((x) => x.verificado);
          setSelectedMethod(firstVerified?.id ?? null);
          setLoading(false);
        }
      });
    } else {
      // Modo lectura por saleId (desde historial).
      salesApi.list()
        .then((all) => { if (!cancelled) setSale(all.find((s) => s.id === params.saleId) ?? all[0] ?? null); })
        .catch(() => { if (!cancelled) setSale(null); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }
    return () => { cancelled = true; };
  }, [piezaId, params.saleId]);

  const handleDeliveryChange = (option: DeliveryOption) => {
    if (option === 'retiro') {
      Alert.alert(
        'Retiro personal',
        'Al retirar personalmente el bien perdés la cobertura del seguro contratado por la empresa. ¿Querés continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Confirmar', onPress: () => setDelivery('retiro') },
        ],
      );
    } else {
      setDelivery('envio');
    }
  };

  const confirmarPago = async () => {
    if (!piezaId || !checkout) return;
    if (!selectedMethod) { Alert.alert('Elegí un medio de pago'); return; }
    if (delivery === 'envio' && !direccion.trim()) {
      Alert.alert('Dirección requerida', 'Ingresá la dirección de envío o elegí retiro personal.');
      return;
    }
    setPaying(true);
    try {
      await salesApi.pay(piezaId, {
        medioPagoId: selectedMethod,
        retiraPersonalmente: delivery === 'retiro',
        direccionEnvio: delivery === 'envio' ? direccion.trim() : undefined,
      });
      Alert.alert('Pago confirmado', 'Tu compra fue registrada correctamente.', [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo confirmar el pago.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;
  }

  // ── Modo lectura: compra ya pagada ──
  if (sale) {
    const costoEnvioMostrado = sale.retiraPersonalmente ? 0 : sale.costoEnvio;
    return (
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.hero}>
          <Ionicons name="trophy" size={64} color={colors.catOro} />
          <Text style={styles.title}>¡Compra confirmada!</Text>
        </View>
        <Card style={{ margin: 16 }}>
          <Text style={styles.bien}>{sale.nombreBien}</Text>
          <Row k="Precio pagado" v={`${sale.moneda} ${sale.precio.toLocaleString('es-AR')}`} highlight />
          {sale.medioPago ? (
            <Row k="Medio de pago" v={`${sale.medioPago.proveedor}${sale.medioPago.ultimosDigitos ? ` ····${sale.medioPago.ultimosDigitos}` : ''}`} />
          ) : null}
          <Row k="Comisiones" v={sale.comisiones.toLocaleString('es-AR')} />
          <Row k="Costo de envío" v={costoEnvioMostrado === 0 ? 'Sin cargo' : costoEnvioMostrado.toLocaleString('es-AR')} />
          {sale.total != null ? <Row k="Total" v={`${sale.moneda} ${sale.total.toLocaleString('es-AR')}`} highlight /> : null}
          <Row k="Fecha" v={new Date(sale.fecha).toLocaleString('es-AR')} />
        </Card>
      </ScrollView>
    );
  }

  if (!checkout) {
    return (
      <View style={styles.center}>
        <Ionicons name="trophy" size={64} color={colors.catOro} />
        <Text style={styles.title}>¡Felicitaciones!</Text>
        <Text style={styles.subtitle}>Detalle de adquisición no disponible.</Text>
      </View>
    );
  }

  // ── Modo checkout: pieza ganada sin pagar ──
  const total = delivery === 'retiro' ? checkout.totalRetiro : checkout.totalEnvio;
  const costoEnvio = delivery === 'retiro' ? 0 : checkout.costoEnvio;

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.hero}>
        <Ionicons name="trophy" size={64} color={colors.catOro} />
        <Text style={styles.title}>¡Has ganado!</Text>
        <Text style={styles.subtitle}>Confirmá el pago para completar tu compra.</Text>
      </View>

      <Card style={{ margin: 16 }}>
        <Text style={styles.bien}>{checkout.descripcion}</Text>
        <Row k="Precio final" v={`${checkout.moneda} ${checkout.precioFinal.toLocaleString('es-AR')}`} />
        <Row k="Comisión" v={`${checkout.moneda} ${checkout.comision.toLocaleString('es-AR')}`} />
        <Row k="Costo de envío" v={costoEnvio === 0 ? 'Sin cargo' : `${checkout.moneda} ${costoEnvio.toLocaleString('es-AR')}`} />
        <View style={styles.divider} />
        <Row k="Total a pagar" v={`${checkout.moneda} ${total.toLocaleString('es-AR')}`} highlight />
      </Card>

      <View style={{ marginHorizontal: 16 }}>
        <Text style={styles.sectionTitle}>Modalidad de entrega</Text>
        <View style={styles.deliveryRow}>
          <DeliveryBtn label="Envío a domicilio" selected={delivery === 'envio'} onPress={() => handleDeliveryChange('envio')} />
          <DeliveryBtn label="Retiro personal" selected={delivery === 'retiro'} onPress={() => handleDeliveryChange('retiro')} />
        </View>
        {delivery === 'envio' ? (
          <TextInput
            style={styles.input}
            placeholder="Dirección de envío"
            placeholderTextColor={colors.inputHint}
            value={direccion}
            onChangeText={setDireccion}
          />
        ) : (
          <View style={styles.retiroRow}>
            <Ionicons name="warning" size={16} color={colors.orangePending} style={{ marginRight: 6 }} />
            <Text style={styles.retiroWarning}>Al retirar personalmente perdés la cobertura del seguro.</Text>
          </View>
        )}
      </View>

      <View style={{ marginHorizontal: 16, marginTop: 16 }}>
        <Text style={styles.sectionTitle}>Medio de pago</Text>
        {methods.length === 0 ? (
          <Text style={styles.subtitle}>No tenés medios de pago. Agregá uno desde tu perfil.</Text>
        ) : methods.map((m) => (
          <TouchableOpacity
            key={m.id}
            activeOpacity={0.7}
            disabled={!m.verificado}
            onPress={() => setSelectedMethod(m.id)}
            style={[
              styles.method,
              selectedMethod === m.id && styles.methodSelected,
              !m.verificado && { opacity: 0.5 },
            ]}
          >
            <Ionicons
              name={selectedMethod === m.id ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={colors.brandPrimary}
              style={{ marginRight: 8 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.methodTitle}>{m.proveedor}{m.ultimosDigitos ? ` ····${m.ultimosDigitos}` : ''}</Text>
              <Text style={styles.methodSub}>{m.verificado ? 'Verificado' : 'Pendiente de verificación'}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ padding: 16 }}>
        <PrimaryButton title="Confirmar pago" onPress={confirmarPago} loading={paying} disabled={methods.length === 0} />
      </View>
    </ScrollView>
  );
}

function DeliveryBtn({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[deliveryStyles.btn, selected && deliveryStyles.btnSelected]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[deliveryStyles.btnText, selected && deliveryStyles.btnTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowKey}>{k}</Text>
      <Text style={[styles.rowVal, highlight && styles.highlight]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: colors.surfaceCream },
  hero: { padding: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: colors.brandPrimary, marginTop: 8 },
  subtitle: { fontSize: 14, color: colors.inputHint, marginTop: 4, textAlign: 'center' },
  bien: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowKey: { color: colors.inputHint, fontSize: 14 },
  rowVal: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  highlight: { color: colors.brandPrimary, fontSize: 18, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.inputBorder, marginVertical: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  deliveryRow: { flexDirection: 'row', gap: 10 },
  input: {
    borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, marginTop: 10, color: colors.textPrimary,
  },
  retiroRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  retiroWarning: { fontSize: 13, color: colors.orangePending, flex: 1 },
  method: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.inputBorder,
    borderRadius: 8, padding: 12, marginBottom: 8,
  },
  methodSelected: { borderColor: colors.brandPrimary, backgroundColor: '#F0E8E8' },
  methodTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  methodSub: { fontSize: 12, color: colors.inputHint, marginTop: 2 },
});

const deliveryStyles = StyleSheet.create({
  btn: { flex: 1, borderWidth: 1.5, borderColor: colors.inputBorder, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  btnSelected: { borderColor: colors.brandPrimary, backgroundColor: '#F0E8E8' },
  btnText: { fontSize: 13, color: colors.inputHint, fontWeight: '600' },
  btnTextSelected: { color: colors.brandPrimary },
});
