import type { GameId } from '../../design-system/hexablock';
import { LEVEL_COUNT } from '../../app/progress';
import { sfx } from '../../infra/audio';
import { t } from '../../infra/i18n';
import { createFit } from '../games/FitGame';
import { createLines } from '../games/LinesGame';
import { createMerge } from '../games/MergeGame';
import { createSort } from '../games/SortGame';
import type { GameController, GameFactory, GameShell } from '../games/types';
import { showInstruction } from '../overlays/Instruction';
import { showPause } from '../overlays/Pause';
import { showResult } from '../overlays/Result';
import { go, Route, Screen } from '../router';
import { el, esc, iconBtn } from '../ui';

const FACTORIES: Record<GameId, GameFactory> = { lines: createLines, fit: createFit, sort: createSort, merge: createMerge };

/** Partida: estructura común de los cuatro juegos. */
export function GameScreen(r: Extract<Route, { name: 'game' }>): Screen {
  const game = r.game;
  const level = r.level ?? 1;
  const leveled = game === 'fit' || game === 'sort';
  const s = el(`<section class="scr game hx-screen--${game}">
    <div class="game__top" data-top></div>
    <div class="hx-hud">
      ${iconBtn('pause', t('pause'), 'hx-ibtn--round', 'data-pause')}
      <div class="hx-hud__score" data-center></div>
      <div class="hud-right" data-right></div>
    </div>
    <div class="game__sub" data-sub></div>
    <div class="game__board" data-board></div>
    <div class="hx-tray game__tray"><div class="hx-tray__in" data-tray></div></div>
  </section>`);
  const q = (sel: string) => s.querySelector<HTMLElement>(sel)!;

  let ctrl: GameController;
  let paused = false, ended = false, intro = true;
  let endTimer: number | undefined;

  const shell: GameShell = {
    game, level, root: s,
    top: q('[data-top]'), hudCenter: q('[data-center]'), hudRight: q('[data-right]'),
    sub: q('[data-sub]'), boardWrap: q('[data-board]'), tray: q('[data-tray]'),
    isActive: () => !paused && !ended && !intro,
    setCenter(label, value, small) {
      shell.hudCenter.innerHTML = `<small>${esc(label)}</small><b>${esc(value)}</b>${small != null ? `<small>${esc(small)}</small>` : ''}`;
    },
    end(spec, delayMs = 450) {
      ended = true;
      endTimer = window.setTimeout(() => {
        sfx(spec.win ? 'win' : 'lose');
        showResult(s, { ...spec, secondary: spec.secondary ?? (leveled ? { label: t('levels'), action: shell.actions.levels } : { label: t('map'), action: shell.actions.map }) });
      }, delayMs);
    },
    reopen() { ended = false; },
    actions: {
      again: () => restart(),
      next: () => go(level < LEVEL_COUNT ? { name: 'game', game, level: level + 1 } : { name: 'levels', game: game as 'fit' }),
      map: () => go({ name: 'map', open: game }),
      levels: () => go({ name: 'levels', game: game as 'fit' | 'sort' }),
    },
  };

  function mount(): void {
    [shell.top, shell.hudCenter, shell.hudRight, shell.sub, shell.boardWrap, shell.tray].forEach(e => { e.innerHTML = ''; });
    ended = false;
    ctrl = FACTORIES[game](shell);
  }
  function restart(): void {
    clearTimeout(endTimer);
    ctrl.destroy();
    mount();
    ctrl.onStart?.();
  }

  q('[data-pause]').addEventListener('click', () => {
    if (ended || paused) return;
    paused = true;
    ctrl.onPause?.(true);
    showPause(s, {
      resume: () => { paused = false; ctrl.onPause?.(false); },
      restart: () => { paused = false; restart(); },
      exit: leveled ? shell.actions.levels : shell.actions.map,
      exitLabel: leveled ? t('levels') : t('map'),
    });
  });

  mount();
  showInstruction(s, game, () => { intro = false; ctrl.onStart?.(); });

  return { el: s, destroy: () => { clearTimeout(endTimer); ctrl.destroy(); } };
}
