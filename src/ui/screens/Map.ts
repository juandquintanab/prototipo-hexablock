import * as H from '../../design-system/hexablock';
import { totalStars, zoneStars } from '../../app/progress';
import { FEATURES } from '../../app/config';
import { t } from '../../infra/i18n';
import { showZoneSheet } from '../overlays/ZoneSheet';
import { go, Route, Screen } from '../router';
import { el, esc, hexi, iconBtn } from '../ui';

/** Posición y escala de cada mundo en el lienzo de 360×700 (de abajo hacia arriba: Lines, Fit, Sort, Merge). */
const POS: Record<H.GameId, [number, number, number]> = {
  merge: [204, 150, 0.95], sort: [14, 262, 0.95], fit: [204, 378, 0.95], lines: [14, 488, 0.95],
};
const PATH: [number, number][] = [[200, 676], [226, 640], [205, 604], [250, 572], [262, 520], [214, 476], [160, 466], [115, 444], [96, 400], [130, 366], [185, 350], [240, 330], [262, 290], [250, 256]];

function worldSign(x: number, y: number, title: string, stars: number): string {
  const h = 54, fs = title.length > 12 ? 13 : 15;
  let s = `<g transform="translate(${x} ${y})"><rect x="0" y="3" width="124" height="${h}" rx="8" style="fill:var(--wood-700)"/><rect x="0" y="0" width="124" height="${h}" rx="8" style="fill:var(--wood-500)"/>` +
    `<rect x="5" y="5" width="114" height="${h - 10}" rx="5" style="fill:var(--panel)"/>` +
    `<text x="62" y="19" text-anchor="middle" dominant-baseline="central" style="font-family:var(--font-display);font-variant-numeric:lining-nums;font-size:${fs}px;fill:var(--ink)">${esc(title)}</text>`;
  for (let i = 0; i < 3; i++) s += `<g transform="translate(${37 + i * 17} ${29 - (i === 1 ? 2 : 0)})">${H.star(i < stars, 16)}</g>`;
  return s + '</g>';
}

function art(): string {
  let s = '';
  // fondo extendido para que llene cualquier alto/ancho sin franjas
  s += '<rect x="-400" y="-600" width="1160" height="1400" style="fill:var(--sky)"/>';
  // mapa vivo (WorldMap/preview): nubes que cruzan despacio y pájaros volando
  ([[40, 60, 1, 0], [200, 96, 0.8, -14], [120, 140, 0.6, -26]] as const).forEach(([x, y, k, d]) => {
    s += `<g class="hx-cloud" style="animation-delay:${d}s"><ellipse cx="${x}" cy="${y}" rx="${34 * k}" ry="${12 * k}" style="fill:var(--panel)"/>` +
      `<ellipse cx="${x + 22 * k}" cy="${y - 8 * k}" rx="${20 * k}" ry="${12 * k}" style="fill:var(--panel)"/></g>`;
  });
  ([[70, 0], [96, -6], [84, -11]] as const).forEach(([y, d]) => {
    s += `<g class="hx-bird" style="animation-delay:${d}s"><path d="M0 ${y} q6 -6 12 0 q6 -6 12 0" fill="none" stroke-width="2.5" stroke-linecap="round" style="stroke:var(--ink)"/></g>`;
  });
  s += '<path d="M-400 200 L-120 120 L-20 200 L60 110 L130 190 L200 100 L290 180 L380 120 L470 190 L760 120 L760 230 L-400 230 Z" style="fill:var(--hill)"/>';
  s += '<path d="M-400 200 C -100 160, 80 150, 180 150 C 280 150, 460 160, 760 200 L760 900 L-400 900 Z" style="fill:var(--grass)"/>';
  s += '<path d="M-400 430 C 120 400, 240 440, 760 400 L760 900 L-400 900 Z" style="fill:var(--grass-700);opacity:.35"/>';
  PATH.forEach(p => { s += `<polygon points="${H.pts(H.ngon(6, 11, p[0], p[1], 0))}" style="fill:var(--panel-tan)"/>`; });
  // carrito con una ficha que recorre el camino de piedras de un mundo a otro
  const route = 'M' + PATH.map(p => `${p[0]} ${p[1]}`).join(' L');
  s += `<g class="hx-cart"><animateMotion dur="26s" repeatCount="indefinite" path="${route}"/><g transform="translate(-10 -20)">` +
    '<circle cx="5" cy="17" r="3.2" style="fill:var(--ink)"/><circle cx="15" cy="17" r="3.2" style="fill:var(--ink)"/>' +
    '<rect x="0" y="6" width="20" height="10" rx="3" style="fill:var(--wood-500)"/>' +
    `<polygon points="${H.pts(H.ngon(6, 6.5, 10, 2, -Math.PI / 2))}" style="fill:var(--piece-teal)"/></g></g>`;
  (Object.keys(POS) as H.GameId[]).forEach(id => {
    const p = POS[id];
    const name = t(`world.${id}`);
    // tres capas: el mundo (toque), el grupo que se levanta (world-lift) y la figurita con su animación propia
    s += `<g class="hx-map__world" data-id="${id}" tabindex="0" role="button" aria-label="${esc(name)}"><g class="world-lift">` +
      `<g transform="translate(${p[0]} ${p[1]}) scale(${p[2]})">${H.LANDMARKS[id]()}</g>` +
      worldSign(p[0] + 6, p[1] + 110 * p[2] + 4, name, zoneStars(id)) + '</g></g>';
  });
  s += `<g transform="translate(150 620)">${hexi({ size: 52 })}</g>`;
  return s;
}

/** Mapa de mundos: isla con camino de piedras y un mundo por juego. */
export function MapScreen(r: Extract<Route, { name: 'map' }>): Screen {
  const s = el(`<section class="scr map hx-map">
    <svg class="hx-map__art" viewBox="0 0 360 700" preserveAspectRatio="xMidYMax meet" role="img" aria-label="${t('worldMap')}">${art()}</svg>
    <div class="hx-map__hud">
      <span class="hx-counter" aria-label="${t('totalStars')}">${H.star(true, 24)}${totalStars()}</span>
      <div class="hud-btns">
        ${FEATURES.achievements ? iconBtn('trophy', t('achievements'), 'hx-ibtn--sm hx-ibtn--panel', 'data-go="achievements"') : ''}
        ${iconBtn('gear', t('settings'), 'hx-ibtn--sm hx-ibtn--panel', 'data-go="settings"')}
      </div>
    </div>
  </section>`);
  let sheet: HTMLElement | null = null;
  const select = (id: H.GameId | null) =>
    s.querySelectorAll<SVGGElement>('.hx-map__world').forEach(w => {
      w.classList.toggle('is-selected', w.dataset.id === id);
      if (w.dataset.id !== id) w.blur();
    });
  const close = () => { sheet?.remove(); sheet = null; select(null); };
  const open = (id: H.GameId) => {
    sheet?.remove();
    select(id);
    sheet = showZoneSheet(s, id, close);
  };
  s.addEventListener('click', e => {
    const tgt = e.target as Element;
    const nav = tgt.closest<HTMLElement>('[data-go]');
    if (nav) { go({ name: nav.dataset.go as 'settings' | 'achievements' }); return; }
    const w = tgt.closest<SVGGElement>('.hx-map__world');
    if (w) { open(w.dataset.id as H.GameId); return; }
    // tocar el mapa fuera de un mundo o del letrero cierra el letrero
    if (sheet && !tgt.closest('.zone-sheet')) close();
  });
  s.addEventListener('keydown', e => {
    const w = (e.target as Element).closest<SVGGElement>('.hx-map__world');
    if (w && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(w.dataset.id as H.GameId); }
  });
  if (r.open) open(r.open);
  return { el: s };
}
