import { GridGeometry, LineFamily, hexCount, nums, z } from './GridGeometry';
import type { CellKey, Direction, IGridGeometry, Point } from './IGridGeometry';

// Mismas medidas que cellGeom('tri') del sistema de diseño con celda 1.
const SIDE = 1.25 * Math.sqrt(3);
const HH = (SIDE * Math.sqrt(3)) / 2; // alto de una fila
const k2 = (a: number, b: number): CellKey => `${z(a)},${z(b)}`;
const isUp = (a: number, b: number): boolean => (((a + b) % 2) + 2) % 2 === 0;

/**
 * Triángulos "a,b" (columna, fila) que alternan punta arriba y punta abajo.
 * 3 vecinas (izquierda, derecha y la del lado horizontal). Las líneas son las 3 franjas
 * (filas y dos diagonales en zigzag). 6 direcciones (las franjas en ambos sentidos). Giro de 120°.
 */
export class TriangleGeometry extends GridGeometry {
  readonly id = 'tri' as const;
  readonly sides = 3;
  readonly rotationSteps = 3;
  readonly origin = '0,0';
  readonly inradius = SIDE / (2 * Math.sqrt(3));
  readonly pieceScale = 0.8;
  readonly slotScale = 0.86;
  /** Un vértice del teselado: centro de simetría de 120°. */
  protected readonly pivot = { x: SIDE / 2, y: 0 };
  protected readonly dirCount = 6;

  protected create(keys: Iterable<CellKey>): IGridGeometry { return new TriangleGeometry(keys); }

  /** Hexágono de triángulos de lado n alrededor de un vértice (6n² celdas ≈ las del hexágono de radio `size`). */
  cells(size: number): CellKey[] {
    const n = Math.max(1, Math.round(Math.sqrt(hexCount(size) / 6)));
    const cx = ((n + 1) * SIDE) / 2, cy = n * HH, R = n * SIDE, eps = 1e-6;
    const out: CellKey[] = [];
    for (let b = 0; b < 2 * n; b++) {
      for (let a = -2 * n - 2; a <= 4 * n + 2; a++) {
        const c = this.center(k2(a, b)), dx = Math.abs(c.x - cx), dy = Math.abs(c.y - cy);
        if (dy <= (R * Math.sqrt(3)) / 2 + eps && Math.sqrt(3) * dx + dy <= Math.sqrt(3) * R + eps) out.push(k2(a, b));
      }
    }
    return out;
  }

  adjacent(k: CellKey): CellKey[] {
    const [a, b] = nums(k);
    return [k2(a - 1, b), k2(a + 1, b), isUp(a, b) ? k2(a, b + 1) : k2(a, b - 1)];
  }

  protected families(): LineFamily[] {
    const up = (k: CellKey) => { const [a, b] = nums(k); return isUp(a, b); };
    return [
      { id: k => nums(k)[1], order: k => nums(k)[0] },                                                   // filas
      { id: k => { const [a, b] = nums(k); return a - b + (up(k) ? 0 : 1); }, order: k => { const [a, b] = nums(k); return b * 1000 + a; } }, // "\"
      { id: k => { const [a, b] = nums(k); return a + b + (up(k) ? 2 : 1); }, order: k => { const [a, b] = nums(k); return b * 1000 - a; } }, // "/"
    ];
  }

  protected rawStep(k: CellKey, dir: Direction): CellKey | null { return this.stripStep(k, dir); }

  center(k: CellKey): Point {
    const [a, b] = nums(k);
    const top = b * HH, x = (a * SIDE) / 2 + SIDE / 2;
    return { x, y: isUp(a, b) ? top + (2 * HH) / 3 : top + HH / 3 };
  }

  polygon(k: CellKey): Point[] {
    const [a, b] = nums(k);
    const top = b * HH, x = (a * SIDE) / 2 + SIDE / 2;
    return isUp(a, b)
      ? [{ x, y: top }, { x: x + SIDE / 2, y: top + HH }, { x: x - SIDE / 2, y: top + HH }]
      : [{ x: x - SIDE / 2, y: top }, { x: x + SIDE / 2, y: top }, { x, y: top + HH }];
  }

  protected candidates(p: Point): CellKey[] {
    const b0 = Math.floor(p.y / HH), a0 = Math.round((2 * p.x) / SIDE - 1);
    const out: CellKey[] = [];
    for (let b = b0 - 1; b <= b0 + 1; b++) for (let a = a0 - 2; a <= a0 + 2; a++) out.push(k2(a, b));
    return out;
  }

  /** Una traslación conserva si el triángulo apunta arriba o abajo. */
  protected canShift(from: CellKey, to: CellKey): boolean {
    const [fa, fb] = nums(from), [ta, tb] = nums(to);
    return isUp(fa, fb) === isUp(ta, tb);
  }
  protected shift(k: CellKey, from: CellKey, to: CellKey): CellKey {
    const [a, b] = nums(k), [fa, fb] = nums(from), [ta, tb] = nums(to);
    return k2(a + ta - fa, b + tb - fb);
  }
}
