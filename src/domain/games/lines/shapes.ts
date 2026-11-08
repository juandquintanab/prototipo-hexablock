import type { HexCoord } from '../../hex';

/** Piezas de Hexa Lines (desplazamientos axiales) con su peso de aparición. */
export interface LinesShape { cells: HexCoord[]; weight: number }

const c = (...pairs: [number, number][]): HexCoord[] => pairs.map(([q, r]) => ({ q, r }));

// Los tamaños 1–3 salen más seguido que 4–5.
const W = { 1: 10, 2: 8, 3: 6, 4: 4, 5: 3 } as const;

export const LINES_SHAPES: LinesShape[] = [
  { cells: c([0, 0]), weight: W[1] },

  { cells: c([0, 0], [1, 0]), weight: W[2] },
  { cells: c([0, 0], [0, 1]), weight: W[2] },
  { cells: c([0, 0], [1, -1]), weight: W[2] },

  { cells: c([0, 0], [1, 0], [2, 0]), weight: W[3] },
  { cells: c([0, 0], [0, 1], [0, 2]), weight: W[3] },
  { cells: c([0, 0], [1, -1], [2, -2]), weight: W[3] },
  { cells: c([0, 0], [1, 0], [0, 1]), weight: W[3] },
  { cells: c([0, 0], [1, -1], [1, 0]), weight: W[3] },
  { cells: c([0, 0], [1, 0], [1, 1]), weight: W[3] },
  { cells: c([0, 0], [0, 1], [1, 1]), weight: W[3] },

  { cells: c([0, 0], [1, 0], [2, 0], [3, 0]), weight: W[4] },
  { cells: c([0, 0], [0, 1], [0, 2], [0, 3]), weight: W[4] },
  { cells: c([0, 0], [1, -1], [2, -2], [3, -3]), weight: W[4] },
  { cells: c([0, 0], [1, 0], [0, 1], [1, 1]), weight: W[4] },

  { cells: c([0, 0], [1, 0], [2, 0], [1, 1], [0, 1]), weight: W[5] },
];
