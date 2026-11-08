# ShapeCatalog

El catálogo de figuras, con dos elecciones separadas:

1. **Tablero** (3 opciones): triángulo, cuadrado o hexágono. Son las únicas figuras regulares que llenan el plano sin huecos, así que son las únicas que cambian la geometría y las reglas (vecinas, ejes, direcciones, giros).
2. **Ficha** (8 opciones, de 3 a 10 lados): cómo se dibuja cada ficha dentro de su espacio. No toca las reglas. Si no coincide con el tablero, la ficha se inscribe en su celda con un poco de aire alrededor.

Al cambiar el tablero, la ficha vuelve a su figura natural (3, 4 o 6 lados); después se puede elegir cualquier otra. La mascota cambia de forma con la ficha, así el jugador siente que su elección es su personaje.

Elección seleccionada: `sun-400` con borde `ink` y texto `sun-ink`; las demás en blanco con labio `trim`.

En el código, el tablero es una Factory Method (crea las celdas y sus vecinas) y la ficha es una Strategy de dibujo intercambiable.
