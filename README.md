# HexaBlock Suite — prototipo navegable

Una app web para teléfono en vertical con cuatro juegos de tablero (Hexa Lines, Hexa Fit, Hexa Sort y Hexa Merge) sobre un solo motor genérico. El tablero y las fichas pueden ser triángulos, cuadrados o hexágonos (Ajustes → Figuras). Proyecto semestral de Desarrollo de Software (UCAB).

## Cómo correrlo

Requiere Node 18 o superior.

```bash
npm install
npm run dev      # http://localhost:5173 (ábrelo en el teléfono con la IP de tu red: npm run dev -- --host)
npm test         # pruebas de las reglas (vitest)
npm run build    # sitio estático en dist/
npm run preview  # sirve dist/ para probar el build
```

## Desplegar

`dist/` es estático y usa rutas relativas, así que funciona en la raíz de un dominio o en una subcarpeta.

- **Vercel**: importa el repositorio; framework "Vite", comando `npm run build`, salida `dist`.
- **GitHub Pages**: publica el contenido de `dist/` (por ejemplo con la acción `actions/deploy-pages`).

## Organización

```
src/
  domain/        motor genérico y reglas (sin DOM): HexBoard<T>, GameEngine<T,M,S>, ports, games/*
    geometry/    IGridGeometry + Hex/Square/Triangle y GeometryFactory (Factory Method)
  app/           progreso, estrellas, logros
  infra/         localStorage, Web Audio, textos ES/EN
  ui/            pantallas, letreros, tablero SVG y controles (arrastrar, deslizar)
  design-system/ tokens, componentes CSS y helpers de dibujo (hexablock.ts)
tests/           pruebas de cada juego y del motor
```

`domain/` no importa nada de `ui/` ni de `infra/`: la UI escucha los eventos del motor (Observer). Cada juego es un `IGameRules<TCell, TMove, TState>`:

| Juego | Celda (`TCell`) | Jugada (`TMove`) | Deshacer |
|---|---|---|---|
| Hexa Merge | `number` (0 = vacía) | dirección de la geometría | 1 paso |
| Hexa Lines | color o `null` | hueco de bandeja + ancla | no |
| Hexa Sort | pila de colores | hueco de bandeja + celda | no |
| Hexa Fit | índice de pieza o `null` | colocar / quitar / girar | ilimitado |

Las reglas reciben una `IGridGeometry` y no preguntan qué figura es: Lines usa `lines()`, Merge `directions()`/`step()`, Sort `neighbors()` y Fit `rotate()`/`translate()`.

Lo que se decidió donde la especificación era ambigua está en [DECISIONES.md](DECISIONES.md). La especificación completa está en [PROTOTIPO.md](PROTOTIPO.md) y la guía visual en [design-system/README.md](design-system/README.md).
