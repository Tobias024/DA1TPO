import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import PrimaryButton from '@/components/PrimaryButton';
import TextField from '@/components/TextField';
import { colors } from '@/theme/colors';
import { authApi } from '@/api/services';
import { useSession } from '@/storage/SessionContext';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useSession();
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!documento || !password) {
      setError('Complete documento y contraseña');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ documento, password });
      await signIn(res.accessToken, res.refreshToken, res.user);
      // El cambio de `loggedIn` en SessionContext re-monta el RootNavigator hacia Main.
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401) setError('Documento o contraseña incorrectos');
      else if (status === 403) setError(e.response.data?.error ?? 'Cuenta no autorizada');
      else setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.banner}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>S</Text>
          </View>
          <Text style={styles.bannerTitle}>LOGIN</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.welcome}>¡Bienvenido!</Text>
          <Text style={styles.section}>INICIO DE SESIÓN</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextField
            label="DNI / Documento"
            value={documento}
            onChangeText={setDocumento}
            keyboardType="numeric"
            autoCapitalize="none"
          />
          <TextField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.forgot}>¿Olvidaste tu contraseña?</Text>

          <PrimaryButton
            title="INGRESAR"
            onPress={submit}
            loading={loading}
            style={{ marginTop: 8 }}
          />

          <Text style={styles.noAccount}>¿no tenés una cuenta?</Text>
          <PrimaryButton
            title="Crear cuenta nueva"
            variant="outlined"
            onPress={() => navigation.navigate('RegisterStep1')}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.brandPrimary,
    paddingTop: 48,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceCream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoLetter: {
    color: colors.brandPrimary,
    fontSize: 40,
    fontWeight: '700',
  },
  bannerTitle: {
    color: colors.textOnDark,
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  form: { paddingHorizontal: 28, paddingTop: 32, paddingBottom: 32 },
  welcome: {
    fontSize: 36,
    color: colors.brandPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  section: {
    fontSize: 22,
    color: colors.textPrimary,
    marginBottom: 28,
  },
  forgot: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 16,
  },
  noAccount: {
    color: colors.textPrimary,
    fontSize: 16,
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  error: {
    backgroundColor: '#FDECEC',
    color: colors.redLive,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
});
