export type ScanRangeKey = 'near' | 'medium' | 'far';

export const SCAN_RANGE_PRESETS: Record<
  ScanRangeKey,
  {
    label: string;
    minRssi: number;
    power: number;
    distance: string;
    description: string;
  }
> = {
  near: {
    label: 'Cercano',
    minRssi: -55,
    power: 18,
    distance: '≈0.5 m',
    description: 'Lecturas muy puntuales, ideal para etiquetas individuales.',
  },
  medium: {
    label: 'Medio',
    minRssi: -65,
    power: 22,
    distance: '≈1.5 m',
    description: 'Equilibrio entre alcance y precisión para la mayoría de casos.',
  },
  far: {
    label: 'Amplio',
    minRssi: -75,
    power: 26,
    distance: '≈3 m',
    description: 'Cobertura amplia para lotes o contenedores con varias prendas.',
  },
};

export const SCAN_RANGE_ORDER: ScanRangeKey[] = ['near', 'medium', 'far'];

