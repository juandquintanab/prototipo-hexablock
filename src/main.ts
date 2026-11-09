import './design-system/tokens.css';
import './design-system/bundle.css';
import './app.css';
import { progress } from './app/progress';
import { FEATURES } from './app/config';
import { setMusic, setSound, sfx } from './infra/audio';
import { setLang } from './infra/i18n';
import { initRouter, go } from './ui/router';
import { HomeScreen } from './ui/screens/Home';
import { MapScreen } from './ui/screens/Map';
import { LevelsScreen } from './ui/screens/Levels';
import { GameScreen } from './ui/screens/Game';
import { SettingsScreen } from './ui/screens/Settings';
import { CatalogScreen } from './ui/screens/Catalog';
import { AchievementsScreen } from './ui/screens/Achievements';

setLang(progress.settings.lang);
setSound(progress.settings.sound);
setMusic(progress.settings.music);

const app = document.getElementById('app')!;
initRouter(app, {
  home: HomeScreen,
  map: MapScreen,
  levels: LevelsScreen,
  game: GameScreen,
  settings: SettingsScreen,
  catalog: CatalogScreen,
  // Logros: solo existe la ruta si la función está prendida (src/app/config.ts)
  ...(FEATURES.achievements ? { achievements: AchievementsScreen } : {}),
});

// sonido de toque en cualquier botón
app.addEventListener('click', e => { if ((e.target as Element).closest('button, [role="button"]')) sfx('tap'); }, true);
// sin zoom accidental con doble toque / gesto en iOS
document.addEventListener('gesturestart', e => e.preventDefault());

// solo en desarrollo: navegar desde la consola (window.__go({ name: 'game', game: 'fit', level: 2 }))
if (import.meta.env.DEV) (window as unknown as { __go: typeof go }).__go = go;

go({ name: 'home' });
