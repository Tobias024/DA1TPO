import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import { colors } from '@/theme/colors';
import { auctionsApi } from '@/api/services';
import type { Auction, Piece } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'SoldItemDetail'>;
type Nav = NativeStackNavigationProp<MainStackParamList>;

export default function SoldItemDetailScreen() {
  const { params } = useRoute<Rt>();
  const nav = useNavigation<Nav>();
  const { auctionId } = params;
  const [auction, setAuction] = useState<Auction | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      auctionsApi.detail(auctionId).catch(() => null),
      auctionsApi.catalog(auctionId).catch(() => []),
    ]).then(([a, c]) => {
      if (cancelled) return;
      setAuction(a);
      setPieces(Array.isArray(c) ? c : []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [auctionId]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;
  }

  const moneda = auction?.moneda ?? '';
  const vendidas = pieces.filter((p) => (p.estado === 'VENDIDO' || p.estado === 'ADJUDICADO') && p.mejorOferta != null);
  // Piezas sin pujador en subasta cerrada: la empresa compra al precio base (PDF).
  const companyBought = pieces.filter((p) => p.mejorOferta == null);

  // Al abrir un ítem voy a la pantalla de venta (LiveBidding): muestra el historial
  // de pujas de ESE ítem y mantiene la puja bloqueada por estar vendido/cerrado.
  const abrirItem = (p: Piece) => nav.navigate('LiveBidding', { auctionId, pieceId: p.id });

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.head}>
        <Text style={styles.kicker}>SUBASTA FINALIZADA</Text>
        <Text style={styles.title}>{auction?.titulo ?? '—'}</Text>
      </View>

      {vendidas.length === 0 && companyBought.length === 0 ? (
        <Text style={styles.empty}>No hay piezas en esta subasta.</Text>
      ) : null}

      {vendidas.length > 0 ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={styles.sectionTitle}>Piezas vendidas</Text>
          {vendidas.map((p) => (
            <TouchableOpacity key={p.id} activeOpacity={0.7} onPress={() => abrirItem(p)}>
              <Card style={{ marginBottom: 10 }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pieceTitle} numberOfLines={2}>
                      {p.numeroItem ? `Lote #${p.numeroItem} — ` : ''}{p.descripcion}
                    </Text>
                    <Text style={styles.priceLabel}>Precio final</Text>
                    <Text style={styles.priceVal}>{moneda} {(p.mejorOferta ?? 0).toLocaleString('es-AR')}</Text>
                  </View>
                  <View style={styles.cta}>
                    <Text style={styles.ctaText}>Ver pujas</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.brandPrimary} />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {companyBought.length > 0 ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <Text style={styles.sectionTitle}>Adquiridas por la empresa</Text>
          {companyBought.map((p) => (
            <TouchableOpacity key={p.id} activeOpacity={0.7} onPress={() => abrirItem(p)}>
              <Card style={{ marginBottom: 8 }}>
                <Text style={styles.pieceTitle} numberOfLines={2}>
                  {p.numeroItem ? `Lote #${p.numeroItem} — ` : ''}{p.descripcion}
                </Text>
                <Text style={styles.companyLabel}>Sin pujadores — comprada por la empresa al precio base</Text>
                <Text style={styles.priceVal}>{moneda} {p.precioBase.toLocaleString('es-AR')}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  head: { backgroundColor: colors.brandPrimary, padding: 20 },
  kicker: { color: colors.onPrimary, fontSize: 12, fontWeight: '700', letterSpacing: 0.16 },
  title: { color: colors.textOnDark, fontSize: 24, fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  pieceTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  priceLabel: { fontSize: 12, color: colors.inputHint, marginTop: 8 },
  priceVal: { fontSize: 22, fontWeight: '700', color: colors.brandPrimary, marginTop: 2 },
  companyLabel: { fontSize: 12, color: colors.inputHint, marginTop: 4 },
  cta: { flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  ctaText: { color: colors.brandPrimary, fontWeight: '700', fontSize: 14 },
  empty: { color: colors.inputHint, textAlign: 'center', padding: 24 },
});
