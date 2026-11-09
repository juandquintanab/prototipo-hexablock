import * as H from '../../design-system/hexablock';
import { boardGeometry } from '../../domain/geometry/GeometryFactory';
import { progress } from '../../app/progress';
import { t } from '../../infra/i18n';
import { directionAngles } from '../board/SwipeController';
import { hexi } from '../ui';

/**
 * Mini ilustraciones animadas del tutorial "Cómo jugar", hechas con los helpers del sistema
 * (board, piece, stack, mergeTile, mascot) en la figura elegida. Las animaciones son clases tut-* de app.css.
 */

type Geo = H.Geo;
const geo = (): Geo => progress.shape;
const sides = (): number => ({ tri: 3, square: 4, hex: 6 } as const)[geo()];
const P = H.PIECES;

/** Fila del medio de board() (en las tres geometrías una fila es una línea). */
const midRow = (g: Geo, size: number) => (g === 'hex' ? 0 : size);
const rowOf = (key: string) => Number(key.split(',')[1]);

/** Tablero sobre piedra con caras; `fill` decide el color de cada celda. */
function stoneBoard(size: number, cell: number, fill: (c: H.CellGeom, i: number) => string | null, faces: H.FaceMood | ((c: H.CellGeom) => H.FaceMood | null) = 'idle'): string {
  return H.board({ geo: geo(), size, cell, base: true, fill, faces: typeof faces === 'function' ? faces : () => faces });
}

/** Marca con una clase las fichas del tablero cuya fila es `row` (para animarlas). */
function tagRow(svg: string, row: number, cls: string): string {
  return svg.replace(/<g class="hx-piece" data-key="([^"]+)"/g, (m, key: string) =>
    rowOf(key) === row ? `<g class="hx-piece ${cls}" data-key="${key}"` : m);
}

const twoCells = (): H.Pt[] => [[0, 0], [1, 0]];
const threeCells = (): H.Pt[] => geo() === 'tri' ? [[0, 0], [1, 0], [2, 0]] : [[0, 0], [1, 0], [0, 1]];

export type TutGame = 'lines' | 'fit' | 'sort' | 'merge';

/** Ilustración del paso `step` (0, 1 o 2) de un juego. */
export function tutorialArt(game: TutGame, step: number): string {
  const g = geo();
  switch (`${game}${step}`) {
    // ---- Lines
    case 'lines0':
      return stage(stoneBoard(2, 12, (_c, i) => (i * 7) % 5 === 0 ? P[i % 8] : null) +
        `<div class="tut-float tut-drop">${H.piece({ geo: g, cells: twoCells(), color: 'piece-teal', cell: 12 })}</div>`);
    case 'lines1': {
      const row = midRow(g, 2);
      const svg = stoneBoard(2, 12, (c, i) => rowOf(c.key) === row ? P[(i + 3) % 8] : (i % 6 === 0 ? P[i % 8] : null),
        c => rowOf(c.key) === row ? 'scared' : 'idle');
      return stage(tagRow(svg, row, 'tut-clear'));
    }
    case 'lines2': {
      const row = midRow(g, 2);
      // dos líneas llenas a la vez = combo
      const svg = stoneBoard(2, 12, (c, i) => rowOf(c.key) === row || rowOf(c.key) === row + 1 ? P[(i + 1) % 8] : null, 'scared');
      return stage(tagRow(tagRow(svg, row, 'tut-clear'), row + 1, 'tut-clear') +
        `<div class="tut-combo">${t('combo2')}</div>` +
        `<div class="tut-hexi">${hexi({ mood: 'sorpresa', size: 46 })}</div>`);
    }
    // ---- Fit
    case 'fit0':
      return stage(stoneBoard(1, 16, (_c, i) => i < 3 ? 'piece-blue' : null) +
        `<div class="tut-float tut-drop">${H.piece({ geo: g, cells: threeCells(), color: 'piece-orange', cell: 16 })}</div>`);
    case 'fit1': {
      const steps = ({ tri: 3, square: 4, hex: 6 } as const)[g];
      return stage(`<div class="tut-turn" style="animation-timing-function:steps(${steps}, end)">${H.piece({ geo: g, cells: threeCells(), color: 'piece-pink', cell: 18 })}</div>` +
        '<span class="tut-tap" aria-hidden="true"></span>');
    }
    case 'fit2':
      return stage(stoneBoard(1, 16, (_c, i) => ['piece-blue', 'piece-orange', 'piece-pink'][i % 3], 'happy') +
        `<div class="tut-hexi">${hexi({ mood: 'celebra', size: 46 })}</div>`);
    // ---- Sort
    case 'sort0':
      return stage(stoneBoard(1, 16, () => null) +
        `<div class="tut-float tut-drop tut-drop--short">${H.stack(['piece-blue', 'piece-pink', 'piece-pink'], { size: 40, layer: 5, sides: sides(), face: true })}</div>`);
    case 'sort1':
      return stage(`<div class="tut-pair">${H.stack(['piece-yellow', 'piece-pink', 'piece-blue'], { size: 52, layer: 6, sides: sides(), face: true })}` +
        `${H.stack(['piece-pink', 'piece-blue', 'piece-blue', 'piece-blue'], { size: 52, layer: 6, sides: sides(), face: true })}</div>` +
        `<div class="tut-hop">${H.shape({ sides: sides(), size: 30, color: 'piece-blue' })}</div>`);
    case 'sort2':
      return stage(`<div class="tut-clear-stack">${H.stack(Array(10).fill('piece-green'), { size: 56, layer: 6, sides: sides(), face: 'happy' })}</div>` +
        '<div class="tut-plus">+1</div>');
    // ---- Merge
    case 'merge0': {
      const angles = directionAngles(boardGeometry(g, 2));
      const arrows = angles.map((a, i) => {
        const deg = (a * 180) / Math.PI;
        return `<g transform="rotate(${H.f(deg)} 70 60)"><g class="tut-arrow" style="animation-delay:${i * 0.12}s">` +
          '<path d="M104 60 h18 M114 52 l9 8 l-9 8" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" style="stroke:var(--wood-700)"/></g></g>';
      }).join('');
      return stage(`<svg class="tut-arrows" width="140" height="120" viewBox="0 0 140 120" aria-hidden="true">${arrows}</svg>` +
        `<div class="tut-center">${H.mergeTile(2, { size: 56, sides: sides() })}</div>`);
    }
    case 'merge1':
      return stage(`<div class="tut-merge">
        <span class="tut-merge__a">${H.mergeTile(2, { size: 52, sides: sides() })}</span>
        <span class="tut-merge__b">${H.mergeTile(2, { size: 52, sides: sides() })}</span>
        <span class="tut-merge__c">${H.mergeTile(4, { size: 52, sides: sides() })}</span>
      </div>`);
    case 'merge2':
      return stage(`<div class="tut-float-soft">${H.mergeTile(2048, { size: 76, sides: sides() })}</div>` +
        `<div class="tut-hexi">${hexi({ mood: 'celebra', size: 46 })}</div>`);
  }
  return stage('');
}

const stage = (inner: string) => `<div class="tut-stage" aria-hidden="true">${inner}</div>`;
