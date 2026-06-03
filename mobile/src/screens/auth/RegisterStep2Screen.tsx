import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import { colors } from '@/theme/colors';
import { authApi } from '@/api/services';
import { session } from '@/storage/session';
import { useSession } from '@/storage/SessionContext';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterStep2'>;

export default function RegisterStep2Screen({ navigation, route }: Props) {
  const { refreshUser } = useSession();
  const [token, setToken] = useState(route.params?.registrationToken ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token || !password || !confirm) {
      Alert.alert('Faltan datos');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.registerStep2({
        registrationToken: token,
        password,
        passwordConfirm: confirm,
      });
      // Step2 deja la cuenta APROBADA pero NO levanta `loggedIn` del context
      // todavía — primero pedimos al usuario el medio de pago en step 3.
      await session.save(res.accessToken, res.refreshToken, res.user);
      refreshUser(res.user);
      navigation.navigate('RegisterStep3');
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 410) Alert.alert('Token expirado', 'Pedí un nuevo registro.');
      else Alert.alert('Error', e?.response?.data?.error ?? 'No se pudo completar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <View style={styles.form}>
        <Text style={styles.kicker}>Confirmación 1 / 2</Text>
        <Text style={styles.title}>Completar Registro</Text>
        <Text style={styles.intro}>
          ¡Tu cuenta fue verificada! Elegí tu contraseña personal para completar el registro.
        </Text>

        <TextField label="Código de verificación" value={token} onChangeText={setToken} autoCapitalize="none" />
        <TextField label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
        <TextField label="Confirmar contraseña" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" />

        <PrimaryButton title="CONTINUAR" onPress={submit} loading={loading} style={{ marginTop: 16 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  form: { padding: 24, paddingTop: 48 },
  kicker: {
    fontSize: 14,
    color: colors.inputHint,
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    color: colors.brandPrimary,
    fontWeight: '700',
    marginBottom: 8,
  },
  intro: {
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: 20,
  },
});
