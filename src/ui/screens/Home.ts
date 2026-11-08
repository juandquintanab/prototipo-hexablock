import * as H from '../../design-system/hexablock';
import { currentGeometry } from '../../app/progress';
import { unlockAudio } from '../../infra/audio';
import { t } from '../../infra/i18n';
import { go, Screen } from '../router';
import { el, hexi } from '../ui';
import { groundArt } from './art';

/** Fichas de colores que caen girando despacio detrás del logo (algunas con cara), como en Logo/preview. */
function fallingTiles(): string {
  const sides = currentGeometry().sides;
  let s = '';
  for (let i = 0; i < 14; i++) {
    s += `<span class="home__fall" style="left:${(i * 7.3) % 96}%;animation-duration:${5 + (i * 1.7) % 4}s;animation-delay:-${i * 0.9}s">` +
      H.shape({ sides, size: 30 + (i * 5) % 18, color: H.PIECES[i % 8], face: i % 3 === 0 }) + '</span>';
  }
  return s;
}

/** Inicio: logo pegatina, Hexi y JUGAR. El primer toque desbloquea el audio. */
export function HomeScreen(): Screen {
  const s = el(`<section class="scr home">
    ${groundArt()}
    <div class="home__falling" aria-hidden="true">${fallingTiles()}</div>
    <h1 class="home__logo">${H.logo({ width: 360 })}</h1>
    <div class="home__hexi">${hexi({ mood: 'feliz', size: 150 })}</div>
    <div class="home__cta">
      <div class="hx-label">${t('tapToPlay')}</div>
      <button class="hx-btn" data-play>${t('play')}</button>
    </div>
  </section>`);
  s.addEventListener('click', () => { unlockAudio(); go({ name: 'map' }, { curtain: true }); });
  return { el: s };
}
