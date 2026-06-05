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

type StatusKey = 'todas' | 'activas' | 'proximas' | 'cerradas';
const STATUS_TABS: { key: StatusKey; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'activas', label: 'Activas' },
  { key: 'proximas', label: 'Próximas' },
  { key: 'cerradas', label: 'Vendidas' },
];

function matchesStatus(a: Auction, status: StatusKey): boolean {
  switch (status) {
    case 'activas': return a.estado === 'EN_CURSO' || a.estado === 'ABIERTA';
    case 'proximas': return a.estado === 'PROXIMA';
    case 'cerradas': return a.estado === 'CERRADA';
    default: return true;
  }
}

export default function DiscoverScreen() {
  const nav = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<Categoria | null>(null);
  const [status, setStatus] = useState<StatusKey>('todas');
  const [all, setAll] = useState<Auction[]>([]);

  useEffect(() => {
    auctionsApi.list({ size: 50 }).then((r) => setAll(r.content ?? [])).catch(() => setAll([]));
  }, []);

  const filtered = useMemo(() => {
    return all.filter((a) => {
      if (!matchesStatus(a, status)) return false;
      if (cat && a.categoriaRequerida !== cat) return false;
      if (query && !a.titulo.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [all, query, cat, status]);

  return (
    <ScrollView style={{ flex: 1 }}>
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

        <View style={styles.statusRow}>
          {STATUS_TABS.map((t) => {
            const active = status === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setStatus(t.key)}
                style={[styles.statusChip, active && styles.statusChipActive]}
              >
                <Text style={[styles.statusText, active && styles.statusTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Subastas destacadas</Text>
        {filtered.length === 0 ? (
          <Text style={styles.empty}>Sin resultados.</Text>
        ) : (
          filtered.map((a) => {
            const cerrada = a.estado === 'CERRADA';
            return (
              <AuctionCard
                key={a.id}
                auction={a}
                dimmed={cerrada}
                onPress={() =>
                  cerrada
                    ? nav.navigate('SoldItemDetail', { auctionId: a.id })
                    : nav.navigate('AuctionDetail', { auctionId: a.id })
                }
              />
            );
          })
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
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
  },
  statusChipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  statusText: { fontSize: 12, fontWeight: '600', color: colors.inputHint },
  statusTextActive: { color: colors.onPrimary },
  empty: { color: colors.inputHint, textAlign: 'center', padding: 24 },
});
