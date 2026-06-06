import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from './Card';
import { colors, categoriaColor, categoriaTextColor } from '@/theme/colors';
import type { Auction, Piece } from '@/types/api';
import { auctionsApi } from '@/api/services';
import ImageCollage from './ImageCollage';

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

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return '';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function pieceImage(p: Piece): string | undefined {
  return (p.imagenes ?? p.fotos ?? [])[0];
}

export default function AuctionCard({ auction, onPress, dimmed }: Props) {
  const badge = ESTADO_BADGE[auction.estado] ?? ESTADO_BADGE.CERRADA;
  const [firstImages, setFirstImages] = useState<string[]>([]);
  
  const timeText = auction.estado === 'PROXIMA' ? timeUntil(auction.fechaHoraInicio) : null;

  useEffect(() => {
    let cancelled = false;
    auctionsApi.catalog(auction.id)
      .then((items) => {
        if (!cancelled) {
          const imgs = items
            .map(pieceImage)
            .filter((u): u is string => !!u)
            .slice(0, 5);
          setFirstImages(imgs);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [auction.id]);

  return (
    <Card style={[styles.card, dimmed && styles.dimmed]}>
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>

        <View style={styles.topRow}>
          <View style={styles.statusRow}>
            {badge.icon
              ? <Ionicons name={badge.icon} size={13} color={badge.color} style={{ marginRight: 4 }} />
              : null}
            <Text style={[styles.status, { color: badge.color }]}>{badge.label}</Text>
            {timeText
              ? <Text style={[styles.time, { color: badge.color }]}> - {timeText}</Text>
              : null}
          </View>
          <View style={[styles.chip, {
            backgroundColor: categoriaColor(auction.categoriaRequerida),
            borderColor: categoriaTextColor(auction.categoriaRequerida),
          }]}>
            <Text style={[styles.chipText, { color: categoriaTextColor(auction.categoriaRequerida) }]}>
              {auction.categoriaRequerida}
            </Text>
          </View>
        </View>

        <View>
          <ImageCollage images={firstImages} />
          {auction.estado === 'CERRADA' ? (
            <View style={styles.closedOverlay}>
              <Text style={styles.closedText}>FINALIZADA</Text>
            </View>
          ) : null}
        </View>

        {/* Título */}
        <Text numberOfLines={2} style={styles.title}>{auction.titulo}</Text>

        {/* Fecha + ubicación */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.inputHint} />
          <Text style={styles.metaText}>{formatDate(auction.fechaHoraInicio)}</Text>
          {auction.ubicacion ? (
            <>
              <Text style={styles.metaSep}></Text>
              <Ionicons name="location-outline" size={13} color={colors.inputHint} />
              <Text style={styles.metaText} numberOfLines={1}>{auction.ubicacion}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.btnRow}>
          <View style={[styles.btn, auction.estado === 'CERRADA' && styles.btnDisabled]}>
            <Text style={[styles.btnText, auction.estado === 'CERRADA' && styles.btnTextDisabled]}>
              {auction.estado === 'CERRADA' ? 'Subasta finalizada' : 'Más información / Participar'}
            </Text>
          </View>
        </View>

      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, padding: 0, overflow: 'hidden' },
  dimmed: { opacity: 0.5 },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  status: { fontSize: 12, fontWeight: '600' },
  time: { fontSize: 12, fontWeight: '500' },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: '700' },

  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  metaText: { fontSize: 12, color: colors.inputHint, flexShrink: 1 },
  metaSep: { fontSize: 12, color: colors.inputHint, marginHorizontal: 2 },

  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedText: {
    color: colors.textOnDark,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
  },
  btnDisabled: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  btnTextDisabled: {
    color: colors.inputHint,
  },
  btnRow: { paddingHorizontal: 14, paddingBottom: 14 },
  btn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  btnText: { color: colors.onPrimary, fontSize: 14, fontWeight: '600' },
});
