import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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

export default function PaymentMethodsScreen() {
  const nav = useNavigation<Nav>();
  const [items, setItems] = useState<MedioPago[]>([]);
  const [loading, setLoading] = useState(false);

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
    <View style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <FlatList
        data={items}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? 'Cargando…' : 'No tenés medios de pago registrados.'}</Text>}
        renderItem={({ item }) => (
          <Card onPress={() => remove(item.id)} style={{ marginBottom: 10 }}>
            <Text style={styles.tipo}>{TIPO_LABEL[item.tipo] ?? item.tipo}</Text>
            <Text style={styles.proveedor}>
              {item.proveedor}{item.ultimosDigitos ? `  ····${item.ultimosDigitos}` : ''}
            </Text>
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
            {item.tipo === 'CHEQUE_CERTIFICADO' && item.montoGarantia ? (
              <Text style={styles.garantia}>Garantía: $ {item.montoGarantia.toLocaleString('es-AR')}</Text>
            ) : null}
          </Card>
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton title="Agregar Medio de Pago" onPress={() => nav.navigate('AddPaymentMethod')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.inputHint, textAlign: 'center', padding: 32 },
  tipo: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  proveedor: { fontSize: 14, color: colors.textPrimary, marginTop: 2 },
  estadoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  estado: { fontSize: 13 },
  garantia: { fontSize: 13, color: colors.brandPrimary, marginTop: 4, fontWeight: '600' },
  footer: { padding: 16, backgroundColor: colors.surfaceCream, borderTopColor: colors.inputBorder, borderTopWidth: 1 },
});
