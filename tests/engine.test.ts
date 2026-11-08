import { describe, expect, it } from 'vitest';
import { boardGeometry } from '../src/domain/geometry/GeometryFactory';
import { HexBoard } from '../src/domain/HexBoard';
import { fromPixel, hexagonKeys, key, rotateCW, toPixel } from '../src/domain/hex';
import { SeededRandom } from '../src/domain/random';
import { GameEngine } from '../src/domain/GameEngine';
import { FitRules } from '../src/domain/games/fit/FitRules';

describe('HexBoard', () => {
  it('should_have_19_cells_when_radius_is_2', () => {
    const board = new HexBoard(boardGeometry('hex', 2), () => 0);
    expect(board.size).toBe(19);
  });

  it('should_have_61_cells_when_radius_is_4', () => {
    const board = new HexBoard(boardGeometry('hex', 4), () => 0);
    expect(board.size).toBe(61);
  });

  it('should_have_6_neighbors_when_cell_is_center', () => {
    const board = new HexBoard(boardGeometry('hex', 2), () => 0);
    expect(board.neighbors(key(0, 0))).toHaveLength(6);
  });

  it('should_have_3_neighbors_when_cell_is_corner', () => {
    const board = new HexBoard(boardGeometry('hex', 2), () => 0);
    expect(board.neighbors(key(2, 0))).toHaveLength(3);
  });

  it('should_return_lines_on_3_axes_when_board_is_hexagon', () => {
    // Arrange
    const board = new HexBoard(boardGeometry('hex', 2), () => 0);
    // Act
    const lines = board.lines();
    // Assert: 5 líneas por eje, 3 ejes; la central de cada eje tiene 5 celdas
    expect(lines).toHaveLength(15);
    expect(lines.filter(l => l.length === 5)).toHaveLength(3);
    expect(lines.flat()).toHaveLength(19 * 3);
  });

  it('should_copy_cells_when_cloned', () => {
    const board = new HexBoard<number[]>(boardGeometry('hex', 1), () => []);
    const copy = board.clone(c => [...c]);
    copy.get(key(0, 0)).push(1);
    expect(board.get(key(0, 0))).toEqual([]);
  });
});

describe('hex', () => {
  it('should_rotate_east_to_southeast_when_rotating_60_clockwise', () => {
    expect(rotateCW({ q: 1, r: 0 })).toEqual({ q: 0, r: 1 });
  });

  it('should_return_same_coord_when_rotating_6_times', () => {
    expect(rotateCW({ q: 2, r: -1 }, 6)).toEqual({ q: 2, r: -1 });
  });

  it('should_round_trip_when_converting_to_pixel_and_back', () => {
    for (const k of hexagonKeys(3)) {
      const [q, r] = k.split(',').map(Number);
      const p = toPixel({ q, r }, 22);
      expect(fromPixel(p.x + 3, p.y - 2, 22)).toEqual({ q, r });
    }
  });
});

describe('SeededRandom', () => {
  it('should_repeat_sequence_when_seed_is_equal', () => {
    const a = new SeededRandom(42), b = new SeededRandom(42);
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it('should_continue_sequence_when_cloned', () => {
    const a = new SeededRandom(7);
    a.next();
    const b = a.clone();
    expect(b.next()).toBe(a.next());
  });
});

describe('GameEngine', () => {
  it('should_notify_listeners_when_move_is_played', () => {
    const engine = new GameEngine(new FitRules());
    engine.start(1);
    const seen: string[] = [];
    engine.on(e => seen.push(e.type));
    engine.play({ type: 'rotate', piece: 0 });
    expect(seen).toEqual(['rotated']);
  });

  it('should_reject_move_when_invalid', () => {
    const engine = new GameEngine(new FitRules());
    engine.start(1);
    expect(engine.play({ type: 'remove', piece: 0 })).toBe(false);
  });
});
