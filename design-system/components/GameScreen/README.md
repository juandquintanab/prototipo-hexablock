# GameScreen

La pantalla de partida de los cuatro juegos. Misma estructura en todos (lo común), distinto contenido y escena (lo que varía):

1. **Escena de fondo** del mundo (`HexaBlock.scene(id)`) detrás de todo: atardecer con tren (Lines), jardín con colmena (Fit), torres (Sort), plaza con fuente (Merge). Capas planas con algo que se mueve lento.
2. **HUD** arriba: pausa redonda a la izquierda; al centro, un **letrerito de madera** con la etiqueta, el número grande (`score-md`, números alineados y de ancho fijo) y una línea pequeña; a la derecha deshacer/rehacer solo donde el juego lo permite (Fit ilimitado, Merge un paso).
3. **Tablero** sobre su **plataforma de piedra** (`board({ base: true })`), con huecos hundidos y fichas con cara.
4. **Bandeja** de madera abajo con lo que viene.
5. **Hexi** asomado en la esquina, reaccionando: `sorpresa` en combos, `nervioso` cuando el tablero está casi lleno, `celebra` al fusionar fichas grandes, `feliz` el resto del tiempo.

Diferencias por juego:
- **Lines**: puntos y mejor; tablero de radio 4; bandeja de 3 piezas. Las fichas de una línea a punto de completarse ponen cara de susto.
- **Fit**: barra de tiempo arriba; nivel y piezas; deshacer y rehacer.
- **Sort**: nivel y metas con barra; pilas con relieve, la cima con el número de su racha; la siguiente pila tiene cara.
- **Merge**: puntos y mejor; fichas numéricas sin cara (el número es su cara); la próxima ficha va sobre un círculo `trim` para que no se pierda.
