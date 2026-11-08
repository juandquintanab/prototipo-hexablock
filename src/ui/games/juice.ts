import * as H from '../../design-system/hexablock';
import type { CellKey } from '../../domain/geometry/IGridGeometry';
import { t } from '../../infra/i18n';
import type { BoardView } from '../board/BoardView';

/**
 * El "jugo" de la partida (componente Effects del sistema): pedacitos, puntos que suben, texto de combo,
 * sacudida y confeti. Dibuja sobre la pantalla de la partida (host) y traduce celdas a puntos.
 */
export class Juice {
  constructor(private readonly host: HTMLElement) {}

  /** Punto de una celda relativo al host. */
  private at(board: BoardView, k: CellKey): { x: number; y: number } | null {
    const p = board.clientPoint(k);
    if (!p) return null;
    const r = this.host.getBoundingClientRect();
    return { x: p.x - r.left, y: p.y - r.top };
  }

  /** Pedacitos del color de la ficha saltando desde cada celda, en ola (40 ms entre una y otra). */
  burst(board: BoardView, keys: CellKey[], color: (k: CellKey) => string | null, stagger = 40, n = 7): void {
    keys.forEach((k, i) => {
      const p = this.at(board, k);
      if (p) window.setTimeout(() => H.burst(this.host, p.x, p.y, color(k), n), i * stagger);
    });
  }

  /** "+N" que sube desde el centro de unas celdas. */
  points(board: BoardView, keys: CellKey[], pts: number): void {
    if (pts <= 0 || !keys.length) return;
    const ps = keys.map(k => this.at(board, k)).filter((p): p is { x: number; y: number } => !!p);
    if (!ps.length) return;
    const x = ps.reduce((a, p) => a + p.x, 0) / ps.length, y = ps.reduce((a, p) => a + p.y, 0) / ps.length;
    H.floatText(this.host, x, y, '+' + H.fmt(pts));
  }

  /** Texto de combo (2 o más) y sacudida suave desde 3. */
  combo(count: number): void {
    if (count < 2) return;
    H.combo(this.host, t(count >= 4 ? 'combo4' : count === 3 ? 'combo3' : 'combo2'));
    if (count >= 3) H.shake(this.host, 5);
  }

  confetti(): void { H.confetti(this.host, 80); }
}
