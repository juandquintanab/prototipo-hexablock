import * as H from '../../design-system/hexablock';
import type { CellKey, IGridGeometry, Point } from '../../domain/geometry/IGridGeometry';

/** Qué dibujar en una celda: color de ficha plana, cara y/o SVG extra (número, pila). */
export interface CellPaint { color?: string | null; html?: string; cls?: string; delay?: number; face?: H.FaceMood | null }

export interface BoardViewOptions {
  /** Unidades del SVG por unidad de la geometría (1 = radio de un hexágono). */
  cell?: number;
  /** Lateral de las fichas (solo Hexa Sort). */
  depth?: number;
  /** Aire extra arriba del tablero (pilas altas de Sort). */
  padTop?: number;
  /** Plataforma de piedra con huecos hundidos (board({ base: true }) del sistema). */
  base?: boolean;
}

const toPt = (p: Point, s: number): H.Pt => [p.x * s, p.y * s];
/** Cuánto crece cada celda para formar la plataforma: los mismos valores que board() del sistema (tri 1.24, cuadrado 1.12, resto 1.16). */
const BASE_GROW: Record<number, number> = { 3: 1.24, 4: 1.12 };

/** Polígono de la ficha dentro de su celda (encogido hacia el centro), en unidades del SVG. */
export function piecePolygon(g: IGridGeometry, k: CellKey, scale: number, shrink = g.pieceScale): H.Pt[] {
  const c = g.center(k);
  return H.shrink(g.polygon(k).map(p => toPt(p, scale)), c.x * scale, c.y * scale, shrink);
}

/** Centroide de un conjunto de celdas, en unidades de la geometría. */
export function centroid(g: IGridGeometry, cells: CellKey[]): Point {
  const cs = cells.map(k => g.center(k));
  return { x: cs.reduce((a, c) => a + c.x, 0) / cs.length, y: cs.reduce((a, c) => a + c.y, 0) / cs.length };
}

function boundsOf(polys: H.Pt[][], pad: number): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  polys.flat().forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); });
  return [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad];
}

/**
 * Dibuja cualquier tablero (cualquier geometría) en SVG con las fichas planas del sistema de diseño.
 * No conoce reglas ni figuras: pide a la geometría centros y polígonos.
 */
export class BoardView {
  readonly el: HTMLDivElement;
  readonly cell: number;
  private svg!: SVGSVGElement;
  private pieces!: SVGGElement;
  private previewLayer!: SVGGElement;
  private keys: CellKey[];
  private depth: number;
  private lastPreview = '';

  constructor(readonly geometry: IGridGeometry, opts: BoardViewOptions = {}) {
    this.cell = opts.cell ?? 22;
    this.depth = opts.depth ?? 0;
    // de arriba hacia abajo: las de abajo se dibujan después y tapan a las de arriba
    this.keys = geometry.keys().sort((a, b) => { const A = geometry.center(a), B = geometry.center(b); return A.y - B.y || A.x - B.x; });
    this.el = document.createElement('div');
    this.el.className = 'board-view';
    const padTop = opts.padTop ?? 0;
    const cell = this.cell;
    let floor = '', slots = '', vb: [number, number, number, number];
    if (opts.base) {
      // Plataforma de piedra, igual que board({ base: true }) del sistema: sombra suave, grosor stone-600,
      // cara stone-400 y huecos hundidos (borde stone-600, fondo stone-500 un poco más abajo).
      const grow = BASE_GROW[geometry.sides] ?? 1.16, thick = Math.max(5, cell * 0.34);
      const big = this.keys.map(k => piecePolygon(geometry, k, cell, grow));
      floor = '<g style="opacity:.16">' + big.map(p => `<polygon points="${H.pts(p, thick + cell * 0.35)}" style="fill:var(--ink)"/>`).join('') + '</g>' +
        big.map(p => `<polygon points="${H.pts(p, thick)}" style="fill:var(--stone-600)"/>`).join('') +
        big.map(p => `<polygon points="${H.pts(p)}" style="fill:var(--stone-400)"/>`).join('');
      slots = this.keys.map(k => {
        const c = geometry.center(k), k2 = geometry.slotScale;
        const inner = H.shrink(geometry.polygon(k).map(p => toPt(p, cell)), c.x * cell, c.y * cell, k2 * 0.93).map(p => [p[0], p[1] + cell * 0.08] as H.Pt);
        return `<polygon class="hx-slot" points="${H.pts(piecePolygon(geometry, k, cell, k2))}" style="fill:var(--stone-600)"/>` +
          `<polygon points="${H.pts(inner)}" style="fill:var(--stone-500)"/>`;
      }).join('');
      const [x, y, w, h] = boundsOf(big, 4 + cell * 0.4);
      vb = [x, y, w, h + thick + cell * 0.5];
    } else {
      slots = this.keys.map(k => `<polygon class="hx-slot" points="${H.pts(piecePolygon(geometry, k, cell, geometry.slotScale))}" style="fill:var(--cell-slot)"/>`).join('');
      vb = boundsOf(this.keys.map(k => geometry.polygon(k).map(p => toPt(p, cell))), 4);
    }
    const [x, y, w, h] = vb;
    this.el.innerHTML = `<svg class="hx-board" viewBox="${H.f(x)} ${H.f(y - padTop)} ${H.f(w)} ${H.f(h + padTop + this.depth)}" role="img" aria-label="Tablero">${floor}${slots}<g class="bv-pieces"></g><g class="bv-preview"></g></svg>`;
    this.svg = this.el.querySelector('svg')!;
    this.pieces = this.svg.querySelector('.bv-pieces')!;
    this.previewLayer = this.svg.querySelector('.bv-preview')!;
  }

  has(k: CellKey): boolean { return this.geometry.has(k); }

  /** Centro de la celda en unidades del SVG. */
  center(k: CellKey): Point {
    const c = this.geometry.center(k);
    return { x: c.x * this.cell, y: c.y * this.cell };
  }

  /** Polígono de la ficha plana dentro de su celda, levantado `lift` unidades. */
  poly(k: CellKey, lift = 0): H.Pt[] {
    return piecePolygon(this.geometry, k, this.cell).map(p => [p[0], p[1] - this.depth * 0.4 - lift] as H.Pt);
  }

  /** Tamaño de letra para números dentro de una celda, proporcional a su radio interior. */
  fontSize(factor = 0.8): number { return this.cell * this.geometry.inradius * factor; }

  /** Cara de una ficha centrada en el polígono dado (como board({faces}) del sistema: parpadeo a destiempo). */
  faceAt(poly: H.Pt[], mood: H.FaceMood, i: number): string {
    const c = H.centroid(poly);
    return H.face(c[0], c[1], this.cell * this.geometry.inradius * 0.86, mood, (i * 0.37) % 4);
  }

  render(paint: (k: CellKey) => CellPaint | null): void {
    let s = '';
    this.keys.forEach((k, i) => {
      const p = paint(k);
      if (!p || (!p.color && !p.html)) return;
      const style = p.delay ? ` style="animation-delay:${p.delay}ms"` : '';
      s += `<g class="hx-piece ${p.cls ?? ''}" data-key="${k}"${style}>`;
      // brillo arriba y sombra de contacto debajo (prism del sistema); sin sombra cuando hay lateral (Sort)
      if (p.color) s += H.prism(this.poly(k), p.color, this.depth, '', { shadow: !this.depth });
      if (p.html) s += p.html;
      if (p.color && p.face) s += this.faceAt(this.poly(k), p.face, i);
      s += '</g>';
    });
    this.pieces.innerHTML = s;
  }

  pieceEl(k: CellKey): SVGGElement | null { return this.pieces.querySelector(`[data-key="${CSS.escape(k)}"]`); }

  /** Agrega una clase de animación a varias celdas, con desfase opcional. */
  animate(keys: CellKey[], cls: string, stagger = 0): void {
    keys.forEach((k, i) => {
      const g = this.pieceEl(k);
      if (!g) return;
      g.style.animationDelay = `${i * stagger}ms`;
      H.replay(g, cls);
    });
  }

  /** Desliza fichas de una celda a otra (Merge). */
  slide(moves: { from: CellKey; to: CellKey }[], ms: number): void {
    for (const m of moves) {
      const g = this.pieceEl(m.from);
      if (!g) continue;
      const a = this.center(m.from), b = this.center(m.to);
      g.style.transition = `transform ${ms}ms var(--ease-out)`;
      void g.getBoundingClientRect();
      g.style.transform = `translate(${b.x - a.x}px, ${b.y - a.y}px)`;
    }
  }

  /** Vista previa de una pieza: válida en su color al 55%, inválida en rojo y con temblor. */
  preview(keys: CellKey[], color: string, valid: boolean): void {
    const sig = keys.join('|') + valid;
    if (sig === this.lastPreview) return;
    this.lastPreview = sig;
    const fill = valid ? color : 'piece-red';
    this.previewLayer.innerHTML = keys.filter(k => this.has(k)).map(k => H.prism(this.poly(k), fill, 0)).join('');
    this.previewLayer.setAttribute('opacity', '0.55');
    this.previewLayer.classList.remove('hx-anim-shake');
    if (!valid) H.replay(this.previewLayer, 'hx-anim-shake');
  }

  clearPreview(): void {
    this.lastPreview = '';
    this.previewLayer.innerHTML = '';
  }

  /** Centro de una celda en coordenadas de pantalla (para los efectos). */
  clientPoint(k: CellKey): { x: number; y: number } | null {
    const m = this.svg.getScreenCTM();
    if (!m) return null;
    const c = this.center(k);
    const p = new DOMPoint(c.x, c.y - this.depth * 0.4).matrixTransform(m);
    return { x: p.x, y: p.y };
  }

  /** Punto de pantalla → coordenadas de la geometría. */
  toGeometry(clientX: number, clientY: number): Point | null {
    const m = this.svg.getScreenCTM();
    if (!m) return null;
    const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: p.x / this.cell, y: p.y / this.cell };
  }

  /** Celda del tablero bajo un punto de pantalla, o null. */
  keyAt(clientX: number, clientY: number): CellKey | null {
    const p = this.toGeometry(clientX, clientY);
    if (!p) return null;
    const k = this.geometry.cellAt(p);
    return this.has(k) ? k : null;
  }

  /** Píxeles de pantalla por unidad de la geometría. */
  screenScale(): number {
    const m = this.svg.getScreenCTM();
    return m ? this.cell * m.a : this.cell;
  }

  /** ¿El punto está sobre (o cerca de) el tablero? */
  isNear(clientX: number, clientY: number, marginPx = 40): boolean {
    const r = this.svg.getBoundingClientRect();
    return clientX > r.left - marginPx && clientX < r.right + marginPx && clientY > r.top - marginPx && clientY < r.bottom + marginPx;
  }
}

/** SVG de una pieza suelta (bandeja). `scale` = píxeles por unidad de la geometría. */
export function pieceSvg(g: IGridGeometry, cells: CellKey[], color: string, scale: number): string {
  const polys = cells.map(k => piecePolygon(g, k, scale));
  const [x, y, w, h] = boundsOf(polys, 2);
  return `<svg class="hx-piece-svg" width="${H.f(w)}" height="${H.f(h)}" viewBox="${H.f(x)} ${H.f(y)} ${H.f(w)} ${H.f(h)}" aria-hidden="true">${polys.map(p => H.prism(p, color, 0)).join('')}</svg>`;
}

/** SVG de una pieza centrado en su centroide (fantasma al arrastrar). */
export function ghostPiece(g: IGridGeometry, cells: CellKey[], color: string, scale: number): string {
  const c = centroid(g, cells), cx = c.x * scale, cy = c.y * scale;
  const polys = cells.map(k => piecePolygon(g, k, scale));
  let w = 0, h = 0;
  polys.flat().forEach(([x, y]) => { w = Math.max(w, Math.abs(x - cx)); h = Math.max(h, Math.abs(y - cy)); });
  w += 2; h += 2;
  return `<svg width="${2 * w}" height="${2 * h}" viewBox="${cx - w} ${cy - h} ${2 * w} ${2 * h}" aria-hidden="true">${polys.map(p => H.prism(p, color, 0)).join('')}</svg>`;
}

/** Tablero de muestra (catálogo): las celdas de la geometría con algunas fichas de colores. */
export function sampleBoard(g: IGridGeometry, scale = 12): string {
  const keys = g.keys();
  const polys = keys.map(k => g.polygon(k).map(p => toPt(p, scale)));
  const [x, y, w, h] = boundsOf(polys, 3);
  const body = keys.map((k, i) =>
    `<polygon points="${H.pts(piecePolygon(g, k, scale, g.slotScale))}" style="fill:var(--cell-slot)"/>` +
    ((i * 7) % 3 === 0 ? H.prism(piecePolygon(g, k, scale), H.PIECES[i % 8], 0) : '')).join('');
  return `<svg class="hx-board" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="Tablero">${body}</svg>`;
}
