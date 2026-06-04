import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors, categoriaColor } from '@/theme/colors';
import type { Auction } from '@/types/api';

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
  PROGRAMADA: { color: colors.blueUpcoming, label: 'Próxima', icon: 'calendar-outline' },
  PROXIMA: { color: colors.blueUpcoming, label: 'Próxima', icon: 'calendar-outline' },
  CERRADA: { color: colors.inputHint, label: 'Cerrada', icon: null },
};

export default function AuctionCard({ auction, onPress, dimmed }: Props) {
  const badge = ESTADO_BADGE[auction.estado] ?? ESTADO_BADGE.CERRADA;
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
  location: { fontSize: 13, color: colors.inputHint },
  currency: { fontSize: 12, color: colors.brandPrimary, fontWeight: '700' },
  auctioneer: { fontSize: 12, color: colors.inputHint },
});
