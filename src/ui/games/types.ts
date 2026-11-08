import type { GameId } from '../../design-system/hexablock';
import type { ResultButton, ResultSpec } from '../overlays/Result';
import type { Juice } from './juice';

/** Lo común de toda partida (HUD, tablero, bandeja, pausa, resultado). Lo que varía va en cada GameController. */
export interface GameShell {
  game: GameId;
  level: number;
  root: HTMLElement;
  /** Encima del HUD (barra de tiempo de Fit). */
  top: HTMLElement;
  hudCenter: HTMLElement;
  hudRight: HTMLElement;
  /** Debajo del HUD (barra de metas de Sort). */
  sub: HTMLElement;
  boardWrap: HTMLElement;
  tray: HTMLElement;
  /** Se puede jugar: sin pausa, sin instrucción y sin resultado encima. */
  isActive(): boolean;
  /** Dato central del HUD; si `value` es un número, cuenta hasta él (countUp). */
  setCenter(label: string, value: string | number, small?: string): void;
  /** Termina la partida y muestra el letrero de resultado (confeti si es victoria o `celebrate`, p. ej. récord). */
  end(spec: Omit<ResultSpec, 'secondary'> & { secondary?: ResultButton; celebrate?: boolean }, delayMs?: number): void;
  /** Efectos de la partida (pedacitos, puntos, combo, sacudida, confeti). */
  juice: Juice;
  /** Vuelve a jugar tras el resultado (SEGUIR en Merge). */
  reopen(): void;
  actions: { again(): void; next(): void; map(): void; levels(): void };
}

export interface GameController {
  /** Arranca el reloj, si lo hay (tras la instrucción). */
  onStart?(): void;
  onPause?(paused: boolean): void;
  destroy(): void;
}

export type GameFactory = (shell: GameShell) => GameController;
