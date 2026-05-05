import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AuctionCard from '@/components/AuctionCard';
import { colors, categoriaColor } from '@/theme/colors';
import { auctionsApi } from '@/api/services';
import type { Auction, Categoria } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const CATS: Categoria[] = ['COMUN', 'ESPECIAL', 'PLATA', 'ORO', 'PLATINO'];

export default function DiscoverScreen() {
  const nav = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<Categoria | null>(null);
  const [all, setAll] = useState<Auction[]>([]);

  useEffect(() => {
    auctionsApi.list({ size: 50 }).then((r) => setAll(r.content ?? [])).catch(() => setAll([]));
  }, []);

  const filtered = useMemo(() => {
    return all.filter((a) => {
      if (cat && a.categoriaRequerida !== cat) return false;
      if (query && !a.titulo.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [all, query, cat]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Descubrir</Text>

        <TextInput
          placeholder="Buscar subastas, piezas, categorías…"
          placeholderTextColor={colors.inputHint}
          style={styles.search}
          value={query}
          onChangeText={setQuery}
        />

        <Text style={styles.sectionTitle}>Categorías</Text>
        <View style={styles.chips}>
          {CATS.map((c) => {
            const active = cat === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCat(active ? null : c)}
                style={[
                  styles.chip,
                  { backgroundColor: active ? categoriaColor(c) : colors.inputBg, borderColor: categoriaColor(c) },
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Subastas destacadas</Text>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>Sin resultados.</Text>
        ) : (
          filtered.map((a) => (
            <AuctionCard key={a.id} auction={a} onPress={() => nav.navigate('AuctionDetail', { auctionId: a.id })} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20 },
  title: { fontSize: 36, fontWeight: '700', color: colors.brandPrimary, marginBottom: 16 },
  search: {
    backgroundColor: colors.inputBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.inputHint },
  chipTextActive: { color: colors.textOnDark },
  empty: { color: colors.inputHint, textAlign: 'center', padding: 24 },
});
