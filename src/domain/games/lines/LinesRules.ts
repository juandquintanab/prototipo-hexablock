import { HexBoard } from '../../HexBoard';
import { boardGeometry } from '../../geometry/GeometryFactory';
import type { CellKey, IGridGeometry } from '../../geometry/IGridGeometry';
import type { GameEvent, GameStatus, IGameRules, IPieceSource, IScoringPolicy } from '../../ports';
import { SeededRandom } from '../../random';
import { randomPolyform, randomSize } from './polyforms';

export const LINES_COLORS = ['piece-red', 'piece-orange', 'piece-yellow', 'piece-green', 'piece-teal', 'piece-blue', 'piece-purple', 'piece-pink'] as const;
export type PieceColor = typeof LINES_COLORS[number];

/** Celda de Lines: el color de la ficha o null. */
export type LinesCell = PieceColor | null;
/** Pieza de la bandeja: sus celdas en una posición cualquiera; se coloca trasladando cells[0] al ancla. */
export interface TrayPiece { cells: CellKey[]; color: PieceColor }
export interface LinesMove { slot: number; anchor: CellKey }

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

/** Fuente de piezas: poliformas conexas de 1 a 5 celdas de la geometría del tablero. */
export class LinesPieceSource implements IPieceSource<TrayPiece> {
  constructor(private readonly rng: SeededRandom, private readonly geometry: IGridGeometry) {}
  next(): TrayPiece {
    const cells = randomPolyform(this.geometry, randomSize(this.rng), this.rng);
    return { cells, color: this.rng.pick(LINES_COLORS) };
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

/** Celdas que ocupa la pieza con su primera celda en el ancla (null si la geometría no lo permite). */
export function cellsAt(g: IGridGeometry, piece: CellKey[], anchor: CellKey): CellKey[] | null {
  return g.translate(piece, piece[0], anchor);
}

export function fits(board: HexBoard<LinesCell>, anchor: CellKey, piece: CellKey[]): boolean {
  const cells = cellsAt(board.geometry, piece, anchor);
  return !!cells && cells.every(k => board.has(k) && board.get(k) === null);
}

export function fitsAnywhere(board: HexBoard<LinesCell>, piece: CellKey[]): boolean {
  return board.keys().some(k => fits(board, k, piece));
}

export class LinesRules implements IGameRules<LinesCell, LinesMove, LinesState> {
  readonly undoLimit = 0;
  private readonly scoring: IScoringPolicy<LinesScoreCtx>;

  constructor(
    private readonly seed: number,
    private readonly geometry: IGridGeometry = boardGeometry('hex', LINES_RADIUS),
    scoring?: IScoringPolicy<LinesScoreCtx>,
  ) {
    this.scoring = scoring ?? new LinesScoring();
  }

  init(): LinesState {
    const rng = new SeededRandom(this.seed);
    const state: LinesState = {
      board: new HexBoard<LinesCell>(this.geometry, () => null),
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
    const keys = cellsAt(state.board.geometry, p.cells, move.anchor)!;
    keys.forEach(k => state.board.set(k, p.color));
    state.tray[move.slot] = null;
    const events: GameEvent[] = [{ type: 'placed', keys }];

    const full = state.board.lines().filter(line => line.every(k => state.board.get(k) !== null));
    const cleared = new Set<CellKey>();
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
    return { ...s, board: s.board.clone(), tray: s.tray.map(t => t && { ...t, cells: [...t.cells] }), rng: s.rng.clone() };
  }

  private refill(state: LinesState): void {
    const src = new LinesPieceSource(state.rng, this.geometry);
    state.tray = Array.from({ length: TRAY_SIZE }, () => src.next());
  }
}
