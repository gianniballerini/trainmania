# TrainMania — LLM Reference

Browser puzzle game: place rail pieces before the moving train derails.
Stack: TypeScript · Three.js · Vite. No framework.

## Quick facts
- Entry: `index.html` → `main.ts` (root, not src/)
- Dev: `yarn start` (vite --port 1234)
- Type-check: `yarn tsc --noEmit`
- Build: `yarn vite build`
- tsconfig: `moduleResolution: bundler`, `strict: true`, `noEmit: true`
- Deps: `three ^0.183.2`, `vite ^8.0.8`; devDeps: `typescript ^6.0.2`, `@types/three ^0.183.1`
- Imports use `.js` extensions at runtime (Vite/bundler resolution)

## File map
```
index.html       HTML shell: #game-canvas, #speed-bar, #level-num, overlay divs
main.ts          Bootstrap, tick loop, render loop, input, level loading
vite.config.ts   Vite config
src/
  Constants.ts   Types, enums, TRACK_PIECES, LEVELS[]
  Grid.ts        Board cells, track placement, ghost preview, coord helpers
  Train.ts       Train movement, interpolation, fall/derail/win detection
  Cards.ts       CardTray UI — 4-card hand, refill logic
  Smoke.ts       SmokeSystem particle emitter
  Station.ts     buildStation() — 3-D station model + flag
  Stars.ts       buildStarfield() — background points
  scene.ts       createScene() — renderer, camera, lighting
  ui.ts          showOverlay() / hideOverlay()
  style.css      All CSS
```

## Key exports
| Module | Exports |
|---|---|
| Constants.ts | `Direction`, `PieceId`, `CellType`, `TrackPiece`, `LevelDef`, `CELL`, `DIR`, `OPPOSITE`, `TRACK_PIECES`, `HAND_POOL`, `LEVELS` |
| Grid.ts | `class Grid`, `CellData`, `cellToWorld()`, `worldToCell()`, `CELL_SIZE_EXPORT`, `CELL_H_EXPORT` |
| Train.ts | `class Train`, `StepResult`, `StepSuccess`, `StepFailure` |
| Cards.ts | `class CardTray` |
| Smoke.ts | `class SmokeSystem` |
| scene.ts | `createScene(canvas)` → `{ renderer, scene, camera }` |
| Station.ts | `buildStation(scene, grid)` → `THREE.Group` |
| Stars.ts | `buildStarfield(scene)` → `THREE.Points` |
| ui.ts | `showOverlay(id, options?)`, `hideOverlay()` |

## Core types (Constants.ts)
```ts
type Direction = 'N' | 'S' | 'E' | 'W'
type PieceId   = 'STRAIGHT_NS'|'STRAIGHT_EW'|'CURVE_NE'|'CURVE_NW'|'CURVE_SE'|'CURVE_SW'
type CellType  = 'VOID'|'FLOOR'|'RAIL'|'STATION'|'START'
interface LevelDef { id, grid: string[][], trainStart: [col,row], trainDir, stationPos, baseSpeed }
interface TrackPiece { id, label, connections: Partial<Record<Direction,Direction>>, svgPath }
```

## Architecture
1. `main.ts` owns game state machine: `TITLE → PLAYING → (WIN | DEAD)`
2. Each level: `Grid` builds board from `LevelDef.grid`; `Train` initialises at `trainStart`; `CardTray` fills 4-card hand from `HAND_POOL`.
3. Tick loop (interval-based): `Train.step()` returns `StepResult`; main handles outcome.
4. Speed accelerates each step: `interval *= 0.92`, floor `250 ms`.
5. Render loop: Three.js `requestAnimationFrame`; camera gentle sway; `SmokeSystem.update(dt)`.
6. Input: `mousemove` → `Grid.showGhost()`; `click` → `Grid.placeTrack()` using selected card.
7. Raycasting uses an invisible `PlaneGeometry(200,200)` at `y=0`.

## Grid cell encoding (LevelDef.grid)
`V`=VOID `F`=FLOOR `R`=pre-built rail (STRAIGHT_NS) `S`=station `T`=train start

## Levels
3 levels defined in `LEVELS[]`. Each adds complexity to the required path.

## Conventions
- PascalCase `.ts` for gameplay modules; lowercase for `scene.ts`, `ui.ts`, `style.css`.
- ES module imports only — no `require`.
- `dist/` and `node_modules/` are generated; do not edit.
- `CELL_SIZE = 2.0` world units per cell; board centered at origin.
