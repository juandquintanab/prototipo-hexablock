# Signboard

El letrero de madera: el contenedor de todo lo importante (resultado, modal, zona, logros, ajustes, pausa). Es un solo componente reutilizado en todas esas pantallas.

Partes:
- `.hx-sign`: marco `wood-500` con brillo `wood-300` arriba, labio `wood-700` de `lip-lg` y `shadow-sign`.
- `.hx-sign__crest`: la cresta. Es **media hexágono**, no el arco redondo de la referencia: así el letrero es nuestro y repite la forma del juego.
- `.hx-sign__title`: el título arqueado (`HexaBlock.arch(texto)`), en estilo `display-lg`.
- `.hx-sign__body`: panel `panel` con borde `trim` de 6px.
- `.hx-sign__post`: postes opcionales con banderín `ribbon-500`. Solo en resultados y zonas, no en modales pequeños.

Entra con `hx-anim-drop` (cae y rebota, `dur-sign`, `ease-bounce`), luego las estrellas con su "pop" escalonado y el puntaje cuenta desde 0. Botones siempre abajo, fuera del contenido.

Títulos de máximo 12 caracteres para que el arco no se aplaste: ¡Victoria!, Sin espacio, Pausa, Ajustes, Logros.
