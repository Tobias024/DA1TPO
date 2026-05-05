import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import Card from '@/components/Card';
import { colors } from '@/theme/colors';
import { consignmentsApi } from '@/api/services';
import type { Consignment } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'PieceLocation'>;

export default function PieceLocationScreen() {
  const { params } = useRoute<Rt>();
  const [c, setC] = useState<Consignment | null>(null);

  useEffect(() => {
    consignmentsApi.detail(params.consignmentId).then(setC).catch(() => setC(null));
  }, [params.consignmentId]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Ubicación de Pieza</Text>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.lbl}>Depósito</Text>
        <Text style={styles.val}>{c?.ubicacionDeposito ?? '—'}</Text>
      </Card>

      <Card>
        <Text style={styles.lbl}>Póliza de Seguro</Text>
        <Text style={styles.poliza}>{c?.polizaSeguro?.aseguradora ?? '—'}</Text>
        <Text style={styles.numero}>N° {c?.polizaSeguro?.numeroPoliza ?? '—'}</Text>
        <Text style={styles.valor}>
          Valor asegurado: $ {c?.polizaSeguro?.valorAsegurado?.toLocaleString('es-AR') ?? '—'}
        </Text>
        {c?.polizaSeguro?.contactoAseguradora ? (
          <Text style={styles.contacto}>Contacto: {c.polizaSeguro.contactoAseguradora}</Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.brandPrimary, marginBottom: 16 },
  lbl: { fontSize: 13, color: colors.inputHint, marginBottom: 4 },
  val: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
  poliza: { fontSize: 16, color: colors.textPrimary },
  numero: { fontSize: 14, color: colors.textPrimary, marginTop: 2 },
  valor: { fontSize: 16, color: colors.brandPrimary, fontWeight: '700', marginTop: 8 },
  contacto: { fontSize: 14, color: colors.textPrimary, marginTop: 8 },
});
