import { describe, expect, it } from 'vitest';
import { key, keyOf } from '../src/domain/hex';
import { FIT_LEVEL_COUNT, FitRules, FitState, fitStars, pieceCellsAt } from '../src/domain/games/fit/FitRules';
import { FIT_PLAN } from '../src/domain/games/fit/generator';
import { SHAPES } from '../src/domain/geometry/GeometryFactory';
import { GameEngine } from '../src/domain/GameEngine';

/** Gira cada pieza a su orientación original y la coloca donde estaba en la figura. */
function solve(engine: GameEngine<any, any, FitState>, rules: FitRules, level: number) {
  rules.levels()[level - 1].forEach((cells, i) => {
    while (engine.state.pieces[i].rotation !== 0) engine.play({ type: 'rotate', piece: i });
    engine.play({ type: 'place', piece: i, anchor: cells[0] });
  });
}

function hexEngine(level: number) {
  const rules = new FitRules();
  const engine = new GameEngine(rules);
  engine.start(level);
  return { rules, engine };
}

describe('FitRules', () => {
  it('should_rotate_piece_60_degrees_when_rotated', () => {
    // Arrange: primera pieza del nivel 1 en su orientación original
    const rules = new FitRules();
    const s = rules.init(1);
    const g = s.board.geometry;
    const p = s.pieces[0];
    p.rotation = 0;
    const before = pieceCellsAt(g, p, key(0, 0));
    // Act
    rules.apply(s, { type: 'rotate', piece: 0 });
    // Assert: (q,r) → (-r, q+r) alrededor de la primera celda
    const after = pieceCellsAt(g, p, key(0, 0));
    expect(before).toEqual(['0,0', '1,0', '1,-1']);
    expect(after).toEqual(['0,0', keyOf({ q: 0, r: 1 }), keyOf({ q: 1, r: 0 })]);
  });

  it('should_start_rotated_when_level_begins', () => {
    const s = new FitRules().init(2);
    expect(s.pieces.map(p => p.rotation)).toEqual([2, 3, 4]);
  });

  it('should_not_allow_overlap_when_cell_is_taken', () => {
    const { rules, engine } = hexEngine(1);
    solve(engine, rules, 1);
    engine.undo(); // quita la última pieza
    const last = engine.state.pieces.length - 1;
    // intentar ponerla con su referencia sobre la pieza 0
    expect(engine.isValid({ type: 'place', piece: last, anchor: key(0, 0) })).toBe(false);
  });

  it('should_restore_and_reapply_when_undo_and_redo', () => {
    const { rules, engine } = hexEngine(1);
    solve(engine, rules, 1);
    const moves = engine.state.moves;
    expect(engine.undo()).toBe(true);
    expect(engine.status).toBe('playing');
    expect(engine.state.moves).toBe(moves - 1);
    expect(engine.redo()).toBe(true);
    expect(engine.status).toBe('won');
  });

  it('should_return_piece_to_tray_when_removed', () => {
    const { rules, engine } = hexEngine(1);
    solve(engine, rules, 1);
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

describe.each(SHAPES)('Fit levels in %s', shape => {
  const rules = new FitRules(shape);

  it('should_have_6_levels_when_loaded', () => {
    expect(rules.levels()).toHaveLength(FIT_LEVEL_COUNT);
  });

  it('should_be_coverable_when_every_piece_is_rotated_back_and_placed', () => {
    for (let lv = 1; lv <= FIT_LEVEL_COUNT; lv++) {
      const engine = new GameEngine(rules);
      engine.start(lv);
      solve(engine, rules, lv);
      expect(engine.status, `${shape} nivel ${lv}`).toBe('won');
    }
  });

  it('should_use_connected_pieces_without_overlap_when_generated', () => {
    const geo = new FitRules(shape).init(1).board.geometry;
    rules.levels().forEach(pieces => {
      const all = pieces.flat();
      expect(new Set(all).size).toBe(all.length);
      for (const p of pieces) {
        // conexa: desde la primera celda se alcanzan todas
        const seen = new Set([p[0]]), queue = [p[0]];
        while (queue.length) for (const n of geo.adjacent(queue.shift()!)) if (p.includes(n) && !seen.has(n)) { seen.add(n); queue.push(n); }
        expect(seen.size).toBe(p.length);
      }
    });
  });

  it('should_start_with_pieces_rotated_when_level_begins', () => {
    const s = rules.init(1);
    expect(s.pieces.some(p => p.rotation !== 0)).toBe(true);
  });
});

describe('Fit generator', () => {
  it('should_grow_levels_by_plan_when_shape_is_not_hexagon', () => {
    for (const shape of ['tri', 'square'] as const) {
      const levels = new FitRules(shape).levels();
      levels.forEach((pieces, i) => {
        expect(pieces.flat()).toHaveLength(FIT_PLAN[i][0]);
        expect(pieces).toHaveLength(FIT_PLAN[i][1]);
      });
    }
  });

  it('should_generate_the_same_levels_when_called_twice', () => {
    expect(new FitRules('tri').levels()).toEqual(new FitRules('tri').levels());
  });
});
