import type { CellKey, IGridGeometry } from './geometry/IGridGeometry';

/**
 * Tablero genérico: escrito una vez, usado por los cuatro juegos y las cuatro figuras.
 * Guarda el contenido de cada celda; la forma (vecinas, líneas, direcciones) la pone la geometría.
 * (Se mantiene el nombre HexBoard del enunciado aunque ya no es solo hexagonal.)
 */
export class HexBoard<TCell> {
  private cells = new Map<CellKey, TCell>();

  constructor(readonly geometry: IGridGeometry, empty: () => TCell) {
    for (const k of geometry.keys()) this.cells.set(k, empty());
  }

  get(k: CellKey): TCell {
    if (!this.cells.has(k)) throw new Error(`Celda fuera del tablero: ${k}`);
    return this.cells.get(k) as TCell;
  }
  set(k: CellKey, v: TCell): void {
    if (!this.cells.has(k)) throw new Error(`Celda fuera del tablero: ${k}`);
    this.cells.set(k, v);
  }
  has(k: CellKey): boolean { return this.cells.has(k); }
  keys(): CellKey[] { return [...this.cells.keys()]; }
  entries(): [CellKey, TCell][] { return [...this.cells.entries()]; }
  get size(): number { return this.cells.size; }

  neighbors(k: CellKey): CellKey[] { return this.geometry.neighbors(k); }
  lines(): CellKey[][] { return this.geometry.lines(); }

  clone(copyCell: (c: TCell) => TCell = c => c): HexBoard<TCell> {
    const b = new HexBoard<TCell>(this.geometry, () => undefined as TCell);
    for (const [k, v] of this.cells) b.cells.set(k, copyCell(v));
    return b;
  }
}
