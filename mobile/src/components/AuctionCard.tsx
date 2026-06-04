import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors, categoriaColor } from '@/theme/colors';
import { auctionsApi } from '@/api/services';
import type { Auction, Piece } from '@/types/api';

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
    <Card onPress={onPress} style={[styles.card, dimmed && styles.dimmed]}>
      <View style={styles.row}>
        <View style={styles.statusRow}>
          {badge.icon ? <Ionicons name={badge.icon} size={14} color={badge.color} style={{ marginRight: 4 }} /> : null}
          <Text style={[styles.status, { color: badge.color }]}>{badge.label}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: categoriaColor(auction.categoriaRequerida) }]}>
          <Text style={styles.chipText}>{auction.categoriaRequerida}</Text>
        </View>
      </View>
      <Text numberOfLines={2} style={styles.title}>{auction.titulo}</Text>

      {/* Carrusel de ítems de la subasta (deslizá para ver cada uno). */}
      {items.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
          contentContainerStyle={{ gap: 10 }}
        >
          {items.map((p) => {
            const img = pieceImage(p);
            const vendido = p.estado === 'VENDIDO';
            return (
              <View key={p.id} style={styles.itemCard}>
                <View>
                  {img ? (
                    <Image source={{ uri: img }} style={[styles.itemImg, vendido && styles.itemImgSold]} resizeMode="cover" />
                  ) : (
                    <View style={[styles.itemImg, styles.itemImgPlaceholder]}>
                      <Ionicons name="image-outline" size={24} color={colors.inputHint} />
                    </View>
                  )}
                  {vendido ? (
                    <View style={styles.soldOverlay}>
                      <Text style={styles.soldText}>Item vendido</Text>
                    </View>
                  ) : null}
                </View>
                <Text numberOfLines={1} style={styles.itemTitle}>{p.descripcion}</Text>
                <Text style={styles.itemPrice}>
                  {auction.moneda} {(p.mejorOferta ?? p.precioBase).toLocaleString('es-AR')}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      ) : null}

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
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  dimmed: { opacity: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  status: { fontSize: 12, fontWeight: '600' },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  chipText: { color: colors.textOnDark, fontSize: 11, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginVertical: 8 },
  carousel: { marginBottom: 10 },
  itemCard: { width: 140 },
  itemImg: { width: 140, height: 100, borderRadius: 8, backgroundColor: colors.surfaceCream },
  itemImgSold: { opacity: 0.4 },
  itemImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  soldOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  soldText: {
    color: colors.textOnDark, fontWeight: '700', fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    overflow: 'hidden',
  },
  itemTitle: { fontSize: 12, color: colors.textPrimary, marginTop: 4 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: colors.brandPrimary, marginTop: 2 },
  location: { fontSize: 13, color: colors.inputHint },
  currency: { fontSize: 12, color: colors.brandPrimary, fontWeight: '700' },
  auctioneer: { fontSize: 12, color: colors.inputHint },
});
