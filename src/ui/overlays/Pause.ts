import * as H from '../../design-system/hexablock';
import { progress, save } from '../../app/progress';
import { setMusic, setSound } from '../../infra/audio';
import { t } from '../../infra/i18n';
import { el, signHTML, toggleHTML } from '../ui';

export interface PauseActions { resume(): void; restart(): void; exit(): void; howTo(): void; exitLabel: string }

/** Letrero "Pausa": continuar, reiniciar, salir, cómo jugar y los interruptores de sonido y música. */
export function showPause(parent: HTMLElement, a: PauseActions): void {
  const body = `
    <div class="btn-col">
      <button class="hx-btn" data-a="resume">${t('continue')}</button>
      <button class="hx-btn hx-btn--secondary" data-a="restart">${t('restart')}</button>
      <button class="hx-btn hx-btn--secondary" data-a="exit">${a.exitLabel}</button>
      <button class="hx-btn hx-btn--secondary" data-a="howTo">${t('howTo')}</button>
    </div>
    <div class="settings-list">
      <div class="hx-setting"><span>${H.icon('sound', 22)}${t('sound')}</span>${toggleHTML('sound', t('sound'), progress.settings.sound)}</div>
      <div class="hx-setting"><span>${H.icon('music', 22)}${t('music')}</span>${toggleHTML('music', t('music'), progress.settings.music)}</div>
    </div>`;
  const ov = el(`<div class="overlay dim" role="dialog" aria-modal="true"><div class="sign-wrap">${signHTML({ title: t('pause'), body })}</div></div>`);
  const close = () => ov.remove();
  ov.addEventListener('click', e => {
    const target = e.target as HTMLElement;
    const btn = target.closest<HTMLElement>('[data-a]');
    if (btn) {
      close();
      const act = btn.dataset.a as 'resume' | 'restart' | 'exit' | 'howTo';
      a[act]();
      return;
    }
    const tg = target.closest<HTMLElement>('[data-toggle]');
    if (tg) {
      const on = tg.getAttribute('aria-checked') !== 'true';
      tg.setAttribute('aria-checked', String(on));
      if (tg.dataset.toggle === 'sound') { progress.settings.sound = on; setSound(on); }
      else { progress.settings.music = on; setMusic(on); }
      save();
    }
  });
  parent.append(ov);
}
