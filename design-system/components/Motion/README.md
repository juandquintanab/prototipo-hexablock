# Motion

Catálogo de animaciones. Todo el juego usa estas duraciones y curvas (familias `duration` y `easing` de los tokens), para que se sienta como un solo juego.

| Momento | Animación | Tiempo |
|---|---|---|
| Aparece un letrero | Cae desde arriba y rebota | `dur-sign`, `ease-bounce` |
| Estrellas del resultado | "Pop" escalonado | `dur-sign`, 220ms entre cada una |
| Puntaje final | Cuenta desde 0 | `dur-slow` |
| Tocar un botón | Se hunde lo que mide su labio | `dur-tap` |
| Soltar una ficha | Encaja con un pequeño rebote | `dur-fast`, `ease-bounce` |
| Completar una línea | Cada ficha crece y desaparece, en ola | `dur-base`, `ease-in`, 40ms de desfase |
| Fusión en Merge | Una ficha se desliza sobre la otra y la nueva rebota | `dur-fast` |
| Cascada en Sort | Las fichas viajan de una en una | `dur-base` por ficha |
| Movimiento inválido | Tiembla | `dur-base` |
| Mascota | Respira y parpadea siempre | 2.4s y 3.6s |

Reglas:
- Lo que entra rebota; lo que sale acelera (`ease-in`).
- Nada bloquea al jugador más de `dur-sign`: el siguiente toque siempre responde.
- Con "reducir movimiento" activado en el teléfono, todo pasa en 1ms (ya está en `bundle.css`).
