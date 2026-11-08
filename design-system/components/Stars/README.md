# Stars

Tres estrellas planas: la del medio más grande y más alta. Calificación de los niveles de Fit y Sort y de cada zona del mapa.

- Ganada: `star-on`. Pendiente: `star-off`.
- `HexaBlock.star(ganada, tamaño)` dibuja una.
- Al aparecer, cada estrella ganada hace "pop" con 220ms de diferencia (clase `is-playing` en `.hx-stars`). Las pendientes no se animan.
