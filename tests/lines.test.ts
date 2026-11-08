import { describe, expect, it } from 'vitest';
import { HexKey, key } from '../src/domain/hex';
import { LinesRules, LinesScoring, LinesState } from '../src/domain/games/lines/LinesRules';

const single = { cells: ['0,0'], color: 'piece-red' as const };

function freshState(): { rules: LinesRules; s: LinesState } {
  const rules = new LinesRules(3);
  const s = rules.init();
  s.tray = [single, single, single];
  return { rules, s };
}

function fill(s: LinesState, keys: HexKey[]) { keys.forEach(k => s.board.set(k, 'piece-blue')); }

describe('LinesRules', () => {
  it('should_clear_line_when_row_r_is_full', () => {
    // Arrange: fila r=4 (5 celdas) llena menos una
    const { rules, s } = freshState();
    fill(s, [key(-4, 4), key(-3, 4), key(-2, 4), key(-1, 4)]);
    // Act
    const events = rules.apply(s, { slot: 0, anchor: key(0, 4) });
    // Assert
    const cleared = events.find(e => e.type === 'linesCleared');
    expect(cleared).toMatchObject({ lines: 1 });
    expect(s.board.get(key(-4, 4))).toBeNull();
  });

  it('should_clear_line_when_column_q_is_full', () => {
    const { rules, s } = freshState();
    fill(s, [key(4, -4), key(4, -3), key(4, -2), key(4, -1)]);
    rules.apply(s, { slot: 0, anchor: key(4, 0) });
    expect(s.board.get(key(4, -4))).toBeNull();
  });

  it('should_clear_line_when_diagonal_s_is_full', () => {
    // s = -4 → q + r = 4: (0,4) (1,3) (2,2) (3,1) (4,0)
    const { rules, s } = freshState();
    fill(s, [key(0, 4), key(1, 3), key(2, 2), key(3, 1)]);
    rules.apply(s, { slot: 0, anchor: key(4, 0) });
    expect(s.board.get(key(0, 4))).toBeNull();
  });

  it('should_count_combo_of_3_when_one_piece_completes_3_lines', () => {
    // Arrange: las tres líneas que pasan por la esquina (4,0) llenas menos esa esquina
    const { rules, s } = freshState();
    const rowR0 = [-4, -3, -2, -1, 0, 1, 2, 3].map(q => key(q, 0));
    const colQ4 = [-4, -3, -2, -1].map(r => key(4, r));
    const diag = [key(0, 4), key(1, 3), key(2, 2), key(3, 1)];
    fill(s, [...rowR0, ...colQ4, ...diag]);
    // Act
    const events = rules.apply(s, { slot: 0, anchor: key(4, 0) });
    // Assert
    expect(events.find(e => e.type === 'linesCleared')).toMatchObject({ lines: 3 });
    expect(s.maxCombo).toBe(3);
  });

  it('should_detect_no_space_when_no_tray_piece_fits', () => {
    // Arrange: tablero lleno salvo una celda y la bandeja solo tiene piezas de 2
    const { rules, s } = freshState();
    s.board.keys().forEach(k => s.board.set(k, 'piece-green'));
    s.board.set(key(0, 0), null);
    s.tray = [{ cells: ['0,0', '1,0'], color: 'piece-red' }, null, null];
    // Act + Assert
    expect(rules.status(s)).toBe('lost');
  });

  it('should_score_streak_bonus_when_consecutive_moves_clear', () => {
    const scoring = new LinesScoring();
    expect(scoring.score({ placed: 1, cleared: 5, lines: 1, streak: 0 })).toBe(51);
    expect(scoring.score({ placed: 1, cleared: 5, lines: 1, streak: 2 })).toBe(101);
  });

  it('should_refill_tray_when_three_pieces_are_used', () => {
    const { rules, s } = freshState();
    rules.apply(s, { slot: 0, anchor: key(0, 0) });
    rules.apply(s, { slot: 1, anchor: key(1, 0) });
    const events = rules.apply(s, { slot: 2, anchor: key(2, 0) });
    expect(events.some(e => e.type === 'trayRefilled')).toBe(true);
    expect(s.tray.every(t => t !== null)).toBe(true);
  });
});
