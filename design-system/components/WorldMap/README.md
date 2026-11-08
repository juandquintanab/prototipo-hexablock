# WorldMap

El mapa de mundos de la pantalla de inicio, al estilo del mapa de Dumb Ways to Die 2: una isla con un camino de piedras hexagonales que une un mundo por juego. Es el selector de juego que pide el enunciado.

Cada mundo tiene una figurita (`HexaBlock.landmark(id)`) que cuenta su mecánica, y un letrero de madera con su nombre y sus estrellas:

| Mundo | Juego | Figurita | Por qué |
|---|---|---|---|
| Estación Línea | Hexa Lines | Tren de vagones-hexágono | Las fichas en fila son una línea; guiño al tren de la referencia |
| La Colmena | Hexa Fit | Panal con abeja | En un panal todo encaja sin huecos |
| Pilópolis | Hexa Sort | Torres de fichas por color | Pilas; son el único elemento con relieve |
| Fuente Fusión | Hexa Merge | Fuente cuyos chorros se juntan bajo un 2048 | Dos iguales se fusionan en uno |
| En construcción | Quinta variante | Grúa, conos y cinta de precaución | El lugar reservado para un juego nuevo |

Comportamiento:
- El mapa está vivo: nubes que cruzan despacio, pájaros volando y un carrito con una ficha que recorre el camino de piedras de un mundo a otro.
- Cada figurita se apoya en una sombra de contacto; la fuente tiene destellos que titilan.
- Cada figurita tiene una animación propia y constante: el tren avanza y echa humo, la abeja zumba, los chorros laten, la ficha 2048 flota, el gancho de la grúa se mece.
- Tocar un mundo lo levanta y hace caer el letrero de la zona desde abajo: nombre del mundo arqueado, nombre del juego, estrellas, cinta con "Tu mejor" (Lines, Merge) o "Niveles" (Fit, Sort) y JUGAR.
- La mascota espera al inicio del camino. Arriba: contador de estrellas y ajustes.
- Orden del camino de abajo hacia arriba: Lines, Fit, Sort, Merge, En construcción.

Los nombres de los mundos son una propuesta; los del juego (Hexa Lines…) siempre aparecen debajo para que nadie se pierda.
