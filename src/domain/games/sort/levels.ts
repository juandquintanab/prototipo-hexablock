/** Niveles de Hexa Sort. */
export interface SortLevel { goals: number; colors: number; initialStacks: number }

export const SORT_LEVELS: SortLevel[] = [
  { goals: 2, colors: 3, initialStacks: 0 },
  { goals: 3, colors: 3, initialStacks: 0 },
  { goals: 3, colors: 4, initialStacks: 2 },
  { goals: 4, colors: 4, initialStacks: 3 },
  { goals: 5, colors: 5, initialStacks: 3 },
  { goals: 6, colors: 5, initialStacks: 4 },
];

/** Colores de ficha usados por los niveles, en orden (el nivel toma los primeros N). */
export const SORT_PALETTE = ['piece-blue', 'piece-pink', 'piece-yellow', 'piece-green', 'piece-purple'] as const;
