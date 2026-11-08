# Pantallas del prototipo

Inventario de pantallas que el prototipo navegable va a tener, con los componentes que usa cada una. Las marcadas como *enunciado* son obligatorias (sección 5.1); el resto son decisiones de diseño nuestras.

| Pantalla | Origen | Componentes |
|---|---|---|
| Inicio con el logo y TOCA PARA JUGAR | Enunciado | Mascot, Button |
| Mapa de mundos con las 4 zonas y la zona en construcción | Enunciado (selector de juego) | WorldMap, Counter, IconButton, Signboard |
| Zona de un juego: mejor puntaje y JUGAR | Nuestra | Signboard, Ribbon, Stars, Mascot |
| Selección de niveles (Fit 15, Sort 10) | Enunciado | Signboard, LevelTile |
| Instrucción de entrada | Nuestra | Instruction |
| Partida de cada juego | Enunciado | GameScreen, Board, PieceContent, PieceTray |
| Pausa | Nuestra | Signboard, Button |
| Victoria con puntaje y siguiente nivel | Enunciado | Signboard, Stars, Ribbon, Mascot (celebra) |
| Derrota con reintentar | Enunciado | Signboard, Ribbon, Mascot (triste) |
| Ajustes: sonido, música, idioma | Enunciado | Signboard, Settings |
| Catálogo de figuras | Nuestra | ShapeCatalog, Mascot |
| Logros | Nuestra | Signboard, AchievementRow |
| Ranking por juego y por nivel | Enunciado (backend) | Signboard, lista; en el prototipo con datos de ejemplo |

Flujo principal: Inicio → Mapa → Zona → (Niveles) → Instrucción → Partida → Victoria o Derrota → Zona o Mapa. Pausa, Ajustes y Catálogo se abren como letreros encima de la pantalla actual.
