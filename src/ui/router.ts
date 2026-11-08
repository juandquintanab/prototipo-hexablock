import * as H from '../design-system/hexablock';
import type { GameId } from '../design-system/hexablock';

export type Route =
  | { name: 'home' }
  | { name: 'map'; open?: GameId }
  | { name: 'levels'; game: 'fit' | 'sort' }
  | { name: 'game'; game: GameId; level?: number }
  | { name: 'settings' }
  | { name: 'catalog' }
  | { name: 'achievements' };

export interface Screen { el: HTMLElement; destroy?(): void }
type Factory = (route: any) => Screen;

let root: HTMLElement;
let current: Screen | null = null;
let currentRoute: Route = { name: 'home' };
let covering = false;
/** Hasta cuándo la cortina sigue destapando la pantalla nueva (performance.now()). */
let revealUntil = 0;
const factories = new Map<Route['name'], Factory>();

/** La cortina tarda unos 650 ms en destaparse (260 ms por ficha + 380 ms de ola). */
const REVEAL_MS = 650;

export function initRouter(container: HTMLElement, screens: Record<Route['name'], Factory>): void {
  root = container;
  for (const [k, f] of Object.entries(screens)) factories.set(k as Route['name'], f);
}

function swap(route: Route): void {
  current?.destroy?.();
  current?.el.remove();
  currentRoute = route;
  current = factories.get(route.name)!(route);
  root.append(current.el);
}

/**
 * Cambia de pantalla: destruye la actual y monta la nueva.
 * Con `curtain`, pasa por la cortina de hexágonos (Transition): la pantalla cambia cuando está tapada.
 */
export function go(route: Route, opts: { curtain?: boolean } = {}): void {
  if (!opts.curtain) { swap(route); return; }
  if (covering) return; // un segundo toque durante la cortina no navega dos veces
  covering = true;
  H.curtain(root, () => {
    swap(route);
    revealUntil = performance.now() + REVEAL_MS;
    covering = false;
  });
}

/** Milisegundos que faltan para que la cortina termine de destapar (0 si no hay cortina). */
export const revealDelay = (): number => Math.max(0, revealUntil - performance.now());

export const route = (): Route => currentRoute;
export const appRoot = (): HTMLElement => root;
