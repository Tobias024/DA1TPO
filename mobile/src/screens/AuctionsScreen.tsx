import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, TextInput } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import ScreenHeader from '@/components/ScreenHeader';
import AuctionCard from '@/components/AuctionCard';
import { colors, categoriaColor, categoriaTextColor } from '@/theme/colors';
import { auctionsApi } from '@/api/services';
import type { Auction, Categoria } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';
import type { MainTabParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainTabParamList, 'Auctions'>;

const CATS: Categoria[] = ['COMUN', 'ESPECIAL', 'PLATA', 'ORO', 'PLATINO'];

const FILTERS = [
  { key: undefined as string | undefined, label: 'Todas' },
  { key: 'EN_CURSO', label: 'Activas' },
  { key: 'PROXIMA', label: 'Próximas' },
  { key: 'CERRADA', label: 'Cerradas' },
];

export default function AuctionsScreen() {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filter, setFilter] = useState<string | undefined>(route.params?.initialFilter);
  const [cat, setCat] = useState<Categoria | null>((route.params?.initialCat as Categoria) ?? null);
  const [query, setQuery] = useState('');
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

  // Solo carga datos al enfocar
  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  // Solo aplica el filtro inicialmente cuando cambian los params
  React.useEffect(() => {
    if (route.params?.initialFilter !== undefined) {
      setFilter(route.params.initialFilter);
    }
  }, [route.params?.initialFilter]);

  const filtered = useMemo(() => {
    return auctions.filter((a) => {
      if (filter && a.estado !== filter) return false;
      if (cat && a.categoriaRequerida !== cat) return false;
      if (query && !a.titulo.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [auctions, filter, cat, query]);

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="SubastAR" />

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 20, paddingTop: 8 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListHeaderComponent={
          <View>
            <Text style={styles.pageTitle}>Descubrir</Text>

            <TextInput
              placeholder="Buscar subastas…"
              placeholderTextColor={colors.inputHint}
              style={styles.search}
              value={query}
              onChangeText={setQuery}
            />

            <View style={styles.catsRow}>
              {CATS.map((c) => {
                const active = cat === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCat(active ? null : c)}
                    style={[styles.catChip, {
                      backgroundColor: active ? categoriaColor(c) : colors.inputBg,
                      borderColor: categoriaTextColor(c),
                    }]}
                  >
                    <Text style={[styles.catChipText, { color: categoriaTextColor(c) }]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>

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
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>{loading ? 'Cargando…' : 'No hay subastas.'}</Text>
        }
        renderItem={({ item }) => (
          <AuctionCard
            auction={item}
            onPress={() =>
              item.estado === 'CERRADA'
                ? nav.navigate('SoldItemDetail', { auctionId: item.id })
                : nav.navigate('AuctionDetail', { auctionId: item.id })
            }
          />
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  pageTitle: { 
    fontSize: 26, 
    fontWeight: '700', 
    color: colors.brandPrimary, 
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 4,
    textAlign: 'center',
  },
  search: {
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 10,
  },
  catsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 0 },
  catChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  catChipText: { fontSize: 11, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    justifyContent: 'center',
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
