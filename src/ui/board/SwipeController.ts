import type { Direction, IGridGeometry } from '../../domain/geometry/IGridGeometry';

const MIN_SWIPE = 24;

/**
 * Ángulo en pantalla de cada dirección de la geometría: se mide dando dos pasos desde una celda
 * (en triángulos un paso zigzaguea; dos pasos siguen la franja en línea recta).
 */
export function directionAngles(g: IGridGeometry): number[] {
  const angle = (from: string, to: string) => {
    const p = g.center(from), q = g.center(to);
    return Math.atan2(q.y - p.y, q.x - p.x);
  };
  return g.directions().map(d => {
    let oneStep: number | null = null;
    for (const k of g.keys()) {
      const a = g.step(k, d);
      if (!a) continue;
      const b = g.step(a, d);
      if (b) return angle(k, b);
      oneStep ??= angle(k, a);
    }
    return oneStep ?? 0;
  });
}

const angleDiff = (a: number, b: number) => { const d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };

export function nearestDirection(angles: number[], a: number): Direction {
  let best = 0, bestDiff = Infinity;
  angles.forEach((b, i) => { const diff = angleDiff(a, b); if (diff < bestDiff) { bestDiff = diff; best = i; } });
  return best;
}

/** Teclas → ángulo en pantalla (y hacia abajo). */
const KEY_ANGLES: Record<string, number> = {
  arrowright: 0, arrowleft: Math.PI, arrowup: -Math.PI / 2, arrowdown: Math.PI / 2,
  e: -Math.PI / 3, q: (-2 * Math.PI) / 3, z: (2 * Math.PI) / 3, c: Math.PI / 3,
};

/** Deslizar en las direcciones de la geometría (Merge). Teclado: flechas y Q, E, Z, C. */
export class SwipeController {
  private start: { x: number; y: number; id: number } | null = null;
  private off: (() => void)[] = [];

  constructor(area: HTMLElement, geometry: IGridGeometry, onSwipe: (d: Direction) => void, enabled: () => boolean) {
    const angles = directionAngles(geometry);
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      this.start = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const up = (e: PointerEvent) => {
      const s = this.start;
      this.start = null;
      if (!s || s.id !== e.pointerId || !enabled()) return;
      const dx = e.clientX - s.x, dy = e.clientY - s.y;
      if (Math.hypot(dx, dy) >= MIN_SWIPE) onSwipe(nearestDirection(angles, Math.atan2(dy, dx)));
    };
    const key = (e: KeyboardEvent) => {
      const a = KEY_ANGLES[e.key.toLowerCase()];
      if (a === undefined || !enabled() || e.repeat) return;
      e.preventDefault();
      onSwipe(nearestDirection(angles, a));
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
