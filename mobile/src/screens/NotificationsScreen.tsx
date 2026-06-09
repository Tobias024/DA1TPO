import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import { colors } from '@/theme/colors';
import { notificationsApi, salesApi } from '@/api/services';
import type { Notification, TipoNotificacion } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

type IconSpec = { name: React.ComponentProps<typeof Ionicons>['name']; color: string };

const ICON: Record<TipoNotificacion, IconSpec> = {
  CONSIGNACION_ACEPTADA: { name: 'checkmark-circle', color: colors.greenLive },
  CONSIGNACION_RECHAZADA: { name: 'close-circle', color: colors.redLive },
  OFERTA_BASE_PROPUESTA: { name: 'pricetag', color: colors.brandPrimary },
  VENTA_GANADA: { name: 'trophy', color: colors.catOro },
  PAGO_REQUERIDO: { name: 'card', color: colors.brandPrimary },
  MULTA_APLICADA: { name: 'warning', color: colors.orangePending },
  CUENTA_APROBADA: { name: 'shield-checkmark', color: colors.greenLive },
  COMPLETAR_REGISTRO: { name: 'person-add', color: colors.brandPrimary },
  BIEN_DEVUELTO: { name: 'return-down-back', color: colors.inputHint },
};

const FALLBACK_ICON: IconSpec = { name: 'notifications-outline', color: colors.inputHint };

export default function NotificationsScreen() {
  const nav = useNavigation<Nav>();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await notificationsApi.list();
      setItems(r.content ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = async (n: Notification) => {
    if (!n.leida) {
      notificationsApi.markRead(n.id).catch(() => {});
    }
    switch (n.tipo) {
      case 'CONSIGNACION_ACEPTADA':
      case 'OFERTA_BASE_PROPUESTA':
        if (n.referenciaId) nav.navigate('RequestAccepted', { consignmentId: n.referenciaId });
        break;
      case 'CONSIGNACION_RECHAZADA':
        if (n.referenciaId) nav.navigate('RequestRejected', { consignmentId: n.referenciaId });
        break;
      case 'VENTA_GANADA': {
        // La notif trae el id de la venta; resolvemos el item ganado para abrir su
        // pantalla de puja (LiveBidding) con el historial. Fallback: Mis Compras.
        if (!n.referenciaId) break;
        try {
          const won = await salesApi.won();
          const w = won.find((x) => x.ventaId === n.referenciaId);
          if (w) nav.navigate('LiveBidding', { auctionId: w.subastaId, pieceId: w.piezaId });
          else nav.navigate('WonItems');
        } catch {
          nav.navigate('WonItems');
        }
        break;
      }
      case 'MULTA_APLICADA':
        // referenciaId = ventaId de la multa → FineDetail muestra pago o comprobante.
        nav.navigate('FineDetail', { titulo: n.titulo, mensaje: n.mensaje, ventaId: n.referenciaId ?? undefined });
        break;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenHeader title="SubastAR" />
      <FlatList
        ListHeaderComponent={<Text style={styles.pageTitle}>Notificaciones</Text>}
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{loading ? 'Cargando…' : 'No tenés notificaciones.'}</Text>
        }
        renderItem={({ item }) => {
          const ic = ICON[item.tipo] ?? FALLBACK_ICON;
          return (
            <Card onPress={() => open(item)} style={[styles.card, !item.leida && styles.unread]}>
              <View style={styles.row}>
                <Ionicons name={ic.name} size={24} color={ic.color} style={styles.icon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.titulo}</Text>
                  <Text style={styles.msg}>{item.mensaje}</Text>
                  <Text style={styles.fecha}>{new Date(item.fecha).toLocaleString('es-AR')}</Text>
                </View>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.brandPrimary },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { marginRight: 12, marginTop: 2 },
  title: { fontSize: 16, color: colors.textPrimary, fontWeight: '700' },
  msg: { fontSize: 14, color: colors.textPrimary, marginTop: 2 },
  fecha: { fontSize: 12, color: colors.inputHint, marginTop: 6 },
  empty: { color: colors.inputHint, textAlign: 'center', padding: 32 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: colors.brandPrimary, paddingBottom: 12, textAlign: 'center' },
});
