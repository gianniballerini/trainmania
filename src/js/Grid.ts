import * as THREE from 'three'
import { CoinSystem } from './collectibles/CoinSystem.js'
import { CELL, CELL_H, CELL_SIZE, CellType, Direction, GAP, PieceId } from './Constants.js'
import { Game } from './Game.js'
import type { Level } from './levels/Level.js'
import { Settings } from './Settings.js'
import hoverFrag from './shaders/hover.frag.glsl?raw'
import hoverVert from './shaders/hover.vert.glsl?raw'
import { tileRegistry } from './tiles/index.js'

// Ghost material — a Grid-level concern, not delegated to tiles
const MAT_GHOST = new THREE.MeshLambertMaterial({
  color: new THREE.Color(Settings.colors.ghost),
  transparent: true,
  opacity: 0.25,
  depthWrite: false,
})

export interface CellData {
  col: number
  row: number
  type: CellType
  trackPiece: PieceId | null
  tileGroup: THREE.Group | null
  trackMesh?: THREE.Group | null
  prebuilt?: boolean
  hasCoin?: boolean
  coinGroup?: THREE.Group | null
}

export function cellToWorld(col: number, row: number, cols: number, rows: number): THREE.Vector3 {
  const ox = -(cols * CELL_SIZE) / 2 + CELL_SIZE / 2
  const oz = -(rows * CELL_SIZE) / 2 + CELL_SIZE / 2
  return new THREE.Vector3(
    ox + col * CELL_SIZE,
    0,
    oz + row * CELL_SIZE
  )
}

export function worldToCell(wx: number, wz: number, cols: number, rows: number): { col: number; row: number } {
  const ox = -(cols * CELL_SIZE) / 2 + CELL_SIZE / 2
  const oz = -(rows * CELL_SIZE) / 2 + CELL_SIZE / 2
  const col = Math.round((wx - ox) / CELL_SIZE)
  const row = Math.round((wz - oz) / CELL_SIZE)
  return { col, row }
}

export const CELL_SIZE_EXPORT = CELL_SIZE
export const CELL_H_EXPORT    = CELL_H

export class Grid {
  scene: THREE.Scene
  level: Level
  cols: number
  rows: number
  cells: CellData[]
  meshes: THREE.Group
  railGroup: THREE.Group
  ghostMesh: THREE.Mesh | null
  ghostTrackGroup: THREE.Group | null
  hoverMesh: THREE.Mesh | null
  private readonly hoverMat: THREE.ShaderMaterial

  // Derived from the grid scan — consumed by Train and Game
  trainStart: [number, number] = [0, 0]
  trainDir: Direction = 'S'
  stationPos: [number, number] = [0, 0]

  // ── Coin system ──────────────────────────────────────────────────────────
  readonly coins: CoinSystem

  constructor(scene: THREE.Scene, levelDef: Level) {
    this.scene     = scene
    this.level     = levelDef
    this.cols      = levelDef.grid[0].length
    this.rows      = levelDef.grid.length
    this.cells     = []
    this.meshes    = new THREE.Group()
    this.railGroup = new THREE.Group()
    this.ghostMesh = null
    this.ghostTrackGroup = null
    this.hoverMesh = null
    this.hoverMat = new THREE.ShaderMaterial({
      uniforms: {
        time:  { value: 0 },
        color: { value: new THREE.Color(0xffffff) },
      },
      transparent: true,
      depthWrite: false,
      vertexShader: hoverVert,
      fragmentShader: hoverFrag,
    })

    this.coins = new CoinSystem(scene)

    scene.add(this.meshes)
    scene.add(this.railGroup)

    this._buildTerrain()
  }

  _buildTerrain(): void {
    const { grid } = this.level

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const gridCell       = grid[row][col]
        const isVoid         = gridCell.type === CELL.VOID
        const isPrebuiltRail = gridCell.type === CELL.RAIL
        const type: CellType = gridCell.type

        // Extract derived metadata from special cell types
        if (type === CELL.START && gridCell.dir) {
          this.trainStart = [col, row]
          this.trainDir   = gridCell.dir
        }
        if (type === CELL.STATION) {
          this.stationPos = [col, row]
        }

        const cell: CellData = {
          col, row, type,
          trackPiece: isPrebuiltRail ? (gridCell.prebuiltPiece ?? null) : null,
          tileGroup: null,
          prebuilt: isPrebuiltRail,
          hasCoin: gridCell.hasCoin ?? false,
          coinGroup: null,
        }
        this.cells.push(cell)

        if (isVoid) continue

        // For RAIL cells the terrain base is a floor tile; track sits on top
        const terrainType = type === CELL.RAIL ? CELL.FLOOR : type

        if (!tileRegistry.has(terrainType)) continue

        const pos   = cellToWorld(col, row, this.cols, this.rows)
        const group = tileRegistry.get(terrainType).build(pos)
        this.meshes.add(group)
        cell.tileGroup = group

        if (isPrebuiltRail && cell.trackPiece) {
          this._buildTrackVisual(cell, cell.trackPiece)
        }
      }
    }
  }

  getCell(col: number, row: number): CellData | null {
    if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) return null
    return this.cells[row * this.cols + col]
  }

  isWalkable(col: number, row: number): boolean {
    const c = this.getCell(col, row)
    return c !== null && c.type !== CELL.VOID
  }

  placeTrack(col: number, row: number, pieceId: PieceId): boolean {
    const cell = this.getCell(col, row)
    if (!cell || !this._trackPlaceable(col, row)) return false
    if (cell.trackPiece) this._removeTrackVisual(cell)
    cell.trackPiece = pieceId
    cell.prebuilt = false
    cell.type = CELL.RAIL
    this._buildTrackVisual(cell, pieceId)
    return true
  }

  removeTrack(col: number, row: number): boolean {
    const cell = this.getCell(col, row)
    if (!cell || !cell.trackPiece) return false
    if (cell.type === CELL.STATION) return false
    const restoreType = cell.type === CELL.START ? CELL.START : CELL.FLOOR
    this._removeTrackVisual(cell)
    cell.trackPiece = null
    cell.prebuilt = false
    cell.type = restoreType
    return true
  }

  _trackPlaceable(col: number, row: number): boolean {
    const cell = this.getCell(col, row)
    if (!cell) return false
    return tileRegistry.has(cell.type) && tileRegistry.get(cell.type).isPlaceable
  }

  _removeTrackVisual(cell: CellData): void {
    if (cell.trackMesh) {
      this.railGroup.remove(cell.trackMesh)
      cell.trackMesh.traverse((o) => {
        if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose()
      })
      cell.trackMesh = null
    }
  }

  _buildTrackVisual(cell: CellData, pieceId: PieceId): void {
    const pos = cellToWorld(cell.col, cell.row, this.cols, this.rows)

    let group: THREE.Group
    switch (pieceId) {
      case 'STRAIGHT_NS': group = tileRegistry.get('STRAIGHT').build(pos, 0);             break
      case 'STRAIGHT_EW': group = tileRegistry.get('STRAIGHT').build(pos, Math.PI / 2);  break
      case 'CURVE_NE':    group = tileRegistry.get('CURVE').build(pos, 0);                break
      case 'CURVE_SE':    group = tileRegistry.get('CURVE').build(pos, -Math.PI / 2);    break
      case 'CURVE_SW':    group = tileRegistry.get('CURVE').build(pos, Math.PI);          break
      case 'CURVE_NW':    group = tileRegistry.get('CURVE').build(pos, Math.PI / 2);     break
      default:            group = new THREE.Group(); break
    }

    this.railGroup.add(group)
    cell.trackMesh = group
  }

  showGhost(col: number, row: number, pieceId?: PieceId): void {
    this.hideGhost()
    const cell = this.getCell(col, row)
    if (!cell || cell.type === CELL.VOID) return

    const pos = cellToWorld(col, row, this.cols, this.rows)

    // Base highlight box (translucent)
    const geo = new THREE.BoxGeometry(CELL_SIZE - GAP + 0.05, CELL_H + 0.05, CELL_SIZE - GAP + 0.05)
    this.ghostMesh = new THREE.Mesh(geo, MAT_GHOST)
    this.ghostMesh.position.set(pos.x, -CELL_H / 2 + 0.05, pos.z)
    this.scene.add(this.ghostMesh)

    // Track preview if a piece is specified
    if (pieceId) {
      const ghostMat = new THREE.MeshLambertMaterial({
        color: 0xd4a843,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      })

      // Build track visual into a temporary cell, then clone with ghost material
      const tmpCell: CellData = { col, row, type: CELL.RAIL, trackPiece: pieceId, tileGroup: null }
      this._buildTrackVisual(tmpCell, pieceId)
      const trackGroup = tmpCell.trackMesh!
      // Remove from railGroup (was added by _buildTrackVisual)
      this.railGroup.remove(trackGroup)

      // Replace all materials with ghostMat
      trackGroup.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).material = ghostMat
        }
      })

      this.ghostTrackGroup = trackGroup
      this.ghostTrackGroup.position.y += 0.05
      this.scene.add(this.ghostTrackGroup)
    }
  }

  hideGhost(): void {
    if (this.ghostMesh) {
      this.scene.remove(this.ghostMesh)
      this.ghostMesh = null
    }
    if (this.ghostTrackGroup) {
      this.ghostTrackGroup.traverse((o) => {
        if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose()
      })
      this.scene.remove(this.ghostTrackGroup)
      this.ghostTrackGroup = null
    }
  }

  /** Show a hover highlight on the given cell (follows the cursor on mousemove). */
  showHover(col: number, row: number): void {
    const cell = this.getCell(col, row)
    if (!cell || cell.type === CELL.VOID) { this.hideHover(); return }
    const pos = cellToWorld(col, row, this.cols, this.rows)
    if (!this.hoverMesh) {
      const geo = new THREE.PlaneGeometry(CELL_SIZE - GAP, CELL_SIZE - GAP)
      this.hoverMesh = new THREE.Mesh(geo, this.hoverMat)
      this.hoverMesh.rotation.x = -Math.PI / 2
      this.scene.add(this.hoverMesh)
    }
    this.hoverMesh.position.set(pos.x, 0.02, pos.z)
  }

  hideHover(): void {
    if (this.hoverMesh) {
      this.scene.remove(this.hoverMesh)
      this.hoverMesh.geometry.dispose()
      this.hoverMesh = null
    }
  }

  updateHover(time: number): void {
    this.hoverMat.uniforms.time.value = time
  }

  updateColors(): void {
    MAT_GHOST.color.set(Settings.colors.ghost)
    tileRegistry.updateColors(Settings.colors)
  }

  // ── Coin system (delegates to CoinSystem) ────────────────────────────────

  get totalCoins(): number { return this.coins.totalCoins }

  buildCoins(): Promise<void> {
    return this.coins.build(this.cells, this.cols, this.rows)
  }

  updateCoins(delta: number): void {
    this.coins.update(delta)
  }

  collectCoin(col: number, row: number, game: Game): boolean {
    const cell = this.getCell(col, row)
    if (!cell) return false
    return this.coins.collect(cell, game)
  }

  dispose(): void {
    this.coins.dispose()
    this.scene.remove(this.meshes)
    this.scene.remove(this.railGroup)
    this.hideGhost()
    this.hideHover()
  }
}
