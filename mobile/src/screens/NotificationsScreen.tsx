import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import { colors } from '@/theme/colors';
import { notificationsApi } from '@/api/services';
import type { Notification } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const ICON: Record<string, string> = {
  SOLICITUD_ACEPTADA: '✅',
  SOLICITUD_RECHAZADA: '❌',
  NUEVA_SUBASTA: '🆕',
  SUBASTA_ADQUIRIDA: '🏆',
  MULTA_APLICADA: '⚠️',
};

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
      case 'SOLICITUD_ACEPTADA':
        nav.navigate('RequestAccepted', { consignmentId: n.referenciaId ?? '' });
        break;
      case 'SOLICITUD_RECHAZADA':
        nav.navigate('RequestRejected', { consignmentId: n.referenciaId ?? '' });
        break;
      case 'SUBASTA_ADQUIRIDA':
        nav.navigate('Acquisition', { saleId: n.referenciaId ?? '' });
        break;
      case 'NUEVA_SUBASTA':
        if (n.referenciaId) nav.navigate('AuctionDetail', { auctionId: n.referenciaId });
        break;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <ScreenHeader title="Notificaciones" />
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={
          <Text style={styles.empty}>{loading ? 'Cargando…' : 'No tenés notificaciones.'}</Text>
        }
        renderItem={({ item }) => (
          <Card onPress={() => open(item)} style={[styles.card, !item.leida && styles.unread]}>
            <View style={styles.row}>
              <Text style={styles.icon}>{ICON[item.tipo] ?? '🔔'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.titulo}</Text>
                <Text style={styles.msg}>{item.mensaje}</Text>
                <Text style={styles.fecha}>{new Date(item.fecha).toLocaleString('es-AR')}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.brandPrimary },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { fontSize: 22, marginRight: 12 },
  title: { fontSize: 16, color: colors.textPrimary, fontWeight: '700' },
  msg: { fontSize: 14, color: colors.textPrimary, marginTop: 2 },
  fecha: { fontSize: 12, color: colors.inputHint, marginTop: 6 },
  empty: { color: colors.inputHint, textAlign: 'center', padding: 32 },
});
