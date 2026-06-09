import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import { paymentsApi } from '@/api/services';
import type { MedioPago } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const TIPO_LABEL: Record<string, string> = {
  CUENTA_BANCARIA: 'Cuenta bancaria',
  TARJETA_CREDITO: 'Tarjeta de crédito',
  CHEQUE_CERTIFICADO: 'Cheque certificado',
};

const TIPO_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  CUENTA_BANCARIA: 'business-outline',
  TARJETA_CREDITO: 'card-outline',
  CHEQUE_CERTIFICADO: 'document-text-outline',
};

export default function PaymentMethodsScreen() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<MedioPago[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await paymentsApi.list()); } catch { setItems([]); } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = (id: string) => {
    Alert.alert('Eliminar', '¿Eliminar este medio de pago?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try { await paymentsApi.remove(id); load(); } catch { Alert.alert('Error'); }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Cargando…' : 'No tenés medios de pago registrados.'}</Text>}
        renderItem={({ item }) => {
          const open = expanded === item.id;
          return (
            <Card style={{ marginBottom: 10 }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setExpanded(open ? null : item.id)}
                style={styles.header}
              >
                <Ionicons name={TIPO_ICON[item.tipo] ?? 'card-outline'} size={22} color={colors.brandPrimary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tipo}>{TIPO_LABEL[item.tipo] ?? item.tipo}</Text>
                  <Text style={styles.proveedor}>
                    {item.proveedor}{item.ultimosDigitos ? `  ····${item.ultimosDigitos}` : ''}
                  </Text>
                </View>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.inputHint} />
              </TouchableOpacity>

              <View style={styles.estadoRow}>
                <Ionicons
                  name={item.verificado ? 'checkmark-circle' : 'time-outline'}
                  size={14}
                  color={item.verificado ? colors.greenLive : colors.orangePending}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.estado, { color: item.verificado ? colors.greenLive : colors.orangePending }]}>
                  {item.verificado ? 'Verificado' : 'Pendiente de verificación'}
                </Text>
              </View>

              {open ? (
                <View style={styles.detail}>
                  <Detail k="Método de pago" v={TIPO_LABEL[item.tipo] ?? item.tipo} />
                  {item.tipo === 'TARJETA_CREDITO' ? (
                    <>
                      <Detail k="Titular" v={item.titular} />
                      <Detail k="Número" v={item.numeroMasked} />
                      <Detail k="Vencimiento" v={item.vencimiento} />
                      <Detail k="Código de seguridad" v={item.codigoMasked} />
                      {item.moneda ? <Detail k="Moneda" v={item.moneda} /> : null}
                    </>
                  ) : null}
                  {item.tipo === 'CUENTA_BANCARIA' ? (
                    <>
                      <Detail k="Banco" v={item.banco} />
                      <Detail k="N° de cuenta" v={item.numeroCuentaMasked} />
                      <Detail k="CBU" v={item.cbuMasked} />
                    </>
                  ) : null}
                  {item.tipo === 'CHEQUE_CERTIFICADO' ? (
                    <>
                      <Detail k="Banco" v={item.banco} />
                      <Detail k="N° de cheque" v={item.numeroCheque} />
                      <Detail k="Garantía" v={item.montoGarantia != null ? `$ ${item.montoGarantia.toLocaleString('es-AR')}` : undefined} />
                      <Detail k="Disponible" v={item.montoDisponible != null ? `$ ${item.montoDisponible.toLocaleString('es-AR')}` : undefined} />
                    </>
                  ) : null}

                  <TouchableOpacity onPress={() => remove(item.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color={colors.redLive} style={{ marginRight: 6 }} />
                    <Text style={styles.deleteText}>Eliminar medio de pago</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </Card>
          );
        }}
      />
      <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
        <PrimaryButton title="Agregar Medio de Pago" onPress={() => nav.navigate('AddPaymentMethod')} />
      </View>
    </View>
  );
}

function Detail({ k, v }: { k: string; v?: string | null }) {
  if (!v) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailKey}>{k}</Text>
      <Text style={styles.detailVal}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.inputHint, textAlign: 'center', padding: 32 },
  header: { flexDirection: 'row', alignItems: 'center' },
  tipo: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  proveedor: { fontSize: 14, color: colors.textPrimary, marginTop: 2 },
  estadoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  estado: { fontSize: 13 },
  detail: { marginTop: 12, borderTopColor: colors.inputBorder, borderTopWidth: 1, paddingTop: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailKey: { fontSize: 13, color: colors.inputHint },
  detailVal: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  deleteText: { color: colors.redLive, fontWeight: '600', fontSize: 14 },
  footer: { padding: 16, backgroundColor: colors.surfaceCream, borderTopColor: colors.inputBorder, borderTopWidth: 1 },
});
