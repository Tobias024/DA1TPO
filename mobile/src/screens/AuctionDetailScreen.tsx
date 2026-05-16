import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Linking, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, categoriaColor } from '@/theme/colors';
import { auctionsApi } from '@/api/services';
import { useSession } from '@/storage/SessionContext';
import type { Auction, Piece } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Rt = RouteProp<MainStackParamList, 'AuctionDetail'>;

export default function AuctionDetailScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { auctionId } = params;
  const { activeAuctionId } = useSession();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [catalog, setCatalog] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      auctionsApi.detail(auctionId).catch(() => null),
      auctionsApi.catalog(auctionId).catch(() => []),
    ]).then(([a, c]) => {
      if (cancelled) return;
      setAuction(a);
      setCatalog(c ?? []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [auctionId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }
  if (!auction) {
    return <View style={styles.center}><Text>No se encontró la subasta.</Text></View>;
  }

  const fecha = new Date(auction.fechaHoraInicio).toLocaleString('es-AR');

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <View style={styles.head}>
        <Text style={styles.title}>{auction.titulo}</Text>
        <View style={styles.tags}>
          <View style={[styles.chip, { backgroundColor: categoriaColor(auction.categoriaRequerida) }]}>
            <Text style={styles.chipText}>{auction.categoriaRequerida}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.brandPrimary }]}>
            <Text style={styles.chipText}>{auction.moneda}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: auction.estado === 'EN_CURSO' ? colors.redLive : colors.blueUpcoming }]}>
            <Text style={styles.chipText}>{auction.estado}</Text>
          </View>
        </View>
      </View>

      <Card style={{ margin: 16 }}>
        <Row k="Fecha y hora" v={fecha} />
        {auction.ubicacion ? <Row k="Ubicación" v={auction.ubicacion} /> : null}
        {auction.rematador ? <Row k="Rematador" v={auction.rematador.nombre} /> : null}
        {auction.descripcion ? <Row k="Descripción" v={auction.descripcion} /> : null}
        {auction.motivoNoPuede ? (
          <Text style={styles.warning}>⚠ {auction.motivoNoPuede}</Text>
        ) : null}
      </Card>

      <View style={{ paddingHorizontal: 16 }}>
        <Text style={styles.sectionTitle}>Catálogo ({catalog.length})</Text>
        {catalog.map((p) => (
          <Card key={p.id} style={{ marginBottom: 8 }}>
            <Text style={styles.pieceTitle}>
              {p.numero ? `Lote #${p.numero} — ` : ''}{p.descripcion}
            </Text>
            <Text style={styles.pieceBase}>
              Precio base: {p.moneda} {p.precioBase.toLocaleString('es-AR')}
            </Text>
            {p.obraArte?.artista ? <Text style={styles.pieceArtist}>🎨 {p.obraArte.artista}</Text> : null}
          </Card>
        ))}
        {catalog.length === 0 ? <Text style={styles.empty}>Catálogo no disponible aún.</Text> : null}
      </View>

      <View style={{ padding: 16 }}>
        <PrimaryButton
          title="Participar"
          onPress={() => {
            if (activeAuctionId && activeAuctionId !== auctionId) {
              Alert.alert(
                'Ya estás en otra subasta',
                'Solo podés estar conectado en una subasta a la vez. Salí de la subasta actual antes de unirte a esta.',
              );
              return;
            }
            nav.navigate('LiveBidding', { auctionId });
          }}
          disabled={!auction.usuarioPuedeParticipar}
        />
        {auction.streamingUrl ? (
          <PrimaryButton
            title="Ver Streaming"
            variant="outlined"
            style={{ marginTop: 8 }}
            onPress={() => Linking.openURL(auction.streamingUrl!).catch(() => {})}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowKey}>{k}</Text>
      <Text style={styles.rowVal}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceCream },
  head: {
    backgroundColor: colors.surfaceWhite,
    padding: 20,
    borderBottomColor: colors.inputBorder,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  chipText: { color: colors.textOnDark, fontSize: 11, fontWeight: '700' },
  row: { flexDirection: 'row', marginBottom: 8 },
  rowKey: { width: 110, color: colors.inputHint, fontSize: 13 },
  rowVal: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  warning: { color: colors.orangePending, fontSize: 13, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginVertical: 8 },
  pieceTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  pieceBase: { fontSize: 14, color: colors.brandPrimary, marginTop: 4 },
  pieceArtist: { fontSize: 12, color: colors.inputHint, marginTop: 4 },
  empty: { color: colors.inputHint, padding: 16, textAlign: 'center' },
});
