import { CircleGeometry, Group, Mesh, MeshBasicMaterial, Scene, SpotLight, Vector3, } from 'three'
import { loadModelAsset, warnAssetLoadFailureOnce } from './Assets.js'
import { DIR, Direction, OPPOSITE, TRACK_PIECES } from './Constants.js'
import { cellToWorld, Grid } from './Grid.js'

let _selectedModelId = 'train-diesel-b'

// Only models in this set will emit smoke.
const SMOKE_MODELS = new Set<string>([
  'train-diesel-a',
  'train-diesel-b',
  'train-diesel-box-a',
  'train-diesel-c',
  'train-steam',
  'train-locomotive-a',
  'train-locomotive-b',
  'train-locomotive-c'
])

function _trainAsset() {
  return {
    modelUrl: `/assets/models/${_selectedModelId}.glb`,
    colorMapUrl: '/assets/textures/colormap.png',
    targetFootprint: 1.35,
    yOffset: 0.02,
    rotationY: Math.PI, // Flip model 180° to face correct direction
  }
}

// Cached after Train.preload() resolves.
let _preloadedModel: import('three').Group | null = null

export interface StepSuccess {
  ok: true
  won?: true
  nextCol: number
  nextRow: number
  nextDir: Direction
}

export interface StepFailure {
  ok: false
  fell?: true
  derailed?: true
  nextCol: number
  nextRow: number
}

export type StepResult = StepSuccess | StepFailure

export class Train {
  scene: Scene
  grid: Grid
  group: Group
  lightsGroup: Group
  col: number
  row: number
  dir: Direction
  moving: boolean
  falling: boolean
  fallVel: number
  derailing: boolean
  derailTilt: number
  fromPos: Vector3
  toPos: Vector3
  lerpT: number
  fromRot: number
  toRot: number
  lerpSpeed: number

  constructor(scene: Scene, grid: Grid) {
    this.scene   = scene
    this.grid    = grid
    this.group   = new Group()
    scene.add(this.group)

    this.lightsGroup = new Group()
    this.group.add(this.lightsGroup)

    this.col     = grid.level.trainStart[0]
    this.row     = grid.level.trainStart[1]
    this.dir     = grid.level.trainDir
    this.moving    = false
    this.falling   = false
    this.fallVel   = 0
    this.derailing = false
    this.derailTilt = 1

    // interpolation
    this.fromPos  = new Vector3()
    this.toPos    = new Vector3()
    this.lerpT    = 1
    this.fromRot  = 0
    this.toRot    = 0
    this.lerpSpeed = 1

    this._addHeadlights()
    this._snapToCell()
    this.group.scale.setScalar(1.5)

    // Use the preloaded model if available (synchronous clone); fall back to
    // async load for cases where Train.preload() was not called first.
    if (_preloadedModel) {
      this.group.add(_preloadedModel.clone())
    } else {
      void this._tryLoadAssetVisual()
    }
  }

  /** Returns true if the currently selected model should emit smoke. */
  static hasSmoke(): boolean {
    console.log(_selectedModelId);

    return SMOKE_MODELS.has(_selectedModelId)
  }

  /** Returns the currently active model id. */
  static getModelId(): string {
    return _selectedModelId
  }

  /** Set the model id (filename without extension) to use for all future trains. */
  static setModel(id: string): void {
    _selectedModelId = id
    _preloadedModel = null
  }

  /** Call once before constructing any Train instances to warm the asset cache. */
  static async preload(): Promise<void> {
    try {
      _preloadedModel = await loadModelAsset(_trainAsset())
    } catch (err) {
      const asset = _trainAsset()
      warnAssetLoadFailureOnce('train asset', asset.modelUrl, err)
    }
  }

  _addHeadlights(): void {
    // Two lens discs + spotlights on the front face — survive model swaps
    const lensGeo = new CircleGeometry(0.055, 8)
    const lensMat = new MeshBasicMaterial({ color: 0xfffbe8 })
    const lensPositions: [number, number][] = [[-0.17, 0], [0.17, 0]]
    lensPositions.forEach(([lx, _ly]) => {
      const lens = new Mesh(lensGeo, lensMat)
      lens.position.set(lx, 0.38, 0)
      this.lightsGroup.add(lens)

      const spot = new SpotLight(0xfffbe8, 10, 8, Math.PI / 10, 0.4, 1.2)
      spot.position.set(lx, 0.38, 0)
      spot.target.position.set(lx, -0.3, -3)
      this.lightsGroup.add(spot)
      this.lightsGroup.add(spot.target)
    })
  }

  async _tryLoadAssetVisual(): Promise<void> {
    try {
      const asset = _trainAsset()
      const assetModel = await loadModelAsset(asset)
      _preloadedModel = assetModel
      this.group.add(assetModel.clone())
    } catch (error) {
      const asset = _trainAsset()
      warnAssetLoadFailureOnce('train asset', asset.modelUrl, error)
    }
  }

  _snapToCell(): void {
    const pos = cellToWorld(this.col, this.row, this.grid.cols, this.grid.rows)
    this.group.position.set(pos.x, 0.14, pos.z)
    this.group.rotation.y = this._dirToRotY(this.dir)
    this.fromPos = this.group.position.clone()
    this.toPos   = this.group.position.clone()
    this.fromRot = this.group.rotation.y
    this.toRot   = this.group.rotation.y
    this.lerpT   = 1
  }

  _dirToRotY(dir: Direction): number {
    // Mesh front (boiler/cowcatcher) sits at local -Z, so rotation.y=0 → faces -Z = North.
    // cellToWorld maps row→Z, so South (+row) = +Z world = rotation.y π.
    const map: Record<Direction, number> = {
      N: 0, S: Math.PI, E: -Math.PI / 2, W: Math.PI / 2,
    }
    return map[dir]
  }

  // Returns result without mutating state
  peekNextStep(): StepResult {
    const [dc, dr] = DIR[this.dir]
    const nc = this.col + dc
    const nr = this.row + dr

    // Off the grid or void cell → fall
    if (!this.grid.isWalkable(nc, nr)) {
      return { ok: false, fell: true, nextCol: nc, nextRow: nr }
    }

    const cell = this.grid.getCell(nc, nr)!

    // Station — win
    if (cell.type === 'STATION') {
      return { ok: true, won: true, nextCol: nc, nextRow: nr, nextDir: this.dir }
    }

    // Has a track piece?
    if (!cell.trackPiece) {
      return { ok: false, derailed: true, nextCol: nc, nextRow: nr }
    }

    // Find exit direction from the track piece
    const piece = TRACK_PIECES[cell.trackPiece]
    const entryFromPrev = OPPOSITE[this.dir]
    const exitDir = piece.connections[entryFromPrev]
    if (!exitDir) {
      return { ok: false, derailed: true, nextCol: nc, nextRow: nr }
    }

    return { ok: true, nextCol: nc, nextRow: nr, nextDir: exitDir }
  }

  // Begin a step (call once per tick)
  step(): StepResult {
    const result = this.peekNextStep()
    if (!result.ok) return result

    // Start lerp
    const fromWorld = cellToWorld(this.col, this.row, this.grid.cols, this.grid.rows)
    const toWorld   = cellToWorld(result.nextCol, result.nextRow, this.grid.cols, this.grid.rows)

    this.fromPos = new Vector3(fromWorld.x, 0.14, fromWorld.z)
    this.toPos   = new Vector3(toWorld.x,   0.14, toWorld.z)
    this.fromRot = this.group.rotation.y
    this.toRot   = this._dirToRotY(result.nextDir)
    this.lerpT   = 0

    this.col = result.nextCol
    this.row = result.nextRow
    this.dir = result.nextDir

    return result
  }

  update(delta: number): void {
    if (this.derailing) {
      // Tip sideways and freeze at 90° — stays above the floor
      const TILT_MAX = Math.PI / 2
      this.group.rotation.z += this.derailTilt * 3.5 * delta
      if (Math.abs(this.group.rotation.z) > TILT_MAX) {
        this.group.rotation.z = this.derailTilt * TILT_MAX
      }
      return
    }

    if (this.falling) {
      this.fallVel += 14 * delta
      this.group.position.y -= this.fallVel * delta
      this.group.rotation.z += 2.5 * delta
      this.group.rotation.x += 1.0 * delta
      return
    }

    if (this.lerpT < 1) {
      this.lerpT = Math.min(1, this.lerpT + delta * this.lerpSpeed)
      const t = easeInOut(this.lerpT)
      this.group.position.lerpVectors(this.fromPos, this.toPos, t)

      // Shortest-path rotation lerp
      let rotDiff = this.toRot - this.fromRot
      while (rotDiff >  Math.PI) rotDiff -= Math.PI * 2
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2
      this.group.rotation.y = this.fromRot + rotDiff * t

      // Gentle bob
      this.group.position.y = this.fromPos.y + Math.sin(this.lerpT * Math.PI) * 0.04
    }
  }

  startFall(): void {
    this.falling = true
    this.fallVel = 0
    // Snap to the off-grid cell the train was heading into so it falls
    // from beyond the visible map edge rather than through a floor tile
    const [dc, dr] = DIR[this.dir]
    const edgePos = cellToWorld(
      this.col + dc, this.row + dr,
      this.grid.cols, this.grid.rows,
    )
    this.group.position.x = edgePos.x
    this.group.position.z = edgePos.z
    this.group.position.y = 0.14
  }

  startDerail(): void {
    this.derailing = true
    this.derailTilt = Math.random() < 0.5 ? 1 : -1
  }

  dispose(): void {
    this.scene.remove(this.group)
  }
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}
