# HexaBlock Suite — Especificación del prototipo navegable

> Documento para el agente que construye el prototipo (Claude Code). Léelo completo antes de escribir código. La carpeta `design-system/` que acompaña este archivo es la fuente de verdad visual: no inventes colores, letras ni componentes fuera de ella.

---

## 0. Contexto y objetivo

HexaBlock Suite es el proyecto semestral de Desarrollo de Software (UCAB, profesor Carlos Alonso): una sola app con **cuatro juegos de tablero hexagonal** (Hexa Lines, Hexa Fit, Hexa Sort, Hexa Merge) construidos sobre **un solo motor genérico**.

Este prototipo es una **app web para teléfono en vertical**, que el equipo abre con un enlace y juega. Objetivos:

1. **Navegable**: todas las pantallas y el flujo completo.
2. **Los cuatro juegos funcionan** de principio a fin (ganar, perder, puntaje, niveles).
3. **Fiel al sistema de diseño** (estilo Dumb Ways to Die 2: letreros de madera, ilustración plana, animaciones).
4. **Código simple pero bien organizado**, con la misma estructura que pide el enunciado (motor genérico + reglas por juego), porque después se porta a la app final y se defiende ante el profesor.

## 1. Alcance

**Incluye**
- Inicio, mapa de mundos, letrero de zona, selección de niveles, instrucción de entrada, partida, pausa, victoria, derrota, ajustes, catálogo de figuras y logros.
- Los 4 juegos jugables **solo en tablero hexagonal**.
- 6 niveles de Hexa Fit y 6 de Hexa Sort (los datos están en la sección 6).
- Español e inglés, sonido y música con opción de silenciar, progreso guardado en el navegador.
- Todas las animaciones del sistema de diseño.

**No incluye (no lo hagas)**
- Backend, login, ranking real, red de cualquier tipo.
- Cambiar de tablero o de figura de ficha: el catálogo **se ve y se puede elegir, pero no cambia nada del juego** (sección 8).
- La zona "En construcción" del mapa: **no va** en este prototipo.
- Anuncios, tienda, monedas.

## 2. Stack y estructura

- **Vite + TypeScript**, sin framework de UI (DOM y SVG a mano). El curso usa TypeScript y el enunciado exige genéricos.
- Sin dependencias de runtime. Dev: `vite`, `typescript`, `vitest` (para probar las reglas).
- Salida estática (`npm run build` → `dist/`), desplegable en Vercel o GitHub Pages.
- Tablero, fichas, mascota y figuritas en **SVG**.

```
hexablock-prototipo/
  index.html
  src/
    main.ts                  # arranque, router de pantallas
    design-system/           # copia de la carpeta design-system (tokens.css, bundle.css, hexablock.ts)
    domain/                  # SIN dependencias de DOM
      hex.ts                 # HexCoord, direcciones, ejes, rotación
      HexBoard.ts            # HexBoard<TCell>
      GameEngine.ts          # GameEngine<TCell, TMove, TState> + eventos (Observer)
      ports.ts               # IGameRules, IPieceSource, IScoringPolicy, IRandom
      random.ts              # SeededRandom (mulberry32)
      games/
        merge/MergeRules.ts
        lines/LinesRules.ts  lines/shapes.ts
        sort/SortRules.ts    sort/levels.ts
        fit/FitRules.ts      fit/levels.ts
    app/                     # casos de uso simples
      progress.ts            # leer/guardar progreso, estrellas, logros
    infra/
      storage.ts             # localStorage con try/catch
      audio.ts               # Web Audio (efectos y música generados)
      i18n.ts                # tablas ES/EN
    ui/
      screens/               # Home, Map, Levels, Game, Settings, Catalog, Achievements
      overlays/              # ZoneSheet, Instruction, Pause, Result
      board/BoardView.ts     # dibuja cualquier HexBoard en SVG
      board/PlacementController.ts  # arrastrar/tocar para colocar piezas
      board/SwipeController.ts      # deslizar (Merge)
  tests/                     # vitest: reglas de cada juego
```

Regla de oro: **`domain/` no importa nada de `ui/` ni de `infra/`**. La UI escucha eventos del motor.

## 3. Sistema de diseño

La carpeta `design-system/` trae:
- `tokens.json` y `tokens.css`: todos los colores, espaciados, radios, sombras, labios, duraciones y curvas como variables CSS.
- `components/bundle.css`: las clases `hx-*` de todos los componentes y las animaciones (`@keyframes`).
- `components/bundle.js`: helpers de dibujo en `window.HexaBlock` (tablero, ficha, pila, ficha de Merge, estrella, mascota, título arqueado, íconos, figuritas del mapa, conteo animado). **Pórtalo a un módulo TypeScript** (`hexablock.ts`) con los mismos nombres; no cambies su dibujo.
- `README.md`: la guía de marca. Léela.
- `components/<Nombre>/README.md` y `preview.html`: guía y ejemplo vivo de cada componente. Úsalos como referencia exacta de marcado y comportamiento (WorldMap, Signboard, GameScreen, AchievementRow, ShapeCatalog, Motion…).

Reglas visuales que no se negocian:
- **Plano**, como Dumb Ways to Die. Fichas, estrellas, niveles, fichas de Merge y mascota: formas planas de un color, sin lateral. **Relieve solo** en botones (labio `sun-600`), letreros y bandejas de madera (`wood-700`) y **pilas de Hexa Sort**.
- **Tipografía**: `Young Serif` (`--font-display`) para títulos, botones, números, nombres de zona e instrucciones; `Gelasio` (`--font-text`) para textos y etiquetas. Etiquetas en MAYÚSCULAS con peso normal, nunca en negrita espaciada. Nunca negrita sintética en Young Serif (`font-synthesis: none`).
- Botones amarillos con texto `sun-ink` (no blanco).
- Una acción principal amarilla por pantalla.
- Cada juego es dueño de un color: `game-lines` (naranja), `game-fit` (menta), `game-sort` (rosa), `game-merge` (azul); su `-bg` es el fondo de la partida.
- Todo entra con rebote (`ease-bounce`), sale acelerando (`ease-in`); duraciones de los tokens `dur-*`. Respeta `prefers-reduced-motion` (ya está en `bundle.css`).
- Diseño de un solo tema (claro). No hace falta modo oscuro.

## 4. Pantallas y flujo

Contenedor de la app: columna de máx. 440px centrada, alto completo, fondo `sky`. Márgenes laterales de 16px. Todo usable con el pulgar (áreas táctiles ≥ 44px).

```
Inicio → Mapa → Letrero de zona → (Niveles, solo Fit y Sort) → Instrucción → Partida → Victoria / Derrota
                     ↑                                                          │
                     └──────────────────── Mapa / Niveles / Otra vez ◄──────────┘
Ajustes y Logros se abren desde el mapa; Pausa desde la partida; Catálogo desde Ajustes.
```

### 4.1 Inicio
- Logo "HexaBlock" en `display-xl` con "Suite" debajo, Hexi (mascota, humor `feliz`, viva) y botón **JUGAR** ("TOCA PARA JUGAR" como etiqueta).
- El primer toque desbloquea el audio (requisito del navegador) y va al mapa.

### 4.2 Mapa de mundos
Ver `components/WorldMap/preview.html`. Igual que ahí, **sin** la zona en construcción ni su cinta.
- Isla con camino de piedras hexagonales, de abajo hacia arriba: **Estación Línea** (Lines), **La Colmena** (Fit), **Pilópolis** (Sort), **Fuente Fusión** (Merge). Cada una con su figurita animada (`landmark(id)`) y letrero con nombre y estrellas de la zona (sección 9.2).
- Hexi al inicio del camino.
- Arriba: contador de estrellas totales (izquierda), botones **Logros** (trofeo) y **Ajustes** (engranaje) (derecha).
- Tocar un mundo lo levanta y abre el **Letrero de zona**.

### 4.3 Letrero de zona (hoja inferior)
Ver `WorldMap/preview.html`. Letrero que cae desde abajo con: nombre del mundo arqueado, nombre del juego en etiqueta, estrellas de la zona, cinta ("Tu mejor 8 192" en Lines y Merge; "Niveles 3 / 6" en Fit y Sort), botón **JUGAR** y X para cerrar.
- Lines y Merge → Instrucción → Partida.
- Fit y Sort → Selección de niveles.

### 4.4 Selección de niveles (Fit, Sort)
- Letrero con el nombre del mundo y una cuadrícula de 6 `LevelTile` (hexágono plano con número y estrellas). Completados en color del juego con sus estrellas; el siguiente disponible en `sun-400` respirando; el resto bloqueados con candado.
- Botón atrás → mapa.

### 4.5 Instrucción
Pantalla completa con el fondo del juego, el verbo enorme entrando de lado y el subtítulo en mayúsculas (ver `Instruction`). Dura 1.1 s o hasta que el jugador toque.

| Juego | Verbo ES / EN | Subtítulo ES / EN |
|---|---|---|
| Lines | ¡Completa! / Complete! | LLENA LÍNEAS EN 3 EJES / FILL LINES ON 3 AXES |
| Fit | ¡Encaja! / Fit it! | SIN HUECOS, SIN SOBRANTES / NO GAPS, NO LEFTOVERS |
| Sort | ¡Ordena! / Sort it! | APILA 10 DEL MISMO COLOR / STACK 10 OF A COLOR |
| Merge | ¡Fusiona! / Merge! | DESLIZA Y JUNTA IGUALES / SWIPE AND JOIN TWINS |

### 4.6 Partida
Estructura común (ver `GameScreen`): **HUD** arriba (pausa redonda a la izquierda, dato central, controles extra a la derecha), **tablero** al centro, **bandeja** de madera abajo. Detalle por juego en la sección 6.

### 4.7 Pausa
Letrero "Pausa": **CONTINUAR** (principal), **REINICIAR**, **MAPA** (o **NIVELES** en Fit/Sort) y los interruptores de sonido y música.

### 4.8 Victoria y derrota
Letrero con postes y banderines (ver `Signboard`):
- Título arqueado: "¡Victoria!", "¡2048!", "Sin espacio" (Lines), "Sin movimientos" (Merge), "Tablero lleno" (Sort).
- Estrellas (Fit, Sort) con pop escalonado; puntaje con conteo animado (Lines, Merge).
- Cinta: "Tu mejor N" o "¡Nuevo récord!" o "Nivel N".
- Hexi `celebra` (victoria) o `triste` (derrota) al lado.
- Botones según caso: **SIGUIENTE** (nivel siguiente) / **OTRA VEZ** / **SEGUIR** (Merge tras 2048) y secundario **MAPA** o **NIVELES**.

### 4.9 Ajustes
Letrero "Ajustes" (ver `Settings`): Sonido (interruptor), Música (interruptor), Idioma (ES/EN), Figuras (botón al catálogo). Atrás → mapa.

### 4.10 Catálogo de figuras
Ver `ShapeCatalog`. Dos filas: **Tablero** (triángulo, cuadrado, hexágono) y **Ficha** (3 a 10 lados), vista previa del tablero y Hexi con la figura elegida. Se guarda la elección. Nota visible en etiqueta: "En esta versión se juega con hexágonos". **No afecta los juegos ni la mascota fuera de esta pantalla.**

### 4.11 Logros
Letrero "Logros" con encabezados "EN PROGRESO" y "COMPLETADOS" y filas `AchievementRow` (sección 9.3).

## 5. Motor genérico (dominio)

### 5.1 Coordenadas
Hexágonos **con punta arriba**, coordenadas **axiales** `(q, r)`, `s = -q - r`. Clave de celda: `"q,r"`.
- Píxel del centro: `x = size·√3·(q + r/2)`, `y = size·3/2·r` (igual que `cellGeom` del sistema de diseño).
- Direcciones (en este orden): E `(+1,0)`, NE `(+1,-1)`, NO `(0,-1)`, O `(-1,0)`, SO `(-1,+1)`, SE `(0,+1)`.
- Ejes de línea: `r` constante, `q` constante, `s` constante.
- Rotación 60° horaria: `(q, r) → (-r, q + r)`.
- Tablero hexagonal de radio R: celdas con `max(|q|,|r|,|s|) ≤ R` (R=2 → 19 celdas, R=4 → 61).

### 5.2 Tipos (orientativos; nombres en el estilo del enunciado)

```ts
type HexKey = `${number},${number}`;
interface HexCoord { q: number; r: number }

class HexBoard<TCell> {                 // escrito una vez, usado por los 4 juegos
  constructor(keys: Iterable<HexKey>, empty: () => TCell);
  get(k: HexKey): TCell; set(k: HexKey, v: TCell): void; has(k: HexKey): boolean;
  keys(): HexKey[]; neighbors(k: HexKey): HexKey[];
  lines(): HexKey[][];                  // todas las líneas de los 3 ejes
  clone(): HexBoard<TCell>;
}

interface IRandom { next(): number }    // SeededRandom(seed) con mulberry32: reproducible

interface IGameRules<TCell, TMove, TState> {
  init(level?: number): TState;
  isValid(state: TState, move: TMove): boolean;
  apply(state: TState, move: TMove): GameEvent[];   // modifica el estado y devuelve lo que pasó
  status(state: TState): 'playing' | 'won' | 'lost';
}

type GameEvent =
  | { type: 'placed'; keys: HexKey[] } | { type: 'linesCleared'; keys: HexKey[]; lines: number }
  | { type: 'merged'; key: HexKey; value: number } | { type: 'spawned'; key: HexKey }
  | { type: 'transferred'; from: HexKey; to: HexKey; count: number } | { type: 'stackCleared'; key: HexKey }
  | { type: 'score'; points: number } | { type: 'won' } | { type: 'lost' };

class GameEngine<TCell, TMove, TState> {   // orquesta: valida, aplica, avisa (Observer)
  constructor(rules: IGameRules<TCell, TMove, TState>);
  start(level?: number): void; play(move: TMove): boolean;
  undo(): boolean; redo(): boolean;        // solo si las reglas lo permiten (Fit ilimitado, Merge 1)
  on(listener: (e: GameEvent) => void): void;
}
```

El tipo de celda de cada juego: Lines `PieceColor | null`, Fit `PieceId | null`, Sort `ColorStack` (arreglo de colores), Merge `number` (0 = vacía). Pon pruebas `vitest` de cada regla (sección 11).

## 6. Los juegos

Colores de ficha: `piece-red, piece-orange, piece-yellow, piece-green, piece-teal, piece-blue, piece-purple, piece-pink`.

### 6.1 Hexa Merge — Fuente Fusión
- **Tablero**: radio 2 (19 celdas). Empieza con 2 fichas.
- **Movimiento**: deslizar en una de las 6 direcciones. Swipe ≥ 24px; se elige la dirección cuyo vector en píxeles tenga el ángulo más cercano. Teclado: ← →, Q (NO), E (NE), Z (SO), C (SE).
- **Regla**: procesa las fichas de la más avanzada en esa dirección a la menos avanzada; cada una avanza hasta chocar. Si choca con una igual que no se fusionó en este turno, se fusionan en una del doble. Suma al puntaje el valor creado.
- **Tras cada movimiento que cambia el tablero**: aparece una ficha nueva en una celda vacía al azar: 2 (90%) o 4 (10%), con `IRandom` sembrado.
- **Fin**: victoria al crear 2048 (letrero "¡2048!" con SEGUIR); derrota si ningún movimiento cambia el tablero.
- **Deshacer**: 1 movimiento.
- **HUD**: Puntos (grande), Mejor (pequeño), botón deshacer.
- **Bandeja**: "NUEVA FICHA" con la ficha que vendrá (2 o 4). Dibuja las fichas claras sobre un hueco `cell-slot` para que no se pierdan sobre el crema.
- **Animación**: las fusionadas rebotan (`hx-anim-bump`), la nueva hace pop (`hx-anim-pop`).

### 6.2 Hexa Lines — Estación Línea
- **Tablero**: radio 4 (61 celdas).
- **Bandeja**: 3 piezas al azar de la tabla; cuando se usan las 3, llega otra bandeja.
- **Colocar**: arrastrar la pieza al tablero (la pieza se levanta ~56 px sobre el dedo; el tablero muestra la vista previa válida en su color al 55% o inválida en rojo con temblor). También: tocar pieza y luego tocar celda.
- **Resolución**: tras colocar, se eliminan todas las líneas completas de los 3 ejes (onda `hx-anim-clear`, 40 ms entre fichas).
- **Puntaje**: +1 por celda colocada; por cada jugada que limpia: `celdas limpiadas × 10 × líneas limpiadas`; racha (jugadas seguidas que limpian) multiplica ×(1 + 0.5·racha).
- **Fin**: derrota cuando ninguna pieza restante de la bandeja cabe en ninguna parte ("Sin espacio"). Sin victoria (partida sin fin).
- **HUD**: Puntos, Mejor.

Piezas (desplazamientos axiales; elige con pesos: tamaños 1–3 más frecuentes):
```
1: [0,0]
2: [0,0][1,0] · [0,0][0,1] · [0,0][1,-1]
3: [0,0][1,0][2,0] · [0,0][0,1][0,2] · [0,0][1,-1][2,-2]
   [0,0][1,0][0,1] · [0,0][1,-1][1,0] · [0,0][1,0][1,1] · [0,0][0,1][1,1]
4: [0,0][1,0][2,0][3,0] · [0,0][0,1][0,2][0,3] · [0,0][1,-1][2,-2][3,-3]
   [0,0][1,0][0,1][1,1]
5: [0,0][1,0][2,0][1,1][0,1]
```

### 6.3 Hexa Sort — Pilópolis
- **Tablero**: radio 2 (19 celdas). Cada celda es una pila (arreglo de colores, abajo → arriba).
- **Bandeja**: 3 pilas generadas (2–6 fichas, 1–3 grupos de colores tomados de los colores del nivel). Al usar las 3, llegan 3 nuevas.
- **Colocar**: arrastrar o tocar pila y celda **vacía**.
- **Resolución en cascada** (animada, `dur-base` por paso): desde la celda colocada, si una vecina tiene el mismo color arriba, la racha superior pasa de la pila con racha más corta a la de racha más larga (empate: a la recién colocada). Repetir desde las celdas que cambiaron hasta que no haya transferencias. Si una pila junta **10 o más** del mismo color arriba, esa racha desaparece y cuenta **1 meta**.
- **Fin**: victoria al cumplir las metas del nivel; derrota si tras resolver no queda ninguna celda vacía ("Tablero lleno").
- **Estrellas**: `par = metas × 5` movimientos; ≤ par → 3, ≤ 1.5·par → 2, si no → 1.
- **HUD**: Nivel N, "Metas x / y" con barra de progreso estilo logros; bandeja "SIGUIENTE".
- **Dibujo**: pilas con relieve (única ficha 3D), capa de ~6 px por ficha; número de la racha superior sobre la cima.

| Nivel | Metas | Colores | Pilas iniciales en el tablero |
|---|---|---|---|
| 1 | 2 | 3 | 0 |
| 2 | 3 | 3 | 0 |
| 3 | 3 | 4 | 2 |
| 4 | 4 | 4 | 3 |
| 5 | 5 | 5 | 3 |
| 6 | 6 | 5 | 4 |

### 6.4 Hexa Fit — La Colmena
- **Tablero**: la **figura del nivel** (conjunto de celdas); solo esas celdas existen.
- **Bandeja**: las piezas del nivel, cada una rotada `(nivel + índice) mod 6` veces al inicio, para que haya que girarlas.
- **Colocar**: arrastrar o tocar pieza y celda. **Girar**: tocar de nuevo la pieza seleccionada, o el botón girar (60°). **Quitar**: tocar una pieza ya colocada la devuelve a la bandeja.
- **Victoria**: todas las celdas cubiertas. No hay derrota.
- **Deshacer y rehacer**: ilimitados (botones en el HUD).
- **Tiempo**: barra fina arriba que se vacía en 90 s (no hace perder).
- **Estrellas**: movimientos ≤ piezas + 2 → 3; ≤ piezas + 6 → 2; si no → 1; −1 estrella (mínimo 1) si pasó de 90 s.
- **HUD**: Nivel N, "Piezas x / y", deshacer, rehacer.

Niveles (celdas axiales absolutas de cada pieza; la figura es la unión; ya están verificados: sin solapes y conexos):
```
N1 (7):  A [0,0][1,0][1,-1] · B [0,-1][-1,0] · C [-1,1][0,1]
N2 (7):  A [0,0][0,-1][1,-1][1,0] · B [-1,0][-1,1] · C [0,1]
N3 (10): A [0,0][1,0][2,-1][1,-1] · B [0,-1][-1,0][-1,-1] · C [-1,1][-1,2][0,1]
N4 (19): A [0,0][1,0][2,0][2,-1] · B [1,-1][2,-2][1,-2][0,-1] · C [0,-2][-1,-1][-1,0][-2,0]
         D [-2,1][-2,2][-1,1][-1,2] · E [0,1][0,2][1,1]
N5 (12): A [0,0][1,0][2,0] · B [3,0][3,1][2,1] · C [0,1][1,1][0,2] · D [1,2][2,2][3,2]
N6 (19): A [0,0][1,0][2,0][1,1][0,1] · B [2,-1][2,-2][1,-1][1,-2][0,-1]
         C [0,-2][-1,-1][-1,0][-2,0][-2,1] · D [-2,2][-1,1][-1,2][0,2]
```
Un color de ficha distinto por pieza.

## 7. Controles comunes

- `PlacementController` (Lines, Sort, Fit): pointer events (mouse y toque), `touch-action: none` en el tablero. Arrastre con "fantasma" de la pieza; el ancla se calcula para que el **centroide** de la pieza quede bajo el punto (dedo − 56 px en táctil). Tocar sin arrastrar = seleccionar; tocar celda con algo seleccionado = colocar.
- `SwipeController` (Merge): ver 6.1.
- Ningún gesto debe hacer scroll de la página durante la partida.

## 8. Catálogo de figuras (solo apariencia, sin efecto)

Guarda `{ board: 'tri'|'square'|'hex', pieceSides: 3..10 }`. Por defecto `hex` y 6. Al elegir tablero, la ficha vuelve a su figura natural (3, 4, 6). La vista previa del catálogo sí cambia (usa `board()` del sistema). **El resto de la app sigue en hexágono.** Deja el dato guardado y un comentario `// TODO: conectar geometría (Factory Method) y forma de ficha (Strategy)` donde se conectaría.

## 9. Progreso, estrellas y logros

### 9.1 Guardado (`localStorage`, clave `hexablock-proto-v1`, todo con try/catch)
```json
{ "settings": { "sound": true, "music": true, "lang": "es" },
  "shape": { "board": "hex", "pieceSides": 6 },
  "best": { "lines": 0, "merge": 0, "mergeMaxTile": 0 },
  "fit":  { "stars": [0,0,0,0,0,0] },
  "sort": { "stars": [0,0,0,0,0,0] },
  "stats": { "linesMaxCombo": 0, "sortGoalsTotal": 0 } }
```
Un nivel se desbloquea al ganar el anterior (nivel 1 siempre abierto).

### 9.2 Estrellas de zona (mapa)
- Lines: mejor ≥ 500 → 1, ≥ 1 500 → 2, ≥ 3 000 → 3.
- Merge: ficha máxima ≥ 128 → 1, ≥ 512 → 2, ≥ 2048 → 3.
- Fit y Sort: niveles ganados ≥ 1 → 1, ≥ 4 → 2, 6 → 3.
- Contador del mapa: suma de estrellas de zona + estrellas de niveles.

### 9.3 Logros
| Logro | Meta |
|---|---|
| Completa 3 líneas a la vez | `linesMaxCombo ≥ 3` |
| Haz 1 000 puntos en Hexa Lines | `best.lines ≥ 1000` |
| Llega a 256 en Hexa Merge | `mergeMaxTile ≥ 256` |
| Llega a 2048 en Hexa Merge | `mergeMaxTile ≥ 2048` |
| Gana 3 niveles de Hexa Fit | niveles ganados ≥ 3 |
| Gana todos los niveles de Hexa Fit | 6 |
| Cumple 10 metas en Hexa Sort | `sortGoalsTotal ≥ 10` |
| Gana 3 niveles de Hexa Sort | niveles ganados ≥ 3 |

La barra muestra el avance (`valor / meta`); completado → recompensa amarilla.

## 10. Idioma y sonido

- **i18n**: tabla de cadenas `es` y `en`; ningún texto fijo en el código de pantallas. Cambia en vivo desde Ajustes. Nombres de mundos en inglés: Line Station, The Hive, Stackville, Merge Fountain.
- **Sonido** (Web Audio, generado, sin archivos): toque, colocar, línea limpia (arpegio subiendo según líneas), fusión (tono según valor), transferencia, meta, victoria, derrota. **Música**: bucle suave de pocas notas a volumen bajo. Ambos se silencian desde Ajustes y Pausa. Arrancan solo tras el primer toque.

## 11. Pruebas (vitest)

Nombres `should_<resultado>_when_<condición>`, patrón Arrange-Act-Assert. Mínimo:
- Merge: `should_merge_two_equal_tiles_when_sliding_east`, no fusiona dos veces la misma ficha en un turno, derrota sin movimientos, misma semilla → misma partida.
- Lines: limpia líneas en los 3 ejes, cuenta combo de 3, detecta "sin espacio".
- Sort: transfiere hacia la racha más larga, elimina al llegar a 10 y suma meta, cascada de dos pasos.
- Fit: rotación de 60° correcta, no permite solapes, victoria al cubrir la figura, undo/redo.
- HexBoard: 19 celdas en radio 2, 61 en radio 4, 6 vecinas en el centro, 3 ejes de líneas.

## 12. Criterios de aceptación

- [ ] Abre en el teléfono (vertical, 360–430 px) sin scroll horizontal ni zoom accidental.
- [ ] Se recorre todo el flujo de la sección 4 sin callejones.
- [ ] Los 4 juegos se pueden ganar o perder y muestran su resultado correcto.
- [ ] Fit y Sort: 6 niveles cada uno, desbloqueo progresivo, estrellas guardadas.
- [ ] Lines y Merge: mejor puntaje guardado.
- [ ] Deshacer/rehacer en Fit; deshacer 1 en Merge.
- [ ] Cambio ES/EN en vivo; sonido y música silenciables.
- [ ] Al recargar, el progreso sigue ahí.
- [ ] Catálogo de figuras visible, elección guardada, sin efecto en los juegos.
- [ ] Animaciones de la sección 3 presentes; nada bloquea más de `dur-sign`.
- [ ] `domain/` sin imports de `ui/` o `infra/`; pruebas en verde (`npm test`).
- [ ] `npm run build` genera un sitio estático que funciona desplegado.

## 13. Orden de trabajo

Commits pequeños con Conventional Commits en inglés (`feat(merge): ...`, `test(lines): ...`). Deja la app funcionando al final de cada paso.

1. `chore`: Vite + TS + vitest; copiar `design-system/`; portar `bundle.js` a `hexablock.ts`; cargar fuentes y tokens.
2. `feat(ui)`: router de pantallas y todas las pantallas con datos de ejemplo (Inicio, Mapa, Zona, Niveles, Ajustes, Catálogo, Logros, Pausa, Resultado).
3. `feat(engine)`: `hex.ts`, `HexBoard`, `GameEngine`, `SeededRandom` + pruebas.
4. `feat(merge)` + pruebas → conectado a la partida.
5. `feat(lines)` + pruebas + `PlacementController`.
6. `feat(sort)` + pruebas + niveles.
7. `feat(fit)` + pruebas + niveles + undo/redo.
8. `feat(progress)`: guardado, estrellas, desbloqueos, logros.
9. `feat(i18n)` y `feat(audio)`.
10. `chore(deploy)`: configuración de despliegue y README corto con cómo correrlo.

## 14. Instrucción inicial para el agente

> Lee `PROTOTIPO.md` y la carpeta `design-system/` (empieza por `design-system/README.md` y los `README.md` de cada componente). Construye el prototipo siguiendo el orden de la sección 13, un paso a la vez, haciendo commit al final de cada paso. No agregues funciones fuera del alcance (sección 1). Si algo de esta especificación es ambiguo, elige la opción más simple que respete el sistema de diseño y anótala en `DECISIONES.md`.
