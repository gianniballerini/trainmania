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
main.ts               Bootstrap, game state machine, tick/render loop, input, level loading
vite.config.ts        Vite config with custom Pug render plugin
src/
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
1. `main.ts` owns the game state machine: `TITLE → PLAYING → (WIN | DEAD | PAUSED)`. On DEAD, always restarts from level 1 (`levelIndex = 0`).
2. Each level: `Grid` builds the board from `LevelDef.grid`; `Train` initialises at `rotation`; keyboard W/S/A/D changes type and rotation).
3. **Tick loop** (rAF-driven, not interval-based): `doTick()` is called inside `animate()` whenever `train.lerpT >= 1` (i.e. the previous lerp has completed). `Train.step()` returns a `StepResult`; `main.ts` handles WIN / DEAD / continue.
4. **Speed model**: `lerpSpeed` (cells/sec) starts at `1000 / levelDef.baseSpeed` and is multiplied by `SPEED_ACCEL = 1.05` after every step, capped at `MAX_SPEED = 4.0`. `train.lerpSpeed` is updated live each tick.
5. **Render loop**: `requestAnimationFrame` → `train.update(delta)`, `smoke.update(delta)`, `renderer.render(scene, camera)`, then `keyboardHUD.update(delta)` + `keyboardHUD.render(renderer)` via scissor viewport.
6. **Input**: `mousemove` → `Grid.showGhost()`; `click` → `Grid.placeTrack()`. Raycasting uses an invisible `PlaneGeometry(200,200)` at `y=0`. Middle/right drag orbits the camera.
7. **Audio**: `AudioManager.init()` called on first user gesture; background music via `playMusic([...webm])`, SFX via `playSfx(url)`. Settings modal exposes mute toggles + volume sliders.
8. **KeyboardHUD**: loads 4 GLB key models (`w_key.glb` etc.), renders them in a bottom-left scissor viewport; keys animate down on press and light up gold.

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
