import { HexCoord, HexKey, fromPixel, key } from '../../domain/hex';
import { BoardView, centroid } from './BoardView';

export interface PlacementConfig {
  board: BoardView;
  /** Contenedor con los elementos [data-slot]. */
  tray: HTMLElement;
  /** Celdas relativas de la pieza del hueco, o null si no hay pieza. */
  offsets(slot: number): HexCoord[] | null;
  /** Color para la vista previa válida. */
  color(slot: number): string;
  /** SVG del "fantasma" al tamaño de celda en pantalla, centrado en su centroide. */
  ghost(slot: number, cellPx: number): string;
  canPlace(slot: number, anchor: HexKey): boolean;
  place(slot: number, anchor: HexKey): void;
  /** Se tocó una pieza; again = ya estaba seleccionada (Fit la gira). */
  onSelect?(slot: number, again: boolean): void;
  /** Toque en el tablero sin nada seleccionado (Fit quita la pieza). */
  onBoardTap?(k: HexKey): void;
  /** Error (sonido de inválido). */
  onInvalid?(): void;
  enabled(): boolean;
}

const LIFT_TOUCH = 56; // la pieza se levanta sobre el dedo
const DRAG_START = 6;

/** Arrastrar o tocar para colocar piezas (Lines, Sort, Fit). Pointer events: mouse y toque. */
export class PlacementController {
  private selected: number | null = null;
  private drag: { slot: number; id: number; x0: number; y0: number; started: boolean; touch: boolean; ghost?: HTMLElement; anchor?: HexKey | null; src: HTMLElement } | null = null;
  private cleanup: (() => void)[] = [];

  constructor(private cfg: PlacementConfig) {
    const tray = cfg.tray;
    const boardEl = cfg.board.el;
    const on = <K extends keyof HTMLElementEventMap>(t: HTMLElement | Window, ev: K, fn: (e: HTMLElementEventMap[K]) => void) => {
      t.addEventListener(ev, fn as EventListener);
      this.cleanup.push(() => t.removeEventListener(ev, fn as EventListener));
    };
    on(tray, 'pointerdown', e => this.trayDown(e));
    on(window, 'pointermove', e => this.move(e));
    on(window, 'pointerup', e => this.up(e));
    on(window, 'pointercancel', () => this.cancel());
    on(boardEl, 'click', e => this.boardTap(e));
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

  /** Ancla para que el centroide de la pieza quede bajo el punto. */
  private anchorAt(slot: number, clientX: number, clientY: number): HexKey | null {
    const offs = this.cfg.offsets(slot);
    const p = this.cfg.board.toSvg(clientX, clientY);
    if (!offs || !p) return null;
    const c = centroid(offs, this.cfg.board.cell);
    const a = fromPixel(p.x - c.x, p.y - c.y, this.cfg.board.cell);
    return key(a.q, a.r);
  }

  private cellsOf(slot: number, anchor: HexKey): HexKey[] {
    const [aq, ar] = anchor.split(',').map(Number);
    return (this.cfg.offsets(slot) ?? []).map(o => key(aq + o.q, ar + o.r));
  }

  /** Devuelve true si se dibujó una vista previa sobre el tablero. */
  private showPreview(slot: number, anchor: HexKey | null): boolean {
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
    if (!this.cfg.offsets(slot)) return;
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
      ghost.innerHTML = this.cfg.ghost(d.slot, this.cfg.board.screenCell());
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
    if (s !== null && this.cfg.offsets(s)) {
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
