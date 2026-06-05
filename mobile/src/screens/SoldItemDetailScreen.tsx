import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import { colors } from '@/theme/colors';
import { auctionsApi, bidsApi } from '@/api/services';
import type { Auction, Bid, Piece } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'SoldItemDetail'>;

export default function SoldItemDetailScreen() {
  const { params } = useRoute<Rt>();
  const { auctionId } = params;
  const [auction, setAuction] = useState<Auction | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    Promise.all([
      auctionsApi.detail(auctionId).catch(() => null),
      auctionsApi.catalog(auctionId).catch(() => []),
      bidsApi.history(auctionId).catch(() => ({ content: [] } as any)),
    ]).then(([a, c, h]) => {
      setAuction(a);
      setPieces(c ?? []);
      setBids(h.content ?? []);
    });
  }, [auctionId]);

  const sold = pieces.filter((p) => p.vendido);
  // Piezas sin pujador en subasta cerrada: la empresa compra al precio base (PDF).
  const companyBought = auction?.estado === 'CERRADA' ? pieces.filter((p) => !p.vendido) : [];

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={styles.head}>
        <Text style={styles.kicker}>VENDIDO</Text>
        <Text style={styles.title}>{auction?.titulo ?? '—'}</Text>
      </View>

      {sold.length === 0 && companyBought.length === 0 ? (
        <Text style={styles.empty}>No hay piezas vendidas en esta subasta.</Text>
      ) : null}

      {sold.map((p) => (
        <Card key={p.id} style={{ margin: 16 }}>
          <Text style={styles.pieceTitle}>{p.descripcion}</Text>
          <Text style={styles.priceLabel}>Precio final</Text>
          <Text style={styles.priceVal}>
            {p.moneda} {(p.precioVenta ?? 0).toLocaleString('es-AR')}
          </Text>
          {p.obraArte ? (
            <View style={styles.artistRow}>
              <Ionicons name="color-palette-outline" size={13} color={colors.inputHint} style={{ marginRight: 4 }} />
              <Text style={styles.artist}>{p.obraArte.artista} {p.obraArte.fecha ? `· ${p.obraArte.fecha}` : ''}</Text>
            </View>
          ) : null}
        </Card>
      ))}

      {companyBought.length > 0 ? (
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={styles.sectionTitle}>Adquiridas por la empresa</Text>
          {companyBought.map((p) => (
            <Card key={p.id} style={{ marginBottom: 8 }}>
              <Text style={styles.pieceTitle}>{p.descripcion}</Text>
              <Text style={styles.companyLabel}>Sin pujadores — comprada por la empresa</Text>
              <Text style={styles.priceVal}>
                {p.moneda} {p.precioBase.toLocaleString('es-AR')}
              </Text>
            </Card>
          ))}
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <Text style={styles.sectionTitle}>Historial de pujas</Text>
        {bids.length === 0 ? (
          <Text style={styles.empty}>Sin pujas registradas.</Text>
        ) : bids.map((b) => (
          <Card key={b.id} style={{ marginBottom: 6 }}>
            <View style={styles.bidRow}>
              <Text style={styles.bidUser}>{b.usuarioNombre ?? 'Postor'}</Text>
              <Text style={styles.bidAmt}>{b.monto.toLocaleString('es-AR')}</Text>
            </View>
            <Text style={styles.bidTime}>{new Date(b.timestamp).toLocaleString('es-AR')}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { backgroundColor: colors.brandPrimary, padding: 20 },
  kicker: { color: colors.onPrimary, fontSize: 12, fontWeight: '700', letterSpacing: 0.16 },
  title: { color: colors.textOnDark, fontSize: 24, fontWeight: '700', marginTop: 4 },
  pieceTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  priceLabel: { fontSize: 12, color: colors.inputHint, marginTop: 8 },
  priceVal: { fontSize: 28, fontWeight: '700', color: colors.brandPrimary },
  artist: { fontSize: 13, color: colors.inputHint },
  artistRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8, marginTop: 8 },
  companyLabel: { fontSize: 12, color: colors.inputHint, marginTop: 4 },
  empty: { color: colors.inputHint, textAlign: 'center', padding: 24 },
  bidRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bidUser: { color: colors.textPrimary, fontSize: 14 },
  bidAmt: { color: colors.brandPrimary, fontSize: 14, fontWeight: '700' },
  bidTime: { color: colors.inputHint, fontSize: 11, marginTop: 2 },
});
