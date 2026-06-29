import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { authApi } from '@/api/services';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterWaiting'>;

/**
 * Pantalla intermedia: la cuenta está "esperando aprobación de la empresa".
 * La empresa/admin aprueba (→ PENDIENTE_COMPLETAR_REGISTRO, avanza a contraseña)
 * o rechaza (→ RECHAZADO, se muestra el motivo y se vuelve al inicio).
 */
export default function RegisterWaitingScreen({ navigation, route }: Props) {
  const { registrationId, registrationToken } = route.params;
  const [error, setError] = useState<string | null>(null);
  const [rechazo, setRechazo] = useState<string | null>(null);
  const stopped = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const goToPassword = (token?: string | null) => {
      if (stopped.current) return;
      stopped.current = true;
      navigation.replace('RegisterStep2', {
        registrationId,
        registrationToken: token ?? registrationToken,
      });
    };

    const check = async () => {
      if (stopped.current) return;
      try {
        const status = await authApi.registerStatus(registrationId);
        if (cancelled) return;
        if (status.rechazado) {
          stopped.current = true;
          setRechazo(status.motivoRechazo ?? 'La empresa no aprobó tu solicitud.');
          return;
        }
        if (status.listoParaCompletar) goToPassword(status.registrationToken);
      } catch {
        if (!cancelled) setError('No pudimos verificar el estado. Reintentando…');
      }
    };

    const firstCheck = setTimeout(check, 5000);
    const interval = setInterval(check, 3000);
    return () => {
      cancelled = true;
      clearTimeout(firstCheck);
      clearInterval(interval);
    };
  }, [navigation, registrationId, registrationToken]);

  if (rechazo) {
    return (
      <View style={styles.container}>
        <Ionicons name="close-circle-outline" size={72} color={colors.redLive} />
        <Text style={styles.title}>Solicitud rechazada</Text>
        <Text style={styles.subtitle}>{rechazo}</Text>
        <Pressable style={styles.btn} onPress={() => navigation.popToTop()}>
          <Text style={styles.btnText}>Volver al inicio</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="shield-checkmark-outline" size={72} color={colors.brandPrimary} />
      <Text style={styles.title}>¡Ya casi está listo!</Text>
      <Text style={styles.subtitle}>
        La empresa está revisando tus datos. Cuando apruebe tu cuenta vas a poder
        definir tu contraseña y empezar a participar. Esto puede demorar unos instantes.
      </Text>
      <ActivityIndicator color={colors.brandPrimary} size="large" style={{ marginTop: 24 }} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.brandPrimary, marginTop: 20, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textPrimary, marginTop: 10, textAlign: 'center', lineHeight: 22 },
  error: { fontSize: 13, color: colors.inputHint, marginTop: 16, textAlign: 'center' },
  btn: {
    marginTop: 24,
    backgroundColor: colors.brandPrimary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  btnText: { color: colors.textOnDark, fontWeight: '700', fontSize: 15 },
});
