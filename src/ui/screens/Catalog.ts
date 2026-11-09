import * as H from '../../design-system/hexablock';
import { SHAPES, boardGeometry, createGeometry } from '../../domain/geometry/GeometryFactory';
import { Shape, progress, setShape } from '../../app/progress';
import { t } from '../../infra/i18n';
import { go, Screen } from '../router';
import { sampleBoard } from '../board/BoardView';
import { el, hexi, iconBtn, signHTML } from '../ui';
import { groundArt } from './art';

/** Texto de reglas de una figura, sacado de su geometría: vecinas, ejes de líneas y giro. */
function ruleText(shape: Shape): string {
  const g = createGeometry(shape);
  const axes = g.withCells(g.cells(2)).directions().length / 2;
  return t('shapeRule', { n: g.adjacent(g.origin).length, lines: t('axesN', { n: axes }), deg: 360 / g.rotationSteps });
}

/**
 * Catálogo de figuras: una sola elección que es a la vez la forma del tablero y la de las fichas.
 * Cambia los juegos, la vista previa, los botones de nivel y la mascota.
 */
export function CatalogScreen(): Screen {
  const s = el(`<section class="scr menu">
    ${groundArt()}
    <div class="menu__top">${iconBtn('back', t('back'), 'hx-ibtn--sm hx-ibtn--panel', 'data-back')}</div>
    <div class="menu__body menu__body--scroll" data-body></div>
  </section>`);
  const body = s.querySelector<HTMLElement>('[data-body]')!;

  function draw(): void {
    const shape = progress.shape;
    const choices = SHAPES.map(sh => {
      const g = createGeometry(sh);
      return `<button class="hx-choice choice-shape" data-shape="${sh}" aria-pressed="${shape === sh}">
        ${H.shape({ sides: g.sides, size: 36, color: 'game-merge' })}${t(`shape.${sh}`)}
      </button>`;
    }).join('');
    const g = createGeometry(shape);
    const content = `
      <div class="catalog">
        <div class="hx-label catalog__label">${t('shapeLabel')}</div>
        <div class="catalog__row catalog__row--wrap">${choices}</div>
        <div class="catalog__preview">
          <div class="hx-screen hx-screen--merge catalog__board">${sampleBoard(boardGeometry(shape, 2))}</div>
          <div class="catalog__hexi">${hexi({ sides: g.sides, mood: 'celebra', size: 84 })}</div>
        </div>
        <div class="catalog__caption">${t(`shape.${shape}`)}</div>
        <div class="hx-label">${ruleText(shape)}</div>
      </div>`;
    const first = !body.firstChild;
    body.innerHTML = signHTML({ title: t('shapes'), body: content, cls: first ? '' : 'no-drop' });
  }
  draw();

  s.addEventListener('click', e => {
    const tgt = e.target as HTMLElement;
    if (tgt.closest('[data-back]')) { go({ name: 'settings' }); return; }
    const c = tgt.closest<HTMLElement>('[data-shape]');
    if (c) { setShape(c.dataset.shape as Shape); draw(); }
  });
  return { el: s };
}
