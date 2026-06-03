import React, { useCallback, useState } from 'react';
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

export default function WonItemsScreen() {
  const nav = useNavigation<Nav>();
  const [items, setItems] = useState<WonItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    salesApi.won()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.surfaceCream }}
      contentContainerStyle={{ padding: 16 }}
      data={items}
      keyExtractor={(it) => it.piezaId}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListEmptyComponent={<Text style={styles.empty}>Todavía no ganaste ninguna pieza.</Text>}
      renderItem={({ item }) => {
        const pagado = item.estadoPago === 'PAGADO';
        return (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => nav.navigate('Acquisition', { piezaId: item.piezaId })}
          >
            <Card style={{ marginBottom: 10 }}>
              <Text style={styles.title}>{item.descripcion}</Text>
              <Text style={styles.price}>{item.moneda} {item.montoGanador.toLocaleString('es-AR')}</Text>
              <View style={styles.footer}>
                <View style={[styles.badge, { backgroundColor: pagado ? colors.greenLive : colors.orangePending }]}>
                  <Text style={styles.badgeText}>{pagado ? 'Pagado' : 'Pendiente de pago'}</Text>
                </View>
                {!pagado ? (
                  <View style={styles.payCta}>
                    <Text style={styles.payCtaText}>Pagar</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.brandPrimary} />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceCream },
  title: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  price: { fontSize: 18, fontWeight: '700', color: colors.brandPrimary, marginTop: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: colors.textOnDark, fontSize: 11, fontWeight: '700' },
  payCta: { flexDirection: 'row', alignItems: 'center' },
  payCtaText: { color: colors.brandPrimary, fontWeight: '700', fontSize: 14 },
  empty: { color: colors.inputHint, textAlign: 'center', marginTop: 40 },
});
