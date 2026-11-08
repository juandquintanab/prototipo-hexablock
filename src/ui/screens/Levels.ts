import * as H from '../../design-system/hexablock';
import { LEVEL_COUNT, isUnlocked, progress } from '../../app/progress';
import { t } from '../../infra/i18n';
import { go, Route, Screen } from '../router';
import { el, hexi, iconBtn, signHTML } from '../ui';
import { groundArt } from './art';

/** Selección de niveles de Fit y Sort: 6 LevelTile. */
export function LevelsScreen(r: Extract<Route, { name: 'levels' }>): Screen {
  const game = r.game;
  const g = H.GAMES.find(x => x.id === game)!;
  const stars = progress[game].stars;
  const current = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).find(l => isUnlocked(game, l) && stars[l - 1] === 0);
  const tiles = stars.map((st, i) => {
    const lv = i + 1;
    const locked = !isUnlocked(game, lv);
    const cur = lv === current;
    const col = locked ? 'disabled' : cur ? 'sun-400' : `game-${game}`;
    const starRow = st > 0 ? `<div class="hx-stars">${H.star(st > 0, 16)}${H.star(st > 1, 18)}${H.star(st > 2, 16)}</div>` : '<div style="height:22px"></div>';
    return `<button class="hx-level${locked ? ' is-locked' : ''}${cur ? ' is-current' : ''}" data-level="${lv}" ${locked ? 'disabled' : ''} aria-label="${t('levelN', { n: lv })}${locked ? ' · ' + t('locked') : ''}">
      <div class="hx-level__hex">${H.shape({ sides: 6, size: 72, color: col, depth: 7 })}<span class="hx-level__num">${locked ? H.icon('lock', 26) : lv}</span></div>${starRow}</button>`;
  }).join('');
  const body = `<div class="hx-label">${g.name}</div><div class="level-grid">${tiles}</div>`;
  const s = el(`<section class="scr menu">
    ${groundArt()}
    <div class="menu__top">${iconBtn('back', t('back'), 'hx-ibtn--sm hx-ibtn--panel', 'data-back')}</div>
    <div class="menu__body">
      ${signHTML({ title: t(`world.${game}`), body, width: 260, titleSize: 28, posts: true })}
      <div class="menu__hexi">${hexi({ mood: 'feliz', size: 84, color: `game-${game}` })}</div>
    </div>
  </section>`);
  s.addEventListener('click', e => {
    const tgt = e.target as HTMLElement;
    if (tgt.closest('[data-back]')) { go({ name: 'map', open: game }); return; }
    const b = tgt.closest<HTMLButtonElement>('[data-level]');
    if (b && !b.disabled) go({ name: 'game', game, level: Number(b.dataset.level) });
  });
  return { el: s };
}
