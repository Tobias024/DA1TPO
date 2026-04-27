import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * Tipografía SubastAR (Doc/CSS.md). RN no tiene Inter/Roboto bundled — usamos
 * fontFamily 'System' por defecto y aplicamos pesos. Si en algún momento
 * cargamos las fuentes vía expo-font, basta con cambiar `display` y `body` aquí.
 */
const family = {
  display: undefined as string | undefined, // Inter cuando se cargue
  body: undefined as string | undefined,    // Roboto cuando se cargue
};

export const typography = {
  titlePage: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 58,
    letterSpacing: -0.96,
    color: colors.textOnDark,
    fontFamily: family.display,
  } as TextStyle,
  display: {
    fontSize: 36,
    fontWeight: '500',
    lineHeight: 44,
    color: colors.brandPrimary,
    fontFamily: family.body,
  } as TextStyle,
  headline: {
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 32,
    color: colors.textPrimary,
    fontFamily: family.body,
  } as TextStyle,
  titleLarge: {
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 28,
    color: colors.textPrimary,
    fontFamily: family.body,
  } as TextStyle,
  titleMedium: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0.15,
    color: colors.textPrimary,
    fontFamily: family.body,
  } as TextStyle,
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: 0.1,
    color: colors.textPrimary,
    fontFamily: family.body,
  } as TextStyle,
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.textPrimary,
    fontFamily: family.display,
  } as TextStyle,
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.inputHint,
    fontFamily: family.body,
  } as TextStyle,
};
