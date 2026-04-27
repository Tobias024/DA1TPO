/**
 * Paleta SubastAR — extraída de Doc/CSS.md
 */
export const colors = {
  brandPrimary: '#710000',
  brandPrimaryDim: '#5A0000',
  brandPrimaryLight: '#8A1A1A',
  onPrimary: '#FEE9E7',

  surfaceCream: '#F5ECE4',
  surfaceWhite: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.4)',

  inputBg: '#D9D9D9',
  inputBorder: '#9D9D9D',
  inputHint: '#727272',

  textPrimary: '#000000',
  textOnDark: '#FFFFFF',
  divider: '#1E1E1E',

  // Status
  greenLive: '#4CAF50',
  redLive: '#E84343',
  orangePending: '#E8A043',
  blueUpcoming: '#6A9FD9',

  // Categorías (gating PDF)
  catComun: '#888888',
  catEspecial: '#4CAF50',
  catPlata: '#C0C0C0',
  catOro: '#C9A84C',
  catPlatino: '#E5E4E2',
} as const;

export type Categoria = 'COMUN' | 'ESPECIAL' | 'PLATA' | 'ORO' | 'PLATINO';

export const categoriaColor = (c?: string): string => {
  switch (c) {
    case 'COMUN': return colors.catComun;
    case 'ESPECIAL': return colors.catEspecial;
    case 'PLATA': return colors.catPlata;
    case 'ORO': return colors.catOro;
    case 'PLATINO': return colors.catPlatino;
    default: return colors.inputHint;
  }
};
