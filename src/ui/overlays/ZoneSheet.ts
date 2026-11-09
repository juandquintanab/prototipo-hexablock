import * as H from '../../design-system/hexablock';
import { LEVEL_COUNT, bestOf, levelsWon, markTutorialSeen, zoneStars } from '../../app/progress';
import { t } from '../../infra/i18n';
import { appRoot, go } from '../router';
import { showTutorial } from './Tutorial';
import { el, iconBtn, ribbonHTML, signHTML, starsHTML } from '../ui';

/** Letrero de zona que cae desde abajo del mapa. */
export function showZoneSheet(parent: HTMLElement, game: H.GameId, onClose: () => void): HTMLElement {
  const g = H.GAMES.find(x => x.id === game)!;
  const leveled = game === 'fit' || game === 'sort';
  const ribbon = leveled
    ? ribbonHTML(t('levels'), `${levelsWon(game)} / ${LEVEL_COUNT}`)
    : ribbonHTML(t('yourBest'), H.fmt(bestOf(game)));
  const body = `<div class="hx-label">${g.name}</div>
    ${starsHTML(zoneStars(game))}
    <div style="margin-top:10px">${ribbon}</div>
    <div class="zone-actions">
      <button class="hx-btn" data-play>${t('play')}</button>
      <button class="hx-btn hx-btn--secondary btn-small" data-howto>${t('howTo')}</button>
    </div>`;
  const close = iconBtn('close', t('close'), 'hx-ibtn--sm hx-ibtn--panel sheet-close', 'data-close');
  const sheet = el(`<div class="hx-map__sheet zone-sheet">${signHTML({ title: t(`world.${game}`), body, width: 260, titleSize: 28, extra: close })}</div>`);
  sheet.addEventListener('click', e => {
    const tgt = e.target as HTMLElement;
    if (tgt.closest('[data-close]')) { sheet.remove(); onClose(); }
    if (tgt.closest('[data-play]')) go(leveled ? { name: 'levels', game } : { name: 'game', game }, { curtain: !leveled });
    // sobre toda la app (no dentro del mapa, para que tocar el tutorial no cierre el letrero)
    if (tgt.closest('[data-howto]')) showTutorial(appRoot(), game, () => markTutorialSeen(game));
  });
  parent.append(sheet);
  return sheet;
}
