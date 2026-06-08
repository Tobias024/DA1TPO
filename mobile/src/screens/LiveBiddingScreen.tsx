import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Alert, TextInput, ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
} from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { auctionsApi, bidsApi, paymentsApi } from '@/api/services';
import { useSession } from '@/storage/SessionContext';
import type { Auction, Piece, Bid, MedioPago } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

const { width: SCREEN_W } = Dimensions.get('window');
type Rt = RouteProp<MainStackParamList, 'LiveBidding'>;

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return '0h : 00m : 00s';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${h}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s`;
}

/**
 * Pantalla Participar de Subasta (Doc).
 *
 * Reglas de puja del PDF:
 *  - mín = mejorOferta + 1% precioBase
 *  - máx = mejorOferta + 20% precioBase  (no aplica para ORO/PLATINO)
 *  - Una puja por usuario en vuelo (flag `pendingBid` local + 423 LOCKED del back).
 *  - Necesita medio de pago verificado.
 */
export default function LiveBiddingScreen() {
  const { params } = useRoute<Rt>();
  const nav = useNavigation();
  const { auctionId, pieceId } = params;
  const { setActiveAuction } = useSession();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [pieza, setPieza] = useState<Piece | null>(null);
  const [history, setHistory] = useState<Bid[]>([]);
  const [verifiedPayment, setVerifiedPayment] = useState<MedioPago | null>(null);
  const [amount, setAmount] = useState('');
  const [pendingBid, setPendingBid] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await auctionsApi.join(auctionId).catch(() => {});
        setActiveAuction(auctionId);
        const [a, cat, hist, methods] = await Promise.all([
          auctionsApi.detail(auctionId),
          auctionsApi.catalog(auctionId).catch(() => []),
          bidsApi.history(auctionId).catch(() => ({ content: [] } as any)),
          paymentsApi.list().catch(() => []),
        ]);
        if (cancelled) return;
        setAuction(a);
        // Pieza a pujar: la elegida (pieceId), si no la primera no vendida, si no la primera.
        const lista = cat ?? [];
        const elegida =
          (pieceId ? lista.find((p) => p.id === pieceId) : undefined)
          ?? lista.find((p) => p.estado !== 'VENDIDO')
          ?? lista[0]
          ?? null;
        setPieza(elegida);
        setHistory(hist.content ?? []);
        setVerifiedPayment((methods ?? []).find((m) => m.verificado) ?? null);
        setBootstrapping(false);

        // Poll del historial + oferta actual (placeholder de WebSocket — STOMP queda como mejora futura).
        pollRef.current = setInterval(async () => {
          try {
            const [r, cat] = await Promise.all([
              bidsApi.history(auctionId),
              auctionsApi.catalog(auctionId).catch(() => null),
            ]);
            setHistory(r.content ?? []);
            if (cat) setPieza((prev) => (prev ? cat.find((p) => p.id === prev.id) ?? prev : cat[0] ?? null));
          } catch {}
        }, 4000);
      } catch {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      auctionsApi.leave(auctionId).catch(() => {});
      setActiveAuction(null);
    };
  }, [auctionId]);

  const tiempo = auction ? timeUntil(auction.fechaHoraInicio) : '';
  const sinTope = auction?.categoriaRequerida === 'ORO' || auction?.categoriaRequerida === 'PLATINO';
  const sold = pieza?.estado === 'VENDIDO';
  const pujaHabilitada = auction?.estado === 'EN_CURSO' && !sold;
  const minimo = pieza
    ? (pieza.mejorOferta ?? pieza.precioBase) + pieza.precioBase * 0.01
    : 0;
  const maximo = pieza
    ? (pieza.mejorOferta ?? pieza.precioBase) + pieza.precioBase * 0.2
    : 0;

  const placeBid = async () => {
    if (!pieza) return;
    if (!verifiedPayment) {
      Alert.alert('Sin medio verificado', 'Necesitás un medio de pago verificado para pujar.');
      return;
    }
    const m = Number(amount);
    if (!m || isNaN(m)) {
      Alert.alert('Monto inválido');
      return;
    }
    if (m < minimo) {
      Alert.alert('Monto bajo', `El mínimo es ${minimo.toFixed(2)}.`);
      return;
    }
    if (!sinTope && m > maximo) {
      Alert.alert('Monto alto', `El máximo es ${maximo.toFixed(2)}.`);
      return;
    }

    const confirmada = await new Promise<boolean>((resolve) => {
      Alert.alert(
        '¿Confirmar puja?',
        `Vas a pujar ${auction?.moneda ?? ''} ${m.toLocaleString('es-AR')}`,
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Confirmar', onPress: () => resolve(true) },
        ],
      );
    });
    if (!confirmada) return;

    setPendingBid(true);
    try {
      await bidsApi.place(auctionId, { piezaId: pieza.id, monto: m, medioPagoId: verifiedPayment.id });
      setAmount('');
      const [r, cat] = await Promise.all([
        bidsApi.history(auctionId),
        auctionsApi.catalog(auctionId).catch(() => null),
      ]);
      setHistory(r.content ?? []);
      if (cat) setPieza((prev) => (prev ? cat.find((p) => p.id === prev.id) ?? prev : prev));
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 423) Alert.alert('Espera', 'Tu puja anterior aún se está procesando.');
      else if (status === 403) Alert.alert('No permitido', e?.response?.data?.error ?? '');
      else if (status === 422) Alert.alert('Monto fuera de rango', e?.response?.data?.error ?? '');
      else Alert.alert('Error', 'No se pudo registrar la puja.');
    } finally {
      setPendingBid(false);
    }
  };

  if (bootstrapping) {
    return <View style={styles.center}><ActivityIndicator color={colors.brandPrimary} /></View>;
  }
  if (!auction || !pieza) {
    return <View style={styles.center}><Text>Subasta no disponible.</Text></View>;
  }
  
  const images = pieza.imagenes ?? pieza.fotos ?? [];

  return (
    <ScrollView style={{ flex: 1 }}>
      <Text style={styles.countdown}>FINALIZA EN: {tiempo}</Text>

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

      <View style={styles.titlePriceRow}>
        <Text style={styles.title}>{pieza.descripcion}</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.priceLabel}>PRECIO BASE</Text>
          <Text style={styles.priceValue}>
            {auction.moneda} {pieza.precioBase.toLocaleString('es-AR')}
          </Text>
        </View>
      </View>

      <Card style={{ margin: 16 }}>
        <View style={styles.bidLimitsRow}>
          <View>
            <Text style={styles.lblBid}>MEJOR OFERTA</Text>
            <Text style={styles.bidVal}>
              {auction.moneda} {(pieza.mejorOferta ?? pieza.precioBase).toLocaleString('es-AR')}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.limit}>Valor Mínimo: {minimo.toFixed(2)}</Text>
            <Text style={styles.limit}>
              {sinTope ? 'Sin tope (ORO/PLATINO)' : `Valor Máximo: ${maximo.toFixed(2)}`}
            </Text>
          </View>
        </View>
      </Card>

      <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="$ Ingresá monto"
          placeholderTextColor={colors.inputHint}
        />
        <PrimaryButton
          title="Realizar Puja"
          onPress={placeBid}
          loading={pendingBid}
          disabled={!verifiedPayment || !pujaHabilitada}
          style={styles.pujaBtn}
        />
        {!pujaHabilitada ? (
          <View style={styles.observerRow}>
            <Ionicons name="information-circle-outline" size={14} color={colors.orangePending} style={{ marginRight: 6 }} />
            <Text style={styles.observerHint}>
              {sold ? 'Este ítem ya fue vendido.' : 'La subasta no está activa en este momento: solo podés observar.'}
            </Text>
          </View>
        ) : !verifiedPayment ? (
          <View style={styles.observerRow}>
            <Ionicons name="eye-outline" size={14} color={colors.orangePending} style={{ marginRight: 6 }} />
            <Text style={styles.observerHint}>Sin medio verificado: solo podés observar.</Text>
          </View>
        ) : null}
      </Card>

      <View style={{ paddingHorizontal: 16}}>
        <Text style={styles.sectionTitle}>Detalle del Item</Text>
        <Card style={{ backgroundColor: 'transparent', borderWidth: 0}}>
          <Row k="N° de item" v={pieza.numeroItem ? `${pieza.numeroItem}` : '-'} />
          <Row k="Descripción" v={pieza.descripcion ?? '-'} />
          {pieza.artista ? <Row k="Artista" v={pieza.artista} /> : null}
          <Row k="Año" v={pieza.fechaObra ?? '-'} />
          <Row k="Historia / Procedencia" v={pieza.historia ?? '-'} />
        </Card>
      </View>
      
      <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <Text style={styles.sectionTitle}>Historial de Ofertas</Text>
        {history.length === 0 ? (
          <Text style={styles.empty}>Sé el primero en pujar.</Text>
        ) : history.map((b) => (
          <Card key={b.id} style={{ backgroundColor: 'transparent', borderWidth: 0, marginBottom: 6}}>
            <View style={styles.histRow}>
              <Text style={styles.histUser}>{b.usuarioNombre ?? 'Postor'}</Text>
              <Text style={styles.histAmount}>{b.monto.toLocaleString('es-AR')}</Text>
            </View>
            <Text style={styles.histTime}>{new Date(b.timestamp).toLocaleTimeString('es-AR')}</Text>
          </Card>
        ))}
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
  countdown: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
    backgroundColor: "rgba(209, 204, 204, 0.34)",
    borderRadius: 8,
    marginBottom: 8,
  },
  image: { width: SCREEN_W, height: 230, backgroundColor: colors.surfaceWhite },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  priceLabel: { fontSize: 11, color: colors.inputHint, fontWeight: '700', textAlign: 'right', marginTop: 10 },
  priceValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  title: { color: colors.brandPrimary, fontSize: 20, fontWeight: '700', marginTop: 0, flex: 1, marginRight: 12 },
  
  bidLimitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 5,
    marginTop: 0,
  },
  lblBid: { color: colors.inputHint, fontSize: 12, fontWeight: '700', letterSpacing: 0.12 },
  bidVal: { color: colors.brandPrimary, fontSize: 22, fontWeight: '700', marginTop: 0 },
  lblBaseline: { color: colors.inputHint, fontSize: 13, marginTop: 6 },
  limits: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  limit: { fontSize: 11, color: colors.inputHint, fontWeight: '600', textAlign: 'right', paddingVertical: 3 },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  pujaBtn: { minHeight: 30, borderRadius: 10 },
  observerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingHorizontal: 12 },
  observerHint: { fontSize: 12, color: colors.orangePending },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  empty: { color: colors.inputHint, textAlign: 'center', padding: 16 },
  histRow: { flexDirection: 'row', justifyContent: 'space-between' },
  histUser: { color: colors.textPrimary, fontSize: 14 },
  histAmount: { color: colors.brandPrimary, fontSize: 14, fontWeight: '700' },
  histTime: { color: colors.inputHint, fontSize: 11, marginTop: 2 },

  row: { flexDirection: 'row', marginBottom: 8 },
  rowKey: { width: 120, color: colors.inputHint, fontSize: 13 },
  rowVal: { flex: 1, color: colors.textPrimary, fontSize: 14 },
});
