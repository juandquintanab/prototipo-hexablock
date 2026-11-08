# PieceTray

Bandeja de piezas al pie de la pantalla en Lines (3 piezas) y Fit (las piezas del nivel). Marco de madera como el letrero, panel crema adentro.

- `HexaBlock.piece({geo, cells, color})` dibuja una pieza de varias celdas en la geometría y figura actuales.
- Pieza ya usada: 25% de opacidad hasta que llegue la bandeja nueva.
- Al tomar una pieza, crece al tamaño del tablero bajo el dedo; al soltarla en un lugar válido encaja con `hx-anim-snap`.
