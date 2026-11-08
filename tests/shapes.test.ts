import { describe, expect, it } from 'vitest';
import { GameEngine } from '../src/domain/GameEngine';
import { SHAPES, boardGeometry } from '../src/domain/geometry/GeometryFactory';
import { HexBoard } from '../src/domain/HexBoard';
import { LINES_RADIUS, LinesRules } from '../src/domain/games/lines/LinesRules';
import { randomPolyform } from '../src/domain/games/lines/polyforms';
import { MERGE_RADIUS, MergeRules, slide } from '../src/domain/games/merge/MergeRules';
import { SORT_RADIUS, SortRules } from '../src/domain/games/sort/SortRules';
import { SeededRandom } from '../src/domain/random';

describe('Merge en otras figuras', () => {
  it('should_merge_like_classic_2048_when_square', () => {
    // Arrange: fila superior 2 2 . .  en un 4×4
    const g = boardGeometry('square', MERGE_RADIUS);
    const b = new HexBoard<number>(g, () => 0);
    const row = g.lines()[0];
    b.set(row[0], 2); b.set(row[1], 2);
    // Act: dirección 0 = avanzar en la fila
    const res = slide(b, 0);
    // Assert
    expect(res.board.get(row[row.length - 1])).toBe(4);
    expect(res.gained).toBe(4);
  });

  it('should_slide_along_strips_when_triangle', () => {
    const g = boardGeometry('tri', MERGE_RADIUS);
    const b = new HexBoard<number>(g, () => 0);
    const strip = g.lines().find(l => l.length >= 3)!;
    b.set(strip[0], 8); b.set(strip[1], 8);
    // alguna dirección junta los dos 8 dentro de su franja
    const merged = g.directions().map(d => slide(b, d)).find(r => r.gained === 16);
    expect(merged).toBeDefined();
    expect(merged!.board.keys().filter(k => merged!.board.get(k) === 16)).toHaveLength(1);
  });

  it.each(['hex', 'square', 'tri'] as const)('should_play_a_full_random_game_when_%s', shape => {
    const engine = new GameEngine(new MergeRules(7, boardGeometry(shape, MERGE_RADIUS)));
    engine.start();
    const rng = new SeededRandom(3);
    const dirs = boardGeometry(shape, MERGE_RADIUS).directions();
    for (let i = 0; i < 3000 && engine.status === 'playing'; i++) engine.play(rng.pick(dirs));
    expect(engine.status).not.toBe('playing');
  });
});

describe('Lines en otras figuras', () => {
  it.each(['square', 'tri'] as const)('should_clear_a_full_line_when_%s', shape => {
    const g = boardGeometry(shape, LINES_RADIUS);
    const rules = new LinesRules(1, g);
    const s = rules.init();
    const line = g.lines()[0];
    line.slice(1).forEach(k => s.board.set(k, 'piece-blue'));
    s.tray = [{ cells: [line[0]], color: 'piece-red' }, null, null];
    const events = rules.apply(s, { slot: 0, anchor: line[0] });
    expect(events.some(e => e.type === 'linesCleared')).toBe(true);
    line.forEach(k => expect(s.board.get(k)).toBeNull());
  });

  it('should_have_about_61_cells_when_lines_board_in_each_shape', () => {
    for (const shape of ['hex', 'square', 'tri'] as const) {
      const n = boardGeometry(shape, LINES_RADIUS).keys().length;
      expect(n).toBeGreaterThanOrEqual(50);
      expect(n).toBeLessThanOrEqual(70);
    }
  });

  it.each(SHAPES)('should_generate_connected_polyforms_of_1_to_5_cells_when_%s', shape => {
    const g = boardGeometry(shape, 2);
    const rng = new SeededRandom(5);
    for (let size = 1; size <= 5; size++) {
      const p = randomPolyform(g, size, rng);
      expect(new Set(p).size).toBe(size);
      p.slice(1).forEach(k => expect(p.some(o => o !== k && g.adjacent(o).includes(k))).toBe(true));
    }
  });
});

describe('Sort en todas las figuras', () => {
  it.each(SHAPES)('should_start_and_play_a_move_when_%s', shape => {
    const engine = new GameEngine(new SortRules(4, boardGeometry(shape, SORT_RADIUS)));
    engine.start(1);
    const empty = engine.state.board.keys().find(k => engine.state.board.get(k).length === 0)!;
    expect(engine.play({ slot: 0, key: empty })).toBe(true);
  });
});
