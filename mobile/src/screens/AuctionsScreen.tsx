import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '@/components/ScreenHeader';
import AuctionCard from '@/components/AuctionCard';
import { colors } from '@/theme/colors';
import { auctionsApi } from '@/api/services';
import type { Auction } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const FILTERS = [
  { key: undefined as string | undefined, label: 'Todas' },
  { key: 'ABIERTA', label: 'Activas' },
  { key: 'PROXIMA', label: 'Próximas' },
  { key: 'CERRADA', label: 'Cerradas' },
];

export default function AuctionsScreen() {
  const nav = useNavigation<Nav>();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await auctionsApi.list({ estado: filter, size: 50 });
      setAuctions(r.content ?? []);
    } catch {
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <ScreenHeader title="Subastas" subtitle="Subastas activas y programadas" />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.label}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={auctions}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{loading ? 'Cargando…' : 'No hay subastas en esta categoría.'}</Text>
        }
        renderItem={({ item }) => {
          if (item.estado === 'CERRADA') {
            return (
              <AuctionCard
                auction={item}
                onPress={() => nav.navigate('SoldItemDetail', { auctionId: item.id })}
              />
            );
          }
          return (
            <AuctionCard
              auction={item}
              onPress={() => nav.navigate('AuctionDetail', { auctionId: item.id })}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surfaceCream,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { color: colors.inputHint, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: colors.onPrimary },
  empty: { textAlign: 'center', color: colors.inputHint, padding: 24 },
});
