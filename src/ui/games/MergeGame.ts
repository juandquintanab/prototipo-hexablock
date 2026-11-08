import * as H from '../../design-system/hexablock';
import { GameEngine } from '../../domain/GameEngine';
import { boardGeometry } from '../../domain/geometry/GeometryFactory';
import type { CellKey, Direction } from '../../domain/geometry/IGridGeometry';
import { MERGE_RADIUS, MergeRules } from '../../domain/games/merge/MergeRules';
import type { GameEvent } from '../../domain/ports';
import { freshSeed } from '../../domain/random';
import { bestOf, recordMerge, shapeFor } from '../../app/progress';
import { sfx } from '../../infra/audio';
import { t } from '../../infra/i18n';
import { BoardView } from '../board/BoardView';
import { SwipeController } from '../board/SwipeController';
import { dur, iconBtn } from '../ui';
import type { GameController, GameShell } from './types';

/** Hexa Merge — Fuente Fusión. */
export function createMerge(shell: GameShell): GameController {
  const geometry = boardGeometry(shapeFor('merge'), MERGE_RADIUS);
  const rules = new MergeRules(freshSeed(), geometry);
  const engine = new GameEngine(rules);
  engine.start();
  const bestAtStart = bestOf('merge');

  const board = new BoardView(geometry, { cell: 24, base: true });
  shell.boardWrap.append(board.el);
  shell.hudRight.innerHTML = iconBtn('undo', t('undo'), 'hx-ibtn--sm', 'data-undo');
  const undoBtn = shell.hudRight.querySelector<HTMLButtonElement>('[data-undo]')!;
  shell.tray.innerHTML = `<span class="hx-label">${t('newTile')}</span><div class="tile-slot" data-next></div>`;
  const nextEl = shell.tray.querySelector<HTMLElement>('[data-next]')!;

  const paint = (k: CellKey) => {
    const v = engine.state.board.get(k);
    if (!v) return null;
    const c = board.center(k);
    const fs = board.fontSize(v >= 1000 ? 0.5 : v >= 100 ? 0.65 : 0.85);
    const light = v < 64 || v >= 2048;
    return {
      color: `merge-${Math.min(v, 2048)}`,
      html: `<text x="${c.x}" y="${c.y}" text-anchor="middle" dominant-baseline="central" style="font-family:var(--font-display);font-size:${H.f(fs)}px;fill:var(--${light ? 'ink' : 'white'})">${v}</text>`,
    };
  };

  function draw(bump: CellKey[] = [], pop: CellKey | null = null): void {
    board.render(paint);
    if (bump.length) board.animate(bump, 'hx-anim-bump');
    if (pop) board.animate([pop], 'hx-anim-pop');
    const st = engine.state;
    shell.setCenter(t('points'), H.fmt(st.score), t('bestN', { n: H.fmt(Math.max(bestOf('merge'), st.score)) }));
    nextEl.innerHTML = H.shape({ sides: geometry.sides, size: 56, color: 'cell-slot' }) + H.mergeTile(st.next, { size: 44, sides: geometry.sides });
    undoBtn.disabled = !engine.canUndo;
  }

  let pending: { timer: number; finish: () => void } | null = null;
  const flush = () => { if (pending) { clearTimeout(pending.timer); const f = pending.finish; pending = null; f(); } };

  let events: GameEvent[] = [];
  const off = engine.on(e => events.push(e));

  function move(dir: Direction): void {
    flush();
    if (!shell.isActive()) return;
    events = [];
    if (!engine.play(dir)) { H.replay(board.el, 'hx-anim-shake'); return; }
    const moves = events.flatMap(e => e.type === 'moved' ? [{ from: e.from, to: e.to }] : []);
    const merged = events.flatMap(e => e.type === 'merged' ? [e] : []);
    const spawned = events.find(e => e.type === 'spawned') as Extract<GameEvent, { type: 'spawned' }> | undefined;
    board.slide(moves, dur('fast'));
    const finish = () => {
      draw(merged.map(m => m.key), spawned?.key ?? null);
      if (merged.length) sfx('merge', Math.max(...merged.map(m => m.value)));
      else sfx('place');
      recordMerge(engine.state.score, engine.state.maxTile);
      checkEnd();
    };
    pending = { timer: window.setTimeout(() => { pending = null; finish(); }, dur('fast')), finish };
  }

  function checkEnd(): void {
    const st = engine.state;
    const status = engine.status;
    if (status === 'playing') return;
    const record = st.score > bestAtStart;
    const ribbon = record ? { label: t('newRecord') } : { label: t('yourBest'), value: H.fmt(bestOf('merge')) };
    if (status === 'won') {
      shell.end({
        win: true, title: t('win2048'), score: st.score, ribbon,
        primary: { label: t('keepGoing'), action: () => { rules.continueAfterWin(engine.state); shell.reopen(); } },
      });
    } else {
      shell.end({ win: false, title: t('noMoves'), score: st.score, ribbon, primary: { label: t('again'), action: shell.actions.again } });
    }
  }

  undoBtn.addEventListener('click', () => {
    flush();
    if (!shell.isActive()) return;
    if (engine.undo()) draw();
  });

  const swipe = new SwipeController(shell.root, geometry, move, () => shell.isActive());
  draw([], null);

  return {
    destroy() { if (pending) clearTimeout(pending.timer); pending = null; off(); swipe.destroy(); },
  };
}
