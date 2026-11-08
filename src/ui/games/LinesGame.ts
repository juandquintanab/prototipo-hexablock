import * as H from '../../design-system/hexablock';
import { GameEngine } from '../../domain/GameEngine';
import { boardGeometry } from '../../domain/geometry/GeometryFactory';
import type { CellKey } from '../../domain/geometry/IGridGeometry';
import { LINES_RADIUS, LinesRules } from '../../domain/games/lines/LinesRules';
import type { GameEvent } from '../../domain/ports';
import { freshSeed } from '../../domain/random';
import { bestOf, recordLines, shapeFor } from '../../app/progress';
import { sfx } from '../../infra/audio';
import { t } from '../../infra/i18n';
import { BoardView, ghostPiece, pieceSvg } from '../board/BoardView';
import { PlacementController } from '../board/PlacementController';
import { dur } from '../ui';
import type { GameController, GameShell } from './types';

/** Hexa Lines — Estación Línea. */
export function createLines(shell: GameShell): GameController {
  const geometry = boardGeometry(shapeFor('lines'), LINES_RADIUS);
  const engine = new GameEngine(new LinesRules(freshSeed(), geometry));
  engine.start();
  const bestAtStart = bestOf('lines');

  const board = new BoardView(geometry, { cell: 22, base: true });
  shell.boardWrap.append(board.el);
  shell.hudRight.innerHTML = '<div class="hud-spacer"></div>';

  let display = engine.state.board; // lo que se ve (puede ir un paso atrás durante la animación)

  // Caras: susto en las líneas a punto de completarse (o que van a explotar), alegría al encajar.
  let scared = new Set<CellKey>();
  let happy = new Set<CellKey>();
  let happyTimer = 0;
  const moodOf = (k: CellKey): H.FaceMood => scared.has(k) ? 'scared' : happy.has(k) ? 'happy' : 'idle';
  const paint = (k: CellKey) => { const c = display.get(k); return c ? { color: c, face: moodOf(k) } : null; };
  function render(): void {
    scared = new Set();
    for (const line of geometry.lines()) {
      if (line.filter(k => display.get(k) === null).length <= 1) line.forEach(k => { if (display.get(k)) scared.add(k); });
    }
    board.render(paint);
  }
  function cheer(keys: CellKey[]): void {
    happy = new Set(keys);
    clearTimeout(happyTimer);
    happyTimer = window.setTimeout(() => { happy = new Set(); render(); }, 700);
  }

  function drawHud(): void {
    const st = engine.state;
    shell.setCenter(t('points'), st.score, t('bestN', { n: H.fmt(Math.max(bestOf('lines'), st.score)) }));
  }
  function drawTray(): void {
    shell.tray.innerHTML = engine.state.tray.map((p, i) =>
      `<div class="hx-tray__slot${p ? '' : ' is-used'}" data-slot="${i}">${p ? pieceSvg(geometry, p.cells, p.color, 11) : ''}</div>`).join('');
    placement?.select(null);
  }

  let pending: { timer: number; finish: () => void } | null = null;
  const flush = () => { if (pending) { clearTimeout(pending.timer); const f = pending.finish; pending = null; f(); } };

  let events: GameEvent[] = [];
  const off = engine.on(e => events.push(e));

  function place(slot: number, anchor: CellKey): void {
    flush();
    const before = engine.state.board.clone();
    const color = engine.state.tray[slot]!.color;
    events = [];
    if (!engine.play({ slot, anchor })) return;
    const placed = (events.find(e => e.type === 'placed') as Extract<GameEvent, { type: 'placed' }>).keys;
    const cleared = events.find(e => e.type === 'linesCleared') as Extract<GameEvent, { type: 'linesCleared' }> | undefined;
    const points = events.reduce((a, e) => a + (e.type === 'score' ? e.points : 0), 0);
    placed.forEach(k => before.set(k, color));
    shell.juice.points(board, placed, points);
    // Hexi: celebra un combo, se alegra al limpiar, se sorprende con una pieza grande
    if (cleared && cleared.lines >= 2) shell.mood('celebra', 1300);
    else if (cleared) shell.mood('feliz', 900);
    else if (placed.length >= 4) shell.mood('sorpresa', 900);
    display = before;
    cheer(placed);
    render();
    board.animate(placed, 'hx-anim-snap');
    sfx('place');
    drawTray();
    drawHud();

    const finish = () => {
      display = engine.state.board;
      render();
      // nervioso cuando queda menos de un cuarto del tablero libre
      const free = display.keys().filter(k => display.get(k) === null).length;
      shell.mood(free < display.size * 0.25 ? 'nervioso' : 'feliz');
      recordLines(engine.state.score, engine.state.maxCombo);
      drawHud();
      if (engine.status === 'lost') {
        const record = engine.state.score > bestAtStart;
        shell.end({
          win: false, celebrate: record, title: t('noSpace'), score: engine.state.score,
          ribbon: record ? { label: t('newRecord') } : { label: t('yourBest'), value: H.fmt(bestOf('lines')) },
          primary: { label: t('again'), action: shell.actions.again },
        });
      }
    };
    if (cleared) {
      // ola: de la pieza colocada hacia afuera, 40 ms entre fichas
      const c = board.center(placed[0]);
      const dist = (k: CellKey) => { const p = board.center(k); return Math.hypot(p.x - c.x, p.y - c.y); };
      const order = [...cleared.keys].sort((a, b) => dist(a) - dist(b));
      const stagger = 40;
      setTimeout(() => {
        if (display !== before) return;
        board.animate(order, 'hx-anim-clear', stagger);
        shell.juice.burst(board, order, k => before.get(k), stagger);
      }, dur('fast'));
      shell.juice.combo(cleared.lines);
      sfx('clear', cleared.lines);
      const total = dur('fast') + dur('base') + stagger * Math.min(order.length, 12);
      pending = { timer: window.setTimeout(() => { pending = null; finish(); }, total), finish };
    } else {
      finish();
    }
  }

  const placement = new PlacementController({
    board, tray: shell.tray,
    cells: s => engine.state.tray[s]?.cells ?? null,
    color: s => engine.state.tray[s]?.color ?? 'piece-blue',
    ghost: (s, px) => { const p = engine.state.tray[s]!; return ghostPiece(geometry, p.cells, p.color, px); },
    // la vista previa usa el estado real del motor: no hace falta esperar la animación
    canPlace: (s, a) => engine.isValid({ slot: s, anchor: a }),
    place,
    onInvalid: () => sfx('invalid'),
    enabled: () => shell.isActive(),
  });

  drawTray();
  drawHud();
  render();

  return {
    destroy() { clearTimeout(happyTimer); if (pending) clearTimeout(pending.timer); pending = null; off(); placement.destroy(); },
  };
}
