import { describe, expect, it } from 'vitest';
import { key } from '../src/domain/hex';
import { SortRules, SortState, sortStars } from '../src/domain/games/sort/SortRules';

function emptyState(): { rules: SortRules; s: SortState } {
  const rules = new SortRules(11);
  const s = rules.init(1);
  s.board.keys().forEach(k => s.board.set(k, []));
  return { rules, s };
}

const B = 'piece-blue', P = 'piece-pink', Y = 'piece-yellow';

describe('SortRules', () => {
  it('should_transfer_to_longer_run_when_tops_match', () => {
    // Arrange: vecina con racha azul de 3; colocamos una pila con racha azul de 1
    const { rules, s } = emptyState();
    s.board.set(key(1, 0), [P, B, B, B]);
    s.tray = [[P, B], null, null];
    // Act
    const events = rules.apply(s, { slot: 0, key: key(0, 0) });
    // Assert: el azul de la colocada se va a la vecina
    expect(events).toContainEqual({ type: 'transferred', from: key(0, 0), to: key(1, 0), count: 1 });
    expect(s.board.get(key(1, 0))).toEqual([P, B, B, B, B]);
    expect(s.board.get(key(0, 0))).toEqual([P]);
  });

  it('should_transfer_to_placed_stack_when_runs_tie', () => {
    const { rules, s } = emptyState();
    s.board.set(key(1, 0), [Y, B, B]);
    s.tray = [[B, B], null, null];
    rules.apply(s, { slot: 0, key: key(0, 0) });
    expect(s.board.get(key(0, 0))).toEqual([B, B, B, B]);
    expect(s.board.get(key(1, 0))).toEqual([Y]);
  });

  it('should_clear_run_and_count_goal_when_reaching_10', () => {
    // Arrange: vecina con 7 azules; colocamos 3 azules
    const { rules, s } = emptyState();
    s.board.set(key(1, 0), [P, B, B, B, B, B, B, B]);
    s.tray = [[B, B, B], null, null];
    // Act
    const events = rules.apply(s, { slot: 0, key: key(0, 0) });
    // Assert
    expect(events.some(e => e.type === 'stackCleared')).toBe(true);
    expect(s.goalsDone).toBe(1);
    expect(s.board.get(key(1, 0))).toEqual([P]);
  });

  it('should_cascade_in_two_steps_when_transfer_exposes_matching_color', () => {
    // Arrange: A=(1,0) [Y, B] ; C=(2,0) [Y, Y, Y]. Colocamos [B, B] en (0,0).
    // Paso 1: el azul de A pasa a la colocada (racha 1 < 2) y A queda con Y arriba.
    // Paso 2: A (Y×1) y C (Y×3) se juntan: el amarillo de A pasa a C.
    const { rules, s } = emptyState();
    s.board.set(key(1, 0), [Y, B]);
    s.board.set(key(2, 0), [Y, Y, Y]);
    s.tray = [[B, B], null, null];
    // Act
    const events = rules.apply(s, { slot: 0, key: key(0, 0) });
    // Assert
    const transfers = events.filter(e => e.type === 'transferred');
    expect(transfers).toHaveLength(2);
    expect(s.board.get(key(0, 0))).toEqual([B, B, B]);
    expect(s.board.get(key(1, 0))).toEqual([]);
    expect(s.board.get(key(2, 0))).toEqual([Y, Y, Y, Y]);
  });

  it('should_lose_when_board_has_no_empty_cell', () => {
    const { rules, s } = emptyState();
    s.board.keys().forEach((k, i) => s.board.set(k, [i % 2 ? B : P]));
    expect(rules.status(s)).toBe('lost');
  });

  it('should_win_when_goals_are_met', () => {
    const { rules, s } = emptyState();
    s.goalsDone = s.goals;
    expect(rules.status(s)).toBe('won');
  });

  it('should_give_stars_by_par_when_level_ends', () => {
    expect(sortStars(10, 2)).toBe(3);
    expect(sortStars(15, 2)).toBe(2);
    expect(sortStars(16, 2)).toBe(1);
  });

  it('should_generate_stacks_of_2_to_6_when_tray_refills', () => {
    const rules = new SortRules(99);
    for (let lv = 1; lv <= 6; lv++) {
      const s = rules.init(lv);
      s.tray.forEach(t => { expect(t!.length).toBeGreaterThanOrEqual(2); expect(t!.length).toBeLessThanOrEqual(6); });
      expect(s.board.keys().filter(k => s.board.get(k).length).length).toBe([0, 0, 2, 3, 3, 4][lv - 1]);
    }
  });
});
