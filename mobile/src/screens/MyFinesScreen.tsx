import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import { colors } from '@/theme/colors';
import { usersApi } from '@/api/services';
import type { Fine } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

/**
 * Lista de multas del usuario (pendientes y pagadas). Una multa por venta
 * incumplida. Las pagadas NO desaparecen: quedan como historial con badge "Pagada".
 */
export default function MyFinesScreen() {
  const nav = useNavigation<Nav>();
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    usersApi.fines()
      .then((f) => {
        // Más nuevas primero (por fecha de la multa).
        const ts = (x: Fine) => (x.fecha ? new Date(x.fecha).getTime() : 0);
        setFines([...f].sort((a, b) => ts(b) - ts(a)));
      })
      .catch(() => setFines([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;
  }

  // Abre el detalle de ESTA multa: pendiente → pantalla de pago; pagada → comprobante.
  const abrir = (f: Fine) => nav.navigate('FineDetail', {
    ventaId: f.ventaId,
    titulo: f.estado === 'PAGADA' ? 'Multa pagada' : 'Multa por impago',
    mensaje: 'Se aplicó una multa del 10% por no pagar un ítem adjudicado dentro del plazo. Regularizá tu situación para volver a participar en subastas.',
  });

  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      data={fines}
      keyExtractor={(f) => f.ventaId}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Ionicons name="checkmark-circle-outline" size={56} color={colors.greenLive} />
          <Text style={styles.empty}>No tenés multas.</Text>
          <Text style={styles.emptySub}>Tu situación está regularizada.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const pagada = item.estado === 'PAGADA';
        const badge = pagada
          ? { color: colors.greenLive, text: 'Pagada' }
          : { color: colors.orangePending, text: 'Pendiente' };
        return (
          <TouchableOpacity activeOpacity={0.7} onPress={() => abrir(item)}>
            <Card style={{ marginBottom: 10 }}>
              <View style={styles.row}>
                <Ionicons
                  name={pagada ? 'checkmark-circle' : 'warning'}
                  size={24}
                  color={pagada ? colors.greenLive : colors.orangePending}
                  style={{ marginRight: 12 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={1}>{item.descripcion ?? 'Multa por impago'}</Text>
                  <Text style={styles.monto}>{item.moneda ?? '$'} {item.monto.toLocaleString('es-AR')}</Text>
                </View>
                <View style={styles.tail}>
                  <View style={[styles.badge, { backgroundColor: badge.color }]}>
                    <Text style={styles.badgeText}>{badge.text}</Text>
                  </View>
                  <View style={styles.cta}>
                    <Text style={[styles.ctaText, pagada && { color: colors.greenLive }]}>
                      {pagada ? 'Ver comprobante' : 'Pagar'}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={pagada ? colors.greenLive : colors.brandPrimary} />
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  empty: { color: colors.textPrimary, textAlign: 'center', marginTop: 14, fontSize: 16, fontWeight: '600' },
  emptySub: { color: colors.inputHint, textAlign: 'center', marginTop: 4, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  monto: { fontSize: 14, color: colors.brandPrimary, fontWeight: '700', marginTop: 4 },
  tail: { alignItems: 'flex-end' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: colors.textOnDark, fontSize: 11, fontWeight: '700' },
  cta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  ctaText: { color: colors.brandPrimary, fontWeight: '700', fontSize: 13 },
});
