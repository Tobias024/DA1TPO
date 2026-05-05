import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '@/components/ScreenHeader';
import AuctionCard from '@/components/AuctionCard';
import PrimaryButton from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { auctionsApi } from '@/api/services';
import type { Auction } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const [activas, setActivas] = useState<Auction[]>([]);
  const [proximas, setProximas] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, p] = await Promise.all([
        auctionsApi.list({ estado: 'ABIERTA', size: 10 }).catch(() => ({ content: [] } as any)),
        auctionsApi.list({ estado: 'PROGRAMADA', size: 10 }).catch(() => ({ content: [] } as any)),
      ]);
      setActivas(a.content ?? []);
      setProximas(p.content ?? []);
    } catch (e) {
      setError('No pudimos cargar las subastas. Reintentá.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.surfaceCream }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <ScreenHeader title="SubastAR" subtitle="Conectá con cada remate desde donde estés." />

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subastas Activas</Text>
          <Text style={styles.sectionLink} onPress={() => nav.navigate('Tabs', { screen: 'Auctions' } as never)}>
            Ver todas →
          </Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && activas.length === 0 && !error ? (
          <Text style={styles.empty}>No hay subastas activas en este momento.</Text>
        ) : null}
        {activas.map((a) => (
          <AuctionCard key={a.id} auction={a} onPress={() => nav.navigate('AuctionDetail', { auctionId: a.id })} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximas Subastas</Text>
        <Text style={styles.sectionHint}>Programadas para esta semana</Text>
        {!loading && proximas.length === 0 ? (
          <Text style={styles.empty}>Sin subastas programadas.</Text>
        ) : null}
        {proximas.map((a) => (
          <AuctionCard key={a.id} auction={a} onPress={() => nav.navigate('AuctionDetail', { auctionId: a.id })} />
        ))}
      </View>

      <PrimaryButton
        title="DESCUBRIR"
        onPress={() => nav.navigate('Discover')}
        style={{ marginHorizontal: 20, marginBottom: 32 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  sectionHint: { fontSize: 14, color: colors.inputHint, marginBottom: 12 },
  sectionLink: { color: colors.brandPrimary, fontSize: 14, fontWeight: '600' },
  empty: { color: colors.inputHint, fontSize: 14, textAlign: 'center', padding: 24 },
  error: { color: colors.redLive, fontSize: 14, textAlign: 'center', padding: 12 },
});
