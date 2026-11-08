/** Fondo plano de cielo, nubes, montañas y pasto para las pantallas de menú (sin degradados). */
export function groundArt(): string {
  return `<svg class="ground-art" viewBox="0 0 360 700" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <ellipse cx="70" cy="80" rx="34" ry="12" style="fill:var(--panel)"/><ellipse cx="96" cy="72" rx="22" ry="12" style="fill:var(--panel)"/>
    <ellipse cx="290" cy="130" rx="30" ry="10" style="fill:var(--panel)"/>
    <path d="M-200 560 L40 470 L130 540 L210 460 L300 530 L560 470 L560 620 L-200 620 Z" style="fill:var(--hill)"/>
    <path d="M-200 590 C 80 560, 280 560, 560 585 L560 900 L-200 900 Z" style="fill:var(--grass)"/>
    <path d="M-200 650 C 120 635, 240 665, 560 640 L560 900 L-200 900 Z" style="fill:var(--grass-700);opacity:.35"/>
  </svg>`;
}
