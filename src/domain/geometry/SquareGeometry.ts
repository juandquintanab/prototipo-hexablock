import { GridGeometry, LineFamily, hexCount, nums, z } from './GridGeometry';
import type { CellKey, Direction, IGridGeometry, Point } from './IGridGeometry';

const SIDE = Math.sqrt(3); // mismo ancho que un hexágono de radio 1
const k2 = (x: number, y: number): CellKey => `${z(x)},${z(y)}`;

/** Cuadrados "x,y" (y hacia abajo). 4 vecinas, filas y columnas, 4 direcciones, giro de 90°. */
export class SquareGeometry extends GridGeometry {
  readonly id = 'square' as const;
  readonly sides = 4;
  readonly rotationSteps = 4;
  readonly origin = '0,0';
  readonly inradius = SIDE / 2;
  readonly pieceScale = 0.86;
  readonly slotScale = 0.9;
  protected readonly pivot = { x: 0, y: 0 };
  protected readonly dirCount = 4;

  protected create(keys: Iterable<CellKey>): IGridGeometry { return new SquareGeometry(keys); }

  /** Lado n×n con n ≈ √(celdas del hexágono): radio 2 → 4×4 (el 2048 clásico), radio 4 → 8×8. */
  cells(size: number): CellKey[] {
    const n = Math.round(Math.sqrt(hexCount(size)));
    const start = -Math.floor(n / 2);
    const out: CellKey[] = [];
    for (let y = start; y < start + n; y++) for (let x = start; x < start + n; x++) out.push(k2(x, y));
    return out;
  }

  adjacent(k: CellKey): CellKey[] {
    const [x, y] = nums(k);
    return [k2(x + 1, y), k2(x, y + 1), k2(x - 1, y), k2(x, y - 1)];
  }

  protected families(): LineFamily[] {
    return [
      { id: k => nums(k)[1], order: k => nums(k)[0] }, // filas
      { id: k => nums(k)[0], order: k => nums(k)[1] }, // columnas
    ];
  }

  /** 0 → E, 1 → O, 2 → S, 3 → N. */
  protected rawStep(k: CellKey, dir: Direction): CellKey | null { return this.stripStep(k, dir); }

  center(k: CellKey): Point {
    const [x, y] = nums(k);
    return { x: x * SIDE, y: y * SIDE };
  }

  polygon(k: CellKey): Point[] {
    const c = this.center(k), h = SIDE / 2;
    return [{ x: c.x - h, y: c.y - h }, { x: c.x + h, y: c.y - h }, { x: c.x + h, y: c.y + h }, { x: c.x - h, y: c.y + h }];
  }

  protected candidates(p: Point): CellKey[] {
    const k = k2(Math.round(p.x / SIDE), Math.round(p.y / SIDE));
    return [k, ...this.adjacent(k)];
  }

  protected canShift(): boolean { return true; }
  protected shift(k: CellKey, from: CellKey, to: CellKey): CellKey {
    const [x, y] = nums(k), [fx, fy] = nums(from), [tx, ty] = nums(to);
    return k2(x + tx - fx, y + ty - fy);
  }
}
