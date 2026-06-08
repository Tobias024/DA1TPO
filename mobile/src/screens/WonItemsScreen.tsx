import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import { colors } from '@/theme/colors';
import { salesApi } from '@/api/services';
import type { WonItem } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

function timeUntil(dateStr?: string | null): string {
  if (!dateStr) return '';
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return '0m';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${String(s).padStart(2, '0')}s`;
}

export default function WonItemsScreen() {
  const nav = useNavigation<Nav>();
  const [items, setItems] = useState<WonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    salesApi.won()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const irAMulta = () => nav.navigate('FineDetail', {
    titulo: 'Multa por impago',
    mensaje: 'No pagaste un ítem adjudicado dentro del plazo. Se aplicó una multa del 10%.',
  });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;
  }

  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      data={items}
      keyExtractor={(it) => it.ventaId ?? it.piezaId}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListEmptyComponent={<Text style={styles.empty}>Todavía no ganaste ninguna pieza.</Text>}
      renderItem={({ item }) => {
        const pagado = item.estadoPago === 'PAGADO';
        const fallido = item.estadoPago === 'INCUMPLIDO' || !!item.vencido;
        const pendiente = item.estadoPago === 'PENDIENTE_PAGO' && !item.vencido;

        const badge = pagado
          ? { color: colors.greenLive, text: 'Pagado' }
          : fallido
          ? { color: colors.redLive, text: 'Plazo vencido' }
          : { color: colors.orangePending, text: 'Pendiente de pago' };

        const onPress = () => {
          if (fallido) irAMulta();
          else nav.navigate('Acquisition', { piezaId: item.piezaId });
        };

        return (
          <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
            <Card style={{ marginBottom: 10 }}>
              <Text style={styles.title}>{item.descripcion}</Text>
              <Text style={styles.price}>{item.moneda} {item.montoGanador.toLocaleString('es-AR')}</Text>

              {pendiente && item.fechaLimitePago ? (
                <View style={styles.timerRow}>
                  <Ionicons name="time-outline" size={14} color={colors.orangePending} style={{ marginRight: 4 }} />
                  <Text style={styles.timer}>Pagá antes de {timeUntil(item.fechaLimitePago)}</Text>
                </View>
              ) : null}

              <View style={styles.footer}>
                <View style={[styles.badge, { backgroundColor: badge.color }]}>
                  <Text style={styles.badgeText}>{badge.text}</Text>
                </View>
                {pendiente ? (
                  <View style={styles.cta}>
                    <Text style={styles.ctaText}>Pagar</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.brandPrimary} />
                  </View>
                ) : fallido ? (
                  <View style={styles.cta}>
                    <Text style={[styles.ctaText, { color: colors.redLive }]}>Regularizar multa</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.redLive} />
                  </View>
                ) : null}
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
  title: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  price: { fontSize: 18, fontWeight: '700', color: colors.brandPrimary, marginTop: 4 },
  timerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  timer: { fontSize: 13, color: colors.orangePending, fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: colors.textOnDark, fontSize: 11, fontWeight: '700' },
  cta: { flexDirection: 'row', alignItems: 'center' },
  ctaText: { color: colors.brandPrimary, fontWeight: '700', fontSize: 14 },
  empty: { color: colors.inputHint, textAlign: 'center', marginTop: 40 },
});
