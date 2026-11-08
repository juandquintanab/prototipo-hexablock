import type { CellKey, Direction, IGridGeometry, Point, Shape } from './IGridGeometry';

/** Familia de líneas paralelas: id de la línea que contiene la celda y su posición a lo largo de ella. */
export interface LineFamily { id(k: CellKey): number; order(k: CellKey): number }

/** Celdas equivalentes en cantidad a un hexágono de radio R. */
export const hexCount = (R: number): number => 3 * R * R + 3 * R + 1;

/** Lo común a todas las geometrías. Cada subclase define vecindad, líneas, dibujo y traslación. */
export abstract class GridGeometry implements IGridGeometry {
  abstract readonly id: Shape;
  abstract readonly sides: number;
  abstract readonly rotationSteps: number;
  abstract readonly origin: CellKey;
  abstract readonly inradius: number;
  abstract readonly pieceScale: number;
  abstract readonly slotScale: number;
  /** Punto alrededor del cual girar (un centro de simetría del teselado). */
  protected abstract readonly pivot: Point;

  private readonly keySet: Set<CellKey> | null;
  private readonly keyList: CellKey[];
  private linesCache: CellKey[][] | null = null;

  constructor(keys?: Iterable<CellKey>) {
    this.keyList = keys ? [...keys] : [];
    this.keySet = keys ? new Set(this.keyList) : null;
  }

  abstract cells(size: number): CellKey[];
  abstract adjacent(k: CellKey): CellKey[];
  abstract center(k: CellKey): Point;
  abstract polygon(k: CellKey): Point[];
  protected abstract create(keys: Iterable<CellKey>): IGridGeometry;
  /** Familias de líneas rectas (vacío si no hay). */
  protected abstract families(): LineFamily[];
  /** Paso sin límites en una dirección (null si la dirección no existe). */
  protected abstract rawStep(k: CellKey, dir: Direction): CellKey | null;
  protected abstract readonly dirCount: number;
  /** Celdas candidatas cerca de un punto (para cellAt). */
  protected abstract candidates(p: Point): CellKey[];
  /** ¿Existe una traslación del teselado que lleve `from` a `to`? */
  protected abstract canShift(from: CellKey, to: CellKey): boolean;
  /** Aplica a `k` la traslación que lleva `from` a `to`. */
  protected abstract shift(k: CellKey, from: CellKey, to: CellKey): CellKey;

  keys(): CellKey[] { return [...this.keyList]; }
  has(k: CellKey): boolean { return this.keySet ? this.keySet.has(k) : true; }
  withCells(keys: Iterable<CellKey>): IGridGeometry { return this.create(keys); }

  neighbors(k: CellKey): CellKey[] { return this.adjacent(k).filter(n => this.has(n)); }

  lines(): CellKey[][] {
    if (this.linesCache) return this.linesCache;
    const out: CellKey[][] = [];
    for (const fam of this.families()) {
      const groups = new Map<number, CellKey[]>();
      for (const k of this.keyList) {
        const id = fam.id(k);
        if (!groups.has(id)) groups.set(id, []);
        groups.get(id)!.push(k);
      }
      for (const list of groups.values()) {
        list.sort((a, b) => fam.order(a) - fam.order(b));
        let run: CellKey[] = [];
        for (const k of list) {
          if (run.length && !this.adjacent(run[run.length - 1]).includes(k)) {
            if (run.length >= 2) out.push(run);
            run = [];
          }
          run.push(k);
        }
        if (run.length >= 2) out.push(run);
      }
    }
    return (this.linesCache = out);
  }

  directions(): Direction[] { return Array.from({ length: this.dirCount }, (_, i) => i); }

  step(k: CellKey, dir: Direction): CellKey | null {
    const n = this.rawStep(k, dir);
    return n !== null && this.has(n) ? n : null;
  }

  /** Paso a lo largo de una familia de líneas: dirección 2f es "adelante" en la familia f, 2f+1 "atrás". */
  protected stripStep(k: CellKey, dir: Direction): CellKey | null {
    const fam = this.families()[Math.floor(dir / 2)];
    if (!fam) return null;
    const sense = dir % 2 === 0 ? 1 : -1;
    const id = fam.id(k), o = fam.order(k);
    return this.adjacent(k).find(n => fam.id(n) === id && Math.sign(fam.order(n) - o) === sense) ?? null;
  }

  rotate(cells: CellKey[], times: number): CellKey[] {
    const t = ((times % this.rotationSteps) + this.rotationSteps) % this.rotationSteps;
    if (t === 0) return [...cells];
    const a = (2 * Math.PI * t) / this.rotationSteps; // horario en pantalla (y hacia abajo)
    const cos = Math.cos(a), sin = Math.sin(a), { x: px, y: py } = this.pivot;
    return cells.map(k => {
      const c = this.center(k), dx = c.x - px, dy = c.y - py;
      return this.cellAt({ x: px + dx * cos - dy * sin, y: py + dx * sin + dy * cos });
    });
  }

  translate(cells: CellKey[], from: CellKey, to: CellKey): CellKey[] | null {
    if (!this.canShift(from, to)) return null;
    return cells.map(k => this.shift(k, from, to));
  }

  cellAt(p: Point): CellKey {
    let best = '', bestD = Infinity;
    for (const k of this.candidates(p)) {
      const c = this.center(k), d = (c.x - p.x) ** 2 + (c.y - p.y) ** 2;
      if (d < bestD) { bestD = d; best = k; }
    }
    return best;
  }
}

export const nums = (k: CellKey): number[] => k.split(',').map(Number);
export const z = (n: number): number => n + 0; // evita "-0" en las claves
