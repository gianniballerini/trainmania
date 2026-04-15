# 🚂 TrainMania

> Place rail pieces before the moving train derails.

A browser-based puzzle game built for the **Three.js Journey Challenge 23 — Theme: Train**.

---

## Gameplay

You're given a hand of 4 random rail cards. Lay them on the grid to build a path from the train's starting position to the station — before it gets there.

The catch: the train doesn't wait. Every step it accelerates (`interval × 0.92`, floor 250 ms). Run out of track and you derail.

**Controls**
- `hover` — ghost-preview a piece on the grid
- `click` — place the selected card
- Select a card from your hand before placing

**Win** — guide the train into the station.  
**Lose** — train steps onto a void cell or a dead-end.

---

## Stack

| | |
|---|---|
| Rendering | [Three.js](https://threejs.org/) `^0.183.2` + WebGL |
| Language | TypeScript `^6.0.2` (strict mode) |
| Bundler | Vite `^8.0.8` |
| No framework | Vanilla TS — no React, no Vue |

---

## Getting started

```bash
yarn install
yarn start          # dev server at localhost:1234
```

```bash
yarn vite build     # production bundle → dist/
yarn tsc --noEmit   # type-check only
```

Entry point: `index.html` → `main.ts` (project root, not `src/`).

---

## Project structure

```
index.html          HTML shell — #game-canvas, overlay divs, UI elements
main.ts             Game state machine, tick loop, render loop, input
vite.config.ts

src/
  Constants.ts      Types, enums, TRACK_PIECES, LEVELS[]
  Grid.ts           Board cells, track placement, ghost preview
  Train.ts          Movement, interpolation, derail/win detection
  Cards.ts          4-card hand UI + refill logic
  Smoke.ts          Particle emitter (smoke puffs)
  Station.ts        3-D station model + flag
  Stars.ts          Background starfield
  scene.ts          Renderer, camera, lighting setup
  ui.ts             showOverlay() / hideOverlay()
  style.css
```

---

## Architecture

1. **State machine** (`main.ts`): `TITLE → PLAYING → WIN | DEAD`
2. **Each level**: `Grid` builds the board from a `LevelDef`; `Train` initialises at `trainStart`; `CardTray` deals 4 cards from `HAND_POOL`.
3. **Tick loop** (interval-based): `Train.step()` returns a `StepResult`; `main.ts` handles outcome and accelerates the interval.
4. **Render loop**: `requestAnimationFrame` — camera sway, `SmokeSystem.update(dt)`, Three.js render.
5. **Input**: `mousemove` → `Grid.showGhost()`; `click` → `Grid.placeTrack()` via an invisible `PlaneGeometry(200,200)` raycasting plane at `y=0`.

---

## Track pieces

| ID | Connections |
|---|---|
| `STRAIGHT_NS` | N ↔ S |
| `STRAIGHT_EW` | E ↔ W |
| `CURVE_NE` | N ↔ E |
| `CURVE_NW` | N ↔ W |
| `CURVE_SE` | S ↔ E |
| `CURVE_SW` | S ↔ W |

---

## Level grid encoding

Each `LevelDef.grid` is a 2D string array:

| Char | Cell type |
|---|---|
| `V` | Void |
| `F` | Floor (placeable) |
| `R` | Pre-built rail (STRAIGHT_NS) |
| `S` | Station |
| `T` | Train start |

---

## Levels

3 levels, each adding complexity to the required path. Speed baseline increases per level.

---

## Notes

- `CELL_SIZE = 2.0` world units per cell; board centered at origin.
- Imports use `.js` extensions (Vite bundler resolution).
- `dist/` and `node_modules/` are generated — do not edit.

---

*Three.js Journey Challenge 23 — due 1 May 2026*
