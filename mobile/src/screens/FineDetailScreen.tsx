import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/Card';
import PrimaryButton from '@/components/PrimaryButton';
import { colors } from '@/theme/colors';
import type { MainStackParamList } from '@/navigation/types';

type Rt = RouteProp<MainStackParamList, 'FineDetail'>;

export default function FineDetailScreen() {
  const nav = useNavigation();
  const { params } = useRoute<Rt>();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceCream }}>
      <View style={styles.head}>
        <Ionicons name="warning" size={48} color={colors.textOnDark} />
        <Text style={styles.title}>{params.titulo}</Text>
      </View>

      <Card style={{ margin: 16 }}>
        <Text style={styles.mensajeLabel}>Detalle</Text>
        <Text style={styles.mensaje}>{params.mensaje}</Text>
      </Card>

      <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <Text style={styles.bloqueadoTitle}>Acceso restringido</Text>
        <Text style={styles.bloqueadoText}>
          Tenés una multa pendiente equivalente al 10% del valor de tu última oferta. No podrás participar en nuevas subastas hasta regularizar la situación.
        </Text>
        <Text style={styles.plazoText}>
          Debés presentar los fondos necesarios dentro de las 72 hs. de recibida esta notificación. En caso de incumplimiento el caso se deriva a la justicia.
        </Text>
      </Card>

      <View style={{ marginHorizontal: 16, marginBottom: 32 }}>
        <PrimaryButton title="Entendido" onPress={() => nav.goBack()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: {
    backgroundColor: colors.orangePending,
    padding: 24,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.textOnDark, marginTop: 8, textAlign: 'center' },
  mensajeLabel: { fontSize: 12, color: colors.inputHint, fontWeight: '700', marginBottom: 6 },
  mensaje: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  bloqueadoTitle: { fontSize: 16, fontWeight: '700', color: colors.brandPrimary, marginBottom: 8 },
  bloqueadoText: { fontSize: 14, color: colors.textPrimary, lineHeight: 21 },
  plazoText: { fontSize: 13, color: colors.inputHint, marginTop: 10, lineHeight: 19 },
});
