import * as H from '../../design-system/hexablock';
import { progress, save } from '../../app/progress';
import { setMusic, setSound } from '../../infra/audio';
import { Lang, setLang, t } from '../../infra/i18n';
import { go, Screen } from '../router';
import { el, iconBtn, signHTML, toggleHTML } from '../ui';
import { groundArt } from './art';

/** Ajustes: sonido, música, idioma y acceso al catálogo de figuras. */
export function SettingsScreen(): Screen {
  const st = progress.settings;
  const pill = (l: Lang) => `<button class="hx-pill" data-lang="${l}" aria-pressed="${st.lang === l}">${l.toUpperCase()}</button>`;
  const body = `<div class="settings-list">
    <div class="hx-setting"><span>${H.icon('sound', 22)}${t('sound')}</span>${toggleHTML('sound', t('sound'), st.sound)}</div>
    <div class="hx-setting"><span>${H.icon('music', 22)}${t('music')}</span>${toggleHTML('music', t('music'), st.music)}</div>
    <div class="hx-setting"><span>${H.icon('globe', 22)}${t('language')}</span><div class="hx-pills">${pill('es')}${pill('en')}</div></div>
    <div class="hx-setting"><span>${H.icon('shapes', 22)}${t('shapes')}</span><button class="hx-btn hx-btn--secondary btn-small" data-catalog>${t('catalog')}</button></div>
  </div>`;
  const s = el(`<section class="scr menu">
    ${groundArt()}
    <div class="menu__top">${iconBtn('back', t('back'), 'hx-ibtn--sm hx-ibtn--panel', 'data-back')}</div>
    <div class="menu__body">${signHTML({ title: t('settings'), body })}</div>
  </section>`);
  s.addEventListener('click', e => {
    const tgt = e.target as HTMLElement;
    if (tgt.closest('[data-back]')) { go({ name: 'map' }); return; }
    if (tgt.closest('[data-catalog]')) { go({ name: 'catalog' }); return; }
    const tg = tgt.closest<HTMLElement>('[data-toggle]');
    if (tg) {
      const on = tg.getAttribute('aria-checked') !== 'true';
      tg.setAttribute('aria-checked', String(on));
      if (tg.dataset.toggle === 'sound') { st.sound = on; setSound(on); } else { st.music = on; setMusic(on); }
      save();
      return;
    }
    const lp = tgt.closest<HTMLElement>('[data-lang]');
    if (lp && lp.dataset.lang !== st.lang) {
      st.lang = lp.dataset.lang as Lang;
      setLang(st.lang);
      save();
      go({ name: 'settings' }); // vuelve a dibujar en el idioma nuevo
    }
  });
  return { el: s };
}
