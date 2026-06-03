import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import { colors } from '@/theme/colors';
import { authApi } from '@/api/services';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterStep1'>;

async function pickDocumentPhoto(setter: (uri: string) => void) {
  Alert.alert('Foto de documento', '¿Cómo querés agregar la foto?', [
    {
      text: 'Cámara',
      onPress: async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.'); return; }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (!result.canceled && result.assets[0]) setter(result.assets[0].uri);
      },
    },
    {
      text: 'Galería',
      onPress: async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Permiso requerido', 'Necesitamos acceso a la galería.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
        if (!result.canceled && result.assets[0]) setter(result.assets[0].uri);
      },
    },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}

export default function RegisterStep1Screen({ navigation }: Props) {
  const [documento, setDocumento] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [domicilioLegal, setDomicilio] = useState('');
  const [paisOrigen, setPais] = useState('');
  const [frenteUri, setFrenteUri] = useState<string | null>(null);
  const [dorsoUri, setDorsoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!documento || !nombre || !apellido || !email) {
      Alert.alert('Faltan datos', 'Complete documento, nombre, apellido y email.');
      return;
    }
    if (!frenteUri || !dorsoUri) {
      Alert.alert('Fotos requeridas', 'Debe adjuntar la foto del frente y dorso de su documento de identidad.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.registerStep1({
        documento, nombre, apellido, email, domicilioLegal, paisOrigen,
      });
      navigation.navigate('RegisterWaiting', {
        registrationId: res.registrationId,
        registrationToken: res.registrationToken,
      });
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? 'No se pudo enviar la solicitud';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>REGISTRO</Text>
        <Text style={styles.bannerSubtitle}>Verificación de Identidad — Etapa 1 de 3</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Registrate</Text>

        <TextField label="DNI / Documento" value={documento} onChangeText={setDocumento} keyboardType="numeric" />
        <TextField label="Nombre" value={nombre} onChangeText={setNombre} />
        <TextField label="Apellido" value={apellido} onChangeText={setApellido} />
        <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextField label="Domicilio Legal" value={domicilioLegal} onChangeText={setDomicilio} />
        <TextField label="País de Origen" value={paisOrigen} onChangeText={setPais} placeholder="ARG" />

        <Text style={styles.section}>Documentación</Text>
        <Text style={styles.sectionHint}>
          Para participar en subastas requerimos una copia digital legible de su documento de identidad (frente y dorso).
        </Text>

        <PhotoPicker label="Frente del documento" uri={frenteUri} onPick={() => pickDocumentPhoto(setFrenteUri)} />
        <PhotoPicker label="Dorso del documento" uri={dorsoUri} onPick={() => pickDocumentPhoto(setDorsoUri)} />

        <Text style={styles.note}>
          Tus datos están protegidos y solo se usan para la verificación de identidad.
        </Text>

        <PrimaryButton title="CONTINUAR" onPress={submit} loading={loading} />
      </View>
    </ScrollView>
  );
}

function PhotoPicker({ label, uri, onPick }: { label: string; uri: string | null; onPick: () => void }) {
  return (
    <View style={pickerStyles.wrapper}>
      <TouchableOpacity style={[pickerStyles.btn, !!uri && pickerStyles.btnDone]} onPress={onPick} activeOpacity={0.7}>
        <Ionicons
          name={uri ? 'checkmark-circle' : 'add-circle-outline'}
          size={18}
          color={colors.brandPrimary}
          style={{ marginRight: 6 }}
        />
        <Text style={pickerStyles.btnText}>{label}</Text>
      </TouchableOpacity>
      {uri ? <Image source={{ uri }} style={pickerStyles.preview} resizeMode="cover" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.brandPrimary,
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
  },
  bannerTitle: { color: colors.textOnDark, fontSize: 48, fontWeight: '700', letterSpacing: -1 },
  bannerSubtitle: { color: colors.onPrimary, fontSize: 14, marginTop: 4 },
  form: { padding: 24 },
  title: { fontSize: 36, color: colors.brandPrimary, fontWeight: '500', marginBottom: 16 },
  section: { fontSize: 18, color: colors.brandPrimary, fontWeight: '700', marginTop: 8, marginBottom: 6 },
  sectionHint: { fontSize: 14, color: colors.textPrimary, marginBottom: 12 },
  note: { fontSize: 12, color: colors.inputHint, marginBottom: 24 },
});

const pickerStyles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  btn: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: colors.brandPrimary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDone: { backgroundColor: '#F0E8E8', borderColor: colors.brandPrimaryLight },
  btnText: { color: colors.brandPrimary, fontWeight: '700', fontSize: 14 },
  preview: {
    width: '100%',
    height: 140,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
});
