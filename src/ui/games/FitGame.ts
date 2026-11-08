import * as H from '../../design-system/hexablock';
import { HexKey } from '../../domain/hex';
import { GameEngine } from '../../domain/GameEngine';
import { FIT_TIME_MS, FitMove, FitRules, fitStars, pieceOffsets } from '../../domain/games/fit/FitRules';
import type { GameEvent } from '../../domain/ports';
import { LEVEL_COUNT, recordLevel } from '../../app/progress';
import { sfx } from '../../infra/audio';
import { t } from '../../infra/i18n';
import { BoardView, ghostPiece } from '../board/BoardView';
import { PlacementController } from '../board/PlacementController';
import { iconBtn } from '../ui';
import type { GameController, GameShell } from './types';

/** Hexa Fit — La Colmena. */
export function createFit(shell: GameShell): GameController {
  const engine = new GameEngine(new FitRules());
  engine.start(shell.level);

  const board = new BoardView(engine.state.board.keys(), { cell: 26 });
  shell.boardWrap.append(board.el);
  shell.boardWrap.insertAdjacentHTML('beforeend', iconBtn('retry', t('rotate'), 'hx-ibtn--sm rotate-btn', 'data-rotate'));
  const rotateBtn = shell.boardWrap.querySelector<HTMLButtonElement>('[data-rotate]')!;
  shell.hudRight.innerHTML = `<div class="hud-pair">${iconBtn('undo', t('undo'), 'hx-ibtn--sm', 'data-undo')}${iconBtn('redo', t('redo'), 'hx-ibtn--sm', 'data-redo')}</div>`;
  const undoBtn = shell.hudRight.querySelector<HTMLButtonElement>('[data-undo]')!;
  const redoBtn = shell.hudRight.querySelector<HTMLButtonElement>('[data-redo]')!;
  shell.top.innerHTML = '<div class="hx-timer"><div class="hx-timer__fill"></div></div>';
  const timerFill = shell.top.querySelector<HTMLElement>('.hx-timer__fill')!;

  // reloj: 90 s que no hacen perder, solo bajan una estrella
  let startedAt = 0, pausedAt = 0, pausedTotal = 0, running = false;
  const elapsed = () => !running ? 0 : (pausedAt || performance.now()) - startedAt - pausedTotal;

  const paint = (k: HexKey) => {
    const id = engine.state.board.get(k);
    return id === null ? null : { color: engine.state.pieces[id].color };
  };

  function draw(snap: HexKey[] = []): void {
    board.render(paint);
    if (snap.length) board.animate(snap, 'hx-anim-snap');
    const st = engine.state;
    const placed = st.pieces.filter(p => p.placedAt !== null).length;
    shell.setCenter(t('levelN', { n: st.level }), `${placed} / ${st.pieces.length}`, t('pieces'));
    undoBtn.disabled = !engine.canUndo;
    redoBtn.disabled = !engine.canRedo;
    drawTray();
  }
  function drawTray(): void {
    const sel = placement?.selection ?? null;
    shell.tray.innerHTML = engine.state.pieces.map((p, i) =>
      `<div class="hx-tray__slot${p.placedAt ? ' is-used' : ''}" data-slot="${i}">${H.piece({ cells: pieceOffsets(p).map(c => [c.q, c.r] as H.Pt), color: p.color, cell: 9 })}</div>`).join('');
    const keep = sel !== null && engine.state.pieces[sel]?.placedAt === null ? sel : null;
    placement?.select(keep);
    rotateBtn.disabled = keep === null;
  }

  let events: GameEvent[] = [];
  const off = engine.on(e => events.push(e));
  function play(m: FitMove): boolean {
    events = [];
    if (!engine.play(m)) return false;
    const placed = events.find(e => e.type === 'placed') as Extract<GameEvent, { type: 'placed' }> | undefined;
    draw(placed?.keys ?? []);
    checkEnd();
    return true;
  }

  function checkEnd(): void {
    if (engine.status !== 'won') return;
    const st = engine.state;
    const stars = fitStars(st.moves, st.pieces.length, elapsed());
    recordLevel('fit', st.level, stars);
    timerFill.style.animationPlayState = 'paused';
    const last = st.level >= LEVEL_COUNT;
    shell.end({
      win: true, title: t('victory'), stars, ribbon: { label: t('levelN', { n: st.level }) },
      primary: last ? { label: t('levels'), action: shell.actions.levels } : { label: t('next'), action: shell.actions.next },
      secondary: last ? { label: t('map'), action: shell.actions.map } : undefined,
    });
  }

  const rotate = (slot: number) => { if (play({ type: 'rotate', piece: slot })) sfx('tap'); };

  const placement = new PlacementController({
    board, tray: shell.tray,
    offsets: s => { const p = engine.state.pieces[s]; return p && p.placedAt === null ? pieceOffsets(p) : null; },
    color: s => engine.state.pieces[s].color,
    ghost: (s, px) => { const p = engine.state.pieces[s]; return ghostPiece(pieceOffsets(p), p.color, px); },
    canPlace: (s, a) => engine.isValid({ type: 'place', piece: s, anchor: a }),
    place: (s, a) => { if (play({ type: 'place', piece: s, anchor: a })) sfx('place'); },
    onSelect: (s, again) => {
      if (engine.state.pieces[s].placedAt !== null) { placement.select(null); return; }
      if (again && shell.isActive()) rotate(s);
      rotateBtn.disabled = false;
    },
    onBoardTap: k => {
      const id = engine.state.board.get(k);
      if (id !== null && shell.isActive()) { play({ type: 'remove', piece: id }); sfx('tap'); }
    },
    onInvalid: () => sfx('invalid'),
    enabled: () => shell.isActive(),
  });

  rotateBtn.addEventListener('click', () => {
    const s = placement.selection;
    if (s !== null && shell.isActive()) rotate(s);
  });
  undoBtn.addEventListener('click', () => { if (shell.isActive() && engine.undo()) draw(); });
  redoBtn.addEventListener('click', () => { if (shell.isActive() && engine.redo()) { draw(); checkEnd(); } });

  draw();

  return {
    onStart() {
      if (running) return;
      running = true;
      startedAt = performance.now();
      timerFill.style.animation = `hx-drain ${FIT_TIME_MS}ms linear forwards`;
    },
    onPause(p) {
      if (!running) return;
      if (p) { pausedAt = performance.now(); timerFill.style.animationPlayState = 'paused'; }
      else { pausedTotal += performance.now() - pausedAt; pausedAt = 0; timerFill.style.animationPlayState = 'running'; }
    },
    destroy() { off(); placement.destroy(); },
  };
}
