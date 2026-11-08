/* HexaBlock Suite: helpers de dibujo compartidos (tablero, fichas, mascota, estrellas, íconos, escenas, efectos).
 * Port a TypeScript de design-system/components/bundle.js. Mismos nombres y mismo dibujo. */

export type Pt = [number, number];
export type Geo = 'hex' | 'square' | 'tri';
export type Mood = 'feliz' | 'celebra' | 'triste' | 'sorpresa' | 'nervioso';
export type FaceMood = 'idle' | 'happy' | 'scared';
export type SceneId = 'lines' | 'fit' | 'sort' | 'merge';

export interface CellGeom {
  key: string; x: number; y: number; poly: Pt[]; R: number; inr: number; native: number; up?: boolean;
}

const S3 = Math.sqrt(3);
export function f(n: number): number { return Math.round(n * 100) / 100; }
function v(name: string): string { return 'var(--' + name + ')'; }

/* Polígono regular de n lados, radio r, centro (cx,cy), rotación rot (rad). */
export function ngon(n: number, r: number, cx: number, cy: number, rot: number): Pt[] {
  const p: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = rot + i * 2 * Math.PI / n;
    p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return p;
}
/* Rotación por defecto: lados pares con base plana, impares con vértice arriba. */
export function defRot(n: number): number { return n % 2 ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / n; }
export function pts(p: Pt[], dy = 0): string { return p.map(q => f(q[0]) + ',' + f(q[1] + dy)).join(' '); }

export function centroid(p: Pt[]): Pt { let x = 0, y = 0; p.forEach(q => { x += q[0]; y += q[1]; }); return [x / p.length, y / p.length]; }
function reach(p: Pt[], c: Pt): number { let m = 0; p.forEach(q => { m = Math.max(m, Math.hypot(q[0] - c[0], q[1] - c[1])); }); return m; }

export interface PrismOpts { shadow?: boolean; flat?: boolean }
/* Ficha: cara plana con un brillo suave arriba (segunda zona clara).
   depth > 0 = con lateral (solo pilas de Sort). opts.shadow = sombra de contacto debajo. opts.flat = sin brillo. */
export function prism(p: Pt[], color: string, depth: number, extra?: string, opts: PrismOpts = {}): string {
  const col = color.indexOf('#') === 0 || color.indexOf('rgb') === 0 ? color : v(color);
  let s = '';
  const c = centroid(p), R = reach(p, c);
  if (opts.shadow) s += '<polygon points="' + pts(p, R * 0.16) + '" style="fill:var(--shade)"/>';
  if (depth > 0) {
    s += '<polygon points="' + pts(p, depth) + '" style="fill:' + col + '" stroke-linejoin="round"/>';
    s += '<polygon points="' + pts(p, depth) + '" style="fill:var(--shade)"/>';
  }
  s += '<polygon points="' + pts(p) + '" style="fill:' + col + '"' + (extra || '') + '/>';
  if (!opts.flat) {
    const hp = p.map(q => [c[0] + (q[0] - c[0]) * 0.66, c[1] - R * 0.2 + (q[1] - c[1]) * 0.5] as Pt);
    s += '<polygon class="hx-sheen" points="' + pts(hp) + '" style="fill:var(--sheen)"/>';
  }
  return s;
}

/* Cara de una ficha: idle (ojos que parpadean), happy (^ ^), scared (ojos grandes y boca en O). */
export function face(cx: number, cy: number, R: number, mood: FaceMood = 'idle', delay = 0): string {
  const ex = R * 0.3, ey = cy - R * 0.04, rx = Math.max(1.5, R * 0.1), ry = Math.max(2, R * 0.15), w = Math.max(1.4, R * 0.08);
  let s = '';
  if (mood === 'happy') {
    [-1, 1].forEach(k => { s += '<path d="M' + f(cx + k * ex - rx * 1.3) + ' ' + f(ey + ry * 0.3) + ' q' + f(rx * 1.3) + ' ' + f(-ry * 1.7) + ' ' + f(rx * 2.6) + ' 0" fill="none" stroke-width="' + f(w) + '" stroke-linecap="round" style="stroke:var(--ink)"/>'; });
    s += '<path d="M' + f(cx - R * 0.14) + ' ' + f(cy + R * 0.22) + ' q' + f(R * 0.14) + ' ' + f(R * 0.14) + ' ' + f(R * 0.28) + ' 0" fill="none" stroke-width="' + f(w) + '" stroke-linecap="round" style="stroke:var(--ink)"/>';
  } else {
    const k2 = mood === 'scared' ? 1.35 : 1;
    [-1, 1].forEach(k => {
      s += '<ellipse cx="' + f(cx + k * ex) + '" cy="' + f(ey) + '" rx="' + f(rx * k2) + '" ry="' + f(ry * k2) + '" style="fill:var(--ink)"/>' +
        '<circle cx="' + f(cx + k * ex + rx * 0.35) + '" cy="' + f(ey - ry * 0.4) + '" r="' + f(rx * 0.42 * k2) + '" style="fill:var(--white)"/>';
    });
    if (mood === 'scared') s += '<ellipse cx="' + f(cx) + '" cy="' + f(cy + R * 0.3) + '" rx="' + f(R * 0.08) + '" ry="' + f(R * 0.11) + '" style="fill:var(--ink)"/>';
  }
  return '<g class="hx-face hx-face--' + mood + '" style="animation-delay:' + f(delay || 0) + 's;transform-origin:' + f(cx) + 'px ' + f(ey) + 'px">' + s + '</g>';
}

/* Una ficha suelta (para UI, bandeja, catálogo). */
export function shape(o: { sides?: number; size?: number; depth?: number; rot?: number; color?: string; face?: boolean | FaceMood; delay?: number } = {}): string {
  const n = o.sides || 6, size = o.size || 40, depth = o.depth || 0;
  const r = size / 2 - 2, cx = size / 2, cy = r + 2;
  const p = ngon(n, r, cx, cy, o.rot == null ? defRot(n) : o.rot);
  if (o.face) return '<svg class="hx-shape" width="' + size + '" height="' + f(size + 2) + '" viewBox="0 0 ' + size + ' ' + f(size + 2) + '" aria-hidden="true">' + prism(p, o.color || 'piece-blue', 0) + face(cx, cy, r * 0.8, o.face === true ? 'idle' : o.face, o.delay || 0) + '</svg>';
  const h = size + depth + 2;
  return '<svg class="hx-shape" width="' + size + '" height="' + f(h) + '" viewBox="0 0 ' + size + ' ' + f(h) + '" aria-hidden="true">' + prism(p, o.color || 'piece-blue', depth) + '</svg>';
}

/* Geometría de una celda: hex (a=q,b=r axial, punta arriba), square (a=col,b=fila), tri (a=col,b=fila, alterna arriba/abajo). */
export function cellGeom(geo: Geo, a: number, b: number, cell: number): CellGeom {
  if (geo === 'hex') {
    const x = cell * S3 * (a + b / 2), y = cell * 1.5 * b;
    return { key: a + ',' + b, x, y, poly: ngon(6, cell, x, y, -Math.PI / 2), R: cell, inr: cell * S3 / 2, native: 6 };
  }
  if (geo === 'square') {
    const x2 = a * cell * 2, y2 = b * cell * 2;
    return { key: a + ',' + b, x: x2, y: y2, poly: ngon(4, cell * Math.SQRT2, x2, y2, Math.PI / 4), R: cell * Math.SQRT2, inr: cell, native: 4 };
  }
  const R = cell * 1.25, side = R * S3, hh = side * S3 / 2, up = ((a + b) % 2 + 2) % 2 === 0, top = b * hh, xx = a * side / 2 + side / 2;
  let poly: Pt[];
  if (up) poly = [[xx, top], [xx + side / 2, top + hh], [xx - side / 2, top + hh]];
  else poly = [[xx - side / 2, top], [xx + side / 2, top], [xx, top + hh]];
  return { key: a + ',' + b, x: xx, y: up ? top + 2 * hh / 3 : top + hh / 3, poly, R, inr: R / 2, native: 3, up };
}
/* Celdas de un tablero completo de "radio" size. */
export function layout(geo: Geo, size: number, cell: number): CellGeom[] {
  const cells: CellGeom[] = [];
  if (geo === 'hex') { for (let q = -size; q <= size; q++) for (let r = -size; r <= size; r++) if (Math.abs(-q - r) <= size) cells.push(cellGeom('hex', q, r, cell)); }
  else if (geo === 'square') { const n = size * 2 + 1; for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) cells.push(cellGeom('square', col, row, cell)); }
  else { const rows = size * 2 + 1; for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < rows * 2 - 1; cc++) cells.push(cellGeom('tri', cc, rr, cell)); }
  return cells;
}
/* Polígono de la ficha dentro de su celda: la forma nativa o una de n lados inscrita. */
export function piecePoly(c: CellGeom, n: number | undefined, geo: Geo, depth: number): Pt[] {
  let p: Pt[];
  if (!n || n === c.native) p = shrink(c.poly, c.x, c.y, geo === 'tri' ? 0.8 : 0.86);
  else p = ngon(n, c.inr * (geo === 'tri' ? 0.95 : 0.86), c.x, c.y, defRot(n));
  return p.map(q => [q[0], q[1] - depth * 0.4] as Pt);
}
export function bounds(cells: CellGeom[], depth: number, pad: number): string {
  const a = [1e9, 1e9, -1e9, -1e9];
  cells.forEach(c => { c.poly.forEach(q => { a[0] = Math.min(a[0], q[0]); a[2] = Math.max(a[2], q[0]); a[1] = Math.min(a[1], q[1]); a[3] = Math.max(a[3], q[1]); }); });
  return f(a[0] - pad) + ' ' + f(a[1] - pad) + ' ' + f(a[2] - a[0] + pad * 2) + ' ' + f(a[3] - a[1] + depth + pad * 2);
}
/* Pieza suelta formada por varias celdas: piece({geo, cells:[[a,b],...], color, cell, pieceSides}) */
export function piece(o: { geo?: Geo; cells: Pt[]; color?: string; cell?: number; depth?: number; pieceSides?: number; scale?: number }): string {
  const geo = o.geo || 'hex', cell = o.cell || 12, depth = o.depth || 0;
  const cs = o.cells.map(ab => cellGeom(geo, ab[0], ab[1], cell));
  const body = cs.map(c => prism(piecePoly(c, o.pieceSides, geo, depth), o.color || 'piece-blue', depth)).join('');
  const vb = bounds(cs, depth, 3).split(' ');
  return '<svg class="hx-piece-svg" width="' + f(+vb[2] * (o.scale || 1)) + '" height="' + f(+vb[3] * (o.scale || 1)) + '" viewBox="' + vb.join(' ') + '" aria-hidden="true">' + body + '</svg>';
}
export function shrink(poly: Pt[], cx: number, cy: number, k: number): Pt[] { return poly.map(q => [cx + (q[0] - cx) * k, cy + (q[1] - cy) * k] as Pt); }

/* board({geo, size, cell, cells, pieceSides, fill(c,i)->color|null, content(c,i,depth)->svg, depth,
           base: true (plataforma de piedra con grosor y huecos hundidos), faces: true | (c,i)->mood|null}) */
export function board(o: {
  geo?: Geo; size?: number; cell?: number; cells?: Pt[]; depth?: number; pieceSides?: number; base?: boolean;
  faces?: boolean | ((c: CellGeom, i: number) => FaceMood | null);
  fill?: (c: CellGeom, i: number) => string | null; content?: (c: CellGeom, i: number, depth: number) => string;
} = {}): string {
  const geo = o.geo || 'hex', cell = o.cell || 22, depth = o.depth || 0;
  const cells = o.cells ? o.cells.map(ab => cellGeom(geo, ab[0], ab[1], cell)) : layout(geo, o.size == null ? 2 : o.size, cell);
  const grow = geo === 'tri' ? 1.24 : geo === 'square' ? 1.12 : 1.16, thick = o.base ? Math.max(5, cell * 0.34) : 0;
  let body = '';
  if (o.base) {
    const big = cells.map(c => shrink(c.poly, c.x, c.y, grow));
    body += '<g style="opacity:.16">' + big.map(p => '<polygon points="' + pts(p, thick + cell * 0.35) + '" style="fill:var(--ink)"/>').join('') + '</g>';
    body += big.map(p => '<polygon points="' + pts(p, thick) + '" style="fill:var(--stone-600)"/>').join('');
    body += big.map(p => '<polygon points="' + pts(p) + '" style="fill:var(--stone-400)"/>').join('');
  }
  cells.forEach(c => {
    const k = geo === 'tri' ? 0.86 : 0.9;
    if (o.base) {
      body += '<polygon class="hx-slot" points="' + pts(shrink(c.poly, c.x, c.y, k)) + '" style="fill:var(--stone-600)"/>' +
        '<polygon points="' + pts(shrink(c.poly, c.x, c.y + cell * 0.08, k * 0.93)) + '" style="fill:var(--stone-500)"/>';
    } else body += '<polygon class="hx-slot" points="' + pts(shrink(c.poly, c.x, c.y, k)) + '" style="fill:var(--cell-slot)"/>';
  });
  cells.forEach((c, i) => {
    const col = o.fill ? o.fill(c, i) : null;
    if (!col) return;
    const p = piecePoly(c, o.pieceSides, geo, depth);
    body += '<g class="hx-piece" data-key="' + c.key + '" style="transform-origin:' + f(c.x) + 'px ' + f(c.y) + 'px">' + prism(p, col, depth, '', { shadow: !depth });
    if (o.content) body += o.content(c, i, depth) || '';
    const mood = typeof o.faces === 'function' ? o.faces(c, i) : o.faces ? 'idle' : null;
    if (mood && cell >= 12) { const cc = centroid(p); body += face(cc[0], cc[1], c.inr * 0.86, mood, (i * 0.37) % 4); }
    body += '</g>';
  });
  return '<svg class="hx-board" viewBox="' + bounds(cells, depth + thick + (o.base ? cell * 0.5 : 0), o.base ? 4 + cell * 0.4 : 4) + '" role="img" aria-label="Tablero">' + body + '</svg>';
}

/* Pila de Hexa Sort: colores de abajo hacia arriba. */
export function stack(colors: string[], o: { size?: number; sides?: number; layer?: number; face?: boolean | FaceMood } = {}): string {
  const size = o.size || 56, sides = o.sides || 6, layer = o.layer || 6, depth = 5;
  const r = size / 2 - 2, h = size + depth + layer * colors.length + 4, base = h - size / 2 - depth - 2;
  let s = '';
  colors.forEach((c, i) => {
    const p = ngon(sides, r, size / 2, base - i * layer, defRot(sides));
    s += prism(p, c, depth, '', { flat: i < colors.length - 1 });
    if (o.face && i === colors.length - 1) s += face(size / 2, base - i * layer, r * 0.8, o.face === true ? 'idle' : o.face, 0.5);
  });
  return '<svg class="hx-stack" width="' + size + '" height="' + f(h) + '" viewBox="0 0 ' + size + ' ' + f(h) + '" aria-hidden="true">' + s + '</svg>';
}

/* Ficha numérica de Merge. */
export function mergeTile(value: number, o: { size?: number; sides?: number; depth?: number } = {}): string {
  const size = o.size || 64, sides = o.sides || 6, depth = o.depth || 0;
  const r = size / 2 - 2, cx = size / 2, cy = r + 2;
  const p = ngon(sides, r, cx, cy, sides === 6 ? -Math.PI / 2 : defRot(sides));
  const light = value < 64 || value >= 2048;
  const fs = value >= 1000 ? size * 0.28 : value >= 100 ? size * 0.34 : size * 0.4;
  return '<svg class="hx-tile" width="' + size + '" height="' + f(size + depth + 2) + '" viewBox="0 0 ' + size + ' ' + f(size + depth + 2) + '" role="img" aria-label="' + value + '">' +
    prism(p, 'merge-' + Math.min(value, 2048), depth) +
    '<text x="' + cx + '" y="' + f(cy) + '" text-anchor="middle" dominant-baseline="central" style="font-family:var(--font-display);font-weight:400;font-variant-numeric:lining-nums;font-size:' + f(fs) + 'px;fill:' + (light ? 'var(--ink)' : 'var(--white)') + '">' + value + '</text></svg>';
}

/* Estrella con relieve. */
export function star(on: boolean, size = 40): string {
  const p: Pt[] = [], cx = size / 2, cy = size / 2, R = size / 2 - 2, r = R * 0.48;
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R; p.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]); }
  return '<svg class="hx-star' + (on ? ' is-on' : '') + '" width="' + size + '" height="' + (size + 4) + '" viewBox="0 0 ' + size + ' ' + (size + 4) + '" aria-hidden="true">' + prism(p, on ? 'star-on' : 'star-off', 0, ' stroke-linejoin="round"') + '</svg>';
}

/* Mascota "Hexi": cuerpo de n lados, humor feliz|celebra|triste|sorpresa|nervioso. */
export function mascot(o: { sides?: number; mood?: Mood; size?: number; color?: string } = {}): string {
  const n = o.sides || 6, mood = o.mood || 'feliz', size = o.size || 120, col = o.color || 'sun-400';
  const W = 120, H = 150, cx = 60, cy = 62, r = 44, depth = 0;
  const body = prism(ngon(n, r, cx, cy, defRot(n)), col, depth);
  const legs = '<rect x="44" y="102" width="9" height="30" rx="4.5" style="fill:var(--wood-700)"/><rect x="67" y="102" width="9" height="30" rx="4.5" style="fill:var(--wood-700)"/>' +
    '<ellipse cx="60" cy="140" rx="34" ry="5" style="fill:var(--shade)"/>' +
    '<rect x="38" y="128" width="17" height="8" rx="4" style="fill:var(--ink)"/><rect x="65" y="128" width="17" height="8" rx="4" style="fill:var(--ink)"/>';
  const arms = mood === 'celebra'
    ? '<path d="M20 58 L6 26" stroke-width="7" stroke-linecap="round" style="stroke:var(--wood-700)" fill="none"/><path d="M100 58 L114 26" stroke-width="7" stroke-linecap="round" style="stroke:var(--wood-700)" fill="none"/>'
    : mood === 'triste'
      ? '<path d="M20 66 L12 92" stroke-width="7" stroke-linecap="round" style="stroke:var(--wood-700)" fill="none"/><path d="M100 66 L108 92" stroke-width="7" stroke-linecap="round" style="stroke:var(--wood-700)" fill="none"/>'
      : '<path d="M20 66 L8 80" stroke-width="7" stroke-linecap="round" style="stroke:var(--wood-700)" fill="none"/><path d="M100 66 L112 80" stroke-width="7" stroke-linecap="round" style="stroke:var(--wood-700)" fill="none"/>';
  const eyeY = mood === 'triste' ? 58 : 54, ed = mood === 'nervioso' ? 4 : 0;
  const eyes = '<g class="hx-eyes" style="transform-origin:60px ' + eyeY + 'px"><ellipse cx="' + (48 + ed) + '" cy="' + eyeY + '" rx="6" ry="8.5" style="fill:var(--ink)"/><ellipse cx="' + (72 + ed) + '" cy="' + eyeY + '" rx="6" ry="8.5" style="fill:var(--ink)"/>' +
    '<circle cx="' + (50 + ed) + '" cy="' + (eyeY - 3) + '" r="2.2" style="fill:var(--white)"/><circle cx="' + (74 + ed) + '" cy="' + (eyeY - 3) + '" r="2.2" style="fill:var(--white)"/></g>';
  let mouth: string;
  if (mood === 'celebra') mouth = '<path d="M46 70 Q60 92 74 70 Z" style="fill:var(--ink)"/><path d="M53 80 Q60 86 67 80" style="fill:var(--ribbon-500)"/>';
  else if (mood === 'triste') mouth = '<path d="M50 80 Q60 71 70 80" stroke-width="4" stroke-linecap="round" fill="none" style="stroke:var(--ink)"/><path d="M73 64 q-3 6 0 8 q3 -2 0 -8" style="fill:var(--sky)"/>';
  else if (mood === 'sorpresa') mouth = '<ellipse cx="60" cy="76" rx="6" ry="8" style="fill:var(--ink)"/>';
  else if (mood === 'nervioso') mouth = '<path d="M47 76 l4.3 -3 l4.3 3 l4.3 -3 l4.3 3 l4.3 -3" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none" style="stroke:var(--ink)"/><path class="hx-sweat" d="M92 36 q-6 9 0 13 q6 -4 0 -13" style="fill:var(--sky)"/>';
  else mouth = '<path d="M49 72 Q60 82 71 72" stroke-width="4" stroke-linecap="round" fill="none" style="stroke:var(--ink)"/>';
  return '<svg class="hx-mascot is-' + mood + '" width="' + size + '" height="' + f(size * H / W) + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Hexi ' + mood + '">' +
    legs + '<g class="hx-mascot__body" style="transform-origin:60px 110px">' + arms + body + eyes + mouth + '</g></svg>';
}

/* Título arqueado del letrero. */
export function arch(text: string, o: { width?: number; size?: number; bend?: number } = {}): string {
  const w = o.width || 300, fs = o.size || 34, bend = o.bend == null ? 22 : o.bend, h = fs + bend + 8;
  const id = 'hxa' + Math.random().toString(36).slice(2, 8);
  return '<svg class="hx-arch" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + text + '">' +
    '<path id="' + id + '" d="M 10 ' + (h - 6) + ' Q ' + (w / 2) + ' ' + (h - 6 - bend * 2) + ' ' + (w - 10) + ' ' + (h - 6) + '" fill="none"/>' +
    '<text text-anchor="middle" style="font-family:var(--font-display);font-weight:400;font-variant-numeric:lining-nums;font-size:' + fs + 'px;fill:var(--ink)"><textPath href="#' + id + '" startOffset="50%">' + text + '</textPath></text></svg>';
}

/* Figuritas de cada mundo del mapa, dibujadas en una caja de 140x116 (origen arriba a la izquierda). */
function F(n: string): string { return 'style="fill:var(--' + n + ')"'; }
function hexAt(x: number, y: number, r: number, col: string, rot?: number): string { return '<polygon points="' + pts(ngon(6, r, x, y, rot == null ? -Math.PI / 2 : rot)) + '" ' + F(col) + '/>'; }
const GROUND = '<ellipse cx="70" cy="106" rx="60" ry="7" style="fill:var(--shade)"/>';
export function sparkle(x: number, y: number, s: number, d: number): string { return '<path class="hx-sparkle" style="animation-delay:' + d + 's;transform-origin:' + x + 'px ' + y + 'px" d="M' + x + ' ' + (y - s) + ' L' + (x + s * .3) + ' ' + (y - s * .3) + ' L' + (x + s) + ' ' + y + ' L' + (x + s * .3) + ' ' + (y + s * .3) + ' L' + x + ' ' + (y + s) + ' L' + (x - s * .3) + ' ' + (y + s * .3) + ' L' + (x - s) + ' ' + y + ' L' + (x - s * .3) + ' ' + (y - s * .3) + ' Z" ' + F('white') + '/>'; }
export const LANDMARKS: Record<string, () => string> = {
  lines() {
    let s = GROUND + '<rect x="4" y="92" width="132" height="5" rx="2" ' + F('wood-700') + '/>';
    for (let i = 0; i < 9; i++) s += '<rect x="' + (8 + i * 14) + '" y="89" width="6" height="12" rx="2" ' + F('wood-500') + '/>';
    s += '<g class="hx-lm-train">';
    const wag = ['piece-red', 'piece-yellow', 'piece-blue'];
    wag.forEach((c, i) => { const x = 6 + i * 30; s += '<rect x="' + x + '" y="66" width="26" height="20" rx="4" ' + F('wood-500') + '/>' + hexAt(x + 13, 56, 12, c) + '<circle cx="' + (x + 7) + '" cy="88" r="4" ' + F('ink') + '/><circle cx="' + (x + 19) + '" cy="88" r="4" ' + F('ink') + '/>'; });
    s += '<rect x="96" y="52" width="38" height="34" rx="6" ' + F('game-lines') + '/><rect x="100" y="40" width="18" height="16" rx="3" ' + F('game-lines') + '/>' +
      '<rect x="104" y="58" width="12" height="10" rx="2" ' + F('sky') + '/><rect x="122" y="34" width="8" height="20" rx="2" ' + F('ink') + '/>' +
      '<circle class="hx-lm-puff" cx="126" cy="24" r="6" ' + F('panel') + '/><circle cx="104" cy="88" r="5" ' + F('ink') + '/><circle cx="124" cy="88" r="5" ' + F('ink') + '/></g>';
    return s;
  },
  fit() {
    let s = GROUND + '<rect x="64" y="88" width="10" height="16" rx="3" ' + F('wood-700') + '/>';
    const r = 15, w = r * S3;
    [[0, 0], [1, 0], [-1, 0], [0.5, 1], [-0.5, 1], [0.5, -1], [-0.5, -1]].forEach((p, i) => {
      s += hexAt(70 + p[0] * w, 58 + p[1] * r * 1.5, r - 1.5, i === 4 ? 'sun-600' : 'sun-400');
    });
    s += hexAt(62.5, 80.5, 7, 'ink');
    s += '<g class="hx-lm-bee"><ellipse cx="116" cy="26" rx="9" ry="6.5" ' + F('sun-400') + '/><rect x="113" y="20" width="3" height="13" ' + F('ink') + '/><rect x="119" y="20" width="3" height="13" ' + F('ink') + '/>' +
      '<ellipse cx="114" cy="18" rx="5" ry="3.5" ' + F('white') + '/><ellipse cx="121" cy="18" rx="5" ry="3.5" ' + F('white') + '/></g>' +
      '<path d="M28 100 q10 -16 20 0 z" ' + F('game-fit') + '/><path d="M96 100 q8 -12 16 0 z" ' + F('game-fit') + '/>';
    return s;
  },
  sort() {
    let s = GROUND + '<rect x="10" y="94" width="120" height="10" rx="4" ' + F('wood-500') + '/>';
    const towers: [number, string[]][] = [[32, ['piece-blue', 'piece-blue', 'piece-blue', 'piece-blue']], [70, ['piece-pink', 'piece-pink', 'piece-pink', 'piece-pink', 'piece-pink', 'piece-pink']], [108, ['piece-green', 'piece-green', 'piece-green']]];
    towers.forEach(t => {
      t[1].forEach((c, i) => {
        const y = 86 - i * 11;
        s += '<polygon points="' + pts([[t[0] - 15, y], [t[0] + 15, y], [t[0] + 15, y + 8], [t[0] - 15, y + 8]]) + '" ' + F(c) + '/>' +
          '<polygon points="' + pts([[t[0] - 15, y + 5], [t[0] + 15, y + 5], [t[0] + 15, y + 8], [t[0] - 15, y + 8]]) + '" ' + F('shade') + '/>';
      });
    });
    s += '<rect x="69" y="8" width="2.5" height="18" ' + F('wood-700') + '/><polygon points="71.5,8 86,12 71.5,16" ' + F('ribbon-500') + '/>';
    return s;
  },
  merge() {
    return GROUND + '<path d="M14 86 h112 l-10 18 h-92 z" ' + F('wood-500') + '/><rect x="14" y="80" width="112" height="8" rx="3" ' + F('wood-300') + '/>' +
      '<rect x="22" y="84" width="96" height="4" rx="2" ' + F('game-merge') + '/>' +
      '<g class="hx-lm-jet"><path d="M58 84 C 56 60, 40 52, 34 70" fill="none" stroke-width="7" stroke-linecap="round" style="stroke:var(--game-merge)"/>' +
      '<path d="M82 84 C 84 60, 100 52, 106 70" fill="none" stroke-width="7" stroke-linecap="round" style="stroke:var(--game-merge)"/>' +
      '<rect x="66" y="40" width="8" height="44" rx="4" ' + F('game-merge') + '/></g>' +
      '<g class="hx-lm-tile">' + hexAt(70, 26, 20, 'merge-2048') + '<text x="70" y="27" text-anchor="middle" dominant-baseline="central" style="font-family:var(--font-display);font-size:13px;font-variant-numeric:lining-nums;fill:var(--ink)">2048</text></g>' +
      sparkle(30, 66, 5, 0) + sparkle(110, 64, 4, .7) + sparkle(84, 50, 3.5, 1.3) + sparkle(52, 52, 3, 1.9);
  },
  build() {
    return '<rect x="30" y="14" width="6" height="88" ' + F('ink') + '/><rect x="30" y="14" width="86" height="6" ' + F('ink') + '/>' +
      '<path d="M36 20 L60 20 L36 44" fill="none" stroke-width="2" style="stroke:var(--ink)"/><rect x="104" y="20" width="2" height="34" ' + F('ink') + '/>' +
      '<g class="hx-lm-hook">' + hexAt(105, 62, 9, 'disabled') + '</g>' +
      '<rect x="20" y="98" width="28" height="6" rx="2" ' + F('ink') + '/>' +
      '<polygon points="88,104 96,80 104,104" ' + F('piece-orange') + '/><rect x="90" y="92" width="12" height="4" ' + F('white') + '/>' +
      '<polygon points="112,104 118,86 124,104" ' + F('piece-orange') + '/>';
  },
};
export function landmark(id: string, size = 140): string {
  return '<svg class="hx-landmark hx-landmark--' + id + '" width="' + size + '" height="' + f(size * 116 / 140) + '" viewBox="0 0 140 116" aria-hidden="true">' + LANDMARKS[id]() + '</svg>';
}

/* Escena de fondo de cada mundo (360x800, se recorta para cubrir). Capas planas + algo que se mueve lento. */
export function cloud(x: number, y: number, s: number, d: number): string { return '<g class="hx-cloud" style="animation-delay:' + d + 's"><ellipse cx="' + x + '" cy="' + y + '" rx="' + (34 * s) + '" ry="' + (12 * s) + '" ' + F('white') + '/><ellipse cx="' + (x + 22 * s) + '" cy="' + (y - 8 * s) + '" rx="' + (20 * s) + '" ry="' + (12 * s) + '" ' + F('white') + '/></g>'; }
export const SCENES: Record<SceneId, () => string> = {
  lines() {
    let s = '<rect width="360" height="800" ' + F('game-lines-bg') + '/><circle cx="262" cy="190" r="74" ' + F('sun-400') + ' opacity=".85"/>' + cloud(60, 110, 1, 0) + cloud(250, 300, .8, -12);
    s += '<path d="M0 560 L60 470 L120 530 L190 440 L260 520 L320 460 L360 500 L360 800 L0 800Z" ' + F('game-lines') + ' opacity=".28"/>';
    s += '<path d="M0 640 C 90 590, 200 620, 360 580 L360 800 L0 800Z" ' + F('game-lines') + ' opacity=".45"/>';
    s += '<g class="hx-scene-train"><rect x="0" y="672" width="56" height="26" rx="5" ' + F('game-lines') + '/><rect x="62" y="676" width="40" height="22" rx="5" ' + F('game-lines') + ' opacity=".8"/><rect x="108" y="676" width="40" height="22" rx="5" ' + F('game-lines') + ' opacity=".8"/></g>';
    s += '<rect x="0" y="700" width="360" height="5" ' + F('wood-700') + ' opacity=".5"/><rect x="0" y="705" width="360" height="95" ' + F('wood-300') + ' opacity=".45"/>';
    return s;
  },
  fit() {
    let s = '<rect width="360" height="800" ' + F('game-fit-bg') + '/>' + cloud(70, 120, .9, -5) + cloud(260, 220, .7, -20);
    s += '<path d="M300 0 C 296 60, 240 80, 236 120" fill="none" stroke-width="7" stroke-linecap="round" style="stroke:var(--wood-700)" opacity=".7"/>';
    for (let i = 0; i < 6; i++) { const a = [[226, 140], [250, 140], [214, 160], [238, 160], [262, 160], [238, 180]][i]; s += '<polygon points="' + pts(ngon(6, 13, a[0], a[1], -Math.PI / 2)) + '" ' + F('sun-400') + ' opacity=".9"/>'; }
    s += '<g class="hx-scene-bee"><ellipse cx="160" cy="250" rx="8" ry="6" ' + F('sun-400') + '/><rect x="157" y="245" width="3" height="11" ' + F('ink') + '/><ellipse cx="158" cy="243" rx="5" ry="3" ' + F('white') + '/></g>';
    s += '<path d="M0 620 C 120 580, 240 640, 360 600 L360 800 L0 800Z" ' + F('game-fit') + ' opacity=".35"/><path d="M0 690 C 120 660, 260 700, 360 670 L360 800 L0 800Z" ' + F('game-fit') + ' opacity=".55"/>';
    [[40, 660], [96, 690], [300, 650], [330, 700], [180, 700]].forEach((p, k) => {
      s += '<rect x="' + (p[0] - 2) + '" y="' + p[1] + '" width="4" height="40" ' + F('game-fit') + '/>';
      for (let q = 0; q < 5; q++) { const ang = q * 2 * Math.PI / 5; s += '<circle cx="' + f(p[0] + 9 * Math.cos(ang)) + '" cy="' + f(p[1] + 9 * Math.sin(ang)) + '" r="7" ' + F(k % 2 ? 'white' : 'piece-pink') + '/>'; }
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" ' + F('sun-400') + '/>';
    });
    return s;
  },
  sort() {
    let s = '<rect width="360" height="800" ' + F('game-sort-bg') + '/>' + cloud(90, 140, 1, -8) + cloud(280, 90, .7, -18);
    [[10, 470, 54], [70, 410, 46], [122, 500, 50], [180, 380, 58], [246, 450, 48], [300, 400, 60]].forEach((t, k) => {
      s += '<rect x="' + t[0] + '" y="' + t[1] + '" width="' + t[2] + '" height="' + (800 - t[1]) + '" ' + F('game-sort') + ' opacity="' + (k % 2 ? '.3' : '.45') + '"/>';
      for (let y = t[1] + 14; y < 760; y += 26) s += '<rect x="' + (t[0] + 6) + '" y="' + y + '" width="' + (t[2] - 12) + '" height="4" ' + F('white') + ' opacity=".35"/>';
    });
    s += '<rect x="198" y="350" width="3" height="30" ' + F('wood-700') + '/><polygon class="hx-scene-flag" points="201,350 222,356 201,362" ' + F('ribbon-500') + '/>';
    return s;
  },
  merge() {
    let s = '<rect width="360" height="800" ' + F('game-merge-bg') + '/>' + cloud(60, 150, .9, -3) + cloud(270, 240, 1, -15);
    s += '<path d="M0 600 L360 560 L360 800 L0 800Z" ' + F('white') + ' opacity=".35"/>';
    for (let x = 0; x < 360; x += 40) for (let y = 620; y < 800; y += 34) s += '<polygon points="' + pts(ngon(6, 14, x + (y % 68 ? 20 : 0), y, 0)) + '" ' + F('game-merge') + ' opacity=".14"/>';
    s += '<path d="M120 640 h120 l-12 30 h-96z" ' + F('game-merge') + ' opacity=".45"/><rect x="174" y="560" width="12" height="80" rx="6" ' + F('game-merge') + ' opacity=".45"/>';
    [[60, 120, 0], [300, 160, .8], [210, 90, 1.6], [110, 300, 2.2], [320, 380, .4]].forEach(p => { s += sparkle(p[0], p[1], 7, p[2]); });
    return s;
  },
};
export function scene(id: SceneId): string { return '<svg class="hx-scene" viewBox="0 0 360 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + SCENES[id]() + '</svg>'; }

/* Efectos ("jugo"): todos dibujan en una capa encima de host (host debe tener position:relative). */
const FX_COLORS = ['piece-red', 'piece-orange', 'piece-yellow', 'piece-green', 'piece-teal', 'piece-blue', 'piece-purple', 'piece-pink'];
function fxLayer(host: HTMLElement): HTMLElement {
  let l = host.querySelector<HTMLElement>(':scope > .hx-fx');
  if (!l) { l = document.createElement('div'); l.className = 'hx-fx'; host.appendChild(l); }
  return l;
}
function quiet(): boolean { return !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
export function burst(host: HTMLElement, x: number, y: number, color?: string | null, n = 10): void {
  if (quiet()) return;
  const L = fxLayer(host);
  for (let i = 0; i < n; i++) {
    const b = document.createElement('i'), a = Math.random() * 2 * Math.PI, d = 30 + Math.random() * 50, s = 6 + Math.random() * 8;
    b.className = 'hx-fx__bit'; b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.width = b.style.height = s + 'px'; b.style.background = v(color || FX_COLORS[i % 8]);
    L.appendChild(b);
    b.animate([{ transform: 'translate(-50%,-50%) rotate(0deg) scale(1)', opacity: 1 }, { transform: 'translate(calc(-50% + ' + f(Math.cos(a) * d) + 'px), calc(-50% + ' + f(Math.sin(a) * d + 24) + 'px)) rotate(220deg) scale(.4)', opacity: 0 }],
      { duration: 560 + Math.random() * 300, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => { b.remove(); };
  }
}
export function floatText(host: HTMLElement, x: number, y: number, text: string): void {
  const L = fxLayer(host), t = document.createElement('div');
  t.className = 'hx-fx__pts'; t.textContent = text; t.style.left = x + 'px'; t.style.top = y + 'px'; L.appendChild(t);
  t.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-90%) scale(1.1)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-220%) scale(1)', opacity: 0 }],
    { duration: quiet() ? 400 : 900, easing: 'ease-out' }).onfinish = () => { t.remove(); };
}
export function combo(host: HTMLElement, text: string): void {
  const L = fxLayer(host), t = document.createElement('div');
  t.className = 'hx-fx__combo'; t.textContent = text; L.appendChild(t);
  t.animate([{ transform: 'translate(-50%,-50%) scale(.2) rotate(-12deg)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.18) rotate(4deg)', opacity: 1, offset: .3 }, { transform: 'translate(-50%,-50%) scale(1) rotate(-3deg)', opacity: 1, offset: .75 }, { transform: 'translate(-50%,-70%) scale(1)', opacity: 0 }],
    { duration: quiet() ? 500 : 1150, easing: 'ease-out' }).onfinish = () => { t.remove(); };
}
export function shake(el: HTMLElement, px = 6): void {
  if (quiet()) return;
  el.animate([0, -1, 1, -1, 1, 0].map((k, i) => ({ transform: 'translate(' + (k * px) + 'px,' + (i % 2 ? px / 2 : 0) + 'px)' })), { duration: 320 });
}
export function confetti(host: HTMLElement, n = 70): void {
  if (quiet()) return;
  const L = fxLayer(host), W = host.clientWidth, Hh = host.clientHeight;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i');
    c.className = 'hx-fx__conf'; c.style.left = (Math.random() * W) + 'px'; c.style.top = '-20px'; c.style.background = v(FX_COLORS[i % 8]); L.appendChild(c);
    c.animate([{ transform: 'translate(0,0) rotate(0deg)' }, { transform: 'translate(' + f((Math.random() - .5) * 120) + 'px,' + (Hh + 40) + 'px) rotate(' + (360 + Math.random() * 720) + 'deg)' }],
      { duration: 1600 + Math.random() * 1200, delay: Math.random() * 500, easing: 'cubic-bezier(.3,.6,.6,1)' }).onfinish = () => { c.remove(); };
  }
}
/* Cortina de hexágonos: cubre host, llama a mid() con todo tapado y vuelve a descubrir. */
export function curtain(host: HTMLElement, mid?: () => void): void {
  const W = host.clientWidth, Hh = host.clientHeight, r = 30, w = r * S3, polys: Pt[] = [];
  for (let row = 0, y = 0; y < Hh + r * 2; row++, y += r * 1.5) for (let x = (row % 2 ? w / 2 : 0); x < W + w; x += w) polys.push([x, y]);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'hx-curtain'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh);
  svg.innerHTML = polys.map((p, i) => '<polygon points="' + pts(ngon(6, r + 1, p[0], p[1], -Math.PI / 2)) + '" style="fill:var(--' + FX_COLORS[(i * 7) % 8] + ');transform-box:fill-box;transform-origin:center;transform:scale(0)"/>').join('');
  fxLayer(host).appendChild(svg);
  const els = [].slice.call(svg.children) as Element[], dur = quiet() ? 1 : 260;
  function run(inward: boolean, done: () => void) {
    let left = els.length;
    els.forEach((e, i) => {
      const p = polys[i], d = quiet() ? 0 : (p[0] + p[1]) / (W + Hh) * 380;
      e.animate(inward ? [{ transform: 'scale(0)' }, { transform: 'scale(1.08)' }] : [{ transform: 'scale(1.08)' }, { transform: 'scale(0)' }],
        { duration: dur, delay: d, fill: 'forwards', easing: inward ? 'cubic-bezier(.34,1.56,.64,1)' : 'cubic-bezier(.55,0,1,.45)' }).onfinish = () => { if (--left === 0) done(); };
    });
  }
  run(true, () => { if (mid) mid(); run(false, () => { svg.remove(); }); });
}

/* Logo tipo pegatina. */
export function logo(o: { width?: number } = {}): string {
  const w = o.width || 320;
  const txt = (cls: string, dy: number) => '<text x="190" y="' + (80 + dy) + '" text-anchor="middle" textLength="340" lengthAdjust="spacingAndGlyphs" class="' + cls + '" style="font-family:var(--font-display);font-weight:400;font-variant-numeric:lining-nums;font-size:60px;paint-order:stroke;stroke-linejoin:round">HexaBlock</text>';
  return '<svg class="hx-logo" width="' + w + '" height="' + f(w * 156 / 380) + '" viewBox="0 0 380 156" role="img" aria-label="HexaBlock Suite">' +
    txt('hx-logo__shadow', 7) + txt('hx-logo__face', 0) +
    '<g transform="translate(190 122) rotate(-3)"><polygon points="-78,-15 78,-15 70,0 78,15 -78,15 -70,0" style="fill:var(--ribbon-700)" transform="translate(0 4)"/><polygon points="-78,-15 78,-15 70,0 78,15 -78,15 -70,0" style="fill:var(--ribbon-500)"/>' +
    '<text x="0" y="1" text-anchor="middle" dominant-baseline="central" style="font-family:var(--font-display);font-weight:400;font-variant-numeric:lining-nums;font-size:20px;letter-spacing:.3em;fill:var(--white)">SUITE</text></g></svg>';
}

/* Íconos de trazo, 24px, color = currentColor. */
const IC: Record<string, string> = {
  back: '<path d="M14 6l-6 6 6 6"/><path d="M8 12h11"/>',
  play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5" fill="currentColor"/><circle cx="17.5" cy="16" r="2.5" fill="currentColor"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 20h8"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5" fill="currentColor"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/>',
  retry: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  shapes: '<path d="M7 3l4.5 7.8h-9z"/><rect x="13" y="13" width="8" height="8" rx="1"/><path d="M7.5 14l3.5 2v4l-3.5 2L4 20v-4z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  next: '<path d="M5 5l7 7-7 7M13 5l7 7-7 7"/>',
};
export function icon(name: string, size = 24): string {
  return '<svg class="hx-icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[name] || '') + '</svg>';
}
export const icons = Object.keys(IC);

/* Separador de miles con espacio fino (U+2009, el mismo que usa countUp): 8 192. */
export function fmt(n: number): string { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

/* Conteo animado de un número. */
export function countUp(el: HTMLElement, to: number, ms = 900): void {
  let t0: number | null = null;
  function step(t: number) { if (t0 == null) t0 = t; const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = String(Math.round(to * e)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); if (k < 1) requestAnimationFrame(step); }
  requestAnimationFrame(step);
}
/* Reinicia una animación CSS quitando y poniendo la clase. */
export function replay(el: Element, cls: string): void { el.classList.remove(cls); void (el as HTMLElement).offsetWidth; el.classList.add(cls); }

export type GameId = 'lines' | 'fit' | 'sort' | 'merge';
export const GAMES: { id: GameId; name: string; world: string; verb: string; sub: string }[] = [
  { id: 'lines', name: 'Hexa Lines', world: 'Estación Línea', verb: '¡Completa!', sub: 'LLENA LÍNEAS EN 3 EJES' },
  { id: 'fit', name: 'Hexa Fit', world: 'La Colmena', verb: '¡Encaja!', sub: 'SIN HUECOS, SIN SOBRANTES' },
  { id: 'sort', name: 'Hexa Sort', world: 'Pilópolis', verb: '¡Ordena!', sub: 'APILA 10 DEL MISMO COLOR' },
  { id: 'merge', name: 'Hexa Merge', world: 'Fuente Fusión', verb: '¡Fusiona!', sub: 'DESLIZA Y JUNTA IGUALES' },
];
export const PIECES = ['piece-red', 'piece-orange', 'piece-yellow', 'piece-green', 'piece-teal', 'piece-blue', 'piece-purple', 'piece-pink'] as const;
export type PieceColor = typeof PIECES[number];
