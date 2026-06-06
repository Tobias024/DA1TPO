import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors, categoriaColor, categoriaTextColor } from '@/theme/colors';
import { auctionsApi } from '@/api/services';
import type { Auction, Piece, Moneda } from '@/types/api';

type Props = {
  auction: Auction;
  onPress?: () => void;
  /** Atenúa la card (para subastas cerradas / ítems "apagados"). */
  dimmed?: boolean;
};

type BadgeSpec = {
  color: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'] | null;
};

const ESTADO_BADGE: Record<string, BadgeSpec> = {
  ABIERTA: { color: colors.greenLive, label: 'Abierta', icon: 'checkmark-circle' },
  EN_CURSO: { color: colors.redLive, label: 'En vivo', icon: 'ellipse' },
  PROXIMA: { color: colors.blueUpcoming, label: 'Próxima', icon: 'calendar-outline' },
  CERRADA: { color: colors.inputHint, label: 'Cerrada', icon: null },
};

function pieceImage(p: Piece): string | undefined {
  return (p.imagenes ?? p.fotos ?? [])[0];
}

export default function AuctionCard({ auction, onPress, dimmed }: Props) {
  const badge = ESTADO_BADGE[auction.estado] ?? ESTADO_BADGE.CERRADA;
  const [items, setItems] = useState<Piece[]>([]);

  useEffect(() => {
    let cancelled = false;
    auctionsApi.catalog(auction.id).then((c) => { if (!cancelled) setItems(c); }).catch(() => {});
    return () => { cancelled = true; };
  }, [auction.id]);

  return (
    <Card style={[styles.card, dimmed && styles.dimmed]}>
      {/* Header tocable: abre la subasta. */}
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <View style={styles.row}>
          <View style={styles.statusRow}>
            {badge.icon ? <Ionicons name={badge.icon} size={14} color={badge.color} style={{ marginRight: 4 }} /> : null}
            <Text style={[styles.status, { color: badge.color }]}>{badge.label}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: categoriaColor(auction.categoriaRequerida), borderColor: categoriaTextColor(auction.categoriaRequerida) }]}>
            <Text style={[styles.chipText, { color: categoriaTextColor(auction.categoriaRequerida) }]}>{auction.categoriaRequerida}</Text>
          </View>
        </View>
        <Text numberOfLines={2} style={styles.title}>{auction.titulo}</Text>
      </TouchableOpacity>

      {/* Carrusel: un ítem a la vez, deslizable. Tocar un ítem abre la subasta;
          deslizar rota entre ítems (el ScrollView distingue tap de swipe). */}
      {items.length > 0 ? <ItemsCarousel items={items} moneda={auction.moneda} onOpen={onPress} /> : null}

      {/* Pie tocable: también abre la subasta. */}
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {auction.ubicacion ? (
          <View style={styles.iconRow}>
            <Ionicons name="location-outline" size={14} color={colors.inputHint} style={{ marginRight: 4 }} />
            <Text style={styles.location}>{auction.ubicacion}</Text>
          </View>
        ) : null}
        <View style={styles.row}>
          <Text style={styles.currency}>{auction.moneda}</Text>
          {auction.rematador ? (
            <View style={styles.iconRow}>
              <Ionicons name="briefcase-outline" size={13} color={colors.inputHint} style={{ marginRight: 4 }} />
              <Text style={styles.auctioneer}>{auction.rematador.nombre}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </Card>
  );
}

/** Carrusel paginado (un ítem por página) de los productos de la subasta. */
function ItemsCarousel({ items, moneda, onOpen }: { items: Piece[]; moneda: Moneda; onOpen?: () => void }) {
  const [w, setW] = useState(0);
  const [idx, setIdx] = useState(0);

  return (
    <View style={styles.carousel} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / w))}
        >
          {items.map((p) => {
            const img = pieceImage(p);
            const vendido = p.estado === 'VENDIDO';
            return (
              <TouchableOpacity key={p.id} activeOpacity={0.9} onPress={onOpen} style={{ width: w }}>
                <View>
                  {img ? (
                    <Image source={{ uri: img }} style={[styles.carImg, vendido && styles.imgSold]} resizeMode="cover" />
                  ) : (
                    <View style={[styles.carImg, styles.imgPlaceholder]}>
                      <Ionicons name="image-outline" size={28} color={colors.inputHint} />
                    </View>
                  )}
                  {vendido ? (
                    <View style={styles.soldOverlay}><Text style={styles.soldText}>Item vendido</Text></View>
                  ) : null}
                </View>
                <Text numberOfLines={1} style={[styles.itemTitle, vendido && styles.mutedText]}>
                  {p.numeroItem ? `#${p.numeroItem} ` : ''}{p.descripcion}
                </Text>
                <Text style={[styles.itemPrice, vendido && styles.mutedText]}>
                  {moneda} {(p.mejorOferta ?? p.precioBase).toLocaleString('es-AR')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((p, i) => (
            <View key={p.id} style={[styles.dot, i === idx && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  dimmed: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  status: { fontSize: 12, fontWeight: '600' },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  chipText: { color: colors.textOnDark, fontSize: 11, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginVertical: 8 },

  carousel: { marginBottom: 10 },
  carImg: { width: '100%', height: 170, borderRadius: 8, backgroundColor: colors.surfaceCream },
  imgSold: { opacity: 0.4 },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  soldOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  soldText: {
    color: colors.textOnDark, fontWeight: '700', fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, overflow: 'hidden',
  },
  itemTitle: { fontSize: 13, color: colors.textPrimary, marginTop: 6, fontWeight: '600' },
  itemPrice: { fontSize: 15, fontWeight: '700', color: colors.brandPrimary, marginTop: 2 },
  mutedText: { color: colors.inputHint },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.inputBorder },
  dotActive: { backgroundColor: colors.brandPrimary, width: 18 },

  location: { fontSize: 13, color: colors.inputHint },
  currency: { fontSize: 12, color: colors.brandPrimary, fontWeight: '700' },
  auctioneer: { fontSize: 12, color: colors.inputHint },
});
