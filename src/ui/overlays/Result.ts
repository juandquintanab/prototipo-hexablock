import * as H from '../../design-system/hexablock';
import { el, esc, hexi, ribbonHTML, signHTML, starsHTML } from '../ui';

export interface ResultButton { label: string; action(): void }
export interface ResultSpec {
  win: boolean;
  title: string;
  stars?: number;
  score?: number;
  ribbon: { label: string; value?: string };
  primary: ResultButton;
  secondary: ResultButton;
}

/** Letrero de resultado con postes y banderines, Hexi al lado y botones abajo. */
export function showResult(parent: HTMLElement, r: ResultSpec): void {
  const middle = r.stars != null
    ? `<div class="result-stars">${starsHTML(r.stars, [44, 52, 44])}</div>`
    : `<div class="result-score" data-score>0</div>`;
  const body = `${middle}${ribbonHTML(r.ribbon.label, r.ribbon.value)}`;
  const ov = el(`<div class="overlay dim" role="dialog" aria-modal="true">
    <div class="sign-wrap">
      ${signHTML({ title: r.title, body, posts: true })}
      <div class="result-foot">
        <div class="result-hexi">${hexi({ mood: r.win ? 'celebra' : 'triste', size: 84 })}</div>
        <div class="btn-col">
          <button class="hx-btn" data-a="p">${esc(r.primary.label)}</button>
          <button class="hx-btn hx-btn--secondary" data-a="s">${esc(r.secondary.label)}</button>
        </div>
      </div>
    </div>
  </div>`);
  ov.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-a]');
    if (!b) return;
    ov.remove();
    (b.dataset.a === 'p' ? r.primary : r.secondary).action();
  });
  parent.append(ov);
  const sc = ov.querySelector<HTMLElement>('[data-score]');
  if (sc && r.score != null) setTimeout(() => H.countUp(sc, r.score!, 900), 300);
}
