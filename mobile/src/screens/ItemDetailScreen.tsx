import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, ActivityIndicator, Image, FlatList, Dimensions,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { auctionsApi } from '@/api/services';
import type { Auction, Piece } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

const { width: SCREEN_W } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Rt = RouteProp<MainStackParamList, 'ItemDetail'>;

export default function ItemDetailScreen() {
  const nav = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { auctionId, pieceId } = params;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [piece, setPiece] = useState<Piece | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      auctionsApi.detail(auctionId).catch(() => null),
      auctionsApi.catalog(auctionId).catch(() => [] as Piece[]),
    ]).then(([a, c]) => {
      if (cancelled) return;
      setAuction(a);
      setPiece((c ?? []).find((p) => p.id === pieceId) ?? null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [auctionId, pieceId]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;
  }
  if (!piece) {
    return <View style={styles.center}><Text>No se encontró el ítem.</Text></View>;
  }

  const images = piece.imagenes ?? piece.fotos ?? [];
  const moneda = auction?.moneda ?? 'ARS';
  const enCurso = auction?.estado === 'EN_CURSO';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      {images.length > 0 ? (
        <FlatList
          data={images}
          keyExtractor={(uri, i) => `${uri}-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
          )}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="image-outline" size={56} color={colors.inputHint} />
        </View>
      )}

      <View style={{ padding: 16 }}>
        <Text style={styles.title}>
          {piece.numeroItem ? `Lote #${piece.numeroItem} — ` : ''}{piece.descripcion}
        </Text>

        <Card style={{ marginTop: 12 }}>
          <Row k="Precio base" v={`${moneda} ${piece.precioBase.toLocaleString('es-AR')}`} />
          {piece.mejorOferta != null ? (
            <Row k="Mejor oferta" v={`${moneda} ${piece.mejorOferta.toLocaleString('es-AR')}`} highlight />
          ) : null}
          {piece.artista ? <Row k="Artista" v={piece.artista} /> : null}
          {piece.fechaObra ? <Row k="Año" v={piece.fechaObra} /> : null}
          {piece.depositoNombre ? <Row k="Depósito" v={piece.depositoNombre} /> : null}
        </Card>

        {piece.historia ? (
          <Card style={{ marginTop: 12 }}>
            <Text style={styles.historiaLabel}>Historia / Procedencia</Text>
            <Text style={styles.historia}>{piece.historia}</Text>
          </Card>
        ) : null}

        {enCurso ? (
          <PrimaryButton
            title="Participar"
            style={{ marginTop: 16 }}
            onPress={() => nav.navigate('LiveBidding', { auctionId })}
            disabled={auction?.usuarioPuedeParticipar === false}
          />
        ) : null}
      </View>
    </ScrollView>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowKey}>{k}</Text>
      <Text style={[styles.rowVal, highlight && styles.highlight]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceCream },
  image: { width: SCREEN_W, height: 280, backgroundColor: colors.surfaceWhite },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowKey: { color: colors.inputHint, fontSize: 14 },
  rowVal: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  highlight: { color: colors.brandPrimary, fontSize: 16, fontWeight: '700' },
  historiaLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  historia: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
});
