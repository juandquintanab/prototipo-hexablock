import { loadJSON, saveJSON } from '../infra/storage';
import type { I18nKey, Lang } from '../infra/i18n';
import { SHAPES, createGeometry } from '../domain/geometry/GeometryFactory';
import type { IGridGeometry, Shape } from '../domain/geometry/IGridGeometry';

export type { Shape };

/** Mejores puntajes y estrellas de una figura. */
export interface ShapeProgress {
  best: { lines: number; merge: number; mergeMaxTile: number };
  fit: number[];
  sort: number[];
}
/** Progreso guardado en el navegador: por juego y por figura. */
export interface Progress {
  settings: { sound: boolean; music: boolean; lang: Lang };
  shape: Shape;
  byShape: Record<Shape, ShapeProgress>;
  stats: { linesMaxCombo: number; sortGoalsTotal: number };
}

const KEY = 'hexablock-proto-v2';
const OLD_KEY = 'hexablock-proto-v1';
export const LEVEL_COUNT = 6;

const emptyShape = (): ShapeProgress => ({
  best: { lines: 0, merge: 0, mergeMaxTile: 0 },
  fit: Array(LEVEL_COUNT).fill(0),
  sort: Array(LEVEL_COUNT).fill(0),
});

function defaults(): Progress {
  return {
    settings: { sound: true, music: true, lang: 'es' },
    shape: 'hex',
    byShape: Object.fromEntries(SHAPES.map(s => [s, emptyShape()])) as Record<Shape, ShapeProgress>,
    stats: { linesMaxCombo: 0, sortGoalsTotal: 0 },
  };
}

const stars = (list: unknown): number[] => Array.from({ length: LEVEL_COUNT }, (_, i) => Number((list as number[] | undefined)?.[i] ?? 0));

/** Lee v2; si solo existe v1 (sin figuras), lo pasa a la figura hexágono. */
function load(): Progress {
  const d = defaults();
  const saved = loadJSON<Partial<Progress>>(KEY);
  if (saved) {
    for (const s of SHAPES) {
      const sp = saved.byShape?.[s];
      if (sp) d.byShape[s] = { best: { ...d.byShape[s].best, ...sp.best }, fit: stars(sp.fit), sort: stars(sp.sort) };
    }
    return {
      ...d,
      settings: { ...d.settings, ...saved.settings },
      shape: SHAPES.includes(saved.shape as Shape) ? (saved.shape as Shape) : 'hex',
      stats: { ...d.stats, ...saved.stats },
    };
  }
  const v1 = loadJSON<{ settings?: Progress['settings']; shape?: { board?: string }; best?: ShapeProgress['best']; fit?: { stars: number[] }; sort?: { stars: number[] }; stats?: Progress['stats'] }>(OLD_KEY);
  if (v1) {
    d.settings = { ...d.settings, ...v1.settings };
    d.stats = { ...d.stats, ...v1.stats };
    d.byShape.hex = { best: { ...d.byShape.hex.best, ...v1.best }, fit: stars(v1.fit?.stars), sort: stars(v1.sort?.stars) };
    d.shape = (SHAPES.includes(v1.shape?.board as Shape) ? v1.shape!.board : 'hex') as Shape;
  }
  return d;
}

export const progress: Progress = load();
export function save(): void { saveJSON(KEY, progress); }

export type LevelGame = 'fit' | 'sort';
export type ZoneGame = 'lines' | 'fit' | 'sort' | 'merge';

export function setShape(s: Shape): void { progress.shape = s; save(); }
/** Geometría de la figura elegida (sin acotar: para dibujar fichas, mascota, botones). */
export const currentGeometry = (): IGridGeometry => createGeometry(progress.shape);
/** Figura con la que se juega ese juego: la elegida (las tres sirven para los cuatro juegos). */
export const shapeFor = (_game: ZoneGame): Shape => progress.shape;
const sp = (game: ZoneGame): ShapeProgress => progress.byShape[shapeFor(game)];

export const bestOf = (game: 'lines' | 'merge'): number => sp(game).best[game];
export const levelStars = (g: LevelGame): number[] => sp(g)[g];
export const levelsWon = (g: LevelGame, shape: Shape = shapeFor(g)): number => progress.byShape[shape][g].filter(s => s > 0).length;
/** Un nivel se desbloquea al ganar el anterior (el 1 siempre abierto). */
export const isUnlocked = (g: LevelGame, level: number): boolean => level === 1 || levelStars(g)[level - 2] > 0;

export function recordLevel(g: LevelGame, level: number, st: number): void {
  const list = levelStars(g);
  list[level - 1] = Math.max(list[level - 1], st);
  save();
}
/** Devuelve true si es récord nuevo (en la figura con que se jugó). */
export function recordLines(score: number, combo: number): boolean {
  const b = sp('lines').best;
  const record = score > b.lines;
  b.lines = Math.max(b.lines, score);
  progress.stats.linesMaxCombo = Math.max(progress.stats.linesMaxCombo, combo);
  save();
  return record;
}
export function recordMerge(score: number, maxTile: number): boolean {
  const b = sp('merge').best;
  const record = score > b.merge;
  b.merge = Math.max(b.merge, score);
  b.mergeMaxTile = Math.max(b.mergeMaxTile, maxTile);
  save();
  return record;
}
export function addSortGoals(n: number): void { progress.stats.sortGoalsTotal += n; save(); }

/** Estrellas de zona del mapa, en la figura con que se juega ese juego. */
export function zoneStars(g: ZoneGame): number {
  const tiers = (v: number, t: [number, number, number]) => t.filter(x => v >= x).length;
  const b = sp(g).best;
  switch (g) {
    case 'lines': return tiers(b.lines, [500, 1500, 3000]);
    case 'merge': return tiers(b.mergeMaxTile, [128, 512, 2048]);
    default: return tiers(levelsWon(g), [1, 4, 6]);
  }
}

/** Contador del mapa: estrellas de zona + estrellas de niveles, en la figura elegida. */
export function totalStars(): number {
  const zones = (['lines', 'fit', 'sort', 'merge'] as ZoneGame[]).reduce((a, g) => a + zoneStars(g), 0);
  const levels = [...levelStars('fit'), ...levelStars('sort')].reduce((a, b) => a + b, 0);
  return zones + levels;
}

/** Logros: cuentan el mejor resultado en cualquier figura. */
export interface Achievement { id: I18nKey; value: number; goal: number }
export function achievements(): Achievement[] {
  const all = SHAPES.map(s => progress.byShape[s]);
  const maxOf = (f: (x: ShapeProgress) => number) => Math.max(...all.map(f));
  const won = (g: LevelGame) => Math.max(...SHAPES.map(s => levelsWon(g, s)));
  return [
    { id: 'achv.linesCombo', value: progress.stats.linesMaxCombo, goal: 3 },
    { id: 'achv.lines1000', value: maxOf(x => x.best.lines), goal: 1000 },
    { id: 'achv.merge256', value: maxOf(x => x.best.mergeMaxTile), goal: 256 },
    { id: 'achv.merge2048', value: maxOf(x => x.best.mergeMaxTile), goal: 2048 },
    { id: 'achv.fit3', value: won('fit'), goal: 3 },
    { id: 'achv.fitAll', value: won('fit'), goal: LEVEL_COUNT },
    { id: 'achv.sortGoals', value: progress.stats.sortGoalsTotal, goal: 10 },
    { id: 'achv.sort3', value: won('sort'), goal: 3 },
  ];
}
