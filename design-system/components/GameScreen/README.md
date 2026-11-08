# GameScreen

La pantalla de partida de los cuatro juegos. Misma estructura en todos (lo común), distinto contenido (lo que varía):

1. **HUD** arriba: pausa redonda a la izquierda, dato principal al centro en `score-md` con su etiqueta `small`, y deshacer/rehacer a la derecha solo donde el juego lo permite (Fit ilimitado, Merge un paso).
2. **Tablero** al centro sobre el fondo del juego (`game-*-bg`).
3. **Bandeja** abajo con lo que viene: piezas (Lines, Fit), siguiente pila (Sort) o la próxima ficha (Merge).

Diferencias por juego:
- **Lines**: puntos y mejor puntaje; tablero de radio 4 (61 celdas); bandeja de 3 piezas.
- **Fit**: barra de tiempo pegada arriba; nivel y piezas colocadas; deshacer y rehacer.
- **Sort**: nivel y metas con barra de progreso; pilas con altura; siguiente pila.
- **Merge**: puntos y mejor; fichas numéricas; deshacer de un paso.
