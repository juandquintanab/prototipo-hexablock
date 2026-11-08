import * as H from '../../design-system/hexablock';
import { Achievement, achievements } from '../../app/progress';
import { t } from '../../infra/i18n';
import { go, Screen } from '../router';
import { el, esc, iconBtn, signHTML } from '../ui';
import { groundArt } from './art';

function row(a: Achievement): string {
  const done = a.value >= a.goal;
  const pct = Math.min(100, Math.round((a.value / a.goal) * 100));
  const count = `${H.fmt(Math.min(a.value, a.goal))} / ${H.fmt(a.goal)}`;
  return `<div class="hx-achv${done ? ' is-done' : ''}">
    <div class="hx-progress"><div class="hx-progress__fill" style="width:0" data-w="${pct}"></div><span>${esc(t(a.id))}${done ? '' : `<br><small class="achv-count">${count}</small>`}</span></div>
    <span class="hx-achv__reward">${H.star(done, 28)}</span>
  </div>`;
}

/** Logros: en progreso y completados. */
export function AchievementsScreen(): Screen {
  const list = achievements();
  const open = list.filter(a => a.value < a.goal);
  const done = list.filter(a => a.value >= a.goal);
  const body = `<div class="achv-list">
    ${open.length ? `<div class="hx-achv-head">${t('inProgress')}</div>${open.map(row).join('')}` : ''}
    ${done.length ? `<div class="hx-achv-head" style="margin-top:18px">${t('completed')}</div>${done.map(row).join('')}` : ''}
  </div>`;
  const s = el(`<section class="scr menu">
    ${groundArt()}
    <div class="menu__top">${iconBtn('back', t('back'), 'hx-ibtn--sm hx-ibtn--panel', 'data-back')}</div>
    <div class="menu__body menu__body--scroll">${signHTML({ title: t('achievements'), body })}</div>
  </section>`);
  s.addEventListener('click', e => { if ((e.target as HTMLElement).closest('[data-back]')) go({ name: 'map' }); });
  setTimeout(() => s.querySelectorAll<HTMLElement>('[data-w]').forEach(f => { f.style.width = f.dataset.w + '%'; }), 200);
  return { el: s };
}
