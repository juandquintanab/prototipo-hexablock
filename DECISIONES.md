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
- **Lines**: la racha es el número de jugadas seguidas que limpiaron *antes* de la actual. La primera limpieza vale ×1, la segunda seguida ×1.5, la tercera ×2. Las piezas se generan (ver "Figuras").
- **Sort**:
  - Empate de rachas: va hacia la celda que se está procesando (en el primer paso, la recién colocada).
  - Las pilas iniciales del nivel caen en celdas al azar. Colores por nivel: los primeros N de azul, rosa, amarillo, verde, morado.
  - "Movimientos" = pilas colocadas. En derrota el letrero muestra 3 estrellas apagadas.
  - Con un bot simple los 6 niveles se ganan siempre, con menos movimientos que el par: son niveles fáciles, a ajustar si se quiere más reto.
- **Fit**:
  - "Movimientos" = piezas colocadas (girar y quitar no cuentan).
  - La rotación inicial es `(nivel + índice) mod rotationSteps` (6, 4 o 3 según la figura).
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

## Figuras (cambio sobre la sección 8 de PROTOTIPO.md)

El catálogo ya no es solo apariencia: hay una sola elección, **Figura** (triángulo, cuadrado, pentágono, hexágono), que es a la vez el tablero y las fichas, y cambia los juegos, la vista previa, los botones de nivel y la mascota.

**Motor**
- `IGridGeometry` (`src/domain/geometry/`) con `HexGeometry`, `SquareGeometry`, `TriangleGeometry` y `PentagonGeometry`. `GeometryFactory` es el Factory Method: el único lugar que sabe qué clase va con cada figura. `HexBoard<TCell>` recibe la geometría; `GameEngine` no cambió.
- Además de lo que pedía la interfaz agregué:
  - `adjacent` (vecinas sin límite de tablero, para generar piezas);
  - `keys`, `has` y `withCells` (una geometría "acotada" conoce sus celdas, por eso `lines()` y `step()` no reciben el tablero);
  - `translate(cells, from, to)`, porque colocar una pieza ya no es "sumar coordenadas": en triángulos y pentágonos solo algunas celdas sirven de ancla;
  - `cellAt(punto)`, `origin`, `sides`, `inradius` y escalas de dibujo.
- `rotate` es genérico (en la clase base): gira los centros alrededor de un centro de simetría del teselado y vuelve a la celda con `cellAt`. La prueba comprueba que cada giro recorre el tablero sin repetir celdas.
- Las líneas se definen por **familias** (filas, columnas, diagonales) y se cortan donde dos celdas seguidas no son vecinas. Las direcciones de deslizamiento recorren esas mismas familias en ambos sentidos.
- Las reglas no preguntan la figura. Los únicos `'hex'` que quedan son valores por defecto de los constructores, que usan las pruebas.

**Cada figura**
- **Triángulo**: alternan arriba/abajo con las mismas medidas que `cellGeom('tri')` del sistema. Las 3 franjas son filas y dos diagonales en zigzag. Merge tiene 6 direcciones (las franjas en ambos sentidos). Giro de 120° alrededor de un vértice.
- **Pentágono**: teselado Cairo armado sobre una cuadrícula (segmento por el centro de cada cuadrado, horizontal o vertical en damero). Con t = (√7−1)/6 los cinco lados son iguales y todos los pentágonos son congruentes. Giro de 90° alrededor de un vértice de la cuadrícula.

**Tamaños de tablero**: cada figura iguala la cantidad de celdas del hexágono de ese radio.

| Figura | Radio 2 (Merge y Sort) | Radio 4 (Lines) |
|---|---|---|
| Hexágono | 19 | 61 |
| Cuadrado | 4×4 = 16 (el 2048 clásico) | 8×8 = 64 |
| Triángulo | 24 (hexágono de triángulos de lado 2) | 54 (lado 3) |
| Pentágono | 3×3 cuadrados = 18 | no aplica |

**Juegos**
- **Piezas de Lines**: poliformas conexas de 1 a 5 celdas generadas con la semilla de la partida, en las **cuatro** figuras, también en hexágono. Ya no existe la tabla fija de PROTOTIPO.md. Pesos por tamaño: 1 → 10, 2 → 16, 3 → 18, 4 → 8, 5 → 3. Las piezas no giran, así que en triángulos una pieza solo entra en celdas con su misma orientación.
- **Merge** procesa las fichas por su distancia al borde en la dirección elegida (la más cercana primero), sin fórmulas de coordenadas.
- **Pilas de Sort**: una pila ocupa una celda y va en **cualquier** celda vacía. Por eso el control de colocación tiene un modo `anyCell` que no usa traslación; si no, en triángulos y pentágonos solo servirían la mitad o la cuarta parte de las celdas.
- **Fit**:
  - Hexágono conserva los niveles escritos. Las demás figuras generan 6 niveles con semilla fija: crece una figura compacta desde el origen y la parte en piezas conexas desde semillas al azar (crece siempre la más chica).
  - Plan por nivel (celdas / piezas): 7/3, 8/3, 10/3, 12/4, 15/4, 18/5, con piezas de 2 a 6 celdas.
  - Son resolubles por construcción: cada pieza es un trozo de la figura. Hay pruebas que los resuelven en las cuatro figuras.
  - La elección "hexágono a mano, el resto generado" es una tabla de datos (`HAND_MADE`), no un `if` en las reglas.
- **Pentágono en Lines y Merge**: si la figura no tiene líneas o direcciones (se deduce de la geometría con `capabilities()`, no del nombre), esos juegos usan hexágono. La instrucción lo dice en una línea y dura 2.2 s en vez de 1.1 s para que alcance a leerse. En el catálogo, el pentágono lleva la etiqueta "Solo Sort y Fit".

**Progreso**
- Se guarda por figura en la clave `hexablock-proto-v2`. Al abrir con un guardado `v1`, ese progreso pasa al hexágono.
- Mapa y niveles muestran el progreso de la figura con que se juega cada juego (en pentágono, Lines y Merge muestran el de hexágono).
- **Logros**: cuentan el mejor resultado en cualquier figura (máximo por figura). Las estadísticas de combo y metas siguen siendo globales.

**Dibujo**
- El tablero, las piezas de la bandeja, el fantasma y la vista previa del catálogo se dibujan con `center()`/`polygon()` de la geometría.
- Las fichas sueltas (pilas, ficha de Merge, botones de nivel, mascota) usan los helpers del sistema con `sides` de la figura.
- `board()`/`piece()` del sistema no sirven para el pentágono Cairo, así que no se usan para el tablero.

## Hexa Sort "no carga" (no se pudo reproducir)

Probé el flujo mapa → Pilópolis → nivel 1 y no aparece ningún error en la consola:
- en desarrollo y en el build de producción;
- a tamaño de teléfono (375×812) y de escritorio (800×766);
- con el progreso guardado del usuario y sin progreso;
- con clics reales y con arrastre real.

También corrí 3 000 partidas al azar de las reglas de Sort para descartar un ciclo infinito en la cascada (que congelaría la página): todas terminaron, con 18 eventos como máximo por jugada.

Lo único raro que vi: en una pestaña en segundo plano el navegador congela las animaciones, y el letrero de zona queda a medio caer y transparente. Agregué la prueba pedida (iniciar el nivel 1 de Sort y hacer una jugada) como `test(sort)` en lugar de `fix(sort)`, porque no hubo nada que corregir.

## Audio
- Todo generado con Web Audio. La música es un bucle de 16 notas (una cada 420 ms) a volumen muy bajo. El audio se desbloquea con el primer toque en Inicio.
