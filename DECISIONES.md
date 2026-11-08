# Decisiones del prototipo

Puntos donde `PROTOTIPO.md` dejaba espacio a interpretación. En cada caso se eligió la opción más simple que respeta el sistema de diseño.

## Estructura
- **Raíz del proyecto**: el repositorio es la carpeta `hexablock-prototipo/` de la sección 2 (no hay subcarpeta extra).
- **Sistema de diseño**: `design-system/` (raíz) es la copia íntegra del kit, como referencia. Lo que usa la app vive en `src/design-system/` (`tokens.css`, `tokens.json`, `bundle.css` y `hexablock.ts`).
- **`hexablock.ts`** es un port 1:1 de `bundle.js` (mismos nombres y mismo dibujo), con tres cambios mínimos:
  - `fmt(n)` nuevo: separador de miles con espacio fino (guía de marca: "8 192"). `countUp` lo usa en vez de `toLocaleString('es')`, que no agrupa números de 4 cifras.
  - `mergeTile` usa el color `merge-2048` para valores mayores a 2048 (no hay token más alto).
  - `GameId` y `PieceColor` como tipos.
- Las fuentes se cargan con `<link>` en `index.html` además del `@import` de `bundle.css`, porque al empaquetar el `@import` puede quedar después de otras reglas y el navegador lo ignoraría.

## Motor
- `IGameRules` agrega `undoLimit` (0, 1 o Infinity) y `clone(state)`: así `GameEngine` guarda la historia de deshacer/rehacer sin conocer el juego.
- `GameEngine.play` agrega los eventos `won`/`lost` según `status()` después de aplicar la jugada; las reglas no los emiten.
- `GameEvent` agrega `moved` (deslizar en Merge), `removed` y `rotated` (Fit), `trayRefilled`, y `value`/`count` en `spawned`/`stackCleared` para que la UI pueda animar sin consultar las reglas.
- El estado de cada juego incluye su `SeededRandom`, así deshacer restaura también el azar y la misma semilla repite la partida.
- `HexBoard.lines()` devuelve tramos contiguos de al menos 2 celdas por eje; funciona con cualquier figura (Fit), no solo con hexágonos completos.

## Juegos
- **Merge**: el valor de la próxima ficha se sortea por adelantado para poder mostrarlo en la bandeja. Un deslizamiento exactamente vertical empata entre SO y SE; gana SO. Tras SEGUIR, la partida continúa sin volver a mostrar "¡2048!".
- **Lines**: la racha es el número de jugadas seguidas que limpiaron *antes* de la actual. La primera limpieza vale ×1, la segunda seguida ×1.5, la tercera ×2. Pesos de aparición por pieza: tamaño 1 → 10, 2 → 8, 3 → 6, 4 → 4, 5 → 3.
- **Sort**:
  - Empate de rachas: va hacia la celda que se está procesando (en el primer paso, la recién colocada).
  - Las pilas iniciales del nivel caen en celdas al azar. Colores por nivel: los primeros N de azul, rosa, amarillo, verde, morado.
  - "Movimientos" = pilas colocadas. En derrota el letrero muestra 3 estrellas apagadas.
  - Con un bot simple los 6 niveles se ganan siempre, con menos movimientos que el par: son niveles fáciles, a ajustar si se quiere más reto.
- **Fit**:
  - "Movimientos" = piezas colocadas (girar y quitar no cuentan).
  - La rotación inicial `(nivel + índice) mod 6` gira cada pieza alrededor de su primera celda.
  - El botón girar no tiene ícono propio en el sistema; se usa `retry` y flota en la esquina inferior derecha del tablero. Se activa al seleccionar una pieza.
  - Tocar una pieza colocada la quita solo si no hay ninguna seleccionada en la bandeja (si la hay, el toque intenta colocar).
  - El reloj de 90 s arranca al terminar la instrucción y se detiene en pausa.
- Último nivel ganado (6): el botón principal es NIVELES y el secundario MAPA (no hay SIGUIENTE).

## Interfaz
- **Arrastre**: sobre el tablero, el fantasma de la pieza se oculta y queda solo la vista previa al 55% (o roja con temblor). Con el fantasma encima no se veía si la jugada era válida.
- **Resultado**: Hexi va al lado de los botones, debajo del letrero. En una columna de 440 px no caben letrero y mascota lado a lado.
- **Letrero de zona**: se ancla abajo del mapa y entra con `hx-anim-drop`, igual que en `WorldMap/preview.html`.
- **Mapa**: el dibujo de fondo se extiende más allá del lienzo de 360×700 para llenar cualquier proporción de pantalla. El camino de piedras termina en Fuente Fusión (no hay zona en construcción).
- **Instrucción**: el verbo usa el tamaño del componente (`display-md`, 38 px).
- **Logros**: debajo del texto se muestra "valor / meta" en pequeño, además del relleno de la barra.
- **Idioma**: solo se cambia en Ajustes; esa pantalla se vuelve a dibujar al instante y las demás se dibujan ya en el idioma nuevo.
- Textos en inglés elegidos para caber en los letreros: Logros → "Trophies", Seguir → "Go on", Puntos → "Score".
- En desarrollo (`npm run dev`) existe `window.__go(ruta)` para saltar a cualquier pantalla desde la consola. No existe en el build.

## Audio
- Todo generado con Web Audio. La música es un bucle de 16 notas (una cada 420 ms) a volumen muy bajo. El audio se desbloquea con el primer toque en Inicio.
