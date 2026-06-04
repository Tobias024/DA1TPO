import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { consignmentsApi } from '@/api/services';
import type { Consignment } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: 'Enviada — pendiente de inspección',
  EN_INSPECCION: 'En inspección',
  PENDIENTE_CONFIRMACION_USUARIO: 'Propuesta lista — revisá las condiciones',
  ACEPTADO: 'Aceptada',
  RECHAZADO: 'Rechazada',
  EN_SUBASTA: 'En subasta',
  VENDIDO: 'Vendida',
  DEVUELTO: 'Devuelta',
};

const ESTADO_COLOR = (s: string) => {
  if (s === 'ACEPTADO' || s === 'EN_SUBASTA' || s === 'VENDIDO' || s === 'PENDIENTE_CONFIRMACION_USUARIO') return colors.greenLive;
  if (s === 'RECHAZADO') return colors.redLive;
  return colors.orangePending;
};

export default function MyConsignmentsScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await consignmentsApi.list()); } catch { setItems([]); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = (c: Consignment) => {
    if (c.estado === 'PENDIENTE_CONFIRMACION_USUARIO' || c.estado === 'ACEPTADO') {
      nav.navigate('RequestAccepted', { consignmentId: c.id });
    } else if (c.estado === 'RECHAZADO') {
      nav.navigate('RequestRejected', { consignmentId: c.id });
    } else {
      nav.navigate('PieceLocation', { consignmentId: c.id });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <FlatList
        data={items}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Cargando…' : 'Aún no enviaste artículos a subastar.'}</Text>}
        renderItem={({ item }) => (
          <Card onPress={() => open(item)} style={{ marginBottom: 10 }}>
            <Text style={styles.title}>{item.nombreBien ?? item.tipoBien ?? item.descripcion ?? 'Bien consignado'}</Text>
            <Text style={[styles.estado, { color: ESTADO_COLOR(item.estado) }]}>
              {ESTADO_LABEL[item.estado] ?? item.estado}
            </Text>
            {(item.precioBaseOfrecido ?? item.valorBaseOfrecido) ? (
              <Text style={styles.base}>Valor base: $ {(item.precioBaseOfrecido ?? item.valorBaseOfrecido)!.toLocaleString('es-AR')}</Text>
            ) : null}
            {item.polizaSeguro ? (
              <View style={styles.polizaRow}>
                <Ionicons name="shield-checkmark-outline" size={13} color={colors.inputHint} style={{ marginRight: 4 }} />
                <Text style={styles.poliza}>Póliza {item.polizaSeguro.numeroPoliza}</Text>
              </View>
            ) : null}
          </Card>
        )}
      />
      <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
        <PrimaryButton title="Nueva solicitud" onPress={() => nav.navigate('ConsignmentForm')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  estado: { fontSize: 13, marginTop: 4, fontWeight: '600' },
  base: { fontSize: 13, color: colors.brandPrimary, marginTop: 6 },
  polizaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  poliza: { fontSize: 12, color: colors.inputHint },
  empty: { color: colors.inputHint, textAlign: 'center', padding: 32 },
  footer: { padding: 16, backgroundColor: colors.surfaceCream, borderTopColor: colors.inputBorder, borderTopWidth: 1 },
});
