import * as THREE from 'three'
import { AudioManager } from './AudioManager.js'
import { CameraController } from './CameraController.js'
import { CELL, CELL_SIZE, DIR, OPPOSITE, PieceId, tileToPieceId, TileType, TRACK_PIECES } from './Constants.js'
import { Grid } from './Grid.js'
import { InputManager } from './InputManager.js'
import { LeaderboardUI } from './LeaderboardUI.js'
import { LEVELS } from './levels/Level.js'
import { createScene } from './scene.js'
import { SceneController } from './SceneController.js'
import { SettingsUI } from './SettingsUI.js'
import { SmokeSystem } from './Smoke.js'
import { DeadState } from './states/DeadState.js'
import { BaseGameState } from './states/IGameState.js'
import { PausedState } from './states/PausedState.js'
import { PlayingState } from './states/PlayingState.js'
import { TitleState } from './states/TitleState.js'
import { WinState } from './states/WinState.js'
import { tileRegistry } from './tiles/index.js'
import { Train } from './Train.js'
import { Tweakpane } from './Tweakpane.js'
import { initUiSfx, updateOverlayLoadProgress } from './ui.js'

// ── Speed constants ───────────────────────────────────────────────────────────
const SPEED_ACCEL = 1.05
const MAX_SPEED   = 4.0

export class Game {
  // ── Three.js ───────────────────────────────────────────────────────────────
  readonly renderer: THREE.WebGLRenderer
  readonly scene:    THREE.Scene
  readonly camera:   THREE.Camera

  // ── HUD DOM ────────────────────────────────────────────────────────────────
  private readonly speedBar: HTMLElement
  private readonly levelNum: HTMLElement
  private readonly speedBtn: HTMLElement
  private readonly countdownBtn: HTMLElement
  private readonly countdownContainer: HTMLElement
  private readonly countdownValue: HTMLElement
  private readonly coinsEl: HTMLElement
  private readonly coinsCountEl: HTMLElement
  private readonly timeValEl: HTMLElement
  private readonly railsCountEl: HTMLElement
  private readonly straightBtnSpan: HTMLElement
  private readonly straight_btn_annotation: HTMLElement
  private readonly curvedBtnSpan: HTMLElement
  private readonly curved_btn_annotation: HTMLElement
  private readonly placeBtnSpan: HTMLElement
  private tweakpane: Tweakpane | undefined
  // ── Live game objects (replaced on each level load) ───────────────────────
  grid:  Grid        | undefined
  train: Train       | undefined
  smoke: SmokeSystem | undefined

  // ── Speed ─────────────────────────────────────────────────────────────────
  lerpSpeed = 1
  baseSpeed = 1

  // ── Track selection ───────────────────────────────────────────────────────
  selectedPiece:   PieceId | null = null
  currentTileType: TileType       = 'STRAIGHT'
  currentRotation                 = 0
  private readonly rotationByTileType: Record<TileType, number> = {
    STRAIGHT: 0,
    CURVE: 0,
  }
  lastHoveredCell: { col: number; row: number } | null = null

  // ── Level ─────────────────────────────────────────────────────────────────
  levelIndex = 0
  // ── Coins (per-level) ───────────────────────────────────────────────
  coinCount  = 0
  totalCoins = 0
  // ── Rails placed (cumulative per-level) ────────────────────────────
  railsPlaced = 0
  // ── Play time (seconds elapsed while in PlayingState) ────────────
  playTime = 0
  playTimeAccumulated = 0
  playTimeStamp = 0
  // ── Input ─────────────────────────────────────────────────────────────────
  isTouchMode = false
  followTrain = false

  // ── Managers ──────────────────────────────────────────────────────────────

  readonly audioManager!:     AudioManager
  readonly cameraController!: CameraController
  readonly sceneController!:  SceneController

  settingsUI:     SettingsUI     | undefined
  leaderboardUI:  LeaderboardUI  | undefined
  assetsReady!:   Promise<void>

  // ── State machine ─────────────────────────────────────────────────────────
  currentState: BaseGameState = new BaseGameState()

  // ── Render loop ───────────────────────────────────────────────────────────
  private lastTime = performance.now()

  constructor(readonly canvas: HTMLCanvasElement) {
    this.audioManager     = new AudioManager();
    this.cameraController = new CameraController();
    this.cameraController.loadPreferences()

    const { renderer, scene, camera } = createScene(canvas)
    this.renderer = renderer
    this.scene    = scene
    this.camera   = camera

    this.sceneController = new SceneController(scene)

    this.speedBar = document.querySelector<HTMLElement>('.hud__speed-bar')!
    this.levelNum = document.querySelector<HTMLElement>('.hud__level-num')!
    this.speedBtn = document.querySelector<HTMLElement>('.hud__speed-btn')!
    this.countdownContainer = document.querySelector<HTMLElement>('.hud__countdown-container')!
    this.countdownValue = this.countdownContainer.querySelector<HTMLElement>('.hud__countdown-val')!
    this.countdownBtn = document.querySelector<HTMLElement>('.hud__countdown-button')!
    this.coinsEl = document.querySelector<HTMLElement>('.hud__coins')!
    this.coinsCountEl = document.querySelector<HTMLElement>('.hud__coins-count')!
    this.timeValEl = document.querySelector<HTMLElement>('.hud__time-val')!
    this.railsCountEl = document.querySelector<HTMLElement>('.hud__rails-count')!

    this.straightBtnSpan = document.querySelector<HTMLElement>('.hud__action-btn--straight span')!
    this.straight_btn_annotation = document.querySelector<HTMLElement>('.hud__annotation--straight')!

    this.curvedBtnSpan = document.querySelector<HTMLElement>('.hud__action-btn--curved span')!
    this.curved_btn_annotation = document.querySelector<HTMLElement>('.hud__annotation--curved')!

    this.placeBtnSpan = document.querySelector<HTMLElement>('.hud__action-btn--place span')!

    this.countdownBtn.addEventListener('click', () => {
      if (this.currentState instanceof PlayingState) {
        this.currentState.skipCountdown(this)
      }
    })

    this.speedBtn.addEventListener('click', () => {
      if (this.currentState instanceof PlayingState) {
        this.boostSpeed()
      }
    })
  }

  // ── Dev tools ─────────────────────────────────────────────────────────────
  enableDevTools(): void {
    this.tweakpane = new Tweakpane()
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  async boot(): Promise<void> {
    initUiSfx(this.audioManager)

    // Start background loading immediately — tiles + first level load while
    // the user browses the train picker. assetsReady must be set before
    // changeState so TitleState.enter can attach a .then() to it.
    const totalAssets = tileRegistry.size
    let loadedAssets  = 0
    this.assetsReady = tileRegistry.preloadAll(() => {
      loadedAssets++
      updateOverlayLoadProgress(loadedAssets, totalAssets)
    }).then(async () => {
      this.levelIndex = 0
      await this.loadLevel(0)
      // InputManager and UI panels require the level/scene to be ready.
      new InputManager(this.canvas, this, this.cameraController)
      this.settingsUI    = new SettingsUI(this.audioManager, this)
      this.leaderboardUI = new LeaderboardUI(this)
    })

    this.changeState(new TitleState())
    this.startRenderLoop()
  }

  // ── State machine ─────────────────────────────────────────────────────────
  changeState(newState: BaseGameState): void {
    this.currentState.exit(this)
    this.currentState = newState
    this.currentState.enter(this)
  }

  pause(): void {
    if (this.currentState instanceof PlayingState) {
      this.changeState(new PausedState(this.currentState))
    }
  }

  resume(): void {
    if (this.currentState instanceof PausedState) {
      this.lastTime = performance.now()
      this.changeState(this.currentState.previousState as BaseGameState)
    }
  }

  // ── Level loading ─────────────────────────────────────────────────────────
  async loadLevel(idx: number): Promise<void> {
    this.grid?.dispose()
    this.train?.dispose()
    this.smoke?.dispose()

    const levelDef     = LEVELS[idx]
    this.baseSpeed     = 1000 / levelDef.baseSpeed
    this.lerpSpeed     = this.baseSpeed
    this.lastHoveredCell = null

    this.levelNum.textContent = String(levelDef.id)
    this.updateSpeedBar(0)

    this.grid         = new Grid(this.scene, levelDef)
    this.cameraController.setPanBounds(this.grid.cols * CELL_SIZE / 2, this.grid.rows * CELL_SIZE / 2)
    this.train        = new Train(this.scene, this.grid)
    this.train.lerpSpeed = this.lerpSpeed
    this.smoke        = Train.hasSmoke() ? new SmokeSystem(this.scene) : undefined

    await this.grid.buildCoins()
    this.coinCount          = 0
    this.totalCoins         = this.grid.totalCoins
    this.railsPlaced        = 0
    this.playTimeAccumulated = 0
    this.playTimeStamp      = 0
    this.updateCoinDisplay()
    this.updateTimeDisplay()
    this.updateRailsDisplay()

    this.cameraController.reset(this.camera)
    this.updateSelectedPiece()
    this.showDefaultGhost()
  }

  rebuildTrain(): void {
    if (!this.grid) return

    this.train?.dispose()
    this.train = new Train(this.scene, this.grid)
    this.train.lerpSpeed = this.lerpSpeed

    this.smoke?.dispose()
    this.smoke = Train.hasSmoke() ? new SmokeSystem(this.scene) : undefined

    this.showDefaultGhost()
  }

  // ── Tick (called by PlayingState.update when train lerp completes) ─────────
  doTick(): void {
    if (!this.train) return
    // Collect coin on the current cell before stepping
    if (this.grid?.collectCoin(this.train.col, this.train.row, this)) {
      this.coinCount++
      this.updateCoinDisplay()
    }
    const result = this.train.step()

    this.lerpSpeed = Math.min(MAX_SPEED, this.lerpSpeed * SPEED_ACCEL)
    this.train.lerpSpeed = this.lerpSpeed
    const speedT = (this.lerpSpeed - this.baseSpeed) / (MAX_SPEED - this.baseSpeed)
    this.updateSpeedBar(Math.min(1, speedT))

    if (result.ok && result.won) {
      this.changeState(new WinState())
      return
    }

    if (!result.ok) {
      this.changeState(new DeadState(!!result.derailed))
    }
  }

  // ── HUD helpers ───────────────────────────────────────────────────────────
  updateSelectedPiece(): void {
    this.selectedPiece = tileToPieceId(this.currentTileType, this.currentRotation)
    if (this.currentTileType === 'STRAIGHT') {
      this.straight_btn_annotation.classList.remove('hidden')
      this.curved_btn_annotation.classList.add('hidden')
    } else if (this.currentTileType === 'CURVE') {
      this.straight_btn_annotation.classList.add('hidden')
      this.curved_btn_annotation.classList.remove('hidden')
    }
    if (this.grid && this.selectedPiece && this.lastHoveredCell) {
      this.grid.showGhost(this.lastHoveredCell.col, this.lastHoveredCell.row, this.selectedPiece)
      const hoveredCell = this.grid.getCell(this.lastHoveredCell.col, this.lastHoveredCell.row)
      this.updatePlaceBtn(hoveredCell?.trackPiece != null)
    }
  }

  selectTileType(type: TileType): void {
    this.currentTileType = type
    this.currentRotation = this.rotationByTileType[type]
    this.updateSelectedPiece()
  }

  rotateCurrentTile(step = 1): void {
    this.currentRotation = (this.currentRotation + step + 4) % 4
    this.rotationByTileType[this.currentTileType] = this.currentRotation
    this.updateSelectedPiece()
  }

  // -- Start of the Game --
  updateCountdown(seconds: number | null): void {
    if (seconds) {
      this.countdownContainer.classList.remove('hidden')
      this.countdownValue.textContent = seconds.toString()
    } else {
      this.countdownContainer.classList.add('hidden')
    }
  }
  setSpeedBtnEnabled(enabled: boolean): void {
    if (enabled) {
      this.speedBtn.classList.remove('hud__speed-btn--disabled')
    } else {
      this.speedBtn.classList.add('hud__speed-btn--disabled')
    }
  }


  /** Place the ghost on the next free tile along the track ahead of the train. */
  showDefaultGhost(): void {
    if (!this.grid || !this.selectedPiece) return
    const cell = this._findNextFreeTileAlongTrack()
    if (!cell) return
    this.lastHoveredCell = { col: cell.col, row: cell.row }
    this.grid.showGhost(cell.col, cell.row, this.selectedPiece)
    this.updatePlaceBtn(false)
  }

  /**
   * Walk the laid track from the train's current position/direction until the
   * path runs out, then return the first empty floor tile ahead.  If that tile
   * is not placeable, BFS outward from the track-end for the closest free tile.
   */
  private _findNextFreeTileAlongTrack(): { col: number; row: number } | null {
    if (!this.grid || !this.train) return null

    let col = this.train.col
    let row = this.train.row
    let dir = this.train.dir

    // Follow existing track pieces to find where the path ends
    const visited = new Set<string>()
    for (;;) {
      const [dc, dr] = DIR[dir]
      const nc = col + dc
      const nr = row + dr
      const cell = this.grid.getCell(nc, nr)

      // Off-grid → stop
      if (!cell) break

      // Empty placeable floor → ideal target
      if (this._isPlaceable(cell)) return { col: nc, row: nr }

      // Cell has a track piece → traverse it and keep walking
      if (cell.trackPiece) {
        const key = `${nc},${nr}`
        if (visited.has(key)) break // closed loop detected — stop
        visited.add(key)
        const piece = TRACK_PIECES[cell.trackPiece]
        const entryFrom = OPPOSITE[dir]
        const exitDir = piece.connections[entryFrom]
        if (!exitDir) break // can't enter this piece from this side
        col = nc
        row = nr
        dir = exitDir
        continue
      }

      // Non-placeable cell (void / station / start) → stop walking
      break
    }

    // BFS from the track-end position to find the closest placeable tile
    return this._bfsClosestFree(col, row)
  }

  /** BFS outward from (startCol, startRow) returning the nearest placeable cell. */
  private _bfsClosestFree(startCol: number, startRow: number): { col: number; row: number } | null {
    if (!this.grid) return null
    const visited = new Set<string>()
    const queue: [number, number][] = [[startCol, startRow]]
    visited.add(`${startCol},${startRow}`)

    while (queue.length > 0) {
      const [c, r] = queue.shift()!
      const cell = this.grid.getCell(c, r)
      if (cell && this._isPlaceable(cell)) return { col: c, row: r }

      for (const [dc, dr] of Object.values(DIR)) {
        const nc = c + dc
        const nr = r + dr
        const key = `${nc},${nr}`
        if (visited.has(key)) continue
        visited.add(key)
        if (this.grid.getCell(nc, nr)) queue.push([nc, nr])
      }
    }
    return null
  }

  private _isPlaceable(cell: { type: string; trackPiece: unknown }): boolean {
    return cell.type !== CELL.VOID
        && cell.type !== CELL.STATION
        && cell.trackPiece === null
  }

  boostSpeed(): void {
    this.lerpSpeed = MAX_SPEED
    if (this.train) this.train.lerpSpeed = MAX_SPEED
    this.updateSpeedBar(1)
    if (this.speedBtn) {
      this.speedBtn.classList.add('is-active')
      setTimeout(() => this.speedBtn.classList.remove('is-active'), 300)
    }
  }

  updateSpeedBar(t: number): void {
    const pct = t * 100
    this.speedBar.style.width      = pct + '%'
    this.speedBar.style.background = t < 0.5
      ? `hsl(${30 + t * 40}, 80%, 55%)`
      : `hsl(${70 - (t - 0.5) * 100}, 80%, 50%)`
  }

  updateTimeDisplay(): void {
    const t = this.playTime
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60).toString().padStart(2, '0')
    this.timeValEl.textContent = m > 0 ? `${m}:${s}` : `${Math.floor(t)}s`
  }

  updateCoinDisplay(): void {
    this.coinsEl.classList.remove('hidden')
    this.coinsCountEl.textContent = `${this.coinCount} / ${this.totalCoins}`
  }

  updateRailsDisplay(): void {
    this.railsCountEl.textContent = String(this.railsPlaced)
  }

  updatePlaceBtn(isReplace: boolean): void {
    this.placeBtnSpan.textContent = isReplace ? 'Replace' : 'Place'
  }

  // ── Render loop ───────────────────────────────────────────────────────────
  private startRenderLoop(): void {
    this.animate()
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate)
    const now   = performance.now()
    const delta = Math.min((now - this.lastTime) / 1000, 0.1)
    this.lastTime = now

    this.currentState.update(this, delta)

    if (this.train && (this.currentState instanceof PlayingState || this.currentState instanceof DeadState || this.currentState instanceof WinState)) this.train.update(delta)
    if (this.smoke) this.smoke.update(delta, this.train?.group, this.currentState instanceof PlayingState)
    if (this.grid) this.grid.updateHover(now * 0.001)
    if (this.grid) this.grid.updateCoins(delta)
    this.playTime = this.playTimeAccumulated + (this.currentState instanceof PlayingState ? (performance.now() - this.playTimeStamp) / 1000 : 0)
    this.updateTimeDisplay()

    // Lerp camera look target: train follow > ghost tile > grid center
    let goalX = 0
    let goalZ = 0
    if (this.followTrain && this.train) {
      goalX = this.train.group.position.x
      goalZ = this.train.group.position.z
    } else {
      const ghost = this.grid?.ghostMesh
      if (ghost) { goalX = ghost.position.x; goalZ = ghost.position.z }
    }
    this.cameraController.setGoalTarget(new THREE.Vector3(goalX, 0, goalZ))
    this.cameraController.tick(delta)
    this.cameraController.updateOrbit(this.camera)

    const [sc, sr] = this.grid?.stationPos ?? [0, 0]
    const flag = this.grid?.getCell(sc, sr)?.tileGroup?.userData?.flag as THREE.Mesh | undefined
    if (flag) flag.rotation.y = Math.sin(now * 0.003) * 0.3

    this.renderer.render(this.scene, this.camera)
  }


}
