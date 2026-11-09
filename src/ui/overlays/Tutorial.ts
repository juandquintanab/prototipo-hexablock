import { boardGeometry } from '../../domain/geometry/GeometryFactory';
import { progress } from '../../app/progress';
import { I18nKey, t } from '../../infra/i18n';
import { el, esc, iconBtn, signHTML } from '../ui';
import { TutGame, tutorialArt } from './tutorialArt';

const STEPS = 3;
const SWIPE = 40;

/** Textos de un paso; algunos dependen de la figura (ejes de líneas, direcciones de Merge). */
function stepText(game: TutGame, step: number): { title: string; text: string } {
  const g = boardGeometry(progress.shape, 2);
  const params = { axes: g.directions().length / 2, dirs: g.directions().length };
  const base = `tut.${game}.${step + 1}`;
  return { title: t(`${base}.t` as I18nKey), text: t(`${base}.d` as I18nKey, params) };
}

/**
 * Tutorial "Cómo jugar": letrero de madera con 3 pasos (ilustración animada, título corto y una frase),
 * puntitos de paso, SIGUIENTE / ¡ENTENDIDO! y una X para saltar. También se puede deslizar entre pasos.
 */
export function showTutorial(parent: HTMLElement, game: TutGame, onDone: () => void): void {
  let step = 0;
  const ov = el(`<div class="overlay dim tutorial" role="dialog" aria-modal="true" aria-label="${esc(t('howToTitle'))}">
    <div class="sign-wrap">
      ${signHTML({
        title: t('howToTitle'),
        width: 210,
        titleSize: 30,
        extra: iconBtn('close', t('skip'), 'hx-ibtn--sm hx-ibtn--panel sheet-close', 'data-skip'),
        body: `<div class="tut-body" data-body></div>
          <div class="tut-dots" role="tablist">${Array.from({ length: STEPS }, (_, i) => `<span class="tut-dot" data-dot="${i}" role="tab"></span>`).join('')}</div>`,
      })}
      <div class="btn-col tut-actions"><button class="hx-btn" data-tut-next></button></div>
    </div>
  </div>`);
  const body = ov.querySelector<HTMLElement>('[data-body]')!;
  const next = ov.querySelector<HTMLButtonElement>('[data-tut-next]')!;

  function draw(dir: 1 | -1 = 1): void {
    const { title, text } = stepText(game, step);
    body.innerHTML = `<div class="tut-step tut-step--${dir > 0 ? 'in' : 'back'}">
      ${tutorialArt(game, step)}
      <div class="tut-title">${esc(title)}</div>
      <p class="tut-text">${esc(text)}</p>
    </div>`;
    ov.querySelectorAll<HTMLElement>('[data-dot]').forEach(d => {
      const on = Number(d.dataset.dot) === step;
      d.classList.toggle('is-on', on);
      d.setAttribute('aria-selected', String(on));
      d.setAttribute('aria-label', t('stepN', { n: Number(d.dataset.dot) + 1, total: STEPS }));
    });
    next.textContent = step === STEPS - 1 ? t('gotIt') : t('next');
  }

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    ov.remove();
    onDone();
  };
  const go = (to: number) => {
    if (to < 0 || to >= STEPS || to === step) return;
    const dir = to > step ? 1 : -1;
    step = to;
    draw(dir);
  };

  ov.addEventListener('click', e => {
    const tgt = e.target as HTMLElement;
    if (tgt.closest('[data-skip]')) { close(); return; }
    if (tgt.closest('[data-tut-next]')) { if (step === STEPS - 1) close(); else go(step + 1); return; }
    const dot = tgt.closest<HTMLElement>('[data-dot]');
    if (dot) go(Number(dot.dataset.dot));
  });
  // deslizar entre pasos
  let start: { x: number; y: number; id: number } | null = null;
  ov.addEventListener('pointerdown', e => { start = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
  ov.addEventListener('pointerup', e => {
    const s = start;
    start = null;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) >= SWIPE && Math.abs(dx) > Math.abs(dy)) go(step + (dx < 0 ? 1 : -1));
  });
  ov.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') go(step + 1);
    else if (e.key === 'ArrowLeft') go(step - 1);
    else if (e.key === 'Escape') close();
  });

  draw();
  parent.append(ov);
  next.focus({ preventScroll: true });
}
