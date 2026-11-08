import * as H from '../../design-system/hexablock';
import { HexCoord, HexKey, fromPixel, key, parse } from '../../domain/hex';

/** Qué dibujar en una celda: color de ficha plana y/o SVG extra (número, pila). */
export interface CellPaint { color?: string | null; html?: string; cls?: string; delay?: number }

export interface BoardViewOptions {
  cell?: number;
  /** Lateral de las fichas (solo Hexa Sort). */
  depth?: number;
  /** Aire extra arriba del tablero (pilas altas de Sort). */
  padTop?: number;
}

/**
 * Dibuja cualquier HexBoard en SVG con las piezas del sistema de diseño.
 * No conoce reglas: recibe una función que dice qué hay en cada celda.
 */
export class BoardView {
  readonly el: HTMLDivElement;
  readonly cell: number;
  private svg!: SVGSVGElement;
  private pieces!: SVGGElement;
  private previewLayer!: SVGGElement;
  private keys: HexKey[];
  private keySet: Set<HexKey>;
  private depth: number;
  private lastPreview = '';

  constructor(keys: HexKey[], opts: BoardViewOptions = {}) {
    this.cell = opts.cell ?? 22;
    this.depth = opts.depth ?? 0;
    // de arriba hacia abajo: las de abajo se dibujan después y tapan a las de arriba
    this.keys = [...keys].sort((a, b) => { const A = parse(a), B = parse(b); return A.r - B.r || A.q - B.q; });
    this.keySet = new Set(keys);
    this.el = document.createElement('div');
    this.el.className = 'board-view';
    const geoms = this.keys.map(k => this.geom(k));
    const [x, y, w, h] = H.bounds(geoms, this.depth, 4).split(' ').map(Number);
    const padTop = opts.padTop ?? 0;
    const slots = geoms.map(c => `<polygon class="hx-slot" points="${H.pts(H.shrink(c.poly, c.x, c.y, 0.9))}" style="fill:var(--cell-slot)"/>`).join('');
    this.el.innerHTML = `<svg class="hx-board" viewBox="${x} ${y - padTop} ${w} ${h + padTop}" role="img" aria-label="Tablero">${slots}<g class="bv-pieces"></g><g class="bv-preview"></g></svg>`;
    this.svg = this.el.querySelector('svg')!;
    this.pieces = this.svg.querySelector('.bv-pieces')!;
    this.previewLayer = this.svg.querySelector('.bv-preview')!;
  }

  has(k: HexKey): boolean { return this.keySet.has(k); }

  geom(k: HexKey): H.CellGeom {
    const c = parse(k);
    return H.cellGeom('hex', c.q, c.r, this.cell);
  }

  /** Polígono de la ficha plana dentro de su celda. */
  poly(k: HexKey, lift = 0): H.Pt[] {
    return H.piecePoly(this.geom(k), undefined, 'hex', this.depth).map(p => [p[0], p[1] - lift] as H.Pt);
  }

  render(paint: (k: HexKey) => CellPaint | null): void {
    let s = '';
    for (const k of this.keys) {
      const p = paint(k);
      if (!p || (!p.color && !p.html)) continue;
      const style = p.delay ? ` style="animation-delay:${p.delay}ms"` : '';
      s += `<g class="hx-piece ${p.cls ?? ''}" data-key="${k}"${style}>`;
      if (p.color) s += H.prism(this.poly(k), p.color, this.depth);
      if (p.html) s += p.html;
      s += '</g>';
    }
    this.pieces.innerHTML = s;
  }

  pieceEl(k: HexKey): SVGGElement | null { return this.pieces.querySelector(`[data-key="${k}"]`); }

  /** Agrega una clase de animación a varias celdas, con desfase opcional. */
  animate(keys: HexKey[], cls: string, stagger = 0): void {
    keys.forEach((k, i) => {
      const g = this.pieceEl(k);
      if (!g) return;
      g.style.animationDelay = `${i * stagger}ms`;
      H.replay(g, cls);
    });
  }

  /** Desliza fichas de una celda a otra (Merge). */
  slide(moves: { from: HexKey; to: HexKey }[], ms: number): void {
    for (const m of moves) {
      const g = this.pieceEl(m.from);
      if (!g) continue;
      const a = this.geom(m.from), b = this.geom(m.to);
      g.style.transition = `transform ${ms}ms var(--ease-out)`;
      void g.getBoundingClientRect();
      g.style.transform = `translate(${b.x - a.x}px, ${b.y - a.y}px)`;
    }
  }

  /** Vista previa de una pieza: válida en su color al 55%, inválida en rojo y con temblor. */
  preview(keys: HexKey[], color: string, valid: boolean): void {
    const sig = keys.join('|') + valid;
    if (sig === this.lastPreview) return;
    this.lastPreview = sig;
    const fill = valid ? color : 'piece-red';
    this.previewLayer.innerHTML = keys.filter(k => this.has(k))
      .map(k => H.prism(this.poly(k), fill, 0)).join('');
    this.previewLayer.setAttribute('opacity', '0.55');
    this.previewLayer.classList.remove('hx-anim-shake');
    if (!valid) H.replay(this.previewLayer, 'hx-anim-shake');
  }

  clearPreview(): void {
    this.lastPreview = '';
    this.previewLayer.innerHTML = '';
  }

  /** Punto de pantalla → coordenadas del SVG. */
  toSvg(clientX: number, clientY: number): { x: number; y: number } | null {
    const m = this.svg.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  /** Celda bajo un punto de pantalla (aunque esté fuera del tablero). */
  coordAt(clientX: number, clientY: number): HexCoord | null {
    const p = this.toSvg(clientX, clientY);
    return p ? fromPixel(p.x, p.y, this.cell) : null;
  }

  keyAt(clientX: number, clientY: number): HexKey | null {
    const c = this.coordAt(clientX, clientY);
    if (!c) return null;
    const k = key(c.q, c.r);
    return this.has(k) ? k : null;
  }

  /** Tamaño en píxeles de pantalla de una celda (radio). */
  screenCell(): number {
    const m = this.svg.getScreenCTM();
    return m ? this.cell * m.a : this.cell;
  }

  /** ¿El punto está sobre (o cerca de) el tablero? */
  isNear(clientX: number, clientY: number, marginPx = 40): boolean {
    const r = this.svg.getBoundingClientRect();
    return clientX > r.left - marginPx && clientX < r.right + marginPx && clientY > r.top - marginPx && clientY < r.bottom + marginPx;
  }
}

/** SVG de una pieza (varias celdas) centrado en su centroide, al tamaño de celda dado. */
export function ghostPiece(offsets: HexCoord[], color: string, cell: number): string {
  const gs = offsets.map(o => H.cellGeom('hex', o.q, o.r, cell));
  const cx = gs.reduce((a, g) => a + g.x, 0) / gs.length;
  const cy = gs.reduce((a, g) => a + g.y, 0) / gs.length;
  let w = 0, h = 0;
  gs.forEach(g => g.poly.forEach(p => { w = Math.max(w, Math.abs(p[0] - cx)); h = Math.max(h, Math.abs(p[1] - cy)); }));
  w += 2; h += 2;
  const body = gs.map(g => H.prism(H.piecePoly(g, undefined, 'hex', 0), color, 0)).join('');
  return `<svg width="${2 * w}" height="${2 * h}" viewBox="${cx - w} ${cy - h} ${2 * w} ${2 * h}" aria-hidden="true">${body}</svg>`;
}

/** Centroide en píxeles (unidades del tablero) de unos desplazamientos. */
export function centroid(offsets: HexCoord[], cell: number): { x: number; y: number } {
  const gs = offsets.map(o => H.cellGeom('hex', o.q, o.r, cell));
  return { x: gs.reduce((a, g) => a + g.x, 0) / gs.length, y: gs.reduce((a, g) => a + g.y, 0) / gs.length };
}
