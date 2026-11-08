/* HexaBlock Suite: helpers de dibujo compartidos (tablero, fichas, mascota, estrellas, íconos). Sin dependencias. */
(function () {
  var S3 = Math.sqrt(3);
  function f(n) { return Math.round(n * 100) / 100; }
  function v(name) { return 'var(--' + name + ')'; }

  /* Polígono regular de n lados, radio r, centro (cx,cy), rotación rot (rad). */
  function ngon(n, r, cx, cy, rot) {
    var p = [];
    for (var i = 0; i < n; i++) {
      var a = rot + i * 2 * Math.PI / n;
      p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return p;
  }
  /* Rotación por defecto: lados pares con base plana, impares con vértice arriba. */
  function defRot(n) { return n % 2 ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / n; }
  function pts(p, dy) { dy = dy || 0; return p.map(function (q) { return f(q[0]) + ',' + f(q[1] + dy); }).join(' '); }

  /* Prisma 2.5D: copia desplazada (lateral) + cara superior + brillo. */
  function prism(p, color, depth, extra) {
    var c = color.indexOf('#') === 0 || color.indexOf('rgb') === 0 ? color : v(color);
    var s = '';
    if (depth > 0) {
      s += '<polygon points="' + pts(p, depth) + '" style="fill:' + c + '" stroke-linejoin="round"/>';
      s += '<polygon points="' + pts(p, depth) + '" style="fill:var(--shade)"/>';
    }
    s += '<polygon points="' + pts(p) + '" style="fill:' + c + '"' + (extra || '') + '/>';
    return s;
  }

  /* Una ficha suelta (para UI, bandeja, catálogo). */
  function shape(o) {
    o = o || {};
    var n = o.sides || 6, size = o.size || 40, depth = o.depth || 0;
    var r = size / 2 - 2, cx = size / 2, cy = r + 2;
    var p = ngon(n, r, cx, cy, o.rot == null ? defRot(n) : o.rot);
    var h = size + depth + 2;
    return '<svg class="hx-shape" width="' + size + '" height="' + f(h) + '" viewBox="0 0 ' + size + ' ' + f(h) + '" aria-hidden="true">' + prism(p, o.color || 'piece-blue', depth) + '</svg>';
  }

  /* Geometría de una celda: hex (a=q,b=r axial, punta arriba), square (a=col,b=fila), tri (a=col,b=fila, alterna arriba/abajo). */
  function cellGeom(geo, a, b, cell) {
    if (geo === 'hex') {
      var x = cell * S3 * (a + b / 2), y = cell * 1.5 * b;
      return { key: a + ',' + b, x: x, y: y, poly: ngon(6, cell, x, y, -Math.PI / 2), R: cell, inr: cell * S3 / 2, native: 6 };
    }
    if (geo === 'square') {
      var x2 = a * cell * 2, y2 = b * cell * 2;
      return { key: a + ',' + b, x: x2, y: y2, poly: ngon(4, cell * Math.SQRT2, x2, y2, Math.PI / 4), R: cell * Math.SQRT2, inr: cell, native: 4 };
    }
    var R = cell * 1.25, side = R * S3, hh = side * S3 / 2, up = ((a + b) % 2 + 2) % 2 === 0, top = b * hh, xx = a * side / 2 + side / 2, poly;
    if (up) poly = [[xx, top], [xx + side / 2, top + hh], [xx - side / 2, top + hh]];
    else poly = [[xx - side / 2, top], [xx + side / 2, top], [xx, top + hh]];
    return { key: a + ',' + b, x: xx, y: up ? top + 2 * hh / 3 : top + hh / 3, poly: poly, R: R, inr: R / 2, native: 3, up: up };
  }
  /* Celdas de un tablero completo de "radio" size. */
  function layout(geo, size, cell) {
    var cells = [];
    if (geo === 'hex') { for (var q = -size; q <= size; q++) for (var r = -size; r <= size; r++) if (Math.abs(-q - r) <= size) cells.push(cellGeom('hex', q, r, cell)); }
    else if (geo === 'square') { var n = size * 2 + 1; for (var row = 0; row < n; row++) for (var col = 0; col < n; col++) cells.push(cellGeom('square', col, row, cell)); }
    else { var rows = size * 2 + 1; for (var rr = 0; rr < rows; rr++) for (var cc = 0; cc < rows * 2 - 1; cc++) cells.push(cellGeom('tri', cc, rr, cell)); }
    return cells;
  }
  /* Polígono de la ficha dentro de su celda: la forma nativa o una de n lados inscrita. */
  function piecePoly(c, n, geo, depth) {
    var p;
    if (!n || n === c.native) p = shrink(c.poly, c.x, c.y, geo === 'tri' ? 0.8 : 0.86);
    else p = ngon(n, c.inr * (geo === 'tri' ? 0.95 : 0.86), c.x, c.y, defRot(n));
    return p.map(function (q) { return [q[0], q[1] - depth * 0.4]; });
  }
  function bounds(cells, depth, pad) {
    var a = [1e9, 1e9, -1e9, -1e9];
    cells.forEach(function (c) { c.poly.forEach(function (q) { a[0] = Math.min(a[0], q[0]); a[2] = Math.max(a[2], q[0]); a[1] = Math.min(a[1], q[1]); a[3] = Math.max(a[3], q[1]); }); });
    return f(a[0] - pad) + ' ' + f(a[1] - pad) + ' ' + f(a[2] - a[0] + pad * 2) + ' ' + f(a[3] - a[1] + depth + pad * 2);
  }
  /* Pieza suelta formada por varias celdas: piece({geo, cells:[[a,b],...], color, cell, pieceSides}) */
  function piece(o) {
    var geo = o.geo || 'hex', cell = o.cell || 12, depth = o.depth || 0;
    var cs = o.cells.map(function (ab) { return cellGeom(geo, ab[0], ab[1], cell); });
    var body = cs.map(function (c) { return prism(piecePoly(c, o.pieceSides, geo, depth), o.color || 'piece-blue', depth); }).join('');
    var vb = bounds(cs, depth, 3).split(' ');
    return '<svg class="hx-piece-svg" width="' + f(+vb[2] * (o.scale || 1)) + '" height="' + f(+vb[3] * (o.scale || 1)) + '" viewBox="' + vb.join(' ') + '" aria-hidden="true">' + body + '</svg>';
  }
  function shrink(poly, cx, cy, k) { return poly.map(function (q) { return [cx + (q[0] - cx) * k, cy + (q[1] - cy) * k]; }); }

  /* board({geo:'hex'|'square'|'tri', size, cell, pieceSides, fill(cell,i)->color|null, content(cell,i,depth)->svg, depth}) */
  function board(o) {
    o = o || {};
    var geo = o.geo || 'hex', cell = o.cell || 22, depth = o.depth || 0;
    var cells = layout(geo, o.size == null ? 2 : o.size, cell), body = '';
    cells.forEach(function (c) { body += '<polygon class="hx-slot" points="' + pts(shrink(c.poly, c.x, c.y, geo === 'tri' ? 0.86 : 0.9)) + '" style="fill:var(--cell-slot)"/>'; });
    cells.forEach(function (c, i) {
      var col = o.fill ? o.fill(c, i) : null;
      if (!col) return;
      body += '<g class="hx-piece" data-key="' + c.key + '" style="transform-origin:' + f(c.x) + 'px ' + f(c.y) + 'px">' + prism(piecePoly(c, o.pieceSides, geo, depth), col, depth);
      if (o.content) body += o.content(c, i, depth) || '';
      body += '</g>';
    });
    return '<svg class="hx-board" viewBox="' + bounds(cells, depth, 4) + '" role="img" aria-label="Tablero">' + body + '</svg>';
  }

  /* Pila de Hexa Sort: colores de abajo hacia arriba. */
  function stack(colors, o) {
    o = o || {};
    var size = o.size || 56, sides = o.sides || 6, layer = o.layer || 6, depth = 5;
    var r = size / 2 - 2, h = size + depth + layer * colors.length + 4, base = h - size / 2 - depth - 2;
    var s = '';
    colors.forEach(function (c, i) {
      var p = ngon(sides, r, size / 2, base - i * layer, defRot(sides));
      s += prism(p, c, depth);
    });
    return '<svg class="hx-stack" width="' + size + '" height="' + f(h) + '" viewBox="0 0 ' + size + ' ' + f(h) + '" aria-hidden="true">' + s + '</svg>';
  }

  /* Ficha numérica de Merge. */
  function mergeTile(value, o) {
    o = o || {};
    var size = o.size || 64, sides = o.sides || 6, depth = o.depth || 0;
    var r = size / 2 - 2, cx = size / 2, cy = r + 2;
    var p = ngon(sides, r, cx, cy, sides === 6 ? -Math.PI / 2 : defRot(sides));
    var light = value < 64 || value >= 2048;
    var fs = value >= 1000 ? size * 0.28 : value >= 100 ? size * 0.34 : size * 0.4;
    return '<svg class="hx-tile" width="' + size + '" height="' + f(size + depth + 2) + '" viewBox="0 0 ' + size + ' ' + f(size + depth + 2) + '" role="img" aria-label="' + value + '">' +
      prism(p, 'merge-' + value, depth) +
      '<text x="' + cx + '" y="' + f(cy) + '" text-anchor="middle" dominant-baseline="central" style="font-family:var(--font-display);font-weight:400;font-size:' + f(fs) + 'px;fill:' + (light ? 'var(--ink)' : 'var(--white)') + '">' + value + '</text></svg>';
  }

  /* Estrella con relieve. */
  function star(on, size) {
    size = size || 40;
    var p = [], cx = size / 2, cy = size / 2, R = size / 2 - 2, r = R * 0.48;
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R; p.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]); }
    return '<svg class="hx-star' + (on ? ' is-on' : '') + '" width="' + size + '" height="' + (size + 4) + '" viewBox="0 0 ' + size + ' ' + (size + 4) + '" aria-hidden="true">' + prism(p, on ? 'star-on' : 'star-off', 0, ' stroke-linejoin="round"') + '</svg>';
  }

  /* Mascota "Hexi": cuerpo de n lados, humor feliz|celebra|triste|sorpresa. */
  function mascot(o) {
    o = o || {};
    var n = o.sides || 6, mood = o.mood || 'feliz', size = o.size || 120, col = o.color || 'sun-400';
    var W = 120, H = 150, cx = 60, cy = 62, r = 44, depth = 0;
    var body = prism(ngon(n, r, cx, cy, defRot(n)), col, depth);
    var legs = '<rect x="44" y="102" width="9" height="30" rx="4.5" style="fill:var(--wood-700)"/><rect x="67" y="102" width="9" height="30" rx="4.5" style="fill:var(--wood-700)"/>' +
      '<ellipse cx="60" cy="140" rx="34" ry="5" style="fill:var(--shade)"/>' +
      '<rect x="38" y="128" width="17" height="8" rx="4" style="fill:var(--ink)"/><rect x="65" y="128" width="17" height="8" rx="4" style="fill:var(--ink)"/>';
    var arms = mood === 'celebra'
      ? '<path d="M20 58 L6 26" stroke-width="7" stroke-linecap="round" style="stroke:var(--wood-700)" fill="none"/><path d="M100 58 L114 26" stroke-width="7" stroke-linecap="round" style="stroke:var(--wood-700)" fill="none"/>'
      : mood === 'triste'
        ? '<path d="M20 66 L12 92" stroke-width="7" stroke-linecap="round" style="stroke:var(--wood-700)" fill="none"/><path d="M100 66 L108 92" stroke-width="7" stroke-linecap="round" style="stroke:var(--wood-700)" fill="none"/>'
        : '<path d="M20 66 L8 80" stroke-width="7" stroke-linecap="round" style="stroke:var(--wood-700)" fill="none"/><path d="M100 66 L112 80" stroke-width="7" stroke-linecap="round" style="stroke:var(--wood-700)" fill="none"/>';
    var eyeY = mood === 'triste' ? 58 : 54;
    var eyes = '<g class="hx-eyes" style="transform-origin:60px ' + eyeY + 'px"><ellipse cx="48" cy="' + eyeY + '" rx="6" ry="8.5" style="fill:var(--ink)"/><ellipse cx="72" cy="' + eyeY + '" rx="6" ry="8.5" style="fill:var(--ink)"/>' +
      '<circle cx="50" cy="' + (eyeY - 3) + '" r="2.2" style="fill:var(--white)"/><circle cx="74" cy="' + (eyeY - 3) + '" r="2.2" style="fill:var(--white)"/></g>';
    var mouth;
    if (mood === 'celebra') mouth = '<path d="M46 70 Q60 92 74 70 Z" style="fill:var(--ink)"/><path d="M53 80 Q60 86 67 80" style="fill:var(--ribbon-500)"/>';
    else if (mood === 'triste') mouth = '<path d="M50 80 Q60 71 70 80" stroke-width="4" stroke-linecap="round" fill="none" style="stroke:var(--ink)"/><path d="M73 64 q-3 6 0 8 q3 -2 0 -8" style="fill:var(--sky)"/>';
    else if (mood === 'sorpresa') mouth = '<ellipse cx="60" cy="76" rx="6" ry="8" style="fill:var(--ink)"/>';
    else mouth = '<path d="M49 72 Q60 82 71 72" stroke-width="4" stroke-linecap="round" fill="none" style="stroke:var(--ink)"/>';
    return '<svg class="hx-mascot is-' + mood + '" width="' + size + '" height="' + f(size * H / W) + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Hexi ' + mood + '">' +
      legs + '<g class="hx-mascot__body" style="transform-origin:60px 110px">' + arms + body + eyes + mouth + '</g></svg>';
  }

  /* Título arqueado del letrero. */
  function arch(text, o) {
    o = o || {};
    var w = o.width || 300, fs = o.size || 34, bend = o.bend == null ? 22 : o.bend, h = fs + bend + 8;
    var id = 'hxa' + Math.random().toString(36).slice(2, 8);
    return '<svg class="hx-arch" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + text + '">' +
      '<path id="' + id + '" d="M 10 ' + (h - 6) + ' Q ' + (w / 2) + ' ' + (h - 6 - bend * 2) + ' ' + (w - 10) + ' ' + (h - 6) + '" fill="none"/>' +
      '<text text-anchor="middle" style="font-family:var(--font-display);font-weight:400;font-size:' + fs + 'px;fill:var(--ink)"><textPath href="#' + id + '" startOffset="50%">' + text + '</textPath></text></svg>';
  }


  /* Figuritas de cada mundo del mapa, dibujadas en una caja de 140x110 (origen arriba a la izquierda). */
  function F(n) { return 'style="fill:var(--' + n + ')"'; }
  function hexAt(x, y, r, col, rot) { return '<polygon points="' + pts(ngon(6, r, x, y, rot == null ? -Math.PI / 2 : rot)) + '" ' + F(col) + '/>'; }
  var LANDMARKS = {
    lines: function () {
      var s = '<rect x="4" y="92" width="132" height="5" rx="2" ' + F('wood-700') + '/>';
      for (var i = 0; i < 9; i++) s += '<rect x="' + (8 + i * 14) + '" y="89" width="6" height="12" rx="2" ' + F('wood-500') + '/>';
      s += '<g class="hx-lm-train">';
      var wag = ['piece-red', 'piece-yellow', 'piece-blue'];
      wag.forEach(function (c, i) { var x = 6 + i * 30; s += '<rect x="' + x + '" y="66" width="26" height="20" rx="4" ' + F('wood-500') + '/>' + hexAt(x + 13, 56, 12, c) + '<circle cx="' + (x + 7) + '" cy="88" r="4" ' + F('ink') + '/><circle cx="' + (x + 19) + '" cy="88" r="4" ' + F('ink') + '/>'; });
      s += '<rect x="96" y="52" width="38" height="34" rx="6" ' + F('game-lines') + '/><rect x="100" y="40" width="18" height="16" rx="3" ' + F('game-lines') + '/>' +
        '<rect x="104" y="58" width="12" height="10" rx="2" ' + F('sky') + '/><rect x="122" y="34" width="8" height="20" rx="2" ' + F('ink') + '/>' +
        '<circle class="hx-lm-puff" cx="126" cy="24" r="6" ' + F('panel') + '/><circle cx="104" cy="88" r="5" ' + F('ink') + '/><circle cx="124" cy="88" r="5" ' + F('ink') + '/></g>';
      return s;
    },
    fit: function () {
      var s = '<rect x="64" y="88" width="10" height="16" rx="3" ' + F('wood-700') + '/>', r = 15, w = r * S3;
      [[0, 0], [1, 0], [-1, 0], [0.5, 1], [-0.5, 1], [0.5, -1], [-0.5, -1]].forEach(function (p, i) {
        s += hexAt(70 + p[0] * w, 58 + p[1] * r * 1.5, r - 1.5, i === 4 ? 'sun-600' : 'sun-400');
      });
      s += hexAt(62.5, 80.5, 7, 'ink');
      s += '<g class="hx-lm-bee"><ellipse cx="116" cy="26" rx="9" ry="6.5" ' + F('sun-400') + '/><rect x="113" y="20" width="3" height="13" ' + F('ink') + '/><rect x="119" y="20" width="3" height="13" ' + F('ink') + '/>' +
        '<ellipse cx="114" cy="18" rx="5" ry="3.5" ' + F('white') + '/><ellipse cx="121" cy="18" rx="5" ry="3.5" ' + F('white') + '/></g>' +
        '<path d="M28 100 q10 -16 20 0 z" ' + F('game-fit') + '/><path d="M96 100 q8 -12 16 0 z" ' + F('game-fit') + '/>';
      return s;
    },
    sort: function () {
      var s = '<rect x="10" y="94" width="120" height="10" rx="4" ' + F('wood-500') + '/>';
      var towers = [[32, ['piece-blue', 'piece-blue', 'piece-blue', 'piece-blue']], [70, ['piece-pink', 'piece-pink', 'piece-pink', 'piece-pink', 'piece-pink', 'piece-pink']], [108, ['piece-green', 'piece-green', 'piece-green']]];
      towers.forEach(function (t) {
        t[1].forEach(function (c, i) {
          var y = 86 - i * 11;
          s += '<polygon points="' + pts([[t[0] - 15, y], [t[0] + 15, y], [t[0] + 15, y + 8], [t[0] - 15, y + 8]]) + '" ' + F(c) + '/>' +
            '<polygon points="' + pts([[t[0] - 15, y + 5], [t[0] + 15, y + 5], [t[0] + 15, y + 8], [t[0] - 15, y + 8]]) + '" ' + F('shade') + '/>';
        });
      });
      s += '<rect x="69" y="8" width="2.5" height="18" ' + F('wood-700') + '/><polygon points="71.5,8 86,12 71.5,16" ' + F('ribbon-500') + '/>';
      return s;
    },
    merge: function () {
      var s = '<path d="M14 86 h112 l-10 18 h-92 z" ' + F('wood-500') + '/><rect x="14" y="80" width="112" height="8" rx="3" ' + F('wood-300') + '/>' +
        '<rect x="22" y="84" width="96" height="4" rx="2" ' + F('game-merge') + '/>' +
        '<g class="hx-lm-jet"><path d="M58 84 C 56 60, 40 52, 34 70" fill="none" stroke-width="7" stroke-linecap="round" style="stroke:var(--game-merge)"/>' +
        '<path d="M82 84 C 84 60, 100 52, 106 70" fill="none" stroke-width="7" stroke-linecap="round" style="stroke:var(--game-merge)"/>' +
        '<rect x="66" y="40" width="8" height="44" rx="4" ' + F('game-merge') + '/></g>' +
        '<g class="hx-lm-tile">' + hexAt(70, 26, 20, 'merge-2048') + '<text x="70" y="27" text-anchor="middle" dominant-baseline="central" style="font-family:var(--font-display);font-size:13px;fill:var(--ink)">2048</text></g>';
      return s;
    },
    build: function () {
      var s = '<rect x="30" y="14" width="6" height="88" ' + F('ink') + '/><rect x="30" y="14" width="86" height="6" ' + F('ink') + '/>' +
        '<path d="M36 20 L60 20 L36 44" fill="none" stroke-width="2" style="stroke:var(--ink)"/><rect x="104" y="20" width="2" height="34" ' + F('ink') + '/>' +
        '<g class="hx-lm-hook">' + hexAt(105, 62, 9, 'disabled') + '</g>' +
        '<rect x="20" y="98" width="28" height="6" rx="2" ' + F('ink') + '/>' +
        '<polygon points="88,104 96,80 104,104" ' + F('piece-orange') + '/><rect x="90" y="92" width="12" height="4" ' + F('white') + '/>' +
        '<polygon points="112,104 118,86 124,104" ' + F('piece-orange') + '/>';
      return s;
    }
  };
  function landmark(id, size) {
    size = size || 140;
    return '<svg class="hx-landmark hx-landmark--' + id + '" width="' + size + '" height="' + f(size * 110 / 140) + '" viewBox="0 0 140 110" aria-hidden="true">' + LANDMARKS[id]() + '</svg>';
  }

  /* Íconos de trazo, 24px, color = currentColor. */
  var IC = {
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
    next: '<path d="M5 5l7 7-7 7M13 5l7 7-7 7"/>'
  };
  function icon(name, size) {
    size = size || 24;
    return '<svg class="hx-icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[name] || '') + '</svg>';
  }

  /* Conteo animado de un número. */
  function countUp(el, to, ms) {
    var t0 = null; ms = ms || 900;
    function step(t) { if (!t0) t0 = t; var k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(to * e).toLocaleString('es'); if (k < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  /* Reinicia una animación CSS quitando y poniendo la clase. */
  function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  window.HexaBlock = { landmark: landmark, LANDMARKS: LANDMARKS, ngon: ngon, prism: prism, pts: pts, cellGeom: cellGeom, piece: piece, piecePoly: piecePoly, shape: shape, board: board, layout: layout, stack: stack, mergeTile: mergeTile, star: star, mascot: mascot, arch: arch, icon: icon, icons: Object.keys(IC), countUp: countUp, replay: replay, GAMES: [
    { id: 'lines', name: 'Hexa Lines', world: 'Estación Línea', verb: '¡Completa!', sub: 'LLENA LÍNEAS EN 3 EJES' },
    { id: 'fit', name: 'Hexa Fit', world: 'La Colmena', verb: '¡Encaja!', sub: 'SIN HUECOS, SIN SOBRANTES' },
    { id: 'sort', name: 'Hexa Sort', world: 'Pilópolis', verb: '¡Ordena!', sub: 'APILA 10 DEL MISMO COLOR' },
    { id: 'merge', name: 'Hexa Merge', world: 'Fuente Fusión', verb: '¡Fusiona!', sub: 'DESLIZA Y JUNTA IGUALES' }
  ], PIECES: ['piece-red', 'piece-orange', 'piece-yellow', 'piece-green', 'piece-teal', 'piece-blue', 'piece-purple', 'piece-pink'] };
})();
