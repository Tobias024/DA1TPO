import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Linking, ActivityIndicator, Alert,
  FlatList, Image, TouchableOpacity, Dimensions,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, categoriaColor } from '@/theme/colors';
import { auctionsApi } from '@/api/services';
import { useSession } from '@/storage/SessionContext';
import type { Auction, Piece, Moneda } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

const { width: SCREEN_W } = Dimensions.get('window');

/** Imágenes de una pieza, tolerando el shape del backend (imagenes) y legacy (fotos). */
function pieceImages(p: Piece): string[] {
  return p.imagenes ?? p.fotos ?? [];
}

/** Precio a mostrar: mejor oferta si existe, si no el precio base. */
function piecePrice(p: Piece): number {
  return p.mejorOferta ?? p.precioBase;
}

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

      {catalog.length > 0 ? (
        <ItemsCarousel
          catalog={catalog}
          moneda={auction.moneda}
          onPress={(pieceId) => nav.navigate('ItemDetail', { auctionId, pieceId })}
        />
      ) : null}

      <Card style={{ margin: 16 }}>
        <Row k="Fecha y hora" v={fecha} />
        {auction.ubicacion ? <Row k="Ubicación" v={auction.ubicacion} /> : null}
        {auction.rematador ? <Row k="Rematador" v={auction.rematador.nombre} /> : null}
        {auction.descripcion ? <Row k="Descripción" v={auction.descripcion} /> : null}
        {auction.motivoNoPuede ? (
          <View style={styles.warningRow}>
            <Ionicons name="warning" size={16} color={colors.orangePending} style={{ marginRight: 6 }} />
            <Text style={styles.warning}>{auction.motivoNoPuede}</Text>
          </View>
        ) : null}
      </Card>

      <View style={{ paddingHorizontal: 16 }}>
        <Text style={styles.sectionTitle}>Catálogo ({catalog.length})</Text>
        {catalog.map((p) => (
          <TouchableOpacity
            key={p.id}
            activeOpacity={0.7}
            onPress={() => nav.navigate('ItemDetail', { auctionId, pieceId: p.id })}
          >
            <Card style={{ marginBottom: 8 }}>
              <Text style={styles.pieceTitle}>
                {p.numeroItem ? `Lote #${p.numeroItem} — ` : ''}{p.descripcion}
              </Text>
              <Text style={styles.pieceBase}>
                Precio base: {auction.moneda} {p.precioBase.toLocaleString('es-AR')}
              </Text>
              {p.artista ? (
                <View style={styles.artistRow}>
                  <Ionicons name="color-palette-outline" size={13} color={colors.inputHint} style={{ marginRight: 4 }} />
                  <Text style={styles.pieceArtist}>{p.artista}</Text>
                </View>
              ) : null}
            </Card>
          </TouchableOpacity>
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

/** Carrusel de ítems: deslizar cambia imagen, título y precio. El título de la subasta
 * se mantiene arriba (en el header). El precio se muestra acá, ya que estás dentro de la subasta. */
function ItemsCarousel({
  catalog, moneda, onPress,
}: { catalog: Piece[]; moneda: Moneda; onPress: (pieceId: string) => void }) {
  const [index, setIndex] = useState(0);
  return (
    <View style={carouselStyles.wrapper}>
      <FlatList
        data={catalog}
        keyExtractor={(p) => p.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))
        }
        renderItem={({ item }) => {
          const img = pieceImages(item)[0];
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              style={carouselStyles.page}
              onPress={() => onPress(item.id)}
            >
              {img ? (
                <Image source={{ uri: img }} style={carouselStyles.image} resizeMode="cover" />
              ) : (
                <View style={[carouselStyles.image, carouselStyles.imagePlaceholder]}>
                  <Ionicons name="image-outline" size={48} color={colors.inputHint} />
                </View>
              )}
              <Text style={carouselStyles.itemTitle} numberOfLines={2}>
                {item.numeroItem ? `Lote #${item.numeroItem} — ` : ''}{item.descripcion}
              </Text>
              <Text style={carouselStyles.itemPrice}>
                {moneda} {piecePrice(item).toLocaleString('es-AR')}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
      {catalog.length > 1 ? (
        <View style={carouselStyles.dots}>
          {catalog.map((p, i) => (
            <View key={p.id} style={[carouselStyles.dot, i === index && carouselStyles.dotActive]} />
          ))}
        </View>
      ) : null}
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
  artistRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginVertical: 8 },
  pieceTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  pieceBase: { fontSize: 14, color: colors.brandPrimary, marginTop: 4 },
  pieceArtist: { fontSize: 12, color: colors.inputHint },
  empty: { color: colors.inputHint, padding: 16, textAlign: 'center' },
});

const carouselStyles = StyleSheet.create({
  wrapper: { backgroundColor: colors.surfaceWhite, paddingBottom: 12 },
  page: { width: SCREEN_W, paddingHorizontal: 16, paddingTop: 12, alignItems: 'center' },
  image: { width: SCREEN_W - 32, height: 220, borderRadius: 12, backgroundColor: colors.surfaceCream },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginTop: 10, textAlign: 'center' },
  itemPrice: { fontSize: 22, fontWeight: '700', color: colors.brandPrimary, marginTop: 4 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.inputBorder },
  dotActive: { backgroundColor: colors.brandPrimary, width: 18 },
});
