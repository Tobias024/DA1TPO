import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import { colors } from '@/theme/colors';
import { salesApi } from '@/api/services';
import type { Sale } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'Acquisition'>;
type DeliveryOption = 'envio' | 'retiro';

export default function AcquisitionScreen() {
  const { params } = useRoute<Rt>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [delivery, setDelivery] = useState<DeliveryOption>('envio');

  useEffect(() => {
    salesApi.list()
      .then((all) => setSale(all.find((s) => s.id === params.saleId) ?? all[0] ?? null))
      .catch(() => setSale(null))
      .finally(() => setLoading(false));
  }, [params.saleId]);

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

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;
  }

  if (!sale) {
    return (
      <View style={styles.center}>
        <Ionicons name="trophy" size={64} color={colors.catOro} />
        <Text style={styles.title}>¡Felicitaciones!</Text>
        <Text style={styles.subtitle}>Detalle de adquisición no disponible.</Text>
      </View>
    );
  }

  const costoEnvioMostrado = delivery === 'retiro' ? 0 : sale.costoEnvio;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <View style={styles.hero}>
        <Ionicons name="trophy" size={64} color={colors.catOro} />
        <Text style={styles.title}>¡Has ganado!</Text>
      </View>

      <Card style={{ margin: 16 }}>
        <Text style={styles.bien}>{sale.nombreBien}</Text>
        <Row k="Precio pagado" v={`${sale.moneda} ${sale.precio.toLocaleString('es-AR')}`} highlight />
        {sale.medioPago ? (
          <Row
            k="Medio de pago"
            v={`${sale.medioPago.proveedor}${sale.medioPago.ultimosDigitos ? ` ····${sale.medioPago.ultimosDigitos}` : ''}`}
          />
        ) : null}
        <Row k="Comisiones" v={sale.comisiones.toLocaleString('es-AR')} />
        <Row k="Costo de envío" v={costoEnvioMostrado === 0 ? 'Sin cargo' : costoEnvioMostrado.toLocaleString('es-AR')} />
        <Row k="Fecha" v={new Date(sale.fecha).toLocaleString('es-AR')} />
      </Card>

      <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
        <Text style={styles.deliveryTitle}>Modalidad de entrega</Text>
        <View style={styles.deliveryRow}>
          <DeliveryBtn
            label="Envío a domicilio"
            selected={delivery === 'envio'}
            onPress={() => handleDeliveryChange('envio')}
          />
          <DeliveryBtn
            label="Retiro personal"
            selected={delivery === 'retiro'}
            onPress={() => handleDeliveryChange('retiro')}
          />
        </View>
        {delivery === 'retiro' ? (
          <View style={styles.retiroRow}>
            <Ionicons name="warning" size={16} color={colors.orangePending} style={{ marginRight: 6 }} />
            <Text style={styles.retiroWarning}>Al retirar personalmente el bien perdés la cobertura del seguro.</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function DeliveryBtn({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[deliveryStyles.btn, selected && deliveryStyles.btnSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
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
  subtitle: { fontSize: 14, color: colors.inputHint, marginTop: 4 },
  bien: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowKey: { color: colors.inputHint, fontSize: 14 },
  rowVal: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  highlight: { color: colors.brandPrimary, fontSize: 18, fontWeight: '700' },
  deliveryTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  deliveryRow: { flexDirection: 'row', gap: 10 },
  retiroRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 },
  retiroWarning: { fontSize: 13, color: colors.orangePending, flex: 1 },
});

const deliveryStyles = StyleSheet.create({
  btn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnSelected: { borderColor: colors.brandPrimary, backgroundColor: '#F0E8E8' },
  btnText: { fontSize: 13, color: colors.inputHint, fontWeight: '600' },
  btnTextSelected: { color: colors.brandPrimary },
});
