import { HexBoard } from '../../HexBoard';
import { createGeometry } from '../../geometry/GeometryFactory';
import type { CellKey, IGridGeometry, Shape } from '../../geometry/IGridGeometry';
import { key } from '../../hex';
import type { GameEvent, GameStatus, IGameRules } from '../../ports';
import { generateFitLevels } from './generator';
import { FIT_COLORS, FIT_LEVELS } from './levels';

/** Celda de Fit: el índice de la pieza que la cubre, o null. */
export type FitCell = number | null;

export type FitMove =
  | { type: 'place'; piece: number; anchor: CellKey }
  | { type: 'remove'; piece: number }
  | { type: 'rotate'; piece: number };

export interface FitPiece {
  /** Celdas de la pieza en su orientación original. */
  cells: CellKey[];
  /** Giros de 360°/rotationSteps aplicados. */
  rotation: number;
  color: string;
  /** Celda donde quedó su primera celda (ancla), o null si está en la bandeja. */
  placedAt: CellKey | null;
}

export interface FitState {
  level: number;
  board: HexBoard<FitCell>;
  pieces: FitPiece[];
  /** Piezas colocadas (cuenta para las estrellas). */
  moves: number;
}

export const FIT_TIME_MS = 90_000;
export const FIT_LEVEL_COUNT = 6;

/** Niveles escritos a mano, por figura (PROTOTIPO.md trae los de hexágono). */
const HAND_MADE: Partial<Record<Shape, CellKey[][][]>> = {
  hex: FIT_LEVELS.map(lv => lv.map(p => p.map(([q, r]) => key(q, r)))),
};

/** Niveles de una figura: los escritos a mano si existen; si no, generados con semilla fija. */
export function fitLevels(g: IGridGeometry): CellKey[][][] {
  return HAND_MADE[g.id] ?? generateFitLevels(g);
}

/** Celdas de la pieza con su rotación actual (en una posición cualquiera; cells[0] es la referencia). */
export function pieceShape(g: IGridGeometry, p: FitPiece): CellKey[] {
  return g.rotate(p.cells, p.rotation);
}

/** Celdas que ocupa la pieza con su referencia en el ancla, o null si no se puede trasladar ahí. */
export function pieceCellsAt(g: IGridGeometry, p: FitPiece, anchor: CellKey): CellKey[] | null {
  const shape = pieceShape(g, p);
  return g.translate(shape, shape[0], anchor);
}

/** Estrellas: movimientos ≤ piezas+2 → 3; ≤ piezas+6 → 2; si no 1. −1 (mín. 1) si pasó del tiempo. */
export function fitStars(moves: number, pieces: number, elapsedMs: number): number {
  let s = moves <= pieces + 2 ? 3 : moves <= pieces + 6 ? 2 : 1;
  if (elapsedMs > FIT_TIME_MS) s = Math.max(1, s - 1);
  return s;
}

export class FitRules implements IGameRules<FitCell, FitMove, FitState> {
  readonly undoLimit = Infinity;
  private readonly geometry: IGridGeometry;
  private levelsCache: CellKey[][][] | null = null;

  constructor(shape: Shape = 'hex') {
    this.geometry = createGeometry(shape);
  }

  levels(): CellKey[][][] { return (this.levelsCache ??= fitLevels(this.geometry)); }

  init(level = 1): FitState {
    const def = this.levels()[level - 1];
    const steps = this.geometry.rotationSteps;
    const pieces: FitPiece[] = def.map((cells, i) => ({
      cells: [...cells],
      rotation: (level + i) % steps,
      color: FIT_COLORS[i % FIT_COLORS.length],
      placedAt: null,
    }));
    const figure = this.geometry.withCells(def.flat());
    return { level, board: new HexBoard<FitCell>(figure, () => null), pieces, moves: 0 };
  }

  isValid(state: FitState, move: FitMove): boolean {
    const p = state.pieces[move.piece];
    if (!p) return false;
    switch (move.type) {
      case 'rotate': return p.placedAt === null;
      case 'remove': return p.placedAt !== null;
      case 'place': {
        if (p.placedAt !== null) return false;
        const cells = pieceCellsAt(state.board.geometry, p, move.anchor);
        return !!cells && cells.every(k => state.board.has(k) && state.board.get(k) === null);
      }
    }
  }

  apply(state: FitState, move: FitMove): GameEvent[] {
    const p = state.pieces[move.piece];
    const g = state.board.geometry;
    switch (move.type) {
      case 'rotate':
        p.rotation = (p.rotation + 1) % g.rotationSteps;
        return [{ type: 'rotated', piece: move.piece }];
      case 'remove': {
        const keys = pieceCellsAt(g, p, p.placedAt!)!;
        keys.forEach(k => state.board.set(k, null));
        p.placedAt = null;
        return [{ type: 'removed', keys }];
      }
      case 'place': {
        const keys = pieceCellsAt(g, p, move.anchor)!;
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
    return { ...s, board: s.board.clone(), pieces: s.pieces.map(p => ({ ...p, cells: [...p.cells] })) };
  }
}
