import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import { colors } from '@/theme/colors';
import { authApi } from '@/api/services';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterStep1'>;

export default function RegisterStep1Screen({ navigation }: Props) {
  const [documento, setDocumento] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [domicilioLegal, setDomicilio] = useState('');
  const [paisOrigen, setPais] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!documento || !nombre || !apellido || !email) {
      Alert.alert('Faltan datos', 'Complete documento, nombre, apellido y email.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.registerStep1({
        documento, nombre, apellido, email, domicilioLegal, paisOrigen,
      });
      Alert.alert(
        'Solicitud enviada',
        'Te enviamos un mail con un código para completar el registro.',
        [{ text: 'OK', onPress: () => navigation.navigate('RegisterStep2', { registrationId: res.registrationId }) }],
      );
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
        <PrimaryButton title="SUBIR FOTO FRENTE" variant="outlined" onPress={() => Alert.alert('TODO', 'Adjuntar foto DNI frente')} style={{ marginBottom: 8 }} />
        <PrimaryButton title="SUBIR FOTO DORSO" variant="outlined" onPress={() => Alert.alert('TODO', 'Adjuntar foto DNI dorso')} style={{ marginBottom: 16 }} />

        <Text style={styles.note}>
          Tus datos están protegidos y solo se usan para la verificación de identidad.
        </Text>

        <PrimaryButton title="CONTINUAR" onPress={submit} loading={loading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.brandPrimary,
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'center',
  },
  bannerTitle: {
    color: colors.textOnDark,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  bannerSubtitle: {
    color: colors.onPrimary,
    fontSize: 14,
    marginTop: 4,
  },
  form: { padding: 24 },
  title: {
    fontSize: 36,
    color: colors.brandPrimary,
    fontWeight: '500',
    marginBottom: 16,
  },
  section: {
    fontSize: 18,
    color: colors.brandPrimary,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  note: {
    fontSize: 12,
    color: colors.inputHint,
    marginBottom: 24,
  },
});
