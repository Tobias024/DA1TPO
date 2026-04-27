import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
import { colors, categoriaColor } from '@/theme/colors';
import type { Auction } from '@/types/api';

type Props = {
  auction: Auction;
  onPress?: () => void;
};

const ESTADO_BADGE: Record<string, { color: string; label: string }> = {
  ABIERTA: { color: colors.greenLive, label: '✅ Abierta' },
  EN_CURSO: { color: colors.redLive, label: '🔴 En vivo' },
  PROGRAMADA: { color: colors.blueUpcoming, label: '📅 Próxima' },
  CERRADA: { color: colors.inputHint, label: 'Cerrada' },
};

export default function AuctionCard({ auction, onPress }: Props) {
  const badge = ESTADO_BADGE[auction.estado] ?? ESTADO_BADGE.CERRADA;
  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Text style={[styles.status, { color: badge.color }]}>{badge.label}</Text>
        <View style={[styles.chip, { backgroundColor: categoriaColor(auction.categoriaRequerida) }]}>
          <Text style={styles.chipText}>{auction.categoriaRequerida}</Text>
        </View>
      </View>
      <Text numberOfLines={2} style={styles.title}>{auction.titulo}</Text>
      {auction.ubicacion ? <Text style={styles.location}>📍 {auction.ubicacion}</Text> : null}
      <View style={styles.row}>
        <Text style={styles.currency}>{auction.moneda}</Text>
        {auction.rematador ? <Text style={styles.auctioneer}>⚖ {auction.rematador.nombre}</Text> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { fontSize: 12, fontWeight: '600' },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  chipText: { color: colors.textOnDark, fontSize: 11, fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginVertical: 8 },
  location: { fontSize: 13, color: colors.inputHint, marginBottom: 6 },
  currency: { fontSize: 12, color: colors.brandPrimary, fontWeight: '700' },
  auctioneer: { fontSize: 12, color: colors.inputHint },
});
