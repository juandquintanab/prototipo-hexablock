import { DIRECTIONS, Direction, toPixel } from '../../domain/hex';

const MIN_SWIPE = 24;

/** Ángulo en pantalla de cada dirección hexagonal (E, NE, NO, O, SO, SE). */
const ANGLES = DIRECTIONS.map(d => { const p = toPixel(d, 1); return Math.atan2(p.y, p.x); });

export function directionOf(dx: number, dy: number): Direction {
  const a = Math.atan2(dy, dx);
  let best = 0, bestDiff = Infinity;
  ANGLES.forEach((b, i) => {
    let diff = Math.abs(a - b);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  });
  return best as Direction;
}

const KEYS: Record<string, Direction> = {
  ArrowRight: 0, ArrowLeft: 3, e: 1, q: 2, z: 4, c: 5,
};

/** Deslizar en 6 direcciones (Merge). Teclado: ← →, Q (NO), E (NE), Z (SO), C (SE). */
export class SwipeController {
  private start: { x: number; y: number; id: number } | null = null;
  private off: (() => void)[] = [];

  constructor(area: HTMLElement, onSwipe: (d: Direction) => void, enabled: () => boolean) {
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      this.start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const up = (e: PointerEvent) => {
      const s = this.start;
      this.start = null;
      if (!s || s.id !== e.pointerId || !enabled()) return;
      const dx = e.clientX - s.x, dy = e.clientY - s.y;
      if (Math.hypot(dx, dy) >= MIN_SWIPE) onSwipe(directionOf(dx, dy));
    };
    const key = (e: KeyboardEvent) => {
      const d = KEYS[e.key] ?? KEYS[e.key.toLowerCase()];
      if (d === undefined || !enabled() || e.repeat) return;
      e.preventDefault();
      onSwipe(d);
    };
    area.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('keydown', key);
    this.off.push(
      () => area.removeEventListener('pointerdown', down),
      () => window.removeEventListener('pointerup', up),
      () => window.removeEventListener('keydown', key),
    );
  }

  destroy(): void { this.off.forEach(f => f()); }
}
