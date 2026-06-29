import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { CommonActions, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '@/components/PrimaryButton';
import Card from '@/components/Card';
import { colors } from '@/theme/colors';
import { consignmentsApi } from '@/api/services';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'RequestSent'>;

/** Dirección a la que el usuario envía su bien (espejo de DEPOSITO_DEFAULT en el backend). */
const DEPOSITO = 'Depósito Central — Av. de los Constituyentes 1234, CABA';

export default function RequestSentScreen() {
  const nav = useNavigation();
  const { params } = useRoute<Rt>();
  const consignmentId = params?.consignmentId;
  const [confirmado, setConfirmado] = useState(false);
  const [loading, setLoading] = useState(false);

  // Si se llega acá con un envío ya confirmado (desde Mis Subastas o la notificación),
  // reflejarlo en vez de volver a ofrecer el botón.
  useEffect(() => {
    if (!consignmentId) return;
    consignmentsApi.detail(consignmentId)
      .then((c) => { if (c?.envioConfirmado) setConfirmado(true); })
      .catch(() => {});
  }, [consignmentId]);

  const confirmarEnvio = async () => {
    if (!consignmentId) return;
    setLoading(true);
    try {
      await consignmentsApi.confirmShipment(consignmentId);
      setConfirmado(true);
    } catch {
      Alert.alert('Error', 'No se pudo confirmar el envío. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const volver = () =>
    nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' as never }] }));

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.wrap}>
      <Ionicons name="checkmark-circle" size={88} color={colors.brandPrimary} style={{ marginBottom: 8 }} />
      <Text style={styles.title}>Solicitud Enviada</Text>
      <Text style={styles.msg}>
        Tu artículo está siendo revisado. Para continuar, enviá tu bien al depósito.
      </Text>

      <Card style={styles.card}>
        <Text style={styles.label}>Enviá tu producto a</Text>
        <Text style={styles.deposito}>{DEPOSITO}</Text>
      </Card>

      {consignmentId ? (
        confirmado ? (
          <View style={styles.okRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.greenLive} />
            <Text style={styles.okText}>Envío confirmado. Te avisaremos cuando lo recibamos.</Text>
          </View>
        ) : (
          <PrimaryButton
            title="Confirmar que lo envié por correo"
            onPress={confirmarEnvio}
            loading={loading}
            style={{ alignSelf: 'stretch', marginTop: 8 }}
          />
        )
      ) : null}

      <PrimaryButton
        title="Volver"
        variant="outlined"
        onPress={volver}
        style={{ alignSelf: 'stretch', marginTop: 12 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.brandPrimary, marginBottom: 12 },
  msg: { fontSize: 16, color: colors.textPrimary, textAlign: 'center', marginBottom: 20 },
  card: { alignSelf: 'stretch', marginBottom: 16 },
  label: { fontSize: 13, color: colors.inputHint, marginBottom: 4 },
  deposito: { fontSize: 16, color: colors.textPrimary, fontWeight: '600' },
  okRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', marginTop: 8 },
  okText: { flex: 1, marginLeft: 8, color: colors.greenLive, fontWeight: '600' },
});
