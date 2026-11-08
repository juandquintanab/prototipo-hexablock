import { DIRECTIONS, fromPixel, hexagonKeys, key } from '../hex';
import { GridGeometry, LineFamily, nums } from './GridGeometry';
import type { CellKey, Direction, IGridGeometry, Point } from './IGridGeometry';

const S3 = Math.sqrt(3);

/** Hexágonos con punta arriba, coordenadas axiales "q,r". 6 vecinas, 3 ejes, giro de 60°. */
export class HexGeometry extends GridGeometry {
  readonly id = 'hex' as const;
  readonly sides = 6;
  readonly rotationSteps = 6;
  readonly origin = '0,0';
  readonly inradius = S3 / 2;
  readonly pieceScale = 0.86;
  readonly slotScale = 0.9;
  protected readonly pivot = { x: 0, y: 0 };
  protected readonly dirCount = 6;

  protected create(keys: Iterable<CellKey>): IGridGeometry { return new HexGeometry(keys); }

  cells(size: number): CellKey[] { return hexagonKeys(size); }

  adjacent(k: CellKey): CellKey[] {
    const [q, r] = nums(k);
    return DIRECTIONS.map(d => key(q + d.q, r + d.r));
  }

  protected families(): LineFamily[] {
    return [
      { id: k => nums(k)[1], order: k => nums(k)[0] },                    // r constante
      { id: k => nums(k)[0], order: k => nums(k)[1] },                    // q constante
      { id: k => { const [q, r] = nums(k); return -q - r; }, order: k => nums(k)[0] }, // s constante
    ];
  }

  /** Direcciones en este orden: E, NE, NO, O, SO, SE. */
  protected rawStep(k: CellKey, dir: Direction): CellKey | null {
    const d = DIRECTIONS[dir];
    if (!d) return null;
    const [q, r] = nums(k);
    return key(q + d.q, r + d.r);
  }

  center(k: CellKey): Point {
    const [q, r] = nums(k);
    return { x: S3 * (q + r / 2), y: 1.5 * r };
  }

  polygon(k: CellKey): Point[] {
    const c = this.center(k);
    return Array.from({ length: 6 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 3;
      return { x: c.x + Math.cos(a), y: c.y + Math.sin(a) };
    });
  }

  protected candidates(p: Point): CellKey[] {
    const c = fromPixel(p.x, p.y, 1);
    const k = key(c.q, c.r);
    return [k, ...this.adjacent(k)];
  }

  protected canShift(): boolean { return true; }
  protected shift(k: CellKey, from: CellKey, to: CellKey): CellKey {
    const [q, r] = nums(k), [fq, fr] = nums(from), [tq, tr] = nums(to);
    return key(q + tq - fq, r + tr - fr);
  }
}
