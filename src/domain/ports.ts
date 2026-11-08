import type { HexKey } from './hex';

export interface IRandom { next(): number }

/** Fuente de piezas (bandeja de Lines, pilas de Sort). */
export interface IPieceSource<TPiece> { next(): TPiece }

/** Política de puntaje intercambiable. */
export interface IScoringPolicy<TContext> { score(ctx: TContext): number }

export type GameStatus = 'playing' | 'won' | 'lost';

export type GameEvent =
  | { type: 'placed'; keys: HexKey[] }
  | { type: 'removed'; keys: HexKey[] }
  | { type: 'rotated'; piece: number }
  | { type: 'linesCleared'; keys: HexKey[]; lines: number }
  | { type: 'moved'; from: HexKey; to: HexKey }
  | { type: 'merged'; key: HexKey; value: number }
  | { type: 'spawned'; key: HexKey; value: number }
  | { type: 'transferred'; from: HexKey; to: HexKey; count: number }
  | { type: 'stackCleared'; key: HexKey; count: number }
  | { type: 'trayRefilled' }
  | { type: 'score'; points: number }
  | { type: 'won' }
  | { type: 'lost' };

/** Reglas de un juego: lo que varía. El motor (GameEngine) es lo común. */
export interface IGameRules<TCell, TMove, TState> {
  /** Pasos de deshacer que permite el juego: 0, 1 o Infinity. */
  readonly undoLimit: number;
  init(level?: number): TState;
  isValid(state: TState, move: TMove): boolean;
  /** Modifica el estado y devuelve lo que pasó, en orden. */
  apply(state: TState, move: TMove): GameEvent[];
  status(state: TState): GameStatus;
  clone(state: TState): TState;
  /** Celda del tablero de este juego (solo para tipar). */
  readonly cellType?: TCell;
}
