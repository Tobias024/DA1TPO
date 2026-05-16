import React, { useEffect, useState, useRef } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { auctionsApi, bidsApi, paymentsApi } from '@/api/services';
import { useSession } from '@/storage/SessionContext';
import type { Auction, Piece, Bid, MedioPago } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'LiveBidding'>;

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
  const { auctionId } = params;
  const { setActiveAuction } = useSession();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [pieza, setPieza] = useState<Piece | null>(null);
  const [history, setHistory] = useState<Bid[]>([]);
  const [verifiedPayment, setVerifiedPayment] = useState<MedioPago | null>(null);
  const [amount, setAmount] = useState('');
  const [pendingBid, setPendingBid] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        setPieza((cat ?? [])[0] ?? null);
        setHistory(hist.content ?? []);
        setVerifiedPayment((methods ?? []).find((m) => m.verificado) ?? null);
        setBootstrapping(false);

        // Poll del historial (placeholder de WebSocket — STOMP queda como mejora futura).
        pollRef.current = setInterval(async () => {
          try {
            const r = await bidsApi.history(auctionId);
            setHistory(r.content ?? []);
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

  const sinTope = auction?.categoriaRequerida === 'ORO' || auction?.categoriaRequerida === 'PLATINO';
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

    setPendingBid(true);
    try {
      await bidsApi.place(auctionId, { piezaId: pieza.id, monto: m, medioPagoId: verifiedPayment.id });
      setAmount('');
      const r = await bidsApi.history(auctionId);
      setHistory(r.content ?? []);
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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <View style={styles.head}>
        <Text style={styles.kicker}>● EN VIVO</Text>
        <Text style={styles.title}>{pieza.descripcion}</Text>
      </View>

      <Card style={{ margin: 16 }}>
        <Text style={styles.lblBid}>OFERTA ACTUAL</Text>
        <Text style={styles.bidVal}>
          {pieza.moneda} {(pieza.mejorOferta ?? pieza.precioBase).toLocaleString('es-AR')}
        </Text>
        <Text style={styles.lblBaseline}>
          Precio base: {pieza.moneda} {pieza.precioBase.toLocaleString('es-AR')}
        </Text>

        <View style={styles.limits}>
          <Text style={styles.limit}>Mín: {minimo.toFixed(2)}</Text>
          <Text style={styles.limit}>{sinTope ? 'Sin tope (ORO/PLATINO)' : `Máx: ${maximo.toFixed(2)}`}</Text>
        </View>
      </Card>

      <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <Text style={styles.lblInput}>Tu puja</Text>
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
          disabled={!verifiedPayment}
        />
        {!verifiedPayment ? (
          <Text style={styles.observerHint}>👁 Sin medio verificado: solo podés observar.</Text>
        ) : null}
      </Card>

      <View style={{ paddingHorizontal: 16, paddingBottom: 32 }}>
        <Text style={styles.sectionTitle}>Historial de Ofertas</Text>
        {history.length === 0 ? (
          <Text style={styles.empty}>Sé el primero en pujar.</Text>
        ) : history.map((b) => (
          <Card key={b.id} style={{ marginBottom: 6 }}>
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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceCream },
  head: { backgroundColor: colors.brandPrimary, padding: 20 },
  kicker: { color: colors.onPrimary, fontSize: 12, fontWeight: '700', letterSpacing: 0.16 },
  title: { color: colors.textOnDark, fontSize: 24, fontWeight: '700', marginTop: 4 },
  lblBid: { color: colors.inputHint, fontSize: 12, fontWeight: '700', letterSpacing: 0.12 },
  bidVal: { color: colors.brandPrimary, fontSize: 36, fontWeight: '700', marginTop: 4 },
  lblBaseline: { color: colors.inputHint, fontSize: 13, marginTop: 6 },
  limits: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  limit: { fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  lblInput: { color: colors.inputHint, fontSize: 12, fontWeight: '700', letterSpacing: 0.12, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg,
    borderColor: colors.inputBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  observerHint: { fontSize: 12, color: colors.orangePending, marginTop: 8, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  empty: { color: colors.inputHint, textAlign: 'center', padding: 16 },
  histRow: { flexDirection: 'row', justifyContent: 'space-between' },
  histUser: { color: colors.textPrimary, fontSize: 14 },
  histAmount: { color: colors.brandPrimary, fontSize: 14, fontWeight: '700' },
  histTime: { color: colors.inputHint, fontSize: 11, marginTop: 2 },
});
