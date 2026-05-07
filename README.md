# TrainMania

Place rail pieces before the moving train derails.

A browser-based puzzle game built for the Three.js Journey Challenge 23 — Theme: Train.

---

## Gameplay

The train moves automatically and doesn't wait. Build a continuous rail path from the start tile to the station before it runs out of track. Collect coins along the way for a better score. Speed increases each step — fastest runs with more coins win a spot on the leaderboard.

**Win** — guide the train into the station.
**Lose** — train reaches a void cell or a dead-end.

---

## Controls

| Input | Action |
|---|---|
| Left click on grid | Focus cell; second click places track |
| Right click | Swap straight / curve |
| Middle click | Rotate selected tile |
| Left drag | Orbit camera |
| Click on train | Toggle follow-camera |
| `A` | Select / rotate straight tile |
| `S` | Select / rotate curved tile |
| Arrow keys | Move ghost preview |
| Space / Enter | Place track |
| Esc | Pause / settings |

HUD buttons (Rotate L, Swap, Rotate R) mirror the keyboard actions.
On touch: single-finger drag to orbit, single tap for two-tap placement.

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
yarn start        # dev server
```

```bash
yarn build        # production bundle → dist/
yarn tsc --noEmit # type-check only
```

Entry: `index.pug` → `main.ts` → `src/Game.ts`.

---

## Project structure

```
main.ts          Bootstrap — creates Game, calls game.boot()
src/
  Game.ts        Orchestrator — Three.js setup, level loading, render loop
  InputManager.ts  DOM events, raycasting, button wiring
  states/        TitleState, PlayingState, PausedState, DeadState, WinState
  levels/        Level1–Level8 grid definitions
  tiles/         Track piece classes (Straight, Curve, Floor, …)
  js/            CameraController, Train, Grid, AudioManager, CoinSystem, …
  style/         SCSS partials
  views/         Pug partials (HUD, overlays, modals)
```

---

*Three.js Journey Challenge 23 — May 2026*
