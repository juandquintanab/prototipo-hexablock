import { describe, expect, it } from 'vitest';
import { HexBoard } from '../src/domain/HexBoard';
import { Dir, HexKey, hexagonKeys, key } from '../src/domain/hex';
import { MergeRules, MergeState, slide } from '../src/domain/games/merge/MergeRules';
import { GameEngine } from '../src/domain/GameEngine';
import { SeededRandom } from '../src/domain/random';

function boardWith(values: Record<string, number>): HexBoard<number> {
  const b = new HexBoard<number>(hexagonKeys(2), () => 0);
  for (const [k, v] of Object.entries(values)) b.set(k as HexKey, v);
  return b;
}

function stateWith(values: Record<string, number>): MergeState {
  return { board: boardWith(values), score: 0, maxTile: 0, next: 2, rng: new SeededRandom(1), keepPlaying: false };
}

describe('MergeRules', () => {
  it('should_merge_two_equal_tiles_when_sliding_east', () => {
    // Arrange: dos 2 en la fila r=0
    const board = boardWith({ '-1,0': 2, '0,0': 2 });
    // Act
    const res = slide(board, Dir.E);
    // Assert: queda un 4 en el borde este de la fila
    expect(res.board.get(key(2, 0))).toBe(4);
    expect(res.board.keys().filter(k => res.board.get(k) !== 0)).toHaveLength(1);
    expect(res.gained).toBe(4);
  });

  it('should_not_merge_twice_when_three_equal_tiles_slide', () => {
    // Arrange: 2 2 4 en la fila → 4 y 4, no 8
    const board = boardWith({ '-2,0': 2, '-1,0': 2, '0,0': 4 });
    // Act
    const res = slide(board, Dir.E);
    // Assert
    expect(res.board.get(key(2, 0))).toBe(4);
    expect(res.board.get(key(1, 0))).toBe(4);
    expect(res.gained).toBe(4);
  });

  it('should_merge_leading_pair_first_when_four_equal_tiles_slide', () => {
    const board = boardWith({ '-2,0': 2, '-1,0': 2, '0,0': 2, '1,0': 2 });
    const res = slide(board, Dir.E);
    expect(res.board.get(key(2, 0))).toBe(4);
    expect(res.board.get(key(1, 0))).toBe(4);
  });

  it('should_lose_when_no_move_changes_the_board', () => {
    // Arrange: tablero lleno sin vecinas iguales (coloreo de 3 colores del hexágono)
    const values: Record<string, number> = {};
    const vals = [2, 4, 8];
    for (const k of hexagonKeys(2)) {
      const [q, r] = k.split(',').map(Number);
      values[k] = vals[(((q - r) % 3) + 3) % 3];
    }
    const rules = new MergeRules(1);
    // Act + Assert
    expect(rules.status(stateWith(values))).toBe('lost');
  });

  it('should_win_when_2048_is_created', () => {
    const rules = new MergeRules(1);
    const s = stateWith({ '0,0': 1024, '1,0': 1024 });
    rules.apply(s, Dir.E);
    expect(s.maxTile).toBe(2048);
    expect(rules.status(s)).toBe('won');
    rules.continueAfterWin(s);
    expect(rules.status(s)).toBe('playing');
  });

  it('should_play_the_same_game_when_seed_is_equal', () => {
    const play = () => {
      const engine = new GameEngine(new MergeRules(1234));
      engine.start();
      const dirs = [0, 1, 2, 3, 4, 5, 0, 5, 3, 1];
      for (const d of dirs) engine.play(d as 0);
      return engine.state.board.keys().map(k => engine.state.board.get(k)).join(',');
    };
    expect(play()).toBe(play());
  });

  it('should_start_with_two_tiles_when_game_starts', () => {
    const s = new MergeRules(9).init();
    expect(s.board.keys().filter(k => s.board.get(k) !== 0)).toHaveLength(2);
  });

  it('should_undo_one_move_when_undo_is_called', () => {
    const engine = new GameEngine(new MergeRules(5));
    engine.start();
    const before = engine.state.board.entries().join();
    const dir = [0, 1, 2, 3, 4, 5].find(d => engine.isValid(d as 0))!;
    engine.play(dir as 0);
    expect(engine.undo()).toBe(true);
    expect(engine.state.board.entries().join()).toBe(before);
    expect(engine.undo()).toBe(false);
  });
});
