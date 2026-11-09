# Decisiones del prototipo

Puntos donde `PROTOTIPO.md` dejaba espacio a interpretación. En cada caso se eligió la opción más simple que respeta el sistema de diseño.

## Estructura
- **Raíz del proyecto**: el repositorio es la carpeta `hexablock-prototipo/` de la sección 2 (no hay subcarpeta extra).
- **Sistema de diseño**: `design-system/` (raíz) es la copia íntegra del kit, como referencia. Lo que usa la app vive en `src/design-system/` (`tokens.css`, `tokens.json`, `bundle.css` y `hexablock.ts`).
- **`hexablock.ts`** es un port 1:1 de `bundle.js` (mismos nombres y mismo dibujo), con estos cambios mínimos:
  - `fmt(n)` nuevo: separador de miles con espacio fino U+2009, el mismo que usa `countUp` del kit nuevo ("8 192").
  - `mergeTile` usa el color `merge-2048` para valores mayores a 2048 (no hay token más alto).
  - Los dos `<text>` de `logo()` llevan además `font-weight:400` y `lining-nums`, como pide la regla de tipografía. No cambia el dibujo.
  - Tipos de TypeScript (`GameId`, `PieceColor`, `Mood`, `FaceMood`, `SceneId`).
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

El catálogo ya no es solo apariencia: hay una sola elección, **Figura** (triángulo, cuadrado, hexágono), que es a la vez el tablero y las fichas, y cambia los juegos, la vista previa, los botones de nivel y la mascota.

**Sin pentágono.** Hubo un pentágono con el teselado de El Cairo. Se quitó a pedido del usuario: sus pentágonos apuntaban en cuatro direcciones y el borde del tablero quedaba en picos, así que no se veía uniforme como las otras figuras. Pentágonos regulares iguales no cubren el plano sin huecos. Con él se fue el mecanismo que pasaba Lines y Merge a hexágono (las tres figuras que quedan sirven para los cuatro juegos), junto con su nota y su etiqueta. Si había un guardado con pentágono elegido, al abrir vuelve a hexágono.

**Motor**
- `IGridGeometry` (`src/domain/geometry/`) con `HexGeometry`, `SquareGeometry` y `TriangleGeometry`. `GeometryFactory` es el Factory Method: el único lugar que sabe qué clase va con cada figura. `HexBoard<TCell>` recibe la geometría; `GameEngine` no cambió.
- Además de lo que pedía la interfaz agregué:
  - `adjacent` (vecinas sin límite de tablero, para generar piezas);
  - `keys`, `has` y `withCells` (una geometría "acotada" conoce sus celdas, por eso `lines()` y `step()` no reciben el tablero);
  - `translate(cells, from, to)`, porque colocar una pieza ya no es "sumar coordenadas": en triángulos solo las celdas con la misma orientación sirven de ancla;
  - `cellAt(punto)`, `origin`, `sides`, `inradius` y escalas de dibujo.
- `rotate` es genérico (en la clase base): gira los centros alrededor de un centro de simetría del teselado y vuelve a la celda con `cellAt`. La prueba comprueba que cada giro recorre el tablero sin repetir celdas.
- Las líneas se definen por **familias** (filas, columnas, diagonales) y se cortan donde dos celdas seguidas no son vecinas. Las direcciones de deslizamiento recorren esas mismas familias en ambos sentidos.
- Las reglas no preguntan la figura. Los únicos `'hex'` que quedan son valores por defecto de los constructores, que usan las pruebas.

**Cada figura**
- **Triángulo**: alternan arriba/abajo con las mismas medidas que `cellGeom('tri')` del sistema. Las 3 franjas son filas y dos diagonales en zigzag. Merge tiene 6 direcciones (las franjas en ambos sentidos). Giro de 120° alrededor de un vértice.

**Tamaños de tablero**: cada figura iguala la cantidad de celdas del hexágono de ese radio.

| Figura | Radio 2 (Merge y Sort) | Radio 4 (Lines) |
|---|---|---|
| Hexágono | 19 | 61 |
| Cuadrado | 4×4 = 16 (el 2048 clásico) | 8×8 = 64 |
| Triángulo | 24 (hexágono de triángulos de lado 2) | 54 (lado 3) |

**Juegos**
- **Piezas de Lines**: poliformas conexas de 1 a 5 celdas generadas con la semilla de la partida, en las **tres** figuras, también en hexágono. Ya no existe la tabla fija de PROTOTIPO.md. Pesos por tamaño: 1 → 10, 2 → 16, 3 → 18, 4 → 8, 5 → 3. Las piezas no giran, así que en triángulos una pieza solo entra en celdas con su misma orientación.
- **Merge** procesa las fichas por su distancia al borde en la dirección elegida (la más cercana primero), sin fórmulas de coordenadas.
- **Pilas de Sort**: una pila ocupa una celda y va en **cualquier** celda vacía. Por eso el control de colocación tiene un modo `anyCell` que no usa traslación; si no, en triángulos solo serviría la mitad de las celdas.
- **Fit**:
  - Hexágono conserva los niveles escritos. Las demás figuras generan 6 niveles con semilla fija: crece una figura compacta desde el origen y la parte en piezas conexas desde semillas al azar (crece siempre la más chica).
  - Plan por nivel (celdas / piezas): 7/3, 8/3, 10/3, 12/4, 15/4, 18/5, con piezas de 2 a 6 celdas.
  - Son resolubles por construcción: cada pieza es un trozo de la figura. Hay pruebas que los resuelven en las tres figuras.
  - La elección "hexágono a mano, el resto generado" es una tabla de datos (`HAND_MADE`), no un `if` en las reglas.

**Progreso**
- Se guarda por figura en la clave `hexablock-proto-v2`. Al abrir con un guardado `v1`, ese progreso pasa al hexágono.
- Mapa y niveles muestran el progreso de la figura elegida.
- **Logros**: cuentan el mejor resultado en cualquier figura (máximo por figura). Las estadísticas de combo y metas siguen siendo globales.

**Dibujo**
- El tablero, las piezas de la bandeja, el fantasma y la vista previa del catálogo se dibujan con `center()`/`polygon()` de la geometría.
- Las fichas sueltas (pilas, ficha de Merge, botones de nivel, mascota) usan los helpers del sistema con `sides` de la figura.
- El tablero no usa `board()`/`piece()` del sistema: cada geometría ya da sus propios polígonos, y así el dibujo no repite las coordenadas de cada figura.

## Rediseño visual (kit nuevo: escenas, caras, efectos, tipografía)

Solo cambió la interfaz: `domain/`, `app/` (guardado), los controles de colocar y deslizar y el catálogo quedaron iguales (sin diferencias en git). Las 118 pruebas de entonces siguieron en verde (hoy son 103, sin los casos del pentágono).

**PROTOTIPO.md**
- La sección 8 del documento nuevo todavía dice que el catálogo "no afecta los juegos". Se mantiene lo ya acordado: la figura sí cambia tablero y fichas (ver "Figuras").
- "Así vas" no aparece en el kit, en PROTOTIPO.md ni en la app, así que no hubo nada que revisar ahí.

**Tablero**
- `BoardView` dibuja las mismas capas que `board({ base: true, faces })` del sistema, con las mismas medidas, sobre los polígonos de cada geometría:
  - sombra al 16%, grosor `stone-600` de `max(5, celda·0.34)` y cara `stone-400`;
  - huecos con borde `stone-600` y fondo `stone-500` hundido;
  - fichas con brillo y sombra de contacto;
  - caras con parpadeo a destiempo.
- El crecimiento de la plataforma copia los valores de `board()`: triángulo 1.24, cuadrado 1.12 y el resto 1.16.

**Caras**
- **Lines**: susto (`scared`) en las fichas de toda línea a la que le falta una celda o menos. Eso incluye las líneas que están explotando.
- **Lines y Fit**: alegría (`happy`) durante 0.7 s en las fichas recién colocadas.
- **Sort**: el README de GameScreen dice "la cima con el número de su racha; la siguiente pila tiene cara". Por eso las pilas del tablero muestran el número y la cara va en las pilas de la bandeja y en la que arrastras.
- **Merge**: sin cara; el número es su cara.
- Como en `stack()`, solo la ficha de arriba de cada pila tiene brillo.

**Efectos**
- `burst` en ola (40 ms) en cada celda de Lines que se limpia, en cada fusión de Merge y en cada pila de Sort que se completa.
- `floatText` con los puntos de cada jugada en Lines (colocar y limpiar) y en Merge (suma de las fusiones del deslizamiento). Sort no suma puntos, así que no tiene `floatText`.
- `combo` cuando una sola jugada hace 2 o más de algo: líneas en Lines, fusiones en Merge, metas en Sort. `shake` de 5 px desde 3.
- `confetti` en victoria y también en un récord nuevo de Lines o Merge (el README de Effects lo pide en los dos casos).
- **Conteo en el HUD**: el puntaje cuenta desde el valor anterior hasta el nuevo en 420 ms, no desde 0. `countUp` del kit siempre empieza en 0, que en cada jugada se vería raro. El letrero de resultado sí usa `countUp`.

**Hexi en la partida**
- Va en la esquina **inferior izquierda**, parado sobre el borde de la bandeja. La esquina derecha la ocupa el botón girar de Fit, y el alto de la bandeja cambia según el juego.
- Humores (sección 4.6):
  - `sorpresa` al colocar algo grande: pieza de 4 o más en Lines y Fit, pila de 5 o más en Sort;
  - `feliz` al limpiar, encajar o fusionar;
  - `celebra` en combo y en victoria;
  - `triste` en derrota;
  - `nervioso` como humor de base cuando queda poco espacio: menos del 25% libre en Lines, 3 celdas vacías o menos en Sort, 2 o menos en Merge. Fit no tiene ese límite.

**Cortina**
- Va en Inicio → Mapa, Zona → Partida (Lines y Merge) y Niveles → Partida.
- Un segundo toque durante la cortina no navega dos veces.
- El tiempo de la instrucción empieza a contar cuando la cortina termina de destaparse.
- Medido: 0.7 s en tapar y 1.4 s en total.

**HUD y Merge**
- El letrerito de madera mide lo que pide su contenido (mínimo 128 px) y queda centrado entre pausa y los controles.
- La próxima ficha de Merge va sobre un círculo `trim`, como pide GameScreen.

**Tipografía**
- Todo en Young Serif con `lining-nums`: los `font:` de `app.css` (incluidos los que usaban Gelasio) y todos los `<text>` de SVG. El puntaje del resultado usa además `tabular-nums`.
- Un recorrido automático por las diez pantallas, la pausa, la instrucción y el resultado no encontró ningún texto con otra letra, sin números alineados o con peso distinto de 400.
- Gelasio solo queda para `.hx-prose`, que la app no usa hoy porque no tiene párrafos largos.

**Verificación (390×844)**
Los cuatro juegos se jugaron hasta el final por el flujo real (mapa, letrero, cortina, partida), igual que antes:
- **Lines**: "Sin espacio" con récord nuevo.
- **Merge**: "Sin movimientos" con récord nuevo.
- **Sort**: nivel 1 ganado.
- **Fit**: nivel 1 resuelto con toques (girar y colocar), confeti y Hexi celebrando.

La plataforma de piedra también se probó en las cuatro figuras que había entonces (hoy son tres).

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
