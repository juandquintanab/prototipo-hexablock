import { describe, expect, it } from 'vitest';
import { key, keyOf } from '../src/domain/hex';
import { FitRules, fitStars, pieceCellsAt } from '../src/domain/games/fit/FitRules';
import { FIT_LEVELS } from '../src/domain/games/fit/levels';
import { GameEngine } from '../src/domain/GameEngine';

/** Gira cada pieza a su orientación original y la coloca en su lugar. */
function solve(engine: GameEngine<any, any, any>, level: number) {
  FIT_LEVELS[level - 1].forEach((cells, i) => {
    while (engine.state.pieces[i].rotation !== 0) engine.play({ type: 'rotate', piece: i });
    engine.play({ type: 'place', piece: i, anchor: key(cells[0][0], cells[0][1]) });
  });
}

describe('FitRules', () => {
  it('should_rotate_piece_60_degrees_when_rotated', () => {
    // Arrange: pieza de nivel 1 con rotación inicial (1+0)%6 = 1
    const rules = new FitRules();
    const s = rules.init(1);
    const p = s.pieces[0];
    p.rotation = 0;
    const before = pieceCellsAt(p, key(0, 0));
    // Act
    rules.apply(s, { type: 'rotate', piece: 0 });
    // Assert: (q,r) → (-r, q+r)
    const after = pieceCellsAt(p, key(0, 0));
    expect(before).toEqual(['0,0', '1,0', '1,-1']);
    expect(after).toEqual(['0,0', keyOf({ q: 0, r: 1 }), keyOf({ q: 1, r: 0 })]);
  });

  it('should_start_rotated_when_level_begins', () => {
    const s = new FitRules().init(2);
    expect(s.pieces.map(p => p.rotation)).toEqual([2, 3, 4]);
  });

  it('should_not_allow_overlap_when_cell_is_taken', () => {
    const engine = new GameEngine(new FitRules());
    engine.start(1);
    solve(engine, 1);
    engine.undo(); // quita la última pieza
    const last = FIT_LEVELS[0].length - 1;
    // intentar ponerla sobre la pieza 0 (ancla en su primera celda)
    expect(engine.isValid({ type: 'place', piece: last, anchor: key(0, 0) })).toBe(false);
  });

  it('should_win_when_figure_is_covered', () => {
    for (let lv = 1; lv <= 6; lv++) {
      const engine = new GameEngine(new FitRules());
      engine.start(lv);
      solve(engine, lv);
      expect(engine.status).toBe('won');
    }
  });

  it('should_restore_and_reapply_when_undo_and_redo', () => {
    const engine = new GameEngine(new FitRules());
    engine.start(1);
    solve(engine, 1);
    const moves = engine.state.moves;
    expect(engine.undo()).toBe(true);
    expect(engine.status).toBe('playing');
    expect(engine.state.moves).toBe(moves - 1);
    expect(engine.redo()).toBe(true);
    expect(engine.status).toBe('won');
  });

  it('should_return_piece_to_tray_when_removed', () => {
    const engine = new GameEngine(new FitRules());
    engine.start(1);
    solve(engine, 1);
    engine.undo();
    engine.play({ type: 'remove', piece: 0 });
    expect(engine.state.pieces[0].placedAt).toBeNull();
    expect(engine.state.board.get(key(0, 0))).toBeNull();
  });

  it('should_give_stars_by_moves_and_time_when_level_ends', () => {
    expect(fitStars(5, 3, 1000)).toBe(3);
    expect(fitStars(9, 3, 1000)).toBe(2);
    expect(fitStars(10, 3, 1000)).toBe(1);
    expect(fitStars(5, 3, 95_000)).toBe(2);
    expect(fitStars(10, 3, 95_000)).toBe(1);
  });
});
