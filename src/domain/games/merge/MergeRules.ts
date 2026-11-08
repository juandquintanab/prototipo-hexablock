import { DIRECTIONS, Direction, HexKey, add, hexagonKeys, keyOf, parse, sOf } from '../../hex';
import { HexBoard } from '../../HexBoard';
import type { GameEvent, GameStatus, IGameRules } from '../../ports';
import { SeededRandom } from '../../random';

/** Celda de Merge: el número de la ficha (0 = vacía). */
export type MergeCell = number;
export type MergeMove = Direction;

export interface MergeState {
  board: HexBoard<MergeCell>;
  score: number;
  maxTile: number;
  /** Valor de la próxima ficha (se muestra en la bandeja). */
  next: number;
  rng: SeededRandom;
  /** El jugador eligió SEGUIR tras el 2048. */
  keepPlaying: boolean;
}

export const MERGE_RADIUS = 2;
export const MERGE_GOAL = 2048;

interface SlideResult { board: HexBoard<MergeCell>; events: GameEvent[]; gained: number; changed: boolean }

/** Desliza todas las fichas en una dirección. Función pura sobre una copia. */
export function slide(source: HexBoard<MergeCell>, dir: Direction): SlideResult {
  const board = source.clone();
  const d = DIRECTIONS[dir];
  const ds = sOf(d);
  // la más avanzada en esa dirección primero (producto con coordenadas cúbicas)
  const progress = (k: HexKey) => { const c = parse(k); return c.q * d.q + c.r * d.r + sOf(c) * ds; };
  const order = board.keys().filter(k => board.get(k) !== 0).sort((a, b) => progress(b) - progress(a));
  const merged = new Set<HexKey>();
  const events: GameEvent[] = [];
  let gained = 0, changed = false;

  for (const from of order) {
    const value = board.get(from);
    let at = from;
    for (;;) {
      const nk = keyOf(add(parse(at), d));
      if (!board.has(nk)) break;
      const other = board.get(nk);
      if (other === 0) { at = nk; continue; }
      if (other === value && !merged.has(nk)) {
        board.set(from, 0);
        board.set(nk, value * 2);
        merged.add(nk);
        gained += value * 2;
        events.push({ type: 'moved', from, to: nk }, { type: 'merged', key: nk, value: value * 2 });
        changed = true;
        at = '' as HexKey;
      }
      break;
    }
    if (at && at !== from) {
      board.set(from, 0);
      board.set(at, value);
      events.push({ type: 'moved', from, to: at });
      changed = true;
    }
  }
  return { board, events, gained, changed };
}

export class MergeRules implements IGameRules<MergeCell, MergeMove, MergeState> {
  readonly undoLimit = 1;
  constructor(private readonly seed: number) {}

  init(): MergeState {
    const rng = new SeededRandom(this.seed);
    const state: MergeState = {
      board: new HexBoard<MergeCell>(hexagonKeys(MERGE_RADIUS), () => 0),
      score: 0, maxTile: 0, next: 0, rng, keepPlaying: false,
    };
    state.next = this.rollValue(rng);
    this.spawn(state);
    this.spawn(state);
    return state;
  }

  isValid(state: MergeState, move: MergeMove): boolean {
    return slide(state.board, move).changed;
  }

  apply(state: MergeState, move: MergeMove): GameEvent[] {
    const res = slide(state.board, move);
    if (!res.changed) return [];
    state.board = res.board;
    state.score += res.gained;
    const events = [...res.events];
    if (res.gained) events.push({ type: 'score', points: res.gained });
    const sp = this.spawn(state);
    if (sp) events.push(sp);
    return events;
  }

  status(state: MergeState): GameStatus {
    if (state.maxTile >= MERGE_GOAL && !state.keepPlaying) return 'won';
    for (let d = 0; d < 6; d++) if (slide(state.board, d as Direction).changed) return 'playing';
    return 'lost';
  }

  /** SEGUIR tras el 2048. */
  continueAfterWin(state: MergeState): void { state.keepPlaying = true; }

  clone(s: MergeState): MergeState {
    return { ...s, board: s.board.clone(), rng: s.rng.clone() };
  }

  /** Coloca la ficha "next" en una celda vacía al azar y sortea la siguiente. */
  private spawn(state: MergeState): GameEvent | null {
    const empty = state.board.keys().filter(k => state.board.get(k) === 0);
    state.maxTile = Math.max(state.maxTile, ...state.board.keys().map(k => state.board.get(k)));
    if (!empty.length) return null;
    const k = state.rng.pick(empty);
    const value = state.next;
    state.board.set(k, value);
    state.maxTile = Math.max(state.maxTile, value);
    state.next = this.rollValue(state.rng);
    return { type: 'spawned', key: k, value };
  }

  private rollValue(rng: SeededRandom): number { return rng.next() < 0.9 ? 2 : 4; }
}
