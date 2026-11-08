import { HexCoord, HexKey, add, hexagonKeys, keyOf, parse } from '../../hex';
import { HexBoard } from '../../HexBoard';
import type { GameEvent, GameStatus, IGameRules, IPieceSource, IScoringPolicy } from '../../ports';
import { SeededRandom } from '../../random';
import { LINES_SHAPES } from './shapes';

export const LINES_COLORS = ['piece-red', 'piece-orange', 'piece-yellow', 'piece-green', 'piece-teal', 'piece-blue', 'piece-purple', 'piece-pink'] as const;
export type PieceColor = typeof LINES_COLORS[number];

/** Celda de Lines: el color de la ficha o null. */
export type LinesCell = PieceColor | null;
export interface TrayPiece { cells: HexCoord[]; color: PieceColor }
export interface LinesMove { slot: number; anchor: HexKey }

export interface LinesState {
  board: HexBoard<LinesCell>;
  tray: (TrayPiece | null)[];
  score: number;
  /** Jugadas seguidas que limpiaron antes de la actual. */
  streak: number;
  /** Mayor número de líneas limpiadas en una sola jugada. */
  maxCombo: number;
  rng: SeededRandom;
}

export const LINES_RADIUS = 4;
export const TRAY_SIZE = 3;

/** Fuente de piezas al azar según los pesos de la tabla. */
export class LinesPieceSource implements IPieceSource<TrayPiece> {
  constructor(private readonly rng: SeededRandom) {}
  next(): TrayPiece {
    const total = LINES_SHAPES.reduce((a, s) => a + s.weight, 0);
    let roll = this.rng.next() * total;
    let shape = LINES_SHAPES[0];
    for (const s of LINES_SHAPES) { roll -= s.weight; if (roll < 0) { shape = s; break; } }
    return { cells: shape.cells.map(c => ({ ...c })), color: this.rng.pick(LINES_COLORS) };
  }
}

export interface LinesScoreCtx { placed: number; cleared: number; lines: number; streak: number }

/** +1 por celda colocada; al limpiar: celdas × 10 × líneas × (1 + 0.5·racha). */
export class LinesScoring implements IScoringPolicy<LinesScoreCtx> {
  score({ placed, cleared, lines, streak }: LinesScoreCtx): number {
    const clearPts = lines > 0 ? cleared * 10 * lines * (1 + 0.5 * streak) : 0;
    return Math.round(placed + clearPts);
  }
}

export function cellsAt(anchor: HexKey, offsets: HexCoord[]): HexKey[] {
  const a = parse(anchor);
  return offsets.map(o => keyOf(add(a, o)));
}

export function fits(board: HexBoard<LinesCell>, anchor: HexKey, offsets: HexCoord[]): boolean {
  return cellsAt(anchor, offsets).every(k => board.has(k) && board.get(k) === null);
}

export function fitsAnywhere(board: HexBoard<LinesCell>, offsets: HexCoord[]): boolean {
  return board.keys().some(k => fits(board, k, offsets));
}

export class LinesRules implements IGameRules<LinesCell, LinesMove, LinesState> {
  readonly undoLimit = 0;
  private readonly scoring: IScoringPolicy<LinesScoreCtx>;

  constructor(private readonly seed: number, scoring?: IScoringPolicy<LinesScoreCtx>) {
    this.scoring = scoring ?? new LinesScoring();
  }

  init(): LinesState {
    const rng = new SeededRandom(this.seed);
    const state: LinesState = {
      board: new HexBoard<LinesCell>(hexagonKeys(LINES_RADIUS), () => null),
      tray: [], score: 0, streak: 0, maxCombo: 0, rng,
    };
    this.refill(state);
    return state;
  }

  isValid(state: LinesState, move: LinesMove): boolean {
    const p = state.tray[move.slot];
    return !!p && fits(state.board, move.anchor, p.cells);
  }

  apply(state: LinesState, move: LinesMove): GameEvent[] {
    const p = state.tray[move.slot]!;
    const keys = cellsAt(move.anchor, p.cells);
    keys.forEach(k => state.board.set(k, p.color));
    state.tray[move.slot] = null;
    const events: GameEvent[] = [{ type: 'placed', keys }];

    const full = state.board.lines().filter(line => line.every(k => state.board.get(k) !== null));
    const cleared = new Set<HexKey>();
    full.forEach(line => line.forEach(k => cleared.add(k)));
    const points = this.scoring.score({ placed: keys.length, cleared: cleared.size, lines: full.length, streak: state.streak });
    if (full.length) {
      cleared.forEach(k => state.board.set(k, null));
      events.push({ type: 'linesCleared', keys: [...cleared], lines: full.length });
      state.streak += 1;
      state.maxCombo = Math.max(state.maxCombo, full.length);
    } else {
      state.streak = 0;
    }
    state.score += points;
    events.push({ type: 'score', points });

    if (state.tray.every(t => t === null)) { this.refill(state); events.push({ type: 'trayRefilled' }); }
    return events;
  }

  status(state: LinesState): GameStatus {
    const left = state.tray.filter((t): t is TrayPiece => t !== null);
    return left.some(t => fitsAnywhere(state.board, t.cells)) ? 'playing' : 'lost';
  }

  clone(s: LinesState): LinesState {
    return { ...s, board: s.board.clone(), tray: s.tray.map(t => t && { ...t, cells: t.cells.map(c => ({ ...c })) }), rng: s.rng.clone() };
  }

  private refill(state: LinesState): void {
    const src = new LinesPieceSource(state.rng);
    state.tray = Array.from({ length: TRAY_SIZE }, () => src.next());
  }
}
