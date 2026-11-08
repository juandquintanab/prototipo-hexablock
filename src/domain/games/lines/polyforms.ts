import type { CellKey, IGridGeometry } from '../../geometry/IGridGeometry';
import type { IRandom } from '../../ports';

const pick = <T>(rng: IRandom, list: readonly T[]): T => list[Math.floor(rng.next() * list.length)];

/**
 * Poliforma conexa de `size` celdas en cualquier geometría: empieza en el origen y agrega
 * una vecina al azar del borde hasta llegar al tamaño. Mismo generador para las cuatro figuras.
 */
export function randomPolyform(g: IGridGeometry, size: number, rng: IRandom): CellKey[] {
  const cells: CellKey[] = [g.origin];
  const inShape = new Set(cells);
  while (cells.length < size) {
    const frontier = [...new Set(cells.flatMap(k => g.adjacent(k)))].filter(k => !inShape.has(k));
    const next = pick(rng, frontier);
    cells.push(next);
    inShape.add(next);
  }
  return cells;
}

/** Tamaño de pieza al azar: de 1 a 5 celdas, las de 1–3 más frecuentes. */
export const SIZE_WEIGHTS: [size: number, weight: number][] = [[1, 10], [2, 16], [3, 18], [4, 8], [5, 3]];

export function randomSize(rng: IRandom): number {
  const total = SIZE_WEIGHTS.reduce((a, [, w]) => a + w, 0);
  let roll = rng.next() * total;
  for (const [s, w] of SIZE_WEIGHTS) { roll -= w; if (roll < 0) return s; }
  return 1;
}
