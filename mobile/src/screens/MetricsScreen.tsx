import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import Card from '@/components/Card';
import { colors, categoriaColor } from '@/theme/colors';
import { usersApi } from '@/api/services';
import type { UserMetrics } from '@/types/api';

export default function MetricsScreen() {
  const [m, setM] = useState<UserMetrics | null>(null);

  useEffect(() => {
    usersApi.metrics().then(setM).catch(() => setM(null));
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Métricas</Text>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.lbl}>Total Gastado</Text>
        <Text style={styles.bigVal}>$ {(m?.totalGastado ?? 0).toLocaleString('es-AR')}</Text>
      </Card>

      <View style={styles.row}>
        <Card style={[styles.statCard, { marginRight: 6 }]}>
          <Text style={styles.lbl}>Subastas Participadas</Text>
          <Text style={styles.statVal}>{m?.subastasParticipadas ?? 0}</Text>
        </Card>
        <Card style={[styles.statCard, { marginLeft: 6 }]}>
          <Text style={styles.lbl}>Subastas Ganadas</Text>
          <Text style={styles.statVal}>{m?.subastasGanadas ?? 0}</Text>
        </Card>
      </View>

      <View style={[styles.row, { marginTop: 12 }]}>
        <Card style={[styles.statCard, { marginRight: 6 }]}>
          <Text style={styles.lbl}>Tasa de Éxito</Text>
          <Text style={styles.statVal}>{m ? `${(m.tasaExito * 100).toFixed(0)}%` : '0%'}</Text>
        </Card>
        <Card style={[styles.statCard, { marginLeft: 6 }]}>
          <Text style={styles.lbl}>Mayor Puja</Text>
          <Text style={styles.statVal}>$ {(m?.mayorPuja ?? 0).toLocaleString('es-AR')}</Text>
        </Card>
      </View>

      <Text style={styles.section}>Categorías más participadas</Text>
      {(m?.categorias ?? []).length === 0 ? (
        <Text style={styles.empty}>Sin datos.</Text>
      ) : m!.categorias!.map((c) => (
        <Card key={c.categoria} style={styles.catRow}>
          <View style={[styles.dot, { backgroundColor: categoriaColor(c.categoria) }]} />
          <Text style={styles.catLabel}>{c.categoria}</Text>
          <Text style={styles.catCount}>{c.participaciones}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 32, fontWeight: '700', color: colors.brandPrimary, marginBottom: 16 },
  lbl: { color: colors.inputHint, fontSize: 13 },
  bigVal: { color: colors.brandPrimary, fontSize: 28, fontWeight: '700', marginTop: 4 },
  row: { flexDirection: 'row' },
  statCard: { flex: 1 },
  statVal: { color: colors.textPrimary, fontSize: 22, fontWeight: '700', marginTop: 4 },
  section: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 24, marginBottom: 8 },
  empty: { color: colors.inputHint, padding: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  catLabel: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  catCount: { color: colors.brandPrimary, fontSize: 14, fontWeight: '700' },
});
