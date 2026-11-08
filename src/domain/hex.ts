/** Coordenadas axiales de hexágonos con punta arriba. s = -q - r. */
export type HexKey = `${number},${number}`;
export interface HexCoord { q: number; r: number }

export const key = (q: number, r: number): HexKey => `${q + 0},${r + 0}` as HexKey; // +0 evita "-0"
export const keyOf = (c: HexCoord): HexKey => key(c.q, c.r);
export function parse(k: HexKey): HexCoord {
  const [q, r] = k.split(',').map(Number);
  return { q, r };
}

/** Direcciones en este orden: E, NE, NO, O, SO, SE. */
export const DIRECTIONS: readonly HexCoord[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];
export const Dir = { E: 0, NE: 1, NW: 2, W: 3, SW: 4, SE: 5 } as const;
export type Direction = 0 | 1 | 2 | 3 | 4 | 5;

export const add = (a: HexCoord, b: HexCoord): HexCoord => ({ q: a.q + b.q, r: a.r + b.r });
export const sOf = (c: HexCoord): number => -c.q - c.r;

/** Rotación de 60° horaria: (q, r) → (-r, q + r), aplicada `times` veces. */
export function rotateCW(c: HexCoord, times = 1): HexCoord {
  let q = c.q, r = c.r;
  const n = ((times % 6) + 6) % 6;
  for (let i = 0; i < n; i++) [q, r] = [-r, q + r];
  return { q: q + 0, r: r + 0 };
}

/** Celdas de un tablero hexagonal de radio R: max(|q|,|r|,|s|) ≤ R. */
export function hexagonKeys(R: number): HexKey[] {
  const out: HexKey[] = [];
  for (let r = -R; r <= R; r++)
    for (let q = -R; q <= R; q++)
      if (Math.abs(q + r) <= R) out.push(key(q, r));
  return out;
}

/** Centro en píxeles (igual que cellGeom del sistema de diseño). */
export function toPixel(c: HexCoord, size: number): { x: number; y: number } {
  return { x: size * Math.sqrt(3) * (c.q + c.r / 2), y: size * 1.5 * c.r };
}

/** Píxel → celda axial (redondeo cúbico). */
export function fromPixel(x: number, y: number, size: number): HexCoord {
  const fq = (Math.sqrt(3) / 3 * x - y / 3) / size;
  const fr = (2 / 3 * y) / size;
  const fs = -fq - fr;
  let q = Math.round(fq), r = Math.round(fr);
  const s = Math.round(fs);
  const dq = Math.abs(q - fq), dr = Math.abs(r - fr), ds = Math.abs(s - fs);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  return { q: q + 0, r: r + 0 };
}
