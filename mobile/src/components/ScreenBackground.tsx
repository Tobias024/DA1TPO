import React from 'react';
import { ImageBackground, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';

const bg = require('../assets/background.png');

/**
 * Fondo OPACO con la textura de la app. Envuelve cada pantalla de tab para que la
 * entrante tape por completo a la saliente durante el cambio de pestaña (sin esto,
 * con la navegación transparente se ven las dos pantallas superpuestas un instante).
 * El backgroundColor garantiza opacidad aun antes de que pinte la imagen.
 */
export default function ScreenBackground({ children }: { children: React.ReactNode }) {
  return (
    <ImageBackground source={bg} style={styles.bg} resizeMode="cover">
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.surfaceCream },
});
