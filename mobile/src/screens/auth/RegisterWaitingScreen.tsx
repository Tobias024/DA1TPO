import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '@/theme/colors';
import { authApi } from '@/api/services';
import type { AuthStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'RegisterWaiting'>;

/**
 * Pantalla intermedia: la cuenta está "esperando verificación" de la empresa.
 * Cuando la verificación se completa (estado PENDIENTE_COMPLETAR_REGISTRO),
 * avanza a la pantalla de contraseña (Confirmación 1/2) con el token prellenado.
 */
export default function RegisterWaitingScreen({ navigation, route }: Props) {
  const { registrationId, registrationToken } = route.params;
  const [error, setError] = useState<string | null>(null);
  const advanced = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const goToPassword = (token?: string | null) => {
      if (advanced.current) return;
      advanced.current = true;
      navigation.replace('RegisterStep2', {
        registrationId,
        registrationToken: token ?? registrationToken,
      });
    };

    const check = async () => {
      try {
        const status = await authApi.registerStatus(registrationId);
        if (cancelled) return;
        if (status.listoParaCompletar) goToPassword(status.registrationToken);
      } catch {
        if (!cancelled) setError('No pudimos verificar el estado. Reintentando…');
      }
    };

    // Mostramos la pantalla un instante y luego consultamos el estado.
    const firstCheck = setTimeout(check, 2000);
    const interval = setInterval(check, 3000);
    return () => {
      cancelled = true;
      clearTimeout(firstCheck);
      clearInterval(interval);
    };
  }, [navigation, registrationId, registrationToken]);

  return (
    <View style={styles.container}>
      <Ionicons name="shield-checkmark-outline" size={72} color={colors.brandPrimary} />
      <Text style={styles.title}>Verificando tu identidad</Text>
      <Text style={styles.subtitle}>
        Estamos verificando tus datos y documento. Esto puede demorar unos instantes.
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
});
