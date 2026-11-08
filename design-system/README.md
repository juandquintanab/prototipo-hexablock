# HexaBlock Suite

Sistema de diseño de HexaBlock Suite, la app de cuatro juegos de tablero (Hexa Lines, Hexa Fit, Hexa Sort y Hexa Merge) del proyecto semestral de Desarrollo de Software (UCAB, 2026-2). Un solo estilo para toda la app: letreros de madera, ilustración plana como la de Dumb Ways to Die y un tablero que cambia de figura.

Este sistema es la base del prototipo navegable: cada pantalla del prototipo se arma con estos tokens, componentes y animaciones.

## De dónde viene

La referencia principal es la línea visual de **Dumb Ways to Die 2: The Games** (letreros de madera con título arqueado, cinta roja, botones amarillos con relieve, instrucciones de una palabra, mapa por zonas), con apoyo de **Big Hunter** (un color de fondo dominante, números grandes) y de las tarjetas que mostró el profesor en el enunciado. Tomamos la gramática visual, no sus dibujos: los personajes, el arco redondo y los textos son propios.

Cambios deliberados frente a la referencia:
- La cresta del letrero es **media hexágono**, no un arco: repite la forma del juego.
- El texto de los botones amarillos es `sun-ink`, no blanco: el blanco sobre amarillo no se lee (1.6:1).
- La mascota (Hexi) es una ficha con cara y cambia de forma con la figura elegida.

## Voz y textos

- **Corto y en segunda persona**: "¡Encaja!", "Tu mejor", "Gana 5 niveles de Hexa Fit".
- **Humor tierno, nunca macabro**: Hexi se pone triste cuando pierdes; nadie se lastima.
- **Botones**: un verbo en MAYÚSCULAS, una o dos palabras (JUGAR, OTRA VEZ, MAPA, SIGUIENTE).
- **Títulos de letrero**: máximo 12 caracteres, con signos de exclamación solo en victoria y en instrucciones.
- **Dos idiomas** (español e inglés, requisito del enunciado). Cada texto se escribe para caber en inglés también: "Tu mejor" / "Your best", "¡Fusiona!" / "Merge!".
- **Números** con separador de miles de espacio fino: 8 192.

## Fundamentos visuales

**Color.** Cuatro familias, cada una con un trabajo:
- *Madera y panel* (`wood-*`, `trim`, `panel`): todo contenedor (letreros, bandeja, tarjetas). El panel crema `panel` es donde se lee; el texto encima es `ink` (13.6:1) o `ink-muted` (5.7:1).
- *Acción* (`sun-400` con `sun-ink`, labio `sun-600`): solo botones. Una acción principal amarilla por pantalla.
- *Juego* (`game-lines`, `game-fit`, `game-sort`, `game-merge` y sus `-bg`): cada juego es dueño de un color; su versión pastel es el fondo de la partida y su versión fuerte marca la zona. El texto sobre ambos es `ink`, nunca blanco.
- *Fichas* (`piece-*` y `merge-*`): ocho colores de ficha que se distinguen también por luminosidad, y la escala de Merge de crema (2) a cálido, con el 2048 en dorado `star-on`.

Ilustración del mapa: `sky`, `grass` y `hill` en planos sin degradados.

**Plano, pero con vida.** Fichas, estrellas, niveles, fichas de Merge y mascota son formas planas de un color, con dos detalles que les dan volumen sin romper lo plano: una segunda zona clara arriba (`sheen`) y una sombra de contacto debajo (`shade`). Las fichas de Lines, Fit y Sort tienen **cara**: ojitos que parpadean a destiempo, alegría al encajar o fusionarse y susto cuando su línea va a explotar. El tablero se apoya en una **plataforma de piedra** (`stone-*`) con grosor y huecos hundidos. El relieve completo se reserva para botones (labio `sun-600`), madera (`wood-700`) y las **pilas de Hexa Sort**. Las sombras difusas (`shadow-sign`, `shadow-soft`) solo van bajo letreros y tarjetas que flotan.

**Escenas y jugo.** Cada partida ocurre dentro de su mundo (componente Scene): capas planas en el color del juego con algo que se mueve lento. Cada acción tiene respuesta (componente Effects): pedacitos que saltan, puntos que suben, textos de combo tipo pegatina, sacudida y confeti. Entre pantallas grandes, una cortina de hexágonos (Transition). Hexi acompaña la partida desde una esquina y reacciona.

**Tipografía.** Una sola voz, como en Dumb Ways to Die 2: **Young Serif** (Google Fonts) para todo el juego: títulos de letrero, botones, números, etiquetas, cintas, HUD, logros y nombres. Es una serif gruesa de estilo antiguo, la más cercana libre a la letra de la referencia. Reglas:
- **Números siempre alineados** (`font-variant-numeric: lining-nums`, ya activado en `bundle.css` después de cada `font:`; los números del HUD además con ancho fijo). Sin esto, Young Serif usa números de estilo antiguo que suben y bajan de la línea y parecen de otra letra.
- Un solo peso; nunca negrita sintética (`font-synthesis: none`).
- Etiquetas en MAYÚSCULAS con un poco de espaciado (`caps`), nunca en negrita.
- **Gelasio** (`--font-text`, clase `.hx-prose`) solo para párrafos de más de una línea, como la descripción de un letrero.

**Forma.** Esquinas `radius-sm` en filas, `radius-md` en paneles, `radius-lg` en marcos, `radius-pill` en botones y contadores. El hexágono es el motivo de marca: cresta del letrero, niveles, mascota y portada.

**Espacio.** Pantalla vertical de teléfono, margen lateral `space-4`. Letrero y botones separados por `space-6`; el tablero respira con `space-7` alrededor. Áreas táctiles de al menos 44px.

## El tablero y el catálogo de figuras

Dos elecciones independientes en el catálogo:

1. **Tablero** (triángulo, cuadrado o hexágono): la única que cambia las reglas, porque cambia cuántas vecinas tiene cada celda. Solo esas tres figuras llenan el plano sin huecos.
2. **Ficha** (de 3 a 10 lados): cómo se dibuja cada ficha dentro de su celda. Es solo apariencia; si no coincide con el tablero, se inscribe con aire alrededor.

`HexaBlock.board()`, `HexaBlock.piece()` y `HexaBlock.shape()` dibujan cualquier combinación. La mascota toma la figura de la ficha.

Relación con la materia: la geometría del tablero es una **Factory Method** (como el tablero de casillas hexagonales o cuadradas de la Clase 6) y el dibujo de la ficha es una **Strategy**. Lo común (celda, HUD, bandeja, letrero) se diseña una vez y lo que varía (contenido de la celda, color del juego) se encapsula: el mismo principio del motor genérico.

## El mapa de mundos

La pantalla de inicio es un mapa ilustrado, como el de Dumb Ways to Die 2: una isla con un camino de piedras hexagonales y un mundo por juego, cada uno con una figurita animada que cuenta su mecánica (Estación Línea, La Colmena, Pilópolis, Fuente Fusión) y una obra "En construcción" reservada para la quinta variante. Se dibujan con `HexaBlock.landmark(id)`; detalle en el componente WorldMap. La ilustración usa solo `sky`, `hill`, `grass`, `grass-700`, `panel-tan` y los colores de juego, en planos.

## Iconografía

Íconos de trazo redondeado de 24px y 2.6 de grosor, en `HexaBlock.icon(nombre)`, color heredado: `sun-ink` sobre amarillo y `wood-700` sobre panel. Siempre dentro de un botón o una fila, con `aria-label`. Sin emoji.

## Movimiento

Todo se mueve: lo que entra rebota (`ease-bounce`), lo que sale acelera (`ease-in`). Cinco duraciones compartidas (`dur-tap` 90ms a `dur-slow` 900ms). La mascota respira y parpadea siempre. Detalle completo en el componente Motion. Con "reducir movimiento" activado, las animaciones se acortan a 1ms.

## Cómo usarlo en el prototipo

1. Carga `tokens.css`, `components/bundle.css` (incluye la fuente) y `components/bundle.js` (define `window.HexaBlock`).
2. Envuelve la app en un elemento con clase `hx` (pone Young Serif y los números alineados).
3. Arma pantallas con las clases `hx-*` de cada componente y dibuja tableros, fichas, estrellas y la mascota con los helpers de `HexaBlock`.
