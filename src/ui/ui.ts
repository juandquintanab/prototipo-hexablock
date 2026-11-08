import * as H from '../design-system/hexablock';
import { currentGeometry } from '../app/progress';

/** Crea un elemento desde HTML (un solo nodo raíz). */
export function el<T extends HTMLElement = HTMLElement>(html: string): T {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as T;
}

export const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Letrero de madera con cresta hexagonal y título arqueado. */
export function signHTML(o: { title: string; body: string; posts?: boolean; width?: number; titleSize?: number; extra?: string; cls?: string }): string {
  const w = o.width ?? 240;
  const size = o.titleSize ?? (o.title.length > 11 ? 28 : 34);
  return `<div class="hx-sign hx-anim-drop ${o.cls ?? ''}">
    ${o.posts ? '<span class="hx-sign__post hx-sign__post--l"></span><span class="hx-sign__post hx-sign__post--r"></span>' : ''}
    ${o.extra ?? ''}
    <div class="hx-sign__crest"></div>
    <div class="hx-sign__title">${H.arch(esc(o.title), { width: w, size })}</div>
    <div class="hx-sign__body">${o.body}</div>
  </div>`;
}

export function starsHTML(n: number, sizes: [number, number, number] = [28, 34, 28], playing = true): string {
  return `<div class="hx-stars${playing ? ' is-playing' : ''}">${[0, 1, 2].map(i => H.star(i < n, sizes[i])).join('')}</div>`;
}

export function ribbonHTML(label: string, value?: string): string {
  return `<div class="hx-ribbon-wrap"><div class="hx-ribbon"${value ? '' : ' style="justify-content:center"'}><span>${esc(label)}</span>${value ? `<span>${esc(value)}</span>` : ''}</div></div>`;
}

export function iconBtn(icon: string, label: string, cls = '', attrs = ''): string {
  return `<button class="hx-ibtn ${cls}" aria-label="${esc(label)}" ${attrs}>${H.icon(icon, cls.includes('sm') ? 22 : 24)}</button>`;
}

export function toggleHTML(id: string, label: string, on: boolean): string {
  return `<button class="hx-toggle" role="switch" data-toggle="${id}" aria-checked="${on}" aria-label="${esc(label)}"></button>`;
}

/** Mascota viva (respira y parpadea), con la figura elegida en el catálogo. */
export function hexi(o: Parameters<typeof H.mascot>[0] = {}): string {
  return H.mascot({ sides: currentGeometry().sides, ...o }).replace('class="hx-mascot ', 'class="hx-mascot is-alive ');
}

export const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/** Lee una duración de los tokens (dur-*) en ms. */
export function dur(name: 'tap' | 'fast' | 'base' | 'sign' | 'slow'): number {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 1;
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--dur-${name}`).trim();
  return parseFloat(v) || 0;
}
