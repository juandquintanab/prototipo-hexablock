import { GridGeometry, LineFamily, hexCount, nums, z } from './GridGeometry';
import type { CellKey, IGridGeometry, Point } from './IGridGeometry';

/**
 * Teselado Cairo: pentágonos congruentes.
 * Se arma sobre una cuadrícula de cuadrados de lado 1. Cada cuadrado lleva un segmento por el centro
 * (horizontal si x+y es par, vertical si es impar) unido a sus esquinas; cada pentágono es la mitad
 * de un cuadrado más el triángulo vecino del cuadrado de al lado. Dos pentágonos por cuadrado: "x,y,i".
 * Con t = (√7 − 1)/6 los cinco lados miden lo mismo.
 * 5 vecinas; sin líneas rectas ni direcciones; giro de 90° alrededor de un vértice de la cuadrícula.
 */
const T = (Math.sqrt(7) - 1) / 6;
const SCALE = 2.2; // área parecida a la de un hexágono de radio 1
const k3 = (x: number, y: number, i: number): CellKey => `${z(x)},${z(y)},${i}`;
const isEven = (x: number, y: number): boolean => (((x + y) % 2) + 2) % 2 === 0;

/** Vértices en unidades de la cuadrícula, en orden alrededor del pentágono. */
function corners(x: number, y: number, i: number): [number, number][] {
  if (isEven(x, y)) {
    const L: [number, number] = [x + 0.5 - T, y + 0.5], R: [number, number] = [x + 0.5 + T, y + 0.5];
    return i === 0
      ? [L, [x, y], [x + 0.5, y - 0.5 + T], [x + 1, y], R]           // mitad de arriba + punta del cuadrado de arriba
      : [L, R, [x + 1, y + 1], [x + 0.5, y + 1.5 - T], [x, y + 1]];   // mitad de abajo + punta del de abajo
  }
  const Tp: [number, number] = [x + 0.5, y + 0.5 - T], Bp: [number, number] = [x + 0.5, y + 0.5 + T];
  return i === 0
    ? [Tp, [x, y], [x - 0.5 + T, y + 0.5], [x, y + 1], Bp]            // mitad izquierda + punta del de la izquierda
    : [Tp, [x + 1, y], [x + 1.5 - T, y + 0.5], [x + 1, y + 1], Bp];   // mitad derecha + punta del de la derecha
}

export class PentagonGeometry extends GridGeometry {
  readonly id = 'pent' as const;
  readonly sides = 5;
  readonly rotationSteps = 4;
  readonly origin = '0,0,0';
  readonly inradius = 0.37 * SCALE;
  readonly pieceScale = 0.88;
  readonly slotScale = 0.92;
  protected readonly pivot = { x: 0, y: 0 };
  protected readonly dirCount = 0;

  protected create(keys: Iterable<CellKey>): IGridGeometry { return new PentagonGeometry(keys); }

  /** k×k cuadrados (2 pentágonos cada uno) con 2k² ≈ celdas del hexágono de radio `size`. */
  cells(size: number): CellKey[] {
    const k = Math.max(2, Math.round(Math.sqrt(hexCount(size) / 2)));
    const start = -Math.floor(k / 2);
    const out: CellKey[] = [];
    for (let y = start; y < start + k; y++) for (let x = start; x < start + k; x++) out.push(k3(x, y, 0), k3(x, y, 1));
    return out;
  }

  adjacent(k: CellKey): CellKey[] {
    const [x, y, i] = nums(k);
    if (isEven(x, y)) {
      return i === 0
        ? [k3(x - 1, y, 1), k3(x, y - 1, 0), k3(x, y - 1, 1), k3(x + 1, y, 0), k3(x, y, 1)]
        : [k3(x, y, 0), k3(x + 1, y, 0), k3(x, y + 1, 1), k3(x, y + 1, 0), k3(x - 1, y, 1)];
    }
    return i === 0
      ? [k3(x, y - 1, 1), k3(x - 1, y, 0), k3(x - 1, y, 1), k3(x, y + 1, 0), k3(x, y, 1)]
      : [k3(x, y - 1, 1), k3(x + 1, y, 0), k3(x + 1, y, 1), k3(x, y + 1, 0), k3(x, y, 0)];
  }

  protected families(): LineFamily[] { return []; }
  protected rawStep(): null { return null; }

  polygon(k: CellKey): Point[] {
    const [x, y, i] = nums(k);
    return corners(x, y, i).map(([px, py]) => ({ x: px * SCALE, y: py * SCALE }));
  }

  center(k: CellKey): Point {
    const p = this.polygon(k);
    return { x: p.reduce((a, q) => a + q.x, 0) / p.length, y: p.reduce((a, q) => a + q.y, 0) / p.length };
  }

  protected candidates(p: Point): CellKey[] {
    const sx = Math.floor(p.x / SCALE), sy = Math.floor(p.y / SCALE);
    const out: CellKey[] = [];
    for (let y = sy - 1; y <= sy + 1; y++) for (let x = sx - 1; x <= sx + 1; x++) out.push(k3(x, y, 0), k3(x, y, 1));
    return out;
  }

  /** La traslación debe conservar la paridad del cuadrado y la mitad (i). */
  protected canShift(from: CellKey, to: CellKey): boolean {
    const [fx, fy, fi] = nums(from), [tx, ty, ti] = nums(to);
    return fi === ti && isEven(fx, fy) === isEven(tx, ty);
  }
  protected shift(k: CellKey, from: CellKey, to: CellKey): CellKey {
    const [x, y, i] = nums(k), [fx, fy] = nums(from), [tx, ty] = nums(to);
    return k3(x + tx - fx, y + ty - fy, i);
  }
}
