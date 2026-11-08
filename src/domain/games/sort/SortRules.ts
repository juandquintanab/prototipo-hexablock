import { HexKey, hexagonKeys } from '../../hex';
import { HexBoard } from '../../HexBoard';
import type { GameEvent, GameStatus, IGameRules, IPieceSource } from '../../ports';
import { SeededRandom } from '../../random';
import { SORT_LEVELS, SORT_PALETTE } from './levels';

/** Celda de Sort: una pila de colores, de abajo hacia arriba. Vacía = []. */
export type ColorStack = string[];
export interface SortMove { slot: number; key: HexKey }

export interface SortState {
  board: HexBoard<ColorStack>;
  tray: (ColorStack | null)[];
  level: number;
  goals: number;
  goalsDone: number;
  /** Pilas colocadas (para las estrellas). */
  moves: number;
  colors: string[];
  rng: SeededRandom;
}

export const SORT_RADIUS = 2;
export const SORT_CLEAR_AT = 10;
export const SORT_TRAY = 3;

export const topColor = (s: ColorStack): string | undefined => s[s.length - 1];
export function topRun(s: ColorStack): number {
  if (!s.length) return 0;
  const c = topColor(s);
  let n = 0;
  for (let i = s.length - 1; i >= 0 && s[i] === c; i--) n++;
  return n;
}

/** Pilas al azar: 2–6 fichas en 1–3 grupos de colores del nivel. */
export class StackSource implements IPieceSource<ColorStack> {
  constructor(private readonly rng: SeededRandom, private readonly colors: readonly string[]) {}
  next(): ColorStack {
    const n = 2 + this.rng.int(5);
    const groups = Math.min(n, 1 + this.rng.int(3), this.colors.length);
    // reparte n fichas en `groups` partes positivas
    const sizes = Array(groups).fill(1);
    for (let i = groups; i < n; i++) sizes[this.rng.int(groups)]++;
    const out: ColorStack = [];
    let prev = '';
    for (const size of sizes) {
      const options = this.colors.filter(c => c !== prev);
      const c = this.rng.pick(options);
      for (let i = 0; i < size; i++) out.push(c);
      prev = c;
    }
    return out;
  }
}

/** Estrellas: par = metas × 5 movimientos. */
export function sortStars(moves: number, goals: number): number {
  const par = goals * 5;
  return moves <= par ? 3 : moves <= par * 1.5 ? 2 : 1;
}

export class SortRules implements IGameRules<ColorStack, SortMove, SortState> {
  readonly undoLimit = 0;
  constructor(private readonly seed: number) {}

  init(level = 1): SortState {
    const def = SORT_LEVELS[level - 1];
    const rng = new SeededRandom(this.seed);
    const colors = SORT_PALETTE.slice(0, def.colors) as string[];
    const state: SortState = {
      board: new HexBoard<ColorStack>(hexagonKeys(SORT_RADIUS), () => []),
      tray: [], level, goals: def.goals, goalsDone: 0, moves: 0, colors, rng,
    };
    const src = new StackSource(rng, colors);
    const free = state.board.keys();
    for (let i = 0; i < def.initialStacks; i++) {
      const k = free.splice(rng.int(free.length), 1)[0];
      state.board.set(k, src.next());
    }
    this.refill(state);
    return state;
  }

  isValid(state: SortState, move: SortMove): boolean {
    return !!state.tray[move.slot] && state.board.has(move.key) && state.board.get(move.key).length === 0;
  }

  apply(state: SortState, move: SortMove): GameEvent[] {
    const stack = state.tray[move.slot]!;
    state.tray[move.slot] = null;
    state.board.set(move.key, [...stack]);
    state.moves++;
    const events: GameEvent[] = [{ type: 'placed', keys: [move.key] }];
    events.push(...this.resolve(state, move.key));
    if (state.tray.every(t => t === null)) { this.refill(state); events.push({ type: 'trayRefilled' }); }
    return events;
  }

  /** Cascada: las rachas iguales se juntan en la pila con racha más larga. */
  resolve(state: SortState, start: HexKey): GameEvent[] {
    const b = state.board;
    const events: GameEvent[] = [];
    const queue: HexKey[] = [start];
    while (queue.length) {
      const k = queue.shift()!;
      let again = true;
      while (again) {
        again = false;
        const here = b.get(k);
        if (!here.length) break;
        for (const n of b.neighbors(k)) {
          const there = b.get(n);
          if (!there.length || topColor(there) !== topColor(here)) continue;
          const rk = topRun(here), rn = topRun(there);
          // de la racha más corta a la más larga; empate: hacia la celda que se procesa
          const [from, to, count] = rn > rk ? [k, n, rk] : [n, k, rn];
          const src = b.get(from), dst = b.get(to);
          dst.push(...src.splice(src.length - count, count));
          events.push({ type: 'transferred', from, to, count });
          const run = topRun(dst);
          if (run >= SORT_CLEAR_AT) {
            dst.splice(dst.length - run, run);
            state.goalsDone++;
            events.push({ type: 'stackCleared', key: to, count: run });
          }
          for (const c of [from, to]) if (c !== k && !queue.includes(c)) queue.push(c);
          if (!queue.includes(k)) queue.push(k);
          again = true;
          break;
        }
      }
    }
    return events;
  }

  status(state: SortState): GameStatus {
    if (state.goalsDone >= state.goals) return 'won';
    return state.board.keys().some(k => state.board.get(k).length === 0) ? 'playing' : 'lost';
  }

  clone(s: SortState): SortState {
    return { ...s, board: s.board.clone(c => [...c]), tray: s.tray.map(t => t && [...t]), colors: [...s.colors], rng: s.rng.clone() };
  }

  private refill(state: SortState): void {
    const src = new StackSource(state.rng, state.colors);
    state.tray = Array.from({ length: SORT_TRAY }, () => src.next());
  }
}
