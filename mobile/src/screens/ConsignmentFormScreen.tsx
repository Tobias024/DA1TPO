import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import Card from '@/components/Card';
import { colors } from '@/theme/colors';
import { consignmentsApi } from '@/api/services';
import type { MainStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const MIN_FOTOS = 6;

/** Subastar algo propio (Doc + PDF — mínimo 6 fotos + declaraciones obligatorias). */
export default function ConsignmentFormScreen() {
  const nav = useNavigation<Nav>();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [historia, setHistoria] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [propiedad, setPropiedad] = useState(false);
  const [origen, setOrigen] = useState(false);
  const [loading, setLoading] = useState(false);

  const addFoto = () => setFotos((f) => [...f, `foto-${f.length + 1}`]);

  const submit = async () => {
    if (!nombre || !descripcion) { Alert.alert('Faltan datos', 'Completá nombre y descripción.'); return; }
    if (fotos.length < MIN_FOTOS) {
      Alert.alert('Pocas fotos', `Adjuntá al menos ${MIN_FOTOS} fotografías.`);
      return;
    }
    if (!propiedad || !origen) {
      Alert.alert('Declaraciones', 'Debés aceptar ambas declaraciones.');
      return;
    }
    setLoading(true);
    try {
      await consignmentsApi.create({
        nombreBien: nombre,
        descripcionDetallada: descripcion,
        historia: historia || undefined,
        fotos,
        declaraPropiedad: propiedad,
        declaraOrigenLicito: origen,
      });
      nav.replace('RequestSent');
    } catch {
      Alert.alert('Error', 'No se pudo enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.kicker}>SUBASTAR ALGO PROPIO</Text>
      <Text style={styles.title}>Subastar algo propio</Text>
      <Text style={styles.intro}>
        Completá los datos. Si la empresa lo aprueba, te avisaremos para enviarlo a inspección.
      </Text>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.section}>Detalles del Objeto</Text>
        <TextField label="Nombre del bien" value={nombre} onChangeText={setNombre} />
        <TextField label="Descripción detallada" value={descripcion} onChangeText={setDescripcion} multiline />
        <TextField label="Historia (opcional)" value={historia} onChangeText={setHistoria} multiline />
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.section}>Fotografías</Text>
        <Text style={styles.minPhotos}>Mínimo {MIN_FOTOS} fotografías ({fotos.length}/{MIN_FOTOS})</Text>
        <PrimaryButton title="+ Agregar foto" variant="outlined" onPress={addFoto} />
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Text style={styles.section}>Declaraciones</Text>
        <Pressable onPress={() => setPropiedad((v) => !v)} style={styles.cbRow}>
          <View style={[styles.cb, propiedad && styles.cbOn]}>{propiedad ? <Text style={styles.cbTick}>✓</Text> : null}</View>
          <Text style={styles.cbText}>
            Declaro que el bien me pertenece y no posee ningún impedimento legal.
          </Text>
        </Pressable>
        <Pressable onPress={() => setOrigen((v) => !v)} style={styles.cbRow}>
          <View style={[styles.cb, origen && styles.cbOn]}>{origen ? <Text style={styles.cbTick}>✓</Text> : null}</View>
          <Text style={styles.cbText}>Acredito el origen lícito del bien.</Text>
        </Pressable>
      </Card>

      <PrimaryButton title="ENVIAR SOLICITUD" onPress={submit} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kicker: { color: colors.brandPrimary, fontSize: 12, fontWeight: '700', letterSpacing: 0.16, marginBottom: 4 },
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  intro: { fontSize: 14, color: colors.textPrimary, marginBottom: 16 },
  section: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  minPhotos: { fontSize: 13, color: colors.inputHint, marginBottom: 10 },
  cbRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cb: {
    width: 22, height: 22, borderRadius: 4,
    borderWidth: 1.5, borderColor: colors.inputBorder, marginRight: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cbOn: { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimary },
  cbTick: { color: colors.onPrimary, fontWeight: '700' },
  cbText: { flex: 1, fontSize: 14, color: colors.textPrimary },
});
