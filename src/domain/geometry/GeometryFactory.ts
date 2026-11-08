import { HexGeometry } from './HexGeometry';
import type { IGridGeometry, Shape } from './IGridGeometry';
import { PentagonGeometry } from './PentagonGeometry';
import { SquareGeometry } from './SquareGeometry';
import { TriangleGeometry } from './TriangleGeometry';

export const SHAPES: Shape[] = ['tri', 'square', 'pent', 'hex'];

/** Factory Method: la única parte del código que sabe qué clase corresponde a cada figura. */
const CREATORS: Record<Shape, () => IGridGeometry> = {
  hex: () => new HexGeometry(),
  square: () => new SquareGeometry(),
  tri: () => new TriangleGeometry(),
  pent: () => new PentagonGeometry(),
};

/** Teselado infinito de esa figura (para generar piezas). */
export function createGeometry(shape: Shape): IGridGeometry {
  return CREATORS[shape]();
}

/** Tablero estándar de esa figura con la cantidad de celdas de un hexágono de radio `size`. */
export function boardGeometry(shape: Shape, size: number): IGridGeometry {
  const g = createGeometry(shape);
  return g.withCells(g.cells(size));
}

/** Lo que la figura permite, deducido de la geometría (no de su nombre). */
export function capabilities(shape: Shape): { lines: boolean; directions: boolean } {
  const g = boardGeometry(shape, 2);
  return { lines: g.lines().length > 0, directions: g.directions().length > 0 };
}
