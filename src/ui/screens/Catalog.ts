import * as H from '../../design-system/hexablock';
import { BoardShape, progress, save } from '../../app/progress';
import { t } from '../../infra/i18n';
import { go, Screen } from '../router';
import { el, hexi, iconBtn, signHTML } from '../ui';
import { groundArt } from './art';

const GEOS: [BoardShape, number][] = [['tri', 3], ['square', 4], ['hex', 6]];

/**
 * Catálogo de figuras: solo apariencia. La elección se guarda, pero el resto de la app sigue en hexágono.
 * TODO: conectar geometría (Factory Method) y forma de ficha (Strategy)
 */
export function CatalogScreen(): Screen {
  const s = el(`<section class="scr menu">
    ${groundArt()}
    <div class="menu__top">${iconBtn('back', t('back'), 'hx-ibtn--sm hx-ibtn--panel', 'data-back')}</div>
    <div class="menu__body menu__body--scroll" data-body></div>
  </section>`);
  const body = s.querySelector<HTMLElement>('[data-body]')!;

  function draw(): void {
    const sh = progress.shape;
    const geoBtns = GEOS.map(([g, n]) =>
      `<button class="hx-choice choice-geo" data-geo="${g}" aria-pressed="${sh.board === g}">${H.shape({ sides: n, size: 36, color: 'game-merge' })}${t(`geo.${g}`)}</button>`).join('');
    let sideBtns = '';
    for (let n = 3; n <= 10; n++) sideBtns += `<button class="hx-choice choice-side" data-sides="${n}" aria-pressed="${sh.pieceSides === n}">${H.shape({ sides: n, size: 28, color: 'piece-purple' })}${n}</button>`;
    const cell = sh.board === 'tri' ? 15 : sh.board === 'square' ? 13 : 16;
    const preview = H.board({ geo: sh.board, size: 2, cell, pieceSides: sh.pieceSides, fill: (_c, i) => (i * 7) % 3 === 0 ? H.PIECES[i % 8] : null });
    const caption = t('shapeCaption', { geo: t(`geo.${sh.board}`).toLowerCase(), sides: t(`sides.${sh.pieceSides}` as 'sides.6') });
    const content = `
      <div class="catalog">
        <div class="hx-label catalog__label">${t('boardLabel')}</div>
        <div class="catalog__row">${geoBtns}</div>
        <div class="hx-label catalog__label">${t('pieceLabel')}</div>
        <div class="catalog__row catalog__row--wrap">${sideBtns}</div>
        <div class="catalog__preview">
          <div class="hx-screen hx-screen--merge catalog__board">${preview}</div>
          <div class="catalog__hexi">${hexi({ sides: sh.pieceSides, mood: 'celebra', size: 84 })}</div>
        </div>
        <div class="catalog__caption">${caption}</div>
        <div class="hx-label">${t(`rule.${sh.board}`)}</div>
        <div class="hx-label catalog__note">${t('hexNote')}</div>
      </div>`;
    const first = !body.firstChild;
    body.innerHTML = signHTML({ title: t('shapes'), body: content, cls: first ? '' : 'no-drop' });
  }
  draw();

  s.addEventListener('click', e => {
    const tgt = e.target as HTMLElement;
    if (tgt.closest('[data-back]')) { go({ name: 'settings' }); return; }
    const g = tgt.closest<HTMLElement>('[data-geo]');
    if (g) {
      const geo = g.dataset.geo as BoardShape;
      progress.shape.board = geo;
      progress.shape.pieceSides = GEOS.find(x => x[0] === geo)![1]; // vuelve a su figura natural
      save(); draw(); return;
    }
    const n = tgt.closest<HTMLElement>('[data-sides]');
    if (n) { progress.shape.pieceSides = Number(n.dataset.sides); save(); draw(); }
  });
  return { el: s };
}
