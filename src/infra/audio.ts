/** Efectos y música generados con Web Audio: sin archivos. Arrancan solo tras el primer toque. */
export type Sfx = 'tap' | 'place' | 'clear' | 'merge' | 'transfer' | 'goal' | 'win' | 'lose' | 'invalid';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let soundOn = true;
let musicOn = true;
let musicTimer: number | null = null;

export function unlockAudio(): void {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    syncMusic();
  } catch { /* sin audio */ }
}

export function setSound(on: boolean): void { soundOn = on; }
export function setMusic(on: boolean): void { musicOn = on; syncMusic(); }

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'triangle', vol = 0.18): void {
  if (!ctx || !master) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = ctx.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

const C5 = 523.25;
const semi = (n: number) => C5 * Math.pow(2, n / 12);

/** param: líneas limpiadas (clear) o valor creado (merge). */
export function sfx(name: Sfx, param = 1): void {
  if (!soundOn || !ctx) return;
  switch (name) {
    case 'tap': tone(880, 0, 0.05, 'square', 0.05); break;
    case 'place': tone(196, 0, 0.12, 'triangle', 0.22); tone(294, 0.02, 0.08, 'sine', 0.1); break;
    case 'invalid': tone(150, 0, 0.12, 'square', 0.06); tone(130, 0.08, 0.12, 'square', 0.06); break;
    case 'clear': {
      const steps = [0, 4, 7, 12, 16, 19];
      const n = Math.min(steps.length, 2 + param);
      for (let i = 0; i < n; i++) tone(semi(steps[i]), i * 0.06, 0.18, 'triangle', 0.16);
      break;
    }
    case 'merge': {
      const n = Math.log2(Math.max(2, param));
      tone(220 * Math.pow(2, n / 5), 0, 0.14, 'sine', 0.2);
      break;
    }
    case 'transfer': tone(semi(7 + Math.random() * 3), 0, 0.07, 'sine', 0.1); break;
    case 'goal': [0, 7, 12].forEach((s, i) => tone(semi(s + 5), i * 0.07, 0.25, 'triangle', 0.16)); break;
    case 'win': [0, 4, 7, 12, 16].forEach((s, i) => tone(semi(s), i * 0.11, 0.3, 'triangle', 0.18)); break;
    case 'lose': [7, 3, 0, -5].forEach((s, i) => tone(semi(s - 12), i * 0.16, 0.3, 'sine', 0.18)); break;
  }
}

/** Bucle suave de pocas notas a volumen bajo. */
const MELODY = [0, 4, 7, 9, 7, 4, 2, 4, 0, 4, 7, 12, 9, 7, 4, 2];
function syncMusic(): void {
  if (!ctx) return;
  if (musicOn && musicTimer === null) {
    let i = 0;
    musicTimer = window.setInterval(() => {
      const n = MELODY[i % MELODY.length];
      tone(semi(n - 12), 0, 0.5, 'sine', 0.035);
      if (i % 4 === 0) tone(semi(n - 24), 0, 0.9, 'sine', 0.03);
      i++;
    }, 420);
  } else if (!musicOn && musicTimer !== null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
