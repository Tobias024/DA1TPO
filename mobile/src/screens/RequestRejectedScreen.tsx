import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { consignmentsApi } from '@/api/services';
import type { Consignment } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'RequestRejected'>;

export default function RequestRejectedScreen() {
  const nav = useNavigation();
  const { params } = useRoute<Rt>();
  const [c, setC] = useState<Consignment | null>(null);

  useEffect(() => {
    if (!params.consignmentId) return;
    consignmentsApi.detail(params.consignmentId).then(setC).catch(() => setC(null));
  }, [params.consignmentId]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Solicitud Rechazada</Text>

      <Text style={styles.label}>Motivos del rechazo</Text>
      <Text style={styles.value}>{c?.motivoRechazo ?? '—'}</Text>

      <Card style={{ marginTop: 16 }}>
        <Text style={styles.label}>Gastos de devolución</Text>
        <Text style={styles.gastos}>
          {c?.gastosDevolucion ? `$ ${c.gastosDevolucion.toLocaleString('es-AR')}` : '—'}
        </Text>
      </Card>

      <PrimaryButton title="Volver" onPress={() => nav.goBack()} style={{ marginTop: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.redLive, marginBottom: 16 },
  label: { fontSize: 13, color: colors.inputHint, marginBottom: 4 },
  value: { fontSize: 16, color: colors.textPrimary, marginBottom: 12 },
  gastos: { fontSize: 22, color: colors.brandPrimary, fontWeight: '700', marginTop: 4 },
});
