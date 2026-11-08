import { loadJSON, saveJSON } from '../infra/storage';
import type { I18nKey, Lang } from '../infra/i18n';

/** Progreso guardado en el navegador (clave hexablock-proto-v1). */
export type BoardShape = 'tri' | 'square' | 'hex';
export interface Progress {
  settings: { sound: boolean; music: boolean; lang: Lang };
  shape: { board: BoardShape; pieceSides: number };
  best: { lines: number; merge: number; mergeMaxTile: number };
  fit: { stars: number[] };
  sort: { stars: number[] };
  stats: { linesMaxCombo: number; sortGoalsTotal: number };
}

const KEY = 'hexablock-proto-v1';
export const LEVEL_COUNT = 6;

function defaults(): Progress {
  return {
    settings: { sound: true, music: true, lang: 'es' },
    shape: { board: 'hex', pieceSides: 6 },
    best: { lines: 0, merge: 0, mergeMaxTile: 0 },
    fit: { stars: Array(LEVEL_COUNT).fill(0) },
    sort: { stars: Array(LEVEL_COUNT).fill(0) },
    stats: { linesMaxCombo: 0, sortGoalsTotal: 0 },
  };
}

function load(): Progress {
  const d = defaults();
  const saved = loadJSON<Partial<Progress>>(KEY);
  if (!saved) return d;
  return {
    settings: { ...d.settings, ...saved.settings },
    shape: { ...d.shape, ...saved.shape },
    best: { ...d.best, ...saved.best },
    fit: { stars: d.fit.stars.map((_, i) => saved.fit?.stars?.[i] ?? 0) },
    sort: { stars: d.sort.stars.map((_, i) => saved.sort?.stars?.[i] ?? 0) },
    stats: { ...d.stats, ...saved.stats },
  };
}

export const progress: Progress = load();
export function save(): void { saveJSON(KEY, progress); }

export type LevelGame = 'fit' | 'sort';
export type ZoneGame = 'lines' | 'fit' | 'sort' | 'merge';

export const levelsWon = (g: LevelGame): number => progress[g].stars.filter(s => s > 0).length;
/** Un nivel se desbloquea al ganar el anterior (el 1 siempre abierto). */
export const isUnlocked = (g: LevelGame, level: number): boolean => level === 1 || progress[g].stars[level - 2] > 0;

export function recordLevel(g: LevelGame, level: number, stars: number): void {
  progress[g].stars[level - 1] = Math.max(progress[g].stars[level - 1], stars);
  save();
}
/** Devuelve true si es récord nuevo. */
export function recordLines(score: number, combo: number): boolean {
  const record = score > progress.best.lines;
  progress.best.lines = Math.max(progress.best.lines, score);
  progress.stats.linesMaxCombo = Math.max(progress.stats.linesMaxCombo, combo);
  save();
  return record;
}
export function recordMerge(score: number, maxTile: number): boolean {
  const record = score > progress.best.merge;
  progress.best.merge = Math.max(progress.best.merge, score);
  progress.best.mergeMaxTile = Math.max(progress.best.mergeMaxTile, maxTile);
  save();
  return record;
}
export function addSortGoals(n: number): void { progress.stats.sortGoalsTotal += n; save(); }

/** Estrellas de zona del mapa. */
export function zoneStars(g: ZoneGame): number {
  const tiers = (v: number, t: [number, number, number]) => t.filter(x => v >= x).length;
  switch (g) {
    case 'lines': return tiers(progress.best.lines, [500, 1500, 3000]);
    case 'merge': return tiers(progress.best.mergeMaxTile, [128, 512, 2048]);
    default: return tiers(levelsWon(g), [1, 4, 6]);
  }
}

/** Contador del mapa: estrellas de zona + estrellas de niveles. */
export function totalStars(): number {
  const zones = (['lines', 'fit', 'sort', 'merge'] as ZoneGame[]).reduce((a, g) => a + zoneStars(g), 0);
  const levels = [...progress.fit.stars, ...progress.sort.stars].reduce((a, b) => a + b, 0);
  return zones + levels;
}

export interface Achievement { id: I18nKey; value: number; goal: number }
export function achievements(): Achievement[] {
  const p = progress;
  return [
    { id: 'achv.linesCombo', value: p.stats.linesMaxCombo, goal: 3 },
    { id: 'achv.lines1000', value: p.best.lines, goal: 1000 },
    { id: 'achv.merge256', value: p.best.mergeMaxTile, goal: 256 },
    { id: 'achv.merge2048', value: p.best.mergeMaxTile, goal: 2048 },
    { id: 'achv.fit3', value: levelsWon('fit'), goal: 3 },
    { id: 'achv.fitAll', value: levelsWon('fit'), goal: LEVEL_COUNT },
    { id: 'achv.sortGoals', value: p.stats.sortGoalsTotal, goal: 10 },
    { id: 'achv.sort3', value: levelsWon('sort'), goal: 3 },
  ];
}
