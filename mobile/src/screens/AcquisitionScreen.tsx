import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import Card from '@/components/Card';
import { colors } from '@/theme/colors';
import { salesApi } from '@/api/services';
import type { Sale } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'Acquisition'>;

export default function AcquisitionScreen() {
  const { params } = useRoute<Rt>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    salesApi.list()
      .then((all) => setSale(all.find((s) => s.id === params.saleId) ?? all[0] ?? null))
      .catch(() => setSale(null))
      .finally(() => setLoading(false));
  }, [params.saleId]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;
  }

  if (!sale) {
    return (
      <View style={styles.center}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.title}>¡Felicitaciones!</Text>
        <Text style={styles.subtitle}>Detalle de adquisición no disponible.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <View style={styles.hero}>
        <Text style={styles.trophy}>🏆</Text>
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
        <Row k="Costo de envío" v={sale.costoEnvio.toLocaleString('es-AR')} />
        <Row k="Fecha" v={new Date(sale.fecha).toLocaleString('es-AR')} />
      </Card>
    </ScrollView>
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
  trophy: { fontSize: 64 },
  title: { fontSize: 28, fontWeight: '700', color: colors.brandPrimary, marginTop: 8 },
  subtitle: { fontSize: 14, color: colors.inputHint, marginTop: 4 },
  bien: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowKey: { color: colors.inputHint, fontSize: 14 },
  rowVal: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  highlight: { color: colors.brandPrimary, fontSize: 18, fontWeight: '700' },
});
