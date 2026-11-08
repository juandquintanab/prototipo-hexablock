/** Clave de celda: "q,r" (hexágono), "x,y" (cuadrado), "a,b" (triángulo) o "x,y,i" (pentágono). */
export type CellKey = string;
/** Índice de dirección (0..directions().length-1). */
export type Direction = number;
export type Shape = 'tri' | 'square' | 'pent' | 'hex';
export interface Point { x: number; y: number }

/**
 * Geometría de un tablero (Factory Method: GeometryFactory crea la que corresponde a la figura).
 * Las reglas de los juegos solo hablan con esta interfaz: ninguna pregunta qué figura es.
 * Una instancia "acotada" (withCells) conoce sus celdas; sin acotar representa el teselado infinito.
 */
export interface IGridGeometry {
  readonly id: Shape;
  /** Lados de cada celda (para dibujar fichas, mascota y botones con la misma figura). */
  readonly sides: number;
  /** Giros que completan una vuelta (6 → 60°, 4 → 90°, 3 → 120°). */
  readonly rotationSteps: number;
  /** Celda de referencia para crear piezas. */
  readonly origin: CellKey;
  /** Radio interior relativo (para el tamaño de números dentro de la celda). */
  readonly inradius: number;
  /** Escala de la ficha y del hueco dentro de su celda. */
  readonly pieceScale: number;
  readonly slotScale: number;

  /** Celdas del tablero estándar de un "tamaño" (equivale en cantidad al hexágono de ese radio). */
  cells(size: number): CellKey[];
  /** Celdas de esta instancia (vacío si no está acotada). */
  keys(): CellKey[];
  has(k: CellKey): boolean;
  /** Nueva geometría del mismo tipo limitada a esas celdas. */
  withCells(keys: Iterable<CellKey>): IGridGeometry;

  /** Vecinas en el teselado infinito. */
  adjacent(k: CellKey): CellKey[];
  /** Vecinas dentro del tablero. */
  neighbors(k: CellKey): CellKey[];
  /** Líneas rectas (tramos contiguos de al menos 2 celdas). Vacío si la figura no tiene. */
  lines(): CellKey[][];
  /** Direcciones de deslizamiento. Vacío si la figura no tiene. */
  directions(): Direction[];
  /** Siguiente celda en esa dirección, o null si sale del tablero. */
  step(k: CellKey, dir: Direction): CellKey | null;
  /** Gira un conjunto de celdas `times` pasos de 360°/rotationSteps (horario). */
  rotate(cells: CellKey[], times: number): CellKey[];
  /** Traslada un conjunto para que `from` caiga en `to`; null si ninguna traslación del teselado lo permite. */
  translate(cells: CellKey[], from: CellKey, to: CellKey): CellKey[] | null;

  center(k: CellKey): Point;
  polygon(k: CellKey): Point[];
  /** Celda cuyo centro está más cerca del punto. */
  cellAt(p: Point): CellKey;
}
