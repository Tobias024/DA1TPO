import React, { useEffect, useState } from 'react';
import { ScrollView, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import Card from '@/components/Card';
import { colors } from '@/theme/colors';
import { consignmentsApi } from '@/api/services';
import type { Consignment } from '@/types/api';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'PieceLocation'>;

function openContact(contacto: string) {
  let url: string;
  if (contacto.includes('@')) {
    url = `mailto:${contacto}`;
  } else {
    url = `tel:${contacto.replace(/\s/g, '')}`;
  }
  Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir el contacto.'));
}

export default function PieceLocationScreen() {
  const { params } = useRoute<Rt>();
  const [c, setC] = useState<Consignment | null>(null);

  useEffect(() => {
    consignmentsApi.detail(params.consignmentId).then(setC).catch(() => setC(null));
  }, [params.consignmentId]);

  const contacto = c?.polizaSeguro?.contactoAseguradora;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Ubicación de Pieza</Text>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.lbl}>Depósito</Text>
        <Text style={styles.val}>{c?.ubicacionDeposito ?? '—'}</Text>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.lbl}>Póliza de Seguro</Text>
        <Text style={styles.poliza}>{c?.polizaSeguro?.aseguradora ?? '—'}</Text>
        <Text style={styles.numero}>N° {c?.polizaSeguro?.numeroPoliza ?? '—'}</Text>
        <Text style={styles.valor}>
          Valor asegurado: $ {c?.polizaSeguro?.valorAsegurado?.toLocaleString('es-AR') ?? '—'}
        </Text>
      </Card>

      <Card>
        <Text style={styles.lbl}>Aseguradora — Contacto</Text>
        <Text style={styles.poliza}>{c?.polizaSeguro?.aseguradora ?? '—'}</Text>
        {contacto ? (
          <>
            <Text style={styles.contactoTexto}>{contacto}</Text>
            <TouchableOpacity style={styles.contactoBtn} onPress={() => openContact(contacto)} activeOpacity={0.7}>
              <Text style={styles.contactoBtnText}>Contactar aseguradora</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.sinContacto}>Contacto no disponible. Consultá directamente con la empresa de subastas.</Text>
        )}
        <Text style={styles.contactoHint}>
          Podés contactar a la aseguradora para aumentar el valor de tu póliza pagando la diferencia del premio.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.brandPrimary, marginBottom: 16 },
  lbl: { fontSize: 13, color: colors.inputHint, marginBottom: 4 },
  val: { fontSize: 18, color: colors.textPrimary, fontWeight: '700' },
  poliza: { fontSize: 16, color: colors.textPrimary, fontWeight: '600' },
  numero: { fontSize: 14, color: colors.textPrimary, marginTop: 2 },
  valor: { fontSize: 16, color: colors.brandPrimary, fontWeight: '700', marginTop: 8 },
  contactoTexto: { fontSize: 14, color: colors.textPrimary, marginTop: 6 },
  sinContacto: { fontSize: 13, color: colors.inputHint, marginTop: 6, fontStyle: 'italic' },
  contactoBtn: {
    marginTop: 12,
    backgroundColor: colors.brandPrimary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  contactoBtnText: { color: colors.textOnDark, fontWeight: '700', fontSize: 14 },
  contactoHint: { fontSize: 12, color: colors.inputHint, marginTop: 10 },
});
