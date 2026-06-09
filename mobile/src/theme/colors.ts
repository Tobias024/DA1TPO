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

  inputBg: '#eeeeee',
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
  catComun: '#BDECB6',
  catEspecial: '#CCA9DD',
  catPlata: '#E3E4E5',
  catOro: '#F9E6CA',
  catPlatino: '#ACC7CC',

  catTextComun: '#70AA67',
  catTextEspecial: '#924E9C',
  catTextPlata: '#8B8B8B',
  catTextOro: '#775A19',
  catTextPlatino: '#006C68',

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

export const categoriaTextColor = (c?: string): string => {
  switch (c) {
    case 'COMUN': return colors.catTextComun;
    case 'ESPECIAL': return colors.catTextEspecial;
    case 'PLATA': return colors.catTextPlata;
    case 'ORO': return colors.catTextOro;
    case 'PLATINO': return colors.catTextPlatino;
    default: return colors.inputHint;
  }
};