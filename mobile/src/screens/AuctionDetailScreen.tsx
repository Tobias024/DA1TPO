import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Linking, ActivityIndicator, Alert, Image, TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, categoriaColor } from '@/theme/colors';
import { auctionsApi } from '@/api/services';
import { useSession } from '@/storage/SessionContext';
import type { Auction, Piece } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Rt = RouteProp<MainStackParamList, 'AuctionDetail'>;

function pieceImage(p: Piece): string | undefined {
  return (p.imagenes ?? p.fotos ?? [])[0];
}

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
      setCatalog(Array.isArray(c) ? c : []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [auctionId]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;
  }
  if (!auction) {
    return <View style={styles.center}><Text>No se encontró la subasta.</Text></View>;
  }

  const enCurso = auction.estado === 'EN_CURSO';
  const fecha = new Date(auction.fechaHoraInicio).toLocaleString('es-AR');

  const openItem = (p: Piece) => {
    const sold = p.estado === 'VENDIDO';
    if (enCurso && !sold) {
      if (activeAuctionId && activeAuctionId !== auctionId) {
        Alert.alert('Ya estás en otra subasta', 'Salí de la subasta actual antes de pujar en esta.');
        return;
      }
      nav.navigate('LiveBidding', { auctionId, pieceId: p.id });
    } else {
      nav.navigate('ItemDetail', { auctionId, pieceId: p.id });
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.head}>
        <Text style={styles.title}>{auction.titulo}</Text>
        <View style={styles.tags}>
          <View style={[styles.chip, { backgroundColor: categoriaColor(auction.categoriaRequerida) }]}>
            <Text style={styles.chipText}>{auction.categoriaRequerida}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.brandPrimary }]}>
            <Text style={styles.chipText}>{auction.moneda}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: enCurso ? colors.redLive : colors.blueUpcoming }]}>
            <Text style={styles.chipText}>{auction.estado}</Text>
          </View>
        </View>
      </View>

      <Card style={{ margin: 16 }}>
        <Row k="Fecha y hora" v={fecha} />
        {auction.ubicacion ? <Row k="Ubicación" v={auction.ubicacion} /> : null}
        {auction.rematador ? <Row k="Rematador" v={auction.rematador.nombre} /> : null}
        {auction.descripcion ? <Row k="Descripción" v={auction.descripcion} /> : null}
        {!enCurso ? (
          <View style={styles.warningRow}>
            <Ionicons name="time-outline" size={16} color={colors.orangePending} style={{ marginRight: 6 }} />
            <Text style={styles.warning}>
              {auction.estado === 'CERRADA' ? 'Subasta finalizada.' : 'La subasta todavía no está en vivo. Vas a poder pujar cuando comience.'}
            </Text>
          </View>
        ) : auction.motivoNoPuede ? (
          <View style={styles.warningRow}>
            <Ionicons name="warning" size={16} color={colors.orangePending} style={{ marginRight: 6 }} />
            <Text style={styles.warning}>{auction.motivoNoPuede}</Text>
          </View>
        ) : null}
      </Card>

      <View style={{ paddingHorizontal: 16 }}>
        <Text style={styles.sectionTitle}>Catálogo ({catalog.length})</Text>
        {catalog.map((p) => {
          const sold = p.estado === 'VENDIDO';
          const img = pieceImage(p);
          return (
            <TouchableOpacity key={p.id} activeOpacity={0.7} onPress={() => openItem(p)}>
              <Card style={[{ marginBottom: 8 }, sold && styles.soldCard]}>
                <View style={styles.itemRow}>
                  <View>
                    {img ? (
                      <Image source={{ uri: img }} style={[styles.thumb, sold && styles.thumbSold]} resizeMode="cover" />
                    ) : (
                      <View style={[styles.thumb, styles.thumbPlaceholder]}>
                        <Ionicons name="image-outline" size={22} color={colors.inputHint} />
                      </View>
                    )}
                    {sold ? (
                      <View style={styles.soldOverlay}><Text style={styles.soldText}>Item vendido</Text></View>
                    ) : null}
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.pieceTitle, sold && styles.mutedText]} numberOfLines={2}>
                      {p.numeroItem ? `Lote #${p.numeroItem} — ` : ''}{p.descripcion}
                    </Text>
                    <Text style={[styles.pieceBase, sold && styles.mutedText]}>
                      {sold ? 'Vendido en' : 'Precio base'}: {auction.moneda} {(p.mejorOferta ?? p.precioBase).toLocaleString('es-AR')}
                    </Text>
                    {enCurso && !sold ? (
                      <View style={styles.pujaHint}>
                        <Ionicons name="pricetag" size={13} color={colors.brandPrimary} style={{ marginRight: 4 }} />
                        <Text style={styles.pujaHintText}>Tocá para pujar</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
        {catalog.length === 0 ? <Text style={styles.empty}>Catálogo no disponible aún.</Text> : null}
      </View>

      {auction.streamingUrl ? (
        <View style={{ padding: 16 }}>
          <PrimaryButton
            title="Ver Streaming"
            variant="outlined"
            onPress={() => Linking.openURL(auction.streamingUrl!).catch(() => {})}
          />
        </View>
      ) : null}
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
  warningRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  warning: { color: colors.orangePending, fontSize: 13, flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginVertical: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 84, height: 84, borderRadius: 8, backgroundColor: colors.surfaceCream },
  thumbSold: { opacity: 0.4 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  soldOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  soldText: {
    color: colors.textOnDark, fontWeight: '700', fontSize: 11,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden',
  },
  soldCard: { opacity: 0.8 },
  mutedText: { color: colors.inputHint },
  pieceTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  pieceBase: { fontSize: 14, color: colors.brandPrimary, marginTop: 4 },
  pujaHint: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  pujaHintText: { fontSize: 12, color: colors.brandPrimary, fontWeight: '600' },
  empty: { color: colors.inputHint, padding: 16, textAlign: 'center' },
});
