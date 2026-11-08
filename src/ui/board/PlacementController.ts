import type { CellKey, Point } from '../../domain/geometry/IGridGeometry';
import { BoardView, centroid } from './BoardView';

export interface PlacementConfig {
  board: BoardView;
  /** Contenedor con los elementos [data-slot]. */
  tray: HTMLElement;
  /** Celdas de la pieza del hueco (en una posición cualquiera; la primera es la referencia), o null. */
  cells(slot: number): CellKey[] | null;
  /** Color para la vista previa válida. */
  color(slot: number): string;
  /** SVG del "fantasma" a la escala del tablero en pantalla, centrado en su centroide. */
  ghost(slot: number, scalePx: number): string;
  canPlace(slot: number, anchor: CellKey): boolean;
  place(slot: number, anchor: CellKey): void;
  /** Se tocó una pieza; again = ya estaba seleccionada (Fit la gira). */
  onSelect?(slot: number, again: boolean): void;
  /** Toque en el tablero sin nada seleccionado (Fit quita la pieza). */
  onBoardTap?(k: CellKey): void;
  /** Error (sonido de inválido). */
  onInvalid?(): void;
  enabled(): boolean;
  /**
   * La pieza ocupa una sola celda y va en cualquiera (pilas de Sort): el ancla es la celda bajo el punto,
   * sin traslación. Sin esto, en triángulos y pentágonos solo servirían las celdas de la misma orientación.
   */
  anyCell?: boolean;
}

const LIFT_TOUCH = 56; // la pieza se levanta sobre el dedo
const DRAG_START = 6;

/** Arrastrar o tocar para colocar piezas (Lines, Sort, Fit) en cualquier geometría. Pointer events: mouse y toque. */
export class PlacementController {
  private selected: number | null = null;
  private drag: { slot: number; id: number; x0: number; y0: number; started: boolean; touch: boolean; ghost?: HTMLElement; anchor?: CellKey | null; src: HTMLElement } | null = null;
  private cleanup: (() => void)[] = [];

  constructor(private cfg: PlacementConfig) {
    const on = <K extends keyof HTMLElementEventMap>(t: HTMLElement | Window, ev: K, fn: (e: HTMLElementEventMap[K]) => void) => {
      t.addEventListener(ev, fn as EventListener);
      this.cleanup.push(() => t.removeEventListener(ev, fn as EventListener));
    };
    on(cfg.tray, 'pointerdown', e => this.trayDown(e));
    on(window, 'pointermove', e => this.move(e));
    on(window, 'pointerup', e => this.up(e));
    on(window, 'pointercancel', () => this.cancel());
    on(cfg.board.el, 'click', e => this.boardTap(e));
  }

  get selection(): number | null { return this.selected; }

  select(slot: number | null): void {
    this.selected = slot;
    this.cfg.tray.querySelectorAll<HTMLElement>('[data-slot]').forEach(s =>
      s.classList.toggle('is-selected', slot !== null && Number(s.dataset.slot) === slot));
  }

  destroy(): void {
    this.cancel();
    this.cleanup.forEach(f => f());
  }

  /**
   * Ancla para que el centroide de la pieza quede lo más cerca posible del punto.
   * Solo vale una celda a la que la geometría pueda trasladar la referencia (en triángulos y pentágonos
   * no todas sirven), así que se buscan candidatas alrededor y se elige la mejor.
   */
  private anchorAt(slot: number, clientX: number, clientY: number): CellKey | null {
    const cells = this.cfg.cells(slot);
    const p = this.cfg.board.toGeometry(clientX, clientY);
    if (!cells || !p) return null;
    const g = this.cfg.board.geometry;
    if (this.cfg.anyCell) return g.cellAt(p);
    const c = centroid(g, cells), r0 = g.center(cells[0]);
    const guess = g.cellAt({ x: p.x - (c.x - r0.x), y: p.y - (c.y - r0.y) });
    const ring1 = g.adjacent(guess);
    const candidates = [guess, ...ring1, ...ring1.flatMap(k => g.adjacent(k))];
    let best: CellKey | null = null, bestD = Infinity;
    for (const k of new Set(candidates)) {
      const moved = g.translate(cells, cells[0], k);
      if (!moved) continue;
      const m: Point = centroid(g, moved);
      const d = (m.x - p.x) ** 2 + (m.y - p.y) ** 2;
      if (d < bestD) { bestD = d; best = k; }
    }
    return best;
  }

  private cellsOf(slot: number, anchor: CellKey): CellKey[] {
    const cells = this.cfg.cells(slot);
    if (cells && this.cfg.anyCell) return [anchor];
    return (cells && this.cfg.board.geometry.translate(cells, cells[0], anchor)) || [];
  }

  /** Devuelve true si se dibujó una vista previa sobre el tablero. */
  private showPreview(slot: number, anchor: CellKey | null): boolean {
    const b = this.cfg.board;
    if (!anchor) { b.clearPreview(); return false; }
    const cells = this.cellsOf(slot, anchor);
    if (!cells.some(k => b.has(k))) { b.clearPreview(); return false; }
    b.preview(cells, this.cfg.color(slot), this.cfg.canPlace(slot, anchor));
    return true;
  }

  private trayDown(e: PointerEvent): void {
    if (!this.cfg.enabled()) return;
    const src = (e.target as HTMLElement).closest<HTMLElement>('[data-slot]');
    if (!src) return;
    const slot = Number(src.dataset.slot);
    if (!this.cfg.cells(slot)) return;
    e.preventDefault();
    this.drag = { slot, id: e.pointerId, x0: e.clientX, y0: e.clientY, started: false, touch: e.pointerType !== 'mouse', src };
  }

  private move(e: PointerEvent): void {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    if (!d.started) {
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < DRAG_START) return;
      d.started = true;
      const ghost = document.createElement('div');
      ghost.className = 'drag-ghost';
      ghost.innerHTML = this.cfg.ghost(d.slot, this.cfg.board.screenScale());
      document.body.append(ghost);
      d.ghost = ghost;
      d.src.classList.add('is-dragging');
    }
    const lift = d.touch ? LIFT_TOUCH : 0;
    const x = e.clientX, y = e.clientY - lift;
    d.ghost!.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    d.anchor = this.cfg.board.isNear(x, y) ? this.anchorAt(d.slot, x, y) : null;
    // sobre el tablero, la vista previa (al 55%, o roja si no cabe) reemplaza al fantasma
    d.ghost!.classList.toggle('is-over-board', this.showPreview(d.slot, d.anchor));
  }

  private up(e: PointerEvent): void {
    const d = this.drag;
    if (!d || e.pointerId !== d.id) return;
    this.drag = null;
    if (!d.started) { this.tapSlot(d.slot); return; }
    d.ghost?.remove();
    d.src.classList.remove('is-dragging');
    this.cfg.board.clearPreview();
    if (d.anchor && this.cfg.canPlace(d.slot, d.anchor)) {
      this.select(null);
      this.cfg.place(d.slot, d.anchor);
    } else if (d.anchor) {
      this.cfg.onInvalid?.();
    }
  }

  private cancel(): void {
    if (!this.drag) return;
    this.drag.ghost?.remove();
    this.drag.src.classList.remove('is-dragging');
    this.cfg.board.clearPreview();
    this.drag = null;
  }

  private tapSlot(slot: number): void {
    const again = this.selected === slot;
    this.select(slot);
    this.cfg.onSelect?.(slot, again);
  }

  private boardTap(e: MouseEvent): void {
    if (!this.cfg.enabled()) return;
    const s = this.selected;
    if (s !== null && this.cfg.cells(s)) {
      const anchor = this.anchorAt(s, e.clientX, e.clientY);
      if (anchor && this.cfg.canPlace(s, anchor)) {
        this.select(null);
        this.cfg.place(s, anchor);
      } else if (anchor) {
        this.showPreview(s, anchor);
        this.cfg.onInvalid?.();
        setTimeout(() => this.cfg.board.clearPreview(), 320);
      }
      return;
    }
    const k = this.cfg.board.keyAt(e.clientX, e.clientY);
    if (k) this.cfg.onBoardTap?.(k);
  }
}
