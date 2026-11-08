import { HexCoord, HexKey, add, key, keyOf, parse, rotateCW } from '../../hex';
import { HexBoard } from '../../HexBoard';
import type { GameEvent, GameStatus, IGameRules } from '../../ports';
import { FIT_COLORS, FIT_LEVELS } from './levels';

/** Celda de Fit: el índice de la pieza que la cubre, o null. */
export type FitCell = number | null;

export type FitMove =
  | { type: 'place'; piece: number; anchor: HexKey }
  | { type: 'remove'; piece: number }
  | { type: 'rotate'; piece: number };

export interface FitPiece {
  /** Forma base, relativa a su primera celda. */
  base: HexCoord[];
  rotation: number;
  color: string;
  placedAt: HexKey | null;
}

export interface FitState {
  level: number;
  board: HexBoard<FitCell>;
  pieces: FitPiece[];
  /** Piezas colocadas (cuenta para las estrellas). */
  moves: number;
}

export const FIT_TIME_MS = 90_000;

/** Celdas relativas de una pieza con su rotación actual. */
export function pieceOffsets(p: FitPiece): HexCoord[] {
  return p.base.map(c => rotateCW(c, p.rotation));
}

export function pieceCellsAt(p: FitPiece, anchor: HexKey): HexKey[] {
  const a = parse(anchor);
  return pieceOffsets(p).map(o => keyOf(add(a, o)));
}

/** Estrellas: movimientos ≤ piezas+2 → 3; ≤ piezas+6 → 2; si no 1. −1 (mín. 1) si pasó del tiempo. */
export function fitStars(moves: number, pieces: number, elapsedMs: number): number {
  let s = moves <= pieces + 2 ? 3 : moves <= pieces + 6 ? 2 : 1;
  if (elapsedMs > FIT_TIME_MS) s = Math.max(1, s - 1);
  return s;
}

export class FitRules implements IGameRules<FitCell, FitMove, FitState> {
  readonly undoLimit = Infinity;

  init(level = 1): FitState {
    const def = FIT_LEVELS[level - 1];
    const keys = def.flat().map(([q, r]) => key(q, r));
    const pieces: FitPiece[] = def.map((cells, i) => {
      const [q0, r0] = cells[0];
      return {
        base: cells.map(([q, r]) => ({ q: q - q0, r: r - r0 })),
        rotation: (level + i) % 6,
        color: FIT_COLORS[i % FIT_COLORS.length],
        placedAt: null,
      };
    });
    return { level, board: new HexBoard<FitCell>(keys, () => null), pieces, moves: 0 };
  }

  isValid(state: FitState, move: FitMove): boolean {
    const p = state.pieces[move.piece];
    if (!p) return false;
    switch (move.type) {
      case 'rotate': return p.placedAt === null;
      case 'remove': return p.placedAt !== null;
      case 'place':
        return p.placedAt === null &&
          pieceCellsAt(p, move.anchor).every(k => state.board.has(k) && state.board.get(k) === null);
    }
  }

  apply(state: FitState, move: FitMove): GameEvent[] {
    const p = state.pieces[move.piece];
    switch (move.type) {
      case 'rotate':
        p.rotation = (p.rotation + 1) % 6;
        return [{ type: 'rotated', piece: move.piece }];
      case 'remove': {
        const keys = pieceCellsAt(p, p.placedAt!);
        keys.forEach(k => state.board.set(k, null));
        p.placedAt = null;
        return [{ type: 'removed', keys }];
      }
      case 'place': {
        const keys = pieceCellsAt(p, move.anchor);
        keys.forEach(k => state.board.set(k, move.piece));
        p.placedAt = move.anchor;
        state.moves++;
        return [{ type: 'placed', keys }];
      }
    }
  }

  status(state: FitState): GameStatus {
    return state.board.keys().every(k => state.board.get(k) !== null) ? 'won' : 'playing';
  }

  clone(s: FitState): FitState {
    return { ...s, board: s.board.clone(), pieces: s.pieces.map(p => ({ ...p, base: p.base.map(c => ({ ...c })) })) };
  }
}
