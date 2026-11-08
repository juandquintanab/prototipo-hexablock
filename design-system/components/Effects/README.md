# Effects

El "jugo" de cada acción. Todos dibujan en una capa encima del contenedor que les pases (`position: relative`) y respetan "reducir movimiento".

| Helper | Cuándo | Cómo se ve |
|---|---|---|
| `burst(host, x, y, color, n)` | Cada ficha de una línea que explota, pila que se completa | Pedacitos hexagonales del color de la ficha que saltan y caen |
| `floatText(host, x, y, '+120')` | Cada vez que se suman puntos | Número blanco con borde `wood-700` que sube y se desvanece |
| `combo(host, '¡Doble!')` | 2 o más líneas a la vez, fusión de 512 o más, meta de Sort | Texto grande `sun-400` tipo pegatina que aparece girando y se va |
| `shake(el, px)` | Combos de 3 o más líneas, derrota | Sacudida corta de la pantalla (320 ms) |
| `confetti(host, n)` | Victoria, nuevo récord | Papelitos de los 8 colores de ficha cayendo |

Textos de combo: 2 líneas "¡Doble!", 3 "¡Triple!", 4+ "¡Increíble!"; en inglés "Double!", "Triple!", "Amazing!".
