# Button

Botón en pastilla con labio 2.5D: la acción principal de cada pantalla (JUGAR, SIGUIENTE, REINTENTAR).

- **Principal** (`.hx-btn`): `sun-400` con texto `sun-ink` y labio `sun-600`. Una sola por pantalla.
- **Secundario** (`.hx-btn--secondary`): panel crema con borde `trim` y labio `wood-300`. Para MAPA, VOLVER, CANCELAR.
- **Bloqueado** (`disabled`): `disabled` con texto `disabled-ink`. Úsalo poco: mejor explicar por qué no se puede.

Al tocarlo baja exactamente `lip-md` en `dur-tap` y el labio desaparece: se siente que se hunde. Texto siempre en MAYÚSCULAS, un verbo de una o dos palabras. Altura mínima 52px para el pulgar.

La referencia (Dumb Ways to Die 2) usa texto blanco sobre amarillo, que no se lee (1.6:1). Aquí va en `sun-ink` (6.9:1).
