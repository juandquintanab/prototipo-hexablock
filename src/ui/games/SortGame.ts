import * as H from '../../design-system/hexablock';
import type { CellKey as HexKey } from '../../domain/geometry/IGridGeometry';
import { boardGeometry } from '../../domain/geometry/GeometryFactory';
import { HexBoard } from '../../domain/HexBoard';
import { GameEngine } from '../../domain/GameEngine';
import { ColorStack, SORT_RADIUS, SortRules, sortStars, topRun } from '../../domain/games/sort/SortRules';
import type { GameEvent } from '../../domain/ports';
import { freshSeed } from '../../domain/random';
import { LEVEL_COUNT, addSortGoals, recordLevel, shapeFor } from '../../app/progress';
import { sfx } from '../../infra/audio';
import { t } from '../../infra/i18n';
import { BoardView } from '../board/BoardView';
import { PlacementController } from '../board/PlacementController';
import { dur } from '../ui';
import type { GameController, GameShell } from './types';

const DEPTH = 5;   // lateral de cada ficha apilada
const LAYER = 5;   // altura por ficha (unidades del tablero)

/** Hexa Sort — Pilópolis. */
export function createSort(shell: GameShell): GameController {
  const geometry = boardGeometry(shapeFor('sort'), SORT_RADIUS);
  const engine = new GameEngine(new SortRules(freshSeed(), geometry));
  engine.start(shell.level);

  const board = new BoardView(geometry, { cell: 26, depth: DEPTH, padTop: 56 });
  shell.boardWrap.append(board.el);
  shell.hudRight.innerHTML = '<div class="hud-spacer"></div>';
  shell.sub.innerHTML = '<div class="hx-progress"><div class="hx-progress__fill" style="width:0"></div><span data-goals></span></div>';
  const fill = shell.sub.querySelector<HTMLElement>('.hx-progress__fill')!;
  const goalsLabel = shell.sub.querySelector<HTMLElement>('[data-goals]')!;

  let display: HexBoard<ColorStack> = engine.state.board;
  const paint = (k: HexKey) => {
    const st = display.get(k);
    if (!st.length) return null;
    const run = topRun(st);
    const base = st.slice(0, st.length - run), top = st.slice(st.length - run);
    const layers = (list: string[], from: number) => list.map((c, i) => H.prism(board.poly(k, (from + i) * LAYER), c, DEPTH)).join('');
    const g = board.center(k);
    const ty = g.y - DEPTH * 0.4 - (st.length - 1) * LAYER;
    return {
      html: layers(base, 0) + `<g class="stack-run">${layers(top, base.length)}` +
        `<text x="${g.x}" y="${ty}" text-anchor="middle" dominant-baseline="central" style="font-family:var(--font-display);font-size:${H.f(board.fontSize(0.65))}px;fill:var(--ink)">${run}</text></g>`,
    };
  };

  function drawHud(goals = engine.state.goalsDone): void {
    const st = engine.state;
    const g = Math.min(goals, st.goals);
    shell.setCenter(t('levelN', { n: st.level }), `${g} / ${st.goals}`, t('goals'));
    goalsLabel.textContent = t('goalsN', { a: g, b: st.goals });
    fill.style.width = `${(g / st.goals) * 100}%`;
  }
  function drawTray(): void {
    shell.tray.innerHTML = `<span class="hx-label tray-label">${t('nextStack')}</span>` + engine.state.tray.map((p, i) =>
      `<div class="hx-tray__slot${p ? '' : ' is-used'}" data-slot="${i}">${p ? H.stack(p, { size: 40, layer: 5, sides: geometry.sides }) : ''}</div>`).join('');
    placement?.select(null);
  }

  let pending: { timer: number; finish: () => void } | null = null;
  const flush = () => { if (pending) { clearTimeout(pending.timer); const f = pending.finish; pending = null; f(); } };

  let events: GameEvent[] = [];
  const off = engine.on(e => events.push(e));

  function place(slot: number, k: HexKey): void {
    flush();
    const before = engine.state.board.clone(c => [...c]);
    const stack = [...engine.state.tray[slot]!];
    events = [];
    if (!engine.play({ slot, key: k })) return;
    const steps = events.filter(e => e.type === 'transferred' || e.type === 'stackCleared');
    const gained = steps.filter(e => e.type === 'stackCleared').length;
    if (gained) addSortGoals(gained);
    let goalsShown = engine.state.goalsDone - gained;

    display = before;
    display.set(k, stack);
    board.render(paint);
    board.animate([k], 'hx-anim-snap');
    sfx('place');
    drawTray();
    drawHud(goalsShown);

    const finish = () => {
      display = engine.state.board;
      board.render(paint);
      drawHud();
      checkEnd();
    };
    const schedule = (ms: number, fn: () => void) => { pending = { timer: window.setTimeout(() => { pending = null; fn(); }, ms), finish }; };

    // cascada animada: un paso cada dur-base
    const run = (i: number) => {
      if (i >= steps.length) { finish(); return; }
      const e = steps[i];
      if (e.type === 'transferred') {
        const src = display.get(e.from), dst = display.get(e.to);
        dst.push(...src.splice(src.length - e.count, e.count));
        board.render(paint);
        board.animate([e.to], 'hx-anim-bump');
        sfx('transfer');
        schedule(dur('base'), () => run(i + 1));
      } else if (e.type === 'stackCleared') {
        const g = board.pieceEl(e.key)?.querySelector('.stack-run');
        if (g) H.replay(g, 'hx-anim-clear');
        sfx('goal');
        schedule(dur('base'), () => {
          const st = display.get(e.key);
          st.splice(st.length - e.count, e.count);
          goalsShown++;
          board.render(paint);
          drawHud(goalsShown);
          run(i + 1);
        });
      }
    };
    schedule(dur('fast'), () => run(0));
  }

  function checkEnd(): void {
    const st = engine.state;
    const status = engine.status;
    if (status === 'playing') return;
    const ribbon = { label: t('levelN', { n: st.level }) };
    if (status === 'won') {
      const stars = sortStars(st.moves, st.goals);
      recordLevel('sort', st.level, stars);
      const last = st.level >= LEVEL_COUNT;
      shell.end({
        win: true, title: t('victory'), stars, ribbon,
        primary: last ? { label: t('levels'), action: shell.actions.levels } : { label: t('next'), action: shell.actions.next },
        secondary: last ? { label: t('map'), action: shell.actions.map } : undefined,
      });
    } else {
      shell.end({ win: false, title: t('boardFull'), stars: 0, ribbon, primary: { label: t('again'), action: shell.actions.again } });
    }
  }

  const placement = new PlacementController({
    board, tray: shell.tray,
    anyCell: true,
    cells: s => engine.state.tray[s] ? [geometry.origin] : null,
    color: s => engine.state.tray[s]?.slice(-1)[0] ?? 'piece-blue',
    ghost: (s, px) => H.stack(engine.state.tray[s]!, { size: Math.round(px * 2 * geometry.inradius * 1.1), layer: Math.max(4, Math.round(px * 0.22)), sides: geometry.sides }),
    canPlace: (s, k) => engine.isValid({ slot: s, key: k }),
    place,
    onInvalid: () => sfx('invalid'),
    enabled: () => shell.isActive(),
  });

  drawTray();
  drawHud();
  board.render(paint);

  return {
    destroy() { if (pending) clearTimeout(pending.timer); pending = null; off(); placement.destroy(); },
  };
}
