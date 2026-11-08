import type { GameId } from '../../design-system/hexablock';
import { t } from '../../infra/i18n';
import { el } from '../ui';

/** Verbo enorme y subtítulo: 1.1 s o hasta que el jugador toque. */
export function showInstruction(parent: HTMLElement, game: GameId, onDone: () => void): void {
  const ov = el(`<div class="overlay instruction hx-instruction hx-screen--${game} is-playing" role="dialog" aria-live="polite">
    <span class="hx-instruction__verb">${t(`verb.${game}`)}</span>
    <span class="hx-instruction__sub">${t(`sub.${game}`)}</span>
  </div>`);
  let done = false;
  const close = () => {
    if (done) return;
    done = true;
    ov.classList.add('is-leaving');
    onDone();
    setTimeout(() => ov.remove(), 280);
  };
  ov.addEventListener('pointerdown', close);
  parent.append(ov);
  setTimeout(close, 1100);
}
