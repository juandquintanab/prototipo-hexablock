import type { IRandom } from './ports';

/** Generador reproducible (mulberry32). Guarda su estado para poder clonarse. */
export class SeededRandom implements IRandom {
  state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n: number): number { return Math.floor(this.next() * n); }
  pick<T>(list: readonly T[]): T { return list[this.int(list.length)]; }
  clone(): SeededRandom { return new SeededRandom(this.state); }
}

/** Semilla nueva para cada partida (la UI la pide; el dominio no usa Math.random). */
export const freshSeed = (): number => (Date.now() ^ (Math.random() * 0x7fffffff)) >>> 0;
