import { unlockAudio } from '../../infra/audio';
import { t } from '../../infra/i18n';
import { go, Screen } from '../router';
import { el, hexi } from '../ui';
import { groundArt } from './art';

/** Inicio: logo, Hexi y JUGAR. El primer toque desbloquea el audio. */
export function HomeScreen(): Screen {
  const s = el(`<section class="scr home">
    ${groundArt()}
    <div class="home__logo">
      <h1 class="display-xl home__title">HexaBlock</h1>
      <div class="title home__suite">${t('suite')}</div>
    </div>
    <div class="home__hexi">${hexi({ mood: 'feliz', size: 150 })}</div>
    <div class="home__cta">
      <div class="hx-label">${t('tapToPlay')}</div>
      <button class="hx-btn" data-play>${t('play')}</button>
    </div>
  </section>`);
  s.addEventListener('click', () => { unlockAudio(); go({ name: 'map' }); });
  return { el: s };
}
