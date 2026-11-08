# Board

El tablero en sus tres geometrías reales. Es la única pieza que cambia las reglas del juego: cada geometría define cuántas vecinas tiene una celda.

| Geometría | Vecinas | Ejes de líneas | Direcciones de Merge | Giro en Fit |
|---|---|---|---|---|
| Hexágono (por defecto) | 6 | 3 | 6 | 60° |
| Cuadrado | 4 | 2 | 4 | 90° |
| Triángulo | 3 | 3 | 3 ejes, 6 sentidos | 120° |

`HexaBlock.board({geo, size, cell, pieceSides, fill})` dibuja cualquiera de las tres. `fill(celda)` devuelve el color de la ficha o `null` si está vacía.

Estados de una celda:
- **Vacía**: hueco `cell-slot` translúcido sobre el fondo del juego, sin relieve.
- **Ocupada**: ficha plana del color de su contenido. Solo en Hexa Sort la ficha tiene lateral, porque se apila (`board({depth: 5})`).
- **Vista previa válida**: la ficha que arrastras, al 55% de opacidad, en su color.
- **Vista previa inválida**: en `piece-red` al 55% y tiembla (`hx-anim-shake`). Nunca solo con color: el temblor también lo comunica.
- **Resaltada**: borde `ink` de 3px, para pistas y para la línea a punto de completarse.

El hueco se dibuja un 10% más chico que la celda para que entre fichas siempre quede aire.
