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
const factories = new Map<Route['name'], Factory>();

export function initRouter(container: HTMLElement, screens: Record<Route['name'], Factory>): void {
  root = container;
  for (const [k, f] of Object.entries(screens)) factories.set(k as Route['name'], f);
}

/** Cambia de pantalla: destruye la actual y monta la nueva. */
export function go(route: Route): void {
  current?.destroy?.();
  current?.el.remove();
  currentRoute = route;
  current = factories.get(route.name)!(route);
  root.append(current.el);
}

export const route = (): Route => currentRoute;
export const appRoot = (): HTMLElement => root;
