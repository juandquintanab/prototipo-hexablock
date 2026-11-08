import type { GameId } from '../../design-system/hexablock';
import { canPlay } from '../../app/progress';
import { t } from '../../infra/i18n';
import { revealDelay } from '../router';
import { el } from '../ui';

/**
 * Verbo enorme y subtítulo: 1.1 s o hasta que el jugador toque.
 * Si la figura elegida no sirve para este juego (pentágono en Lines o Merge), lo dice en una línea
 * y se queda un poco más para que alcance a leerse.
 */
export function showInstruction(parent: HTMLElement, game: GameId, onDone: () => void): void {
  const fallback = !canPlay(game);
  const ov = el(`<div class="overlay instruction hx-instruction hx-screen--${game} is-playing" role="dialog" aria-live="polite">
    <span class="hx-instruction__verb">${t(`verb.${game}`)}</span>
    <span class="hx-instruction__sub">${t(`sub.${game}`)}</span>
    ${fallback ? `<span class="instruction__note">${t('hexFallback')}</span>` : ''}
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
  // si llegamos tras la cortina, el tiempo de lectura empieza cuando terminó de destaparse
  setTimeout(close, (fallback ? 2200 : 1100) + revealDelay());
}
