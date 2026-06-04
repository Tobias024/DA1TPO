import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import { colors } from '@/theme/colors';
import { consignmentsApi } from '@/api/services';
import type { Consignment } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'RequestAccepted'>;

export default function RequestAcceptedScreen() {
  const nav = useNavigation();
  const { params } = useRoute<Rt>();
  const [c, setC] = useState<Consignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [cbu, setCbu] = useState('');
  const [banco, setBanco] = useState('');

  useEffect(() => {
    if (!params.consignmentId) return;
    consignmentsApi.detail(params.consignmentId).then(setC).catch(() => setC(null));
  }, [params.consignmentId]);

  const accept = async () => {
    if (!c) return;
    if (!cbu.trim() || !banco.trim()) {
      Alert.alert('Cuenta requerida', 'Debés declarar la cuenta bancaria destino para recibir el producido de la venta antes del inicio de la subasta.');
      return;
    }
    setLoading(true);
    try {
      await consignmentsApi.acceptOffer(c.id);
      Alert.alert('Listo', 'Propuesta aceptada.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch { Alert.alert('Error'); } finally { setLoading(false); }
  };

  const reject = async () => {
    if (!c) return;
    setLoading(true);
    try {
      await consignmentsApi.rejectOffer(c.id);
      Alert.alert('Listo', 'Propuesta rechazada.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch { Alert.alert('Error'); } finally { setLoading(false); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Solicitud Aceptada</Text>
      <Text style={styles.intro}>
        Tu artículo fue inspeccionado y aceptado para participar en una subasta.
      </Text>

      <Card>
        <Row k="Subasta asignada" v={c?.subastaAsignadaId ?? '—'} />
        <Row k="Fecha" v={c?.fechaSubastaAsignada ? new Date(c.fechaSubastaAsignada).toLocaleString('es-AR') : '—'} />
        <Row k="Valor base ofrecido" v={(c?.precioBaseOfrecido ?? c?.valorBaseOfrecido) ? `$ ${(c!.precioBaseOfrecido ?? c!.valorBaseOfrecido)!.toLocaleString('es-AR')}` : '—'} highlight />
        <Row k="Comisiones" v={c?.comision ? `$ ${c.comision.toLocaleString('es-AR')}` : '—'} />
        {c?.polizaSeguro ? (
          <Row k="Póliza" v={`${c.polizaSeguro.aseguradora} #${c.polizaSeguro.numeroPoliza}`} />
        ) : null}
      </Card>

      <Text style={styles.sectionTitle}>Cuenta para cobros</Text>
      <Text style={styles.sectionHint}>
        Declarás la cuenta a la vista donde recibirás el producido de la venta. Puede ser del exterior y debe declararse antes del inicio de la subasta.
      </Text>
      <TextField label="CBU / IBAN / Cuenta" value={cbu} onChangeText={setCbu} />
      <TextField label="Banco o entidad" value={banco} onChangeText={setBanco} />

      <PrimaryButton title="Aceptar Propuesta" onPress={accept} loading={loading} style={{ marginTop: 16 }} />
      <PrimaryButton title="Rechazar" variant="outlined" onPress={reject} loading={loading} style={{ marginTop: 8 }} />
    </ScrollView>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowKey}>{k}</Text>
      <Text style={[styles.rowVal, highlight && styles.highlight]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.brandPrimary, marginBottom: 12 },
  intro: { fontSize: 14, color: colors.textPrimary, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.brandPrimary, marginTop: 20, marginBottom: 4 },
  sectionHint: { fontSize: 13, color: colors.inputHint, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  rowKey: { color: colors.inputHint, fontSize: 14 },
  rowVal: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  highlight: { color: colors.brandPrimary, fontSize: 18, fontWeight: '700' },
});
