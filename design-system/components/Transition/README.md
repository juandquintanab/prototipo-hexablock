# Transition

Cortina de hexágonos para pasar de una pantalla a otra: fichas de los 8 colores crecen en diagonal desde arriba a la izquierda hasta tapar todo, se cambia la pantalla por debajo y vuelven a encogerse.

- `HexaBlock.curtain(host, alCubrir)`: `alCubrir` se llama cuando la pantalla está tapada; ahí se cambia el contenido.
- Dura unos 1.3 s en total (entra con `ease-bounce`, sale con `ease-in`).
- Se usa entre pantallas grandes: mapa → partida, partida → mapa, inicio → mapa. No entre letreros o modales: esos caen solos.
