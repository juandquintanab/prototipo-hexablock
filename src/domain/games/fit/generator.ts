import type { CellKey, IGridGeometry } from '../../geometry/IGridGeometry';
import { SeededRandom } from '../../random';

/** Celdas y piezas por nivel: la dificultad crece con el tamaño y la cantidad de piezas. */
export const FIT_PLAN: [cells: number, pieces: number][] = [[7, 3], [8, 3], [10, 3], [12, 4], [15, 4], [18, 5]];
const MIN_PIECE = 2, MAX_PIECE = 6;

/** Figura conexa y compacta: crece desde el origen prefiriendo celdas con más vecinas ya dentro. */
export function growFigure(g: IGridGeometry, size: number, rng: SeededRandom): CellKey[] {
  const fig: CellKey[] = [g.origin];
  const inFig = new Set(fig);
  while (fig.length < size) {
    const frontier = [...new Set(fig.flatMap(k => g.adjacent(k)))].filter(k => !inFig.has(k));
    const score = (k: CellKey) => g.adjacent(k).filter(n => inFig.has(n)).length;
    const best = Math.max(...frontier.map(score));
    // casi siempre la más compacta; a veces cualquiera, para que no salgan todas iguales
    const pool = rng.next() < 0.75 ? frontier.filter(k => score(k) === best) : frontier;
    const next = rng.pick(pool);
    fig.push(next);
    inFig.add(next);
  }
  return fig;
}

/** Parte una figura conexa en `count` piezas conexas creciendo desde semillas al azar. */
export function splitFigure(g: IGridGeometry, fig: CellKey[], count: number, rng: SeededRandom): CellKey[][] {
  const inFig = new Set(fig);
  const owner = new Map<CellKey, number>();
  const pieces: CellKey[][] = [];
  const free = [...fig];
  for (let i = 0; i < count; i++) {
    const seed = free.splice(rng.int(free.length), 1)[0];
    owner.set(seed, i);
    pieces.push([seed]);
  }
  while (owner.size < fig.length) {
    const growable = pieces
      .map((p, i) => ({ i, frontier: [...new Set(p.flatMap(k => g.adjacent(k)))].filter(k => inFig.has(k) && !owner.has(k)) }))
      .filter(x => x.frontier.length);
    // crece la pieza más chica (empate al azar)
    const min = Math.min(...growable.map(x => pieces[x.i].length));
    const pick = rng.pick(growable.filter(x => pieces[x.i].length === min));
    const k = rng.pick(pick.frontier);
    owner.set(k, pick.i);
    pieces[pick.i].push(k);
  }
  return pieces;
}

/**
 * Seis niveles para una geometría, con semilla fija: resolubles por construcción
 * (las piezas salen de partir la figura, así que en su orientación original la cubren exacta).
 */
export function generateFitLevels(g: IGridGeometry, seed = 2026): CellKey[][][] {
  return FIT_PLAN.map(([cells, count], i) => {
    const rng = new SeededRandom(seed + 7919 * (i + 1) + g.sides * 104729);
    for (let attempt = 0; attempt < 500; attempt++) {
      const pieces = splitFigure(g, growFigure(g, cells, rng), count, rng);
      if (pieces.every(p => p.length >= MIN_PIECE && p.length <= MAX_PIECE)) return pieces;
    }
    throw new Error(`No se pudo generar el nivel ${i + 1} de Fit para ${g.id}`);
  });
}
