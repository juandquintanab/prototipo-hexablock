import type { GameEvent, GameStatus, IGameRules } from './ports';

export type Listener = (e: GameEvent) => void;

/** Orquesta un juego cualquiera: valida, aplica, guarda historia y avisa a los oyentes (Observer). */
export class GameEngine<TCell, TMove, TState> {
  private _state!: TState;
  private past: TState[] = [];
  private future: TState[] = [];
  private listeners = new Set<Listener>();

  constructor(private readonly rules: IGameRules<TCell, TMove, TState>) {}

  get state(): TState { return this._state; }
  get status(): GameStatus { return this.rules.status(this._state); }
  get canUndo(): boolean { return this.past.length > 0; }
  get canRedo(): boolean { return this.future.length > 0; }

  start(level?: number): void {
    this._state = this.rules.init(level);
    this.past = [];
    this.future = [];
  }

  isValid(move: TMove): boolean {
    return this.status === 'playing' && this.rules.isValid(this._state, move);
  }

  play(move: TMove): boolean {
    if (!this.isValid(move)) return false;
    const before = this.rules.undoLimit > 0 ? this.rules.clone(this._state) : null;
    const events = this.rules.apply(this._state, move);
    if (before) {
      this.past.push(before);
      if (this.past.length > this.rules.undoLimit) this.past.shift();
      this.future = [];
    }
    const st = this.status;
    if (st === 'won') events.push({ type: 'won' });
    if (st === 'lost') events.push({ type: 'lost' });
    events.forEach(e => this.emit(e));
    return true;
  }

  undo(): boolean {
    const prev = this.past.pop();
    if (prev === undefined) return false;
    this.future.push(this.rules.clone(this._state));
    this._state = prev;
    return true;
  }

  redo(): boolean {
    const next = this.future.pop();
    if (next === undefined) return false;
    this.past.push(this.rules.clone(this._state));
    this._state = next;
    return true;
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private emit(e: GameEvent): void { this.listeners.forEach(l => l(e)); }
}
