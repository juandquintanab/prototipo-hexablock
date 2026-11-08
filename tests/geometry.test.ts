import { describe, expect, it } from 'vitest';
import { SHAPES, boardGeometry, capabilities, createGeometry } from '../src/domain/geometry/GeometryFactory';
import type { IGridGeometry } from '../src/domain/geometry/IGridGeometry';

const sameSet = (a: string[], b: string[]) => expect([...a].sort()).toEqual([...b].sort());

/** Celdas de la zona central de un tablero grande (todas sus vecinas existen). */
function inner(g: IGridGeometry): string[] {
  return g.keys().filter(k => g.adjacent(k).every(n => g.has(n)));
}

describe.each(SHAPES)('geometry %s', shape => {
  const g = boardGeometry(shape, 4);
  const expected = { hex: 6, square: 4, tri: 3, pent: 5 }[shape];

  it('should_have_expected_neighbors_when_cell_is_inside_the_board', () => {
    const ks = inner(g);
    expect(ks.length).toBeGreaterThan(0);
    ks.forEach(k => expect(g.neighbors(k)).toHaveLength(expected));
  });

  it('should_be_symmetric_when_two_cells_are_neighbors', () => {
    for (const k of g.keys()) for (const n of g.neighbors(k)) expect(g.neighbors(n)).toContain(k);
  });

  it('should_return_cell_itself_when_asking_cellAt_its_center', () => {
    for (const k of g.keys()) expect(g.cellAt(g.center(k))).toBe(k);
  });

  it('should_not_overlap_when_polygons_are_drawn', () => {
    // el centro de cada celda está dentro de su propio polígono y a distancia de los centros vecinos
    for (const k of g.keys()) {
      const c = g.center(k);
      for (const n of g.neighbors(k)) {
        const d = g.center(n);
        expect(Math.hypot(c.x - d.x, c.y - d.y)).toBeGreaterThan(0.5);
      }
    }
  });

  it('should_return_to_start_when_rotating_a_full_turn', () => {
    const cells = [g.origin, ...createGeometry(shape).adjacent(g.origin)];
    const rotated = g.rotate(cells, g.rotationSteps);
    expect(rotated).toEqual(cells);
  });

  it('should_keep_shape_connected_when_rotating_one_step', () => {
    const geo = createGeometry(shape);
    const piece = [geo.origin, geo.adjacent(geo.origin)[0], geo.adjacent(geo.adjacent(geo.origin)[0])[0]];
    for (let t = 1; t < geo.rotationSteps; t++) {
      const r = geo.rotate(piece, t);
      expect(new Set(r).size).toBe(piece.length);
      // las adyacencias se conservan
      expect(geo.adjacent(r[0])).toContain(r[1]);
      expect(geo.adjacent(r[1])).toContain(r[2]);
    }
  });

  it('should_keep_adjacency_when_translated', () => {
    const geo = createGeometry(shape);
    const piece = [geo.origin, geo.adjacent(geo.origin)[1]];
    const target = geo.keys().length ? geo.keys()[0] : g.keys().find(k => geo.translate(piece, piece[0], k))!;
    const moved = geo.translate(piece, piece[0], target)!;
    expect(moved[0]).toBe(target);
    expect(geo.adjacent(moved[0])).toContain(moved[1]);
  });
});

describe('lines', () => {
  it('should_have_15_lines_on_3_axes_when_hexagon_radius_2', () => {
    const g = boardGeometry('hex', 2);
    expect(g.lines()).toHaveLength(15);
    expect(g.lines().flat()).toHaveLength(19 * 3);
  });

  it('should_have_rows_and_columns_when_square', () => {
    const g = boardGeometry('square', 4); // 8×8
    expect(g.keys()).toHaveLength(64);
    expect(g.lines()).toHaveLength(16);
    g.lines().forEach(l => expect(l).toHaveLength(8));
  });

  it('should_cover_every_cell_3_times_when_triangle_strips', () => {
    const g = boardGeometry('tri', 4);
    expect(g.keys()).toHaveLength(54); // hexágono de triángulos de lado 3
    const lines = g.lines();
    // cada celda está en exactamente una línea de cada una de las 3 franjas
    expect(lines.flat()).toHaveLength(54 * 3);
    // y cada línea es una cadena de vecinas
    lines.forEach(l => l.slice(1).forEach((k, i) => expect(g.adjacent(l[i])).toContain(k)));
  });

  it('should_have_no_lines_or_directions_when_pentagon', () => {
    const g = boardGeometry('pent', 2);
    expect(g.lines()).toEqual([]);
    expect(g.directions()).toEqual([]);
    expect(capabilities('pent')).toEqual({ lines: false, directions: false });
  });

  it('should_slide_along_its_line_when_stepping_in_a_direction', () => {
    for (const shape of ['hex', 'square', 'tri'] as const) {
      const g = boardGeometry(shape, 3);
      for (const d of g.directions()) {
        for (const k of g.keys()) {
          const n = g.step(k, d);
          if (n) expect(g.neighbors(k)).toContain(n);
          if (n) expect(g.lines().some(l => l.includes(k) && l.includes(n))).toBe(true);
        }
      }
    }
  });

  it('should_have_4_directions_when_square_and_6_when_hex_or_triangle', () => {
    expect(boardGeometry('square', 2).directions()).toHaveLength(4);
    expect(boardGeometry('hex', 2).directions()).toHaveLength(6);
    expect(boardGeometry('tri', 2).directions()).toHaveLength(6);
  });
});

describe('cells', () => {
  it('should_size_boards_like_the_hexagon_when_creating_standard_boards', () => {
    expect(boardGeometry('hex', 2).keys()).toHaveLength(19);
    expect(boardGeometry('square', 2).keys()).toHaveLength(16);
    expect(boardGeometry('tri', 2).keys()).toHaveLength(24);
    expect(boardGeometry('pent', 2).keys()).toHaveLength(18);
  });
});

describe('rotation', () => {
  it.each(SHAPES)('should_map_the_board_one_to_one_when_rotating_%s', shape => {
    const g = boardGeometry(shape, 3);
    for (let t = 1; t < g.rotationSteps; t++) {
      const rotated = g.rotate(g.keys(), t);
      // la rotación es una biyección: ninguna celda se repite
      expect(new Set(rotated).size).toBe(g.keys().length);
      // y un giro más hasta la vuelta completa vuelve al inicio
      sameSet(g.rotate(rotated, g.rotationSteps - t), g.keys());
    }
  });

  it('should_rotate_hex_east_neighbor_to_southeast_when_turning_60', () => {
    expect(createGeometry('hex').rotate(['1,0'], 1)).toEqual(['0,1']);
  });

  it('should_rotate_square_east_neighbor_to_south_when_turning_90', () => {
    expect(createGeometry('square').rotate(['1,0'], 1)).toEqual(['0,1']);
  });
});
