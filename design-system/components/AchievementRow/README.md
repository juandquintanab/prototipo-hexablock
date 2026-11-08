# AchievementRow

Fila de logro al estilo de Dumb Ways to Die 2: una pastilla lila con el texto centrado, que se va llenando de naranja a rayas suaves, y la recompensa en un círculo a la derecha.

- Va siempre dentro del letrero "Logros", agrupada bajo encabezados en pastilla `panel-tan`: "EN PROGRESO" y "COMPLETADOS".
- Pastilla: fondo `trim`; relleno `piece-orange` con rayas blancas al 20% y borde inferior más oscuro. El relleno crece en `dur-slow` al abrir el letrero.
- Texto en `body` (Gelasio), `ink`, centrado: legible tanto sobre el lila como sobre el naranja (7.9:1).
- Recompensa: círculo `panel` con borde `trim` y estrella apagada; al completarlo (`.is-done`) se vuelve `sun-400` con la estrella encendida.
- Textos con verbo y número concreto: "Gana 5 niveles de Hexa Fit".
