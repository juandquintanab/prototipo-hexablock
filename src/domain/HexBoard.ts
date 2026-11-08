import { DIRECTIONS, HexCoord, HexKey, add, key, keyOf, parse, sOf } from './hex';

interface Axis { group: (c: HexCoord) => number; along: (c: HexCoord) => number; step: HexCoord }

/** Los 3 ejes de línea: r constante, q constante y s constante. */
const AXES: Axis[] = [
  { group: c => c.r, along: c => c.q, step: { q: 1, r: 0 } },
  { group: c => c.q, along: c => c.r, step: { q: 0, r: 1 } },
  { group: c => sOf(c), along: c => c.q, step: { q: 1, r: -1 } },
];

/** Tablero genérico: escrito una vez, usado por los cuatro juegos. */
export class HexBoard<TCell> {
  private cells = new Map<HexKey, TCell>();

  constructor(keys: Iterable<HexKey>, empty: () => TCell) {
    for (const k of keys) this.cells.set(k, empty());
  }

  get(k: HexKey): TCell {
    if (!this.cells.has(k)) throw new Error(`Celda fuera del tablero: ${k}`);
    return this.cells.get(k) as TCell;
  }
  set(k: HexKey, v: TCell): void {
    if (!this.cells.has(k)) throw new Error(`Celda fuera del tablero: ${k}`);
    this.cells.set(k, v);
  }
  has(k: HexKey): boolean { return this.cells.has(k); }
  keys(): HexKey[] { return [...this.cells.keys()]; }
  entries(): [HexKey, TCell][] { return [...this.cells.entries()]; }
  get size(): number { return this.cells.size; }

  neighbors(k: HexKey): HexKey[] {
    const c = parse(k);
    return DIRECTIONS.map(d => keyOf(add(c, d))).filter(n => this.cells.has(n));
  }

  /** Todas las líneas de los 3 ejes, como tramos contiguos de al menos 2 celdas. */
  lines(): HexKey[][] {
    const out: HexKey[][] = [];
    for (const axis of AXES) {
      const groups = new Map<number, HexCoord[]>();
      for (const k of this.cells.keys()) {
        const c = parse(k);
        const g = axis.group(c);
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g)!.push(c);
      }
      for (const list of groups.values()) {
        list.sort((a, b) => axis.along(a) - axis.along(b));
        let run: HexKey[] = [];
        let prev: HexCoord | null = null;
        for (const c of list) {
          if (prev && !(prev.q + axis.step.q === c.q && prev.r + axis.step.r === c.r)) {
            if (run.length >= 2) out.push(run);
            run = [];
          }
          run.push(key(c.q, c.r));
          prev = c;
        }
        if (run.length >= 2) out.push(run);
      }
    }
    return out;
  }

  clone(copyCell: (c: TCell) => TCell = c => c): HexBoard<TCell> {
    const b = new HexBoard<TCell>([], () => undefined as TCell);
    for (const [k, v] of this.cells) b.cells.set(k, copyCell(v));
    return b;
  }
}
