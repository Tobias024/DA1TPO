import React, { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Linking, ActivityIndicator, Alert, Image, TouchableOpacity,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors, categoriaColor, categoriaTextColor } from '@/theme/colors';
import { auctionsApi } from '@/api/services';
import { useSession } from '@/storage/SessionContext';
import type { Auction, Piece } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Rt = RouteProp<MainStackParamList, 'AuctionDetail'>;

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  PROXIMA:  { label: 'Próxima',    color: colors.blueUpcoming },
  ABIERTA:  { label: 'Abierta',    color: colors.greenLive },
  EN_CURSO: { label: 'En vivo',    color: colors.redLive },
  CERRADA:  { label: 'Finalizada', color: colors.inputHint },
  CANCELADA:{ label: 'Cancelada',  color: colors.inputHint },
};

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return '';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s`;
}

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
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

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
  const estadoSpec = ESTADO_LABEL[auction.estado] ?? ESTADO_LABEL.CERRADA;
  const fecha = new Date(auction.fechaHoraInicio).toLocaleString('es-AR');
  const tiempo = timeUntil(auction.fechaHoraInicio);

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

      {/* Título */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{auction.titulo}</Text>

        {/* Estado + tiempo + categoría */}
        <View style={styles.badgeRow}>
          <View style={[styles.estadoBadge, { borderColor: estadoSpec.color }]}>
            <Ionicons name="ellipse" size={8} color={estadoSpec.color} style={{ marginRight: 5 }} />
            <Text style={[styles.estadoText, { color: estadoSpec.color }]}>
              {estadoSpec.label}
            </Text>
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

        {tiempo ? <Text style={styles.countdown}>{tiempo}</Text> : null}

      </View>

      {/* Info card */}
      <Card style={styles.infoCard}>
        <Text style={styles.cardTitle}>Datos de la subasta</Text>
        <Row k="Fecha y hora" v={fecha} />
        {auction.ubicacion ? <Row k="Ubicación" v={auction.ubicacion} /> : null}
        {auction.rematador ? <Row k="Rematador" v={auction.rematador.nombre} /> : null}
        <Row k="Moneda" v={auction.moneda} />
        {auction.descripcion ? <Row k="Descripción" v={auction.descripcion} /> : null}
        {!enCurso && auction.estado !== 'CERRADA' ? (
          <View style={styles.warningRow}>
            <Ionicons name="time-outline" size={16} color={colors.orangePending} style={{ marginRight: 6 }} />
            <Text style={styles.warning}>La subasta todavía no está en vivo. Vas a poder pujar cuando comience.</Text>
          </View>
        ) : auction.estado === 'CERRADA' ? (
          <View style={styles.warningRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.inputHint} style={{ marginRight: 6 }} />
            <Text style={[styles.warning, { color: colors.inputHint }]}>Subasta finalizada.</Text>
          </View>
        ) : auction.motivoNoPuede ? (
          <View style={styles.warningRow}>
            <Ionicons name="warning" size={16} color={colors.orangePending} style={{ marginRight: 6 }} />
            <Text style={styles.warning}>{auction.motivoNoPuede}</Text>
          </View>
        ) : null}
      </Card>

      {/* Catálogo */}
      <View style={styles.catalogSection}>
        <Text style={styles.sectionTitle}>Catálogo ({catalog.length})</Text>
        {catalog.length === 0
          ? <Text style={styles.empty}>Catálogo no disponible aún.</Text>
          : catalog.map((p) => {
          const sold = p.estado === 'VENDIDO';
          const img = pieceImage(p);
          const precioActual = p.mejorOferta ?? p.precioBase;
          const precioLabel = sold ? 'Vendido en' : (p.mejorOferta != null ? 'Mejor oferta' : 'Precio base');
          return (
            <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={() => openItem(p)}>
              <Card style={[styles.itemCard, sold && styles.soldCard]}>
                <View style={styles.itemImageWrap}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.itemImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.itemImage, styles.thumbPlaceholder]}>
                      <Ionicons name="image-outline" size={32} color={colors.inputHint} />
                    </View>
                  )}
                  {sold ? (
                    <View style={styles.soldOverlay}>
                      <View style={styles.soldBadge}>
                        <Text style={styles.soldText}>ITEM VENDIDO</Text>
                      </View>
                    </View>
                  ) : null}
                  <View style={styles.itemTitleOverlay}>
                    <Text style={styles.itemTitleOverlayText} numberOfLines={2}>
                      {p.numeroItem ? `Lote #${p.numeroItem} — ` : ''}{p.descripcion}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemFooter}>
                  <View>
                    <Text style={[styles.priceLabel, sold && styles.mutedText]}>{precioLabel}</Text>
                    <Text style={[styles.priceValue, sold && styles.mutedText]}>
                      {auction.moneda} {precioActual.toLocaleString('es-AR')}
                    </Text>
                  </View>
                  {!sold ? (
                    <Pressable
                      style={({ pressed }) => [styles.pujarBtn, pressed && { opacity: 0.8 }]}
                      onPress={() => openItem(p)}
                    >
                      <Text style={styles.pujarBtnText}>PUJAR</Text>
                    </Pressable>
                  ) : null}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Streaming */}
      {auction.streamingUrl ? (
        <View style={styles.streamingRow}>
          <PrimaryButton
            title="Streaming"
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  titleSection: { padding: 20, paddingBottom: 0 },
  title: { fontSize: 26, fontWeight: '700', color: colors.brandPrimary, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  estadoBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  estadoText: { fontSize: 12, fontWeight: '600' },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: '700' },
  countdown: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
    backgroundColor: "rgba(209, 204, 204, 0.34)",
    borderRadius: 8,
  },

  infoCard: { marginHorizontal: 16, marginBottom: 0, backgroundColor: 'transparent', borderWidth: 0 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 8 },
  rowKey: { width: 110, color: colors.inputHint, fontSize: 13 },
  rowVal: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  warningRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  warning: { color: colors.orangePending, fontSize: 13, flex: 1 },

  catalogSection: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.brandPrimary, marginBottom: 12 },
  
  itemCard: { marginBottom: 14, padding: 0, overflow: 'hidden' },
  soldCard: { opacity: 0.75 },

  itemImageWrap: { width: '100%', height: 180, position: 'relative' },
  itemImage: { width: '100%', height: '100%', backgroundColor: colors.inputBg },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  itemTitleOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  itemTitleOverlayText: { color: colors.textOnDark, fontSize: 16, fontWeight: '700' },

  soldOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  soldBadge: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  soldText: { color: colors.textOnDark, fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  mutedText: { color: colors.inputHint },

  itemFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  priceLabel: { fontSize: 12, color: colors.inputHint },
  priceValue: { fontSize: 16, fontWeight: '700', color: colors.brandPrimary, marginTop: 2 },

  pujarBtn: {
    backgroundColor: colors.brandPrimary,
    borderRadius: 25,
    paddingHorizontal: 60, paddingVertical: 10,
  },
  pujarBtnText: { color: colors.onPrimary, fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },

  streamingRow: { paddingHorizontal: 16, marginTop: 8 },
  empty: { color: colors.inputHint, padding: 16, textAlign: 'center' },
});