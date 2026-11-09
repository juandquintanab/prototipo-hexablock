import * as H from '../../design-system/hexablock';
import type { GameId } from '../../design-system/hexablock';
import { LEVEL_COUNT, markTutorialSeen, tutorialSeen } from '../../app/progress';
import { sfx } from '../../infra/audio';
import { t } from '../../infra/i18n';
import { createFit } from '../games/FitGame';
import { createLines } from '../games/LinesGame';
import { createMerge } from '../games/MergeGame';
import { createSort } from '../games/SortGame';
import type { GameController, GameFactory, GameShell } from '../games/types';
import { Juice } from '../games/juice';
import { showInstruction } from '../overlays/Instruction';
import { showPause } from '../overlays/Pause';
import { showTutorial } from '../overlays/Tutorial';
import { showResult } from '../overlays/Result';
import { go, Route, Screen } from '../router';
import { el, esc, hexi, iconBtn } from '../ui';

const FACTORIES: Record<GameId, GameFactory> = { lines: createLines, fit: createFit, sort: createSort, merge: createMerge };

/** Partida: estructura común de los cuatro juegos. */
export function GameScreen(r: Extract<Route, { name: 'game' }>): Screen {
  const game = r.game;
  const level = r.level ?? 1;
  const leveled = game === 'fit' || game === 'sort';
  const s = el(`<section class="scr game hx-screen hx-screen--${game}">
    ${H.scene(game)}
    <div class="game__top" data-top></div>
    <div class="hx-hud">
      ${iconBtn('pause', t('pause'), 'hx-ibtn--round', 'data-pause')}
      <div class="hx-hud__score" data-center></div>
      <div class="hud-right" data-right></div>
    </div>
    <div class="game__sub" data-sub></div>
    <div class="game__board" data-board></div>
    <div class="hx-tray game__tray"><div class="hx-tray__in" data-tray></div><div class="game__hexi" data-hexi aria-hidden="true"></div></div>
  </section>`);
  const q = (sel: string) => s.querySelector<HTMLElement>(sel)!;

  let ctrl: GameController;
  let paused = false, ended = false, intro = true;
  let endTimer: number | undefined;
  // HUD: el número cuenta desde el valor anterior hasta el nuevo (countUp)
  let shownValue: number | null = null, countFrame = 0;
  const countTo = (el: HTMLElement, from: number, to: number, ms = 420) => {
    cancelAnimationFrame(countFrame);
    let t0: number | null = null;
    const step = (now: number) => {
      t0 ??= now;
      const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      el.textContent = H.fmt(from + (to - from) * e);
      if (k < 1) countFrame = requestAnimationFrame(step);
    };
    countFrame = requestAnimationFrame(step);
  };

  // Hexi en la esquina: humor de base + reacciones cortas
  const hexiEl = q('[data-hexi]');
  let baseMood: H.Mood = 'feliz', shownMood: H.Mood | null = null, moodTimer = 0;
  const showMood = (m: H.Mood) => {
    if (m === shownMood) return;
    shownMood = m;
    hexiEl.innerHTML = hexi({ mood: m, size: 56 });
  };

  const shell: GameShell = {
    game, level, root: s,
    top: q('[data-top]'), hudCenter: q('[data-center]'), hudRight: q('[data-right]'),
    sub: q('[data-sub]'), boardWrap: q('[data-board]'), tray: q('[data-tray]'),
    juice: new Juice(s),
    mood(m, ms) {
      if (ended) return;
      if (ms == null) {
        baseMood = m;
        if (!moodTimer) showMood(m);
        return;
      }
      clearTimeout(moodTimer);
      showMood(m);
      moodTimer = window.setTimeout(() => { moodTimer = 0; showMood(baseMood); }, ms);
    },
    isActive: () => !paused && !ended && !intro,
    setCenter(label, value, small) {
      const numeric = typeof value === 'number';
      shell.hudCenter.innerHTML = `<small>${esc(label)}</small><b>${numeric ? H.fmt(shownValue ?? value) : esc(value)}</b>${small != null ? `<small>${esc(small)}</small>` : ''}`;
      if (numeric) {
        const b = shell.hudCenter.querySelector('b')!;
        if (shownValue !== null && shownValue !== value) countTo(b, shownValue, value);
        shownValue = value;
      }
    },
    end(spec, delayMs = 450) {
      clearTimeout(moodTimer);
      moodTimer = 0;
      showMood(spec.win ? 'celebra' : 'triste');
      ended = true;
      endTimer = window.setTimeout(() => {
        sfx(spec.win ? 'win' : 'lose');
        showResult(s, { ...spec, secondary: spec.secondary ?? (leveled ? { label: t('levels'), action: shell.actions.levels } : { label: t('map'), action: shell.actions.map }) });
        if (spec.win || spec.celebrate) shell.juice.confetti();
      }, delayMs);
    },
    reopen() { ended = false; showMood(baseMood); },
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
    shownValue = null;
    cancelAnimationFrame(countFrame);
    clearTimeout(moodTimer);
    moodTimer = 0;
    baseMood = 'feliz';
    showMood('feliz');
    ctrl = FACTORIES[game](shell);
  }
  function restart(): void {
    clearTimeout(endTimer);
    ctrl.destroy();
    mount();
    ctrl.onStart?.();
  }

  // Pausa (con "¿Cómo jugar?": al cerrar el tutorial vuelve al letrero de pausa)
  const openPause = () => {
    showPause(s, {
      resume: () => { paused = false; ctrl.onPause?.(false); },
      restart: () => { paused = false; restart(); },
      exit: leveled ? shell.actions.levels : shell.actions.map,
      howTo: () => showTutorial(s, game, () => { markTutorialSeen(game); openPause(); }),
      exitLabel: leveled ? t('levels') : t('map'),
    });
  };
  q('[data-pause]').addEventListener('click', () => {
    if (ended || paused) return;
    paused = true;
    ctrl.onPause?.(true);
    openPause();
  });

  mount();
  // la primera vez en cada juego: tutorial "Cómo jugar" y después la instrucción corta de siempre
  const startInstruction = () => showInstruction(s, game, () => { intro = false; ctrl.onStart?.(); });
  if (tutorialSeen(game)) startInstruction();
  else showTutorial(s, game, () => { markTutorialSeen(game); startInstruction(); });

  return { el: s, destroy: () => { clearTimeout(endTimer); clearTimeout(moodTimer); cancelAnimationFrame(countFrame); ctrl.destroy(); } };
}
