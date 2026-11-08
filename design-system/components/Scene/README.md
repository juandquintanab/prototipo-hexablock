# Scene

Fondo de la partida de cada mundo: una escena plana en capas, con algo que se mueve lento para que el juego no se sienta quieto. Se dibuja con `HexaBlock.scene(id)` como primer hijo de `.hx-screen` (queda detrás de todo y se recorta para cubrir cualquier alto de pantalla).

| Mundo | Escena | Movimiento |
|---|---|---|
| Estación Línea | Atardecer con sol grande, cerros y rieles | Un tren cruza de un lado al otro cada 14 s |
| La Colmena | Jardín con flores y panal colgando de una rama | La abeja zumba |
| Pilópolis | Silueta de torres apiladas con franjas | El banderín ondea |
| Fuente Fusión | Plaza de baldosas hexagonales con fuente | Destellos que titilan |

Todas tienen nubes que cruzan muy despacio. Solo usan el color del juego a distintas opacidades, `sun-400`, `wood-*` y blanco: el tablero y las fichas siempre son lo más contrastado de la pantalla.
