# 🚂 TrainMania

> Place rail pieces before the moving train derails.

A browser-based puzzle game built for the **Three.js Journey Challenge 23 — Theme: Train**.

---

## Gameplay

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
yarn build          # production bundle → dist/
yarn tsc --noEmit   # type-check only
```

Entry point: `index.pug` (compiled at serve/build time via Vite plugin) → `main.ts` (project root, not `src/`) → `src/Game.ts`.

---

## Project structure

```
index.pug              Root Pug template — includes all view partials
index.html             Minimal Vite HTML shell (replaced by index.pug at runtime)
main.ts                Thin bootstrap: creates Game, calls game.boot()
vite.config.ts         Vite config with custom Pug render plugin

src/
  Game.ts              Orchestrator — Three.js setup, level loading, tick, render loop
  CameraController.ts  Orbit camera angle, drag handling
  InputManager.ts      All DOM event listeners, raycasting, state delegation
  SettingsUI.ts        Settings modal DOM, audio controls
  states/
    IGameState.ts      IGameState interface + BaseGameState base class
    TitleState.ts      Title screen (overlay → PlayingState)
    PlayingState.ts    Active gameplay — tick, placement, keyboard
    PausedState.ts     Paused (stores previous state for resume)
    DeadState.ts       Death animation + "Start Over" overlay
    WinState.ts        "Next Level" / "Play Again" overlay
  views/
    _canvas.pug        .game__canvas
    _hud.pug           .hud block
    _settings-modal.pug .settings block
    _overlay.pug       .overlay block
  style/
    main.scss          SCSS entry — @use all partials
    _variables.scss    CSS custom properties
    _base.scss         Reset, .game, .game__canvas
    _hud.scss          .hud block
    _overlay.scss      .overlay block
    _settings.scss     .settings block
  Constants.ts         Types, enums, TRACK_PIECES, LEVELS[]
  Grid.ts              Board cells, track placement, ghost preview
  Train.ts             Movement, interpolation, derail/win detection
  Smoke.ts             Particle emitter (smoke puffs)
  Station.ts           3-D station model + flag
  Stars.ts             Background starfield
  scene.ts             Renderer, camera, lighting setup
  ui.ts                showOverlay() / hideOverlay()
```

---

## Architecture

1. **Bootstrap** — `main.ts` is 5 lines: creates a `Game` and calls `game.boot()`.
2. **State pattern** — `Game.currentState` holds an `IGameState`. `changeState(s)` calls `exit()` on the old state then `enter()` on the new one. Flow: `TitleState → PlayingState ↔ PausedState`, `PlayingState → DeadState | WinState`.
3. **Game class** — owns all Three.js objects, game entities (`Grid`, `Train`, `SmokeSystem`, station), speed state, selection state, and `levelIndex`. Exposes `loadLevel()`, `doTick()`, `pause()`, `resume()`.
4. **CameraController** — orbit angle + drag; works in all states.
5. **InputManager** — binds all DOM events; raycasts the invisible ground plane; delegates to `currentState.handle*()` methods.
6. **Tick loop** (rAF-driven): `Game.doTick()` fires whenever `train.lerpT >= 1`. `Train.step()` → `WinState` or `DeadState` on outcome; otherwise speed is multiplied by `SPEED_ACCEL = 1.05` (cap `MAX_SPEED = 4.0`).
7. **Settings** — `SettingsUI.open()` calls `game.pause()`; `close()` calls `game.resume()`.

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
