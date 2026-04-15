import * as THREE from 'three'
import { loadModelAsset, warnAssetLoadFailureOnce } from './Assets.js'
import { CELL, CellType, Direction, LevelDef, PieceId } from './Constants.js'

const TRACK_ASSET = {
  modelUrl: '/assets/models/track.glb',
  targetFootprint: 2.0,  // fill the cell
  yOffset: 0,
  rotationY: 0,
  castShadow: true,
  receiveShadow: true,
}

let trackModel: THREE.Group | null = null
let trackModelLoaded = false

const CELL_SIZE  = 2.0   // world units per cell
const CELL_H     = 0.5   // cube height
const GAP        = 0.06  // gap between cells

// Materials
const MAT = {
  floor:   new THREE.MeshLambertMaterial({ color: 0x7a9e6a }),   // moss green
  floor2:  new THREE.MeshLambertMaterial({ color: 0x6b8f5a }),   // alt moss
  rail:    new THREE.MeshLambertMaterial({ color: 0xc8a86a }),   // sandy track bed
  station: new THREE.MeshLambertMaterial({ color: 0xd4a843 }),   // gold
  start:   new THREE.MeshLambertMaterial({ color: 0x5a7aaa }),   // slate blue
  ghost:   new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false }),
}

// Rail track visual materials
const RAIL_MAT     = new THREE.MeshLambertMaterial({ color: 0x5c3d2e }) // dark brown sleepers
const RAIL_TIE_MAT = new THREE.MeshLambertMaterial({ color: 0x8b6040 }) // lighter wood ties
const RAIL_STEEL   = new THREE.MeshLambertMaterial({ color: 0xaaaaaa }) // steel rail

// Suppress unused warning – kept for potential future use
void RAIL_MAT

export async function loadTrackAssets(): Promise<void> {
  if (trackModelLoaded) return
  trackModelLoaded = true
  try {
    trackModel = await loadModelAsset(TRACK_ASSET)
  } catch (error) {
    warnAssetLoadFailureOnce('track model', TRACK_ASSET.modelUrl, error)
  }
}

export interface CellData {
  col: number
  row: number
  type: CellType
  trackPiece: PieceId | null
  mesh: THREE.Mesh | null
  trackMesh?: THREE.Group | null
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
  level: LevelDef
  cols: number
  rows: number
  cells: CellData[]
  meshes: THREE.Group
  railGroup: THREE.Group
  ghostMesh: THREE.Mesh | null
  ghostTrackGroup: THREE.Group | null

  constructor(scene: THREE.Scene, levelDef: LevelDef) {
    this.scene     = scene
    this.level     = levelDef
    this.cols      = levelDef.grid[0].length
    this.rows      = levelDef.grid.length
    this.cells     = []
    this.meshes    = new THREE.Group()
    this.railGroup = new THREE.Group()
    this.ghostMesh = null
    this.ghostTrackGroup = null

    scene.add(this.meshes)
    scene.add(this.railGroup)

    this._buildTerrain()
  }

  _buildTerrain(): void {
    const { grid, stationPos, trainStart } = this.level
    const geo = new THREE.BoxGeometry(
      CELL_SIZE - GAP,
      CELL_H,
      CELL_SIZE - GAP
    )

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const raw = grid[row][col]
        const isVoid        = raw === 'V'
        const isPrebuiltRail = raw === 'R'
        const isStation     = stationPos[0] === col && stationPos[1] === row
        const isStart       = trainStart[0] === col && trainStart[1] === row

        const type: CellType = isVoid ? CELL.VOID
                             : isStation ? CELL.STATION
                             : isStart   ? CELL.START
                             : isPrebuiltRail ? CELL.RAIL
                             : CELL.FLOOR

        const cell: CellData = {
          col, row, type,
          trackPiece: isPrebuiltRail ? 'STRAIGHT_NS' : null,
          mesh: null,
        }
        this.cells.push(cell)

        if (isVoid) continue

        const mat = isStation ? MAT.station
                  : isStart   ? MAT.start
                  : isPrebuiltRail ? MAT.rail
                  : (col + row) % 2 === 0 ? MAT.floor : MAT.floor2

        const mesh = new THREE.Mesh(geo, mat)
        mesh.castShadow    = true
        mesh.receiveShadow = true

        const pos = cellToWorld(col, row, this.cols, this.rows)
        mesh.position.set(pos.x, -CELL_H / 2, pos.z)
        mesh.userData = { col, row }

        this.meshes.add(mesh)
        cell.mesh = mesh

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
    if (!cell || cell.type === CELL.VOID) return false
    if (cell.trackPiece) this._removeTrackVisual(cell)
    cell.trackPiece = pieceId
    cell.type = CELL.RAIL
    this._buildTrackVisual(cell, pieceId)
    return true
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
    const group = new THREE.Group()
    group.position.set(pos.x, 0.02, pos.z)

    const TW = CELL_SIZE * 0.7  // track width region
    const RAIL_W  = 0.08
    const RAIL_H  = 0.06
    const TIE_W   = 0.12
    const TIE_H   = 0.04
    const TIE_L   = CELL_SIZE * 0.36

    const addStraightNS = () => {
      if (trackModel) {
        const clone = trackModel.clone()
        clone.rotation.y = 0
        group.add(clone)
        return
      }
      // Fallback: procedural rails
      const railGeo = new THREE.BoxGeometry(RAIL_W, RAIL_H, TW)
      const r1 = new THREE.Mesh(railGeo, RAIL_STEEL)
      r1.position.set(-CELL_SIZE * 0.13, RAIL_H / 2, 0)
      const r2 = r1.clone()
      r2.position.set( CELL_SIZE * 0.13, RAIL_H / 2, 0)
      group.add(r1, r2)

      // Ties
      const tieGeo = new THREE.BoxGeometry(TIE_L, TIE_H, TIE_W * 0.5)
      for (let i = -2; i <= 2; i++) {
        const t = new THREE.Mesh(tieGeo, RAIL_TIE_MAT)
        t.position.set(0, TIE_H / 2, i * (TW / 5))
        group.add(t)
      }
    }

    const addStraightEW = () => {
      if (trackModel) {
        const clone = trackModel.clone()
        clone.rotation.y = Math.PI / 2
        group.add(clone)
        return
      }
      // Fallback: procedural rails
      const railGeo = new THREE.BoxGeometry(TW, RAIL_H, RAIL_W)
      const r1 = new THREE.Mesh(railGeo, RAIL_STEEL)
      r1.position.set(0, RAIL_H / 2, -CELL_SIZE * 0.13)
      const r2 = r1.clone()
      r2.position.set(0, RAIL_H / 2,  CELL_SIZE * 0.13)
      group.add(r1, r2)

      const tieGeo = new THREE.BoxGeometry(TIE_W * 0.5, TIE_H, TIE_L)
      for (let i = -2; i <= 2; i++) {
        const t = new THREE.Mesh(tieGeo, RAIL_TIE_MAT)
        t.position.set(i * (TW / 5), TIE_H / 2, 0)
        group.add(t)
      }
    }

    // Approximate curves with 3-segment polyline rails
    const addCurve = (fromDir: Direction, toDir: Direction) => {
      const dirVec: Record<Direction, [number, number]> = {
        N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0],
      }
      const s = CELL_SIZE / 2

      const [ex, ez]   = dirVec[fromDir]
      const [ex2, ez2] = dirVec[toDir]

      // Offset for two rails
      const OFFSETS = [-0.13, 0.13]
      OFFSETS.forEach(off => {
        // Perpendicular to entry direction
        const perpEntry: [number, number] = [ez * off, ex * off]    // rotate 90°
        const perpExit:  [number, number] = [ez2 * off, ex2 * off]

        const pts = [
          new THREE.Vector3((ex * s) + perpEntry[0] * CELL_SIZE, RAIL_H, (ez * s) + perpEntry[1] * CELL_SIZE),
          new THREE.Vector3(perpEntry[0] * CELL_SIZE * 0.5, RAIL_H, perpEntry[1] * CELL_SIZE * 0.5),
          new THREE.Vector3(perpExit[0] * CELL_SIZE * 0.5, RAIL_H, perpExit[1] * CELL_SIZE * 0.5),
          new THREE.Vector3((ex2 * s) + perpExit[0] * CELL_SIZE, RAIL_H, (ez2 * s) + perpExit[1] * CELL_SIZE),
        ]

        const curve = new THREE.CatmullRomCurve3(pts)
        const tubeGeo = new THREE.TubeGeometry(curve, 8, RAIL_W / 2, 4, false)
        group.add(new THREE.Mesh(tubeGeo, RAIL_STEEL))
      })

      // A few ties along the curve
      for (let i = 0; i <= 3; i++) {
        const t = i / 3
        const cx = (ex * s) * (1 - t) + (ex2 * s) * t
        const cz = (ez * s) * (1 - t) + (ez2 * s) * t
        const tieGeo = new THREE.BoxGeometry(TIE_L * 0.8, TIE_H, TIE_W * 0.5)
        const tie = new THREE.Mesh(tieGeo, RAIL_TIE_MAT)
        tie.position.set(cx * 0.5, TIE_H / 2, cz * 0.5)
        group.add(tie)
      }
    }

    switch (pieceId) {
      case 'STRAIGHT_NS': addStraightNS(); break
      case 'STRAIGHT_EW': addStraightEW(); break
      case 'CURVE_NE':    addCurve('N', 'E'); break
      case 'CURVE_NW':    addCurve('N', 'W'); break
      case 'CURVE_SE':    addCurve('S', 'E'); break
      case 'CURVE_SW':    addCurve('S', 'W'); break
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
    this.ghostMesh = new THREE.Mesh(geo, MAT.ghost)
    this.ghostMesh.position.set(pos.x, -CELL_H / 2, pos.z)
    this.scene.add(this.ghostMesh)

    // Track preview if a piece is specified
    if (pieceId) {
      const ghostMat = new THREE.MeshLambertMaterial({
        color: 0xd4a843,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })

      // Build track visual into a temporary cell, then clone with ghost material
      const tmpCell: CellData = { col, row, type: CELL.RAIL, trackPiece: pieceId, mesh: null }
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

  dispose(): void {
    this.scene.remove(this.meshes)
    this.scene.remove(this.railGroup)
    this.hideGhost()
  }
}
