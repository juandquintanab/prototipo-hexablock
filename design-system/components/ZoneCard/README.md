# ZoneCard

Tarjeta de cada juego en el mapa de inicio: un letrero pequeño con el nombre, las estrellas, un tablero en miniatura y el mejor puntaje.

- El panel interno lleva el fondo del juego: `game-lines-bg`, `game-fit-bg`, `game-sort-bg`, `game-merge-bg`.
- Al tocarla sube con rebote y abre la pantalla de la zona.
- **Zona bloqueada** (`.hx-zone--locked`): fondo `disabled`, candado y cinta de precaución `caution`/`ink` con "EN CONSTRUCCIÓN". Es el lugar reservado para la quinta variante: muestra en el mapa que el motor está listo para crecer (punto de extensibilidad del enunciado, sección 3.1).
