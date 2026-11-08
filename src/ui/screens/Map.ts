import * as H from '../../design-system/hexablock';
import { totalStars, zoneStars } from '../../app/progress';
import { t } from '../../infra/i18n';
import { showZoneSheet } from '../overlays/ZoneSheet';
import { go, Route, Screen } from '../router';
import { el, esc, iconBtn } from '../ui';

/** Posición y escala de cada mundo en el lienzo de 360×700 (de abajo hacia arriba: Lines, Fit, Sort, Merge). */
const POS: Record<H.GameId, [number, number, number]> = {
  merge: [204, 150, 0.95], sort: [14, 262, 0.95], fit: [204, 378, 0.95], lines: [14, 488, 0.95],
};
const PATH: [number, number][] = [[200, 676], [226, 640], [205, 604], [250, 572], [262, 520], [214, 476], [160, 466], [115, 444], [96, 400], [130, 366], [185, 350], [240, 330], [262, 290], [250, 256]];

function worldSign(x: number, y: number, title: string, stars: number): string {
  const h = 54, fs = title.length > 12 ? 13 : 15;
  let s = `<g transform="translate(${x} ${y})"><rect x="0" y="3" width="124" height="${h}" rx="8" style="fill:var(--wood-700)"/><rect x="0" y="0" width="124" height="${h}" rx="8" style="fill:var(--wood-500)"/>` +
    `<rect x="5" y="5" width="114" height="${h - 10}" rx="5" style="fill:var(--panel)"/>` +
    `<text x="62" y="19" text-anchor="middle" dominant-baseline="central" style="font-family:var(--font-display);font-size:${fs}px;fill:var(--ink)">${esc(title)}</text>`;
  for (let i = 0; i < 3; i++) s += `<g transform="translate(${37 + i * 17} ${29 - (i === 1 ? 2 : 0)})">${H.star(i < stars, 16)}</g>`;
  return s + '</g>';
}

function art(): string {
  let s = '';
  // fondo extendido para que llene cualquier alto/ancho sin franjas
  s += '<rect x="-400" y="-600" width="1160" height="1400" style="fill:var(--sky)"/>';
  s += '<ellipse cx="70" cy="60" rx="34" ry="12" style="fill:var(--panel)"/><ellipse cx="96" cy="52" rx="22" ry="12" style="fill:var(--panel)"/><ellipse cx="290" cy="90" rx="30" ry="10" style="fill:var(--panel)"/>';
  s += '<path d="M-400 200 L-120 120 L-20 200 L60 110 L130 190 L200 100 L290 180 L380 120 L470 190 L760 120 L760 230 L-400 230 Z" style="fill:var(--hill)"/>';
  s += '<path d="M-400 200 C -100 160, 80 150, 180 150 C 280 150, 460 160, 760 200 L760 900 L-400 900 Z" style="fill:var(--grass)"/>';
  s += '<path d="M-400 430 C 120 400, 240 440, 760 400 L760 900 L-400 900 Z" style="fill:var(--grass-700);opacity:.35"/>';
  PATH.forEach(p => { s += `<polygon points="${H.pts(H.ngon(6, 11, p[0], p[1], 0))}" style="fill:var(--panel-tan)"/>`; });
  (Object.keys(POS) as H.GameId[]).forEach(id => {
    const p = POS[id];
    const name = t(`world.${id}`);
    // tres capas: el mundo (toque), el grupo que se levanta (world-lift) y la figurita con su animación propia
    s += `<g class="hx-map__world" data-id="${id}" tabindex="0" role="button" aria-label="${esc(name)}"><g class="world-lift">` +
      `<g transform="translate(${p[0]} ${p[1]}) scale(${p[2]})">${H.LANDMARKS[id]()}</g>` +
      worldSign(p[0] + 6, p[1] + 110 * p[2] + 4, name, zoneStars(id)) + '</g></g>';
  });
  s += `<g transform="translate(150 620)">${H.mascot({ size: 52 }).replace('class="hx-mascot ', 'class="hx-mascot is-alive ')}</g>`;
  return s;
}

/** Mapa de mundos: isla con camino de piedras y un mundo por juego. */
export function MapScreen(r: Extract<Route, { name: 'map' }>): Screen {
  const s = el(`<section class="scr map hx-map">
    <svg class="hx-map__art" viewBox="0 0 360 700" preserveAspectRatio="xMidYMax meet" role="img" aria-label="${t('worldMap')}">${art()}</svg>
    <div class="hx-map__hud">
      <span class="hx-counter" aria-label="${t('totalStars')}">${H.star(true, 24)}${totalStars()}</span>
      <div class="hud-btns">
        ${iconBtn('trophy', t('achievements'), 'hx-ibtn--sm hx-ibtn--panel', 'data-go="achievements"')}
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
