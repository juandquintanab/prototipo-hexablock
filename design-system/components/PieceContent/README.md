# PieceContent

Lo que lleva una celda en cada juego. Es lo que varía entre variantes (el `TCell` del motor genérico), dibujado siempre con la misma ficha plana:

- **Lines: color.** Ocho colores `piece-*`, elegidos para distinguirse también por luminosidad.
- **Fit: pieza.** Todas las celdas de una pieza comparten color; el color identifica la pieza.
- **Sort: pila.** La única con relieve: fichas apiladas con `HexaBlock.stack(colores)`, 6px de altura por ficha y lateral `shade`. Se lee la cima.
- **Merge: número.** Escala `merge-2` a `merge-2048`, de crema a cálido. Número en `ink` hasta 32 y en 2048; en `white` de 64 a 1024. Tamaño del número según dígitos.
