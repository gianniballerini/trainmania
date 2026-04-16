# TrainMania — LLM Reference

Browser puzzle game: place rail pieces before the moving train derails.
Stack: TypeScript · Three.js · Vite · Pug · SCSS. No framework.

## Quick facts
- Entry: `index.pug` (compiled to `index.html` via Vite plugin) → `main.ts` (root, not src/)
- Dev: `yarn dev` or `yarn start` (vite --port 1234)
- Type-check: `yarn tsc --noEmit`
- Build: `yarn build` (vite build)
- tsconfig: `moduleResolution: bundler`, `strict: true`, `noEmit: true`
- Deps: `three ^0.183.2`; devDeps: `vite ^8.0.8`, `pug ^3.0.3`, `sass ^1.x`, `typescript ^6.0.2`, `@types/three ^0.183.1`
- Imports use `.js` extensions at runtime (Vite/bundler resolution)

## File map
```
index.pug             Root Pug template — includes all view partials
index.html            Minimal HTML shell (Vite entry); content is replaced by index.pug via plugin
main.ts               Thin bootstrap only: creates Game instance and calls game.boot()
vite.config.ts        Vite config with custom Pug render plugin
src/
  Game.ts             Game orchestrator — Three.js setup, loadLevel(), doTick(), changeState(), render loop
  CameraController.ts Orbit-camera angle, drag detection, threshold helper
  InputManager.ts     All DOM event listeners, raycasting, delegates to currentState handlers
  SettingsUI.ts       Settings modal DOM, audio controls, calls game.pause()/resume()
  states/
    IGameState.ts     IGameState interface + BaseGameState no-op base class
    TitleState.ts     Shows "Start Game" overlay; transitions to PlayingState on click
    PlayingState.ts   Train tick, track placement/removal, W/A/S/D keyboard shortcuts
    PausedState.ts    Frozen state — stores previousState for resume
    DeadState.ts      Starts fall/derail animation, shows "Start Over" overlay
    WinState.ts       Shows "Next Level"/"Play Again" overlay
  views/
    _canvas.pug       .game__canvas element
    _hud.pug          .hud block: level label, speed bar, settings button
    _settings-modal.pug .settings block: tabs (help, sound, credits)
    _overlay.pug      .overlay block: title/game-over screen
  style/
    main.scss         SCSS entry point — @use all partials + Google Fonts import
    _variables.scss   CSS custom properties (:root)
    _base.scss        Reset, html/body, .game block, .game__canvas
    _hud.scss         .hud block and elements
    _overlay.scss     .overlay block and elements
    _settings.scss    .settings block, .key-table, kbd
  Assets.ts           loadModelAsset(), normalizeObject(), warnAssetLoadFailureOnce() — GLB + texture helpers
  AudioManager.ts     AudioManager — music playlist (HTMLAudioElement) + SFX (Web Audio API)
  Constants.ts        Types, enums, TRACK_PIECES, TileType, tileToPieceId(), LEVELS[]
  Grid.ts             Board cells, track placement, ghost preview, coord helpers
  KeyboardHUD.ts      KeyboardHUD — WASD 3-D key widgets rendered via scissor viewport
  Smoke.ts            SmokeSystem particle emitter
  Station.ts          buildStation() — 3-D station model + flag
  Stars.ts            buildStarfield() — background points
  Train.ts            Train movement, lerp animation, fall/derail/win detection
  scene.ts            createScene() — renderer, camera, lighting (RectAreaLight included)
  ui.ts               showOverlay() / hideOverlay()
```

## Key exports
| Module | Exports |
|---|---|
| Game.ts | `class Game` — `boot()`, `loadLevel(idx)`, `doTick()`, `changeState(state)`, `pause()`, `resume()`, `updateSelectedPiece()`, `updateSpeedBar(t)` |
| CameraController.ts | `class CameraController` — `updateOrbit(camera)`, `reset(camera)`, `startDrag(x,y)`, `onDrag(x,y,camera)`, `endDrag()`, `isPastThreshold(x,y)`, `dragging` |
| InputManager.ts | `class InputManager` — constructor binds all DOM events |
| SettingsUI.ts | `class SettingsUI` — `open()`, `close()` |
| states/IGameState.ts | `IGameState` interface, `BaseGameState` no-op base class |
| states/TitleState.ts | `class TitleState` |
| states/PlayingState.ts | `class PlayingState` |
| states/PausedState.ts | `class PausedState` — `previousState: IGameState` |
| states/DeadState.ts | `class DeadState(derailed: boolean)` |
| states/WinState.ts | `class WinState` |
| Assets.ts | `loadModelAsset(options)`, `normalizeObject()`, `warnAssetLoadFailureOnce()`, `AssetLoadOptions` |
| AudioManager.ts | `class AudioManager` — `init()`, `playMusic()`, `stopMusic()`, `playSfx()`, `muteAll/Music/Sfx()`, `setMusicVolume()`, `setSfxVolume()` |
| Constants.ts | `Direction`, `PieceId`, `CellType`, `TileType`, `TrackPiece`, `LevelDef`, `CELL`, `DIR`, `DIR_NAMES`, `OPPOSITE`, `TRACK_PIECES`, `HAND_POOL`, `TILE_POOL`, `tileToPieceId()`, `LEVELS` |
| Grid.ts | `class Grid`, `CellData`, `cellToWorld()`, `worldToCell()`, `loadTrackAssets()`, `CELL_SIZE_EXPORT`, `CELL_H_EXPORT` |
| KeyboardHUD.ts | `class KeyboardHUD` — `load()`, `pressKey()`, `releaseKey()`, `update(delta)`, `render(renderer)`, `resize()` |
| Train.ts | `class Train`, `StepResult`, `StepSuccess`, `StepFailure` |
| Smoke.ts | `class SmokeSystem` |
| scene.ts | `createScene(canvas)` → `{ renderer, scene, camera }` |
| Station.ts | `buildStation(scene, grid)` → `THREE.Group` |
| Stars.ts | `buildStarfield(scene)` → `THREE.Points` |
| ui.ts | `showOverlay(titleText, subText, btnText, onBtn)`, `hideOverlay()` |

## Core types (Constants.ts)
```ts
type Direction = 'N' | 'S' | 'E' | 'W'
type PieceId   = 'STRAIGHT_NS'|'STRAIGHT_EW'|'CURVE_NE'|'CURVE_NW'|'CURVE_SE'|'CURVE_SW'
type CellType  = 'VOID'|'FLOOR'|'RAIL'|'STATION'|'START'
type TileType  = 'STRAIGHT' | 'CURVE'   // simplified hand type; rotation resolves to PieceId
function tileToPieceId(type: TileType, rotation: number): PieceId
interface LevelDef { id, grid: string[][], trainStart: [col,row], trainDir, stationPos, baseSpeed }
interface TrackPiece { id, label, connections: Partial<Record<Direction,Direction>>, svgPath }
```

## Architecture
1. **Bootstrap**: `main.ts` (5 lines) creates a `Game` instance and calls `game.boot()`.
2. **State pattern**: `Game.currentState` holds an `IGameState`. `game.changeState(s)` calls `currentState.exit()` then `s.enter()`. States: `TitleState → PlayingState ↔ PausedState`, `PlayingState → DeadState | WinState`.
3. **Game class** (`src/Game.ts`): owns all Three.js objects (`renderer`, `scene`, `camera`), game entities (`grid`, `train`, `smoke`, `stationGroup`), speed state (`lerpSpeed`, `baseSpeed`, `stepCount`), selection state (`selectedPiece`, `currentTileType`, `currentRotation`, `lastHoveredCell`), and `levelIndex`. Methods: `loadLevel(idx)`, `doTick()`, `changeState()`, `pause()`, `resume()`, `updateSelectedPiece()`, `updateSpeedBar()`.
4. **Level load**: `Game.loadLevel(idx)` tears down previous entities, recreates `Grid`/`Train`/`SmokeSystem`/station, resets camera. After load the state is unchanged — callers set the desired state with `changeState()`.
5. **CameraController** (`src/CameraController.ts`): owns orbit angle, drag state, drag threshold. Works in all game states.
6. **InputManager** (`src/InputManager.ts`): binds all mouse/keyboard/touch listeners; owns the invisible raycast `PlaneGeometry`. Converts pointer → col/row → delegates to `game.currentState.handle*()` methods.
7. **State responsibilities**:
   - `TitleState.enter()`: shows overlay; on click → `PlayingState` + audio init.
   - `PlayingState.update()`: calls `game.doTick()` when `train.lerpT >= 1`. Input handlers place/remove track and update selection.
   - `PausedState`: stores `previousState` for resume. All update/input methods are no-ops.
   - `DeadState.enter()`: starts fall/derail animation, 1.2 s timeout → overlay → reload level 0 → `PlayingState`.
   - `WinState.enter()`: 0.6 s timeout → overlay → load next level → `PlayingState` (or loop from 0).
8. **SettingsUI** (`src/SettingsUI.ts`): opening calls `game.pause()`; closing calls `game.resume()` (no-op when already paused externally).
9. **Tick loop** (rAF-driven): `doTick()` fires inside `Game.animate()` whenever `train.lerpT >= 1`. `Train.step()` returns a `StepResult`; `Game` transitions to `WinState` or `DeadState` accordingly, or accelerates speed.
10. **Speed model**: `lerpSpeed` starts at `1000 / levelDef.baseSpeed`, multiplied by `SPEED_ACCEL = 1.05` each step, capped at `MAX_SPEED = 4.0`.
11. **Audio**: `AudioManager.init()` called on first user gesture (inside `TitleState` callback).
12. **KeyboardHUD**: loads 4 GLB key models, renders via scissor viewport; W/A/S/D key press animations fire from `InputManager`; tile selection only handled in `PlayingState.handleKeyDown()`.

## Grid cell encoding (LevelDef.grid)
`V`=VOID `F`=FLOOR `R`=pre-built rail (STRAIGHT_NS) `S`=station `T`=train start

## Levels
3 levels defined in `LEVELS[]`. Each adds complexity to the required path; `baseSpeed` (ms/step) decreases each level.

## Conventions
- **BEM naming** for all CSS classes: `.block`, `.block__element`, `.block--modifier`. No `id` selectors in CSS or JS; use `querySelector('.class')` instead of `getElementById`.
- BEM blocks: `.game`, `.hud`, `.overlay`, `.settings`, `.key-table`.
- State classes: `.hidden`, `.active`, `.muted` (toggled via JS).
- Views: Pug partials in `src/views/`, prefixed with `_` (e.g. `_hud.pug`).
- Styles: SCSS partials in `src/style/`, prefixed with `_`, composed via `@use` in `main.scss`.
- PascalCase `.ts` for all modules; lowercase for `scene.ts`, `ui.ts`.
- ES module imports only — no `require`.
- `dist/` and `node_modules/` are generated; do not edit.
- `CELL_SIZE = 2.0` world units per cell; board centered at origin.
