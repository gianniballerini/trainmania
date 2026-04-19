import * as THREE from 'three'
import { CELL, CellType, PieceId } from './Constants.js'
import type { Level } from './levels/Level.js'
import hoverFrag from './shaders/hover.frag.glsl?raw'
import hoverVert from './shaders/hover.vert.glsl?raw'
import { tileRegistry } from './tiles/index.js'

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
  rock:    new THREE.MeshLambertMaterial({ color: 0x8a7a6a }),   // grey-brown rock base
  ghost:   new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false }),
}

export interface CellData {
  col: number
  row: number
  type: CellType
  trackPiece: PieceId | null
  mesh: THREE.Mesh | null
  trackMesh?: THREE.Group | null
  prebuilt?: boolean
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
        const gridCell     = grid[row][col]
        const isVoid        = gridCell.type === CELL.VOID
        const isPrebuiltRail = gridCell.type === CELL.RAIL
        const isRock        = gridCell.type === CELL.ROCK
        const isStation     = stationPos[0] === col && stationPos[1] === row
        const isStart       = trainStart[0] === col && trainStart[1] === row

        const type: CellType = isVoid ? CELL.VOID
                             : isStation ? CELL.STATION
                             : isStart   ? CELL.START
                             : isPrebuiltRail ? CELL.RAIL
                             : isRock    ? CELL.ROCK
                             : CELL.FLOOR

        const cell: CellData = {
          col, row, type,
          trackPiece: isPrebuiltRail ? (gridCell.prebuiltPiece ?? null) : null,
          mesh: null,
          prebuilt: isPrebuiltRail,
        }
        this.cells.push(cell)

        if (isVoid) continue

        const mat = isStation ? MAT.station
                  : isStart   ? MAT.start
                  : isPrebuiltRail ? MAT.rail
                  : isRock    ? MAT.rock
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

        if (isRock && tileRegistry.has('ROCK')) {
          const rockGroup = tileRegistry.get('ROCK').build(pos)
          this.meshes.add(rockGroup)
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
    if (!this._trackPlaceable(col, row)) return false
    if (cell.trackPiece) this._removeTrackVisual(cell)
    cell.trackPiece = pieceId
    cell.type = CELL.RAIL
    this._buildTrackVisual(cell, pieceId)
    return true
  }

  removeTrack(col: number, row: number): boolean {
    const cell = this.getCell(col, row)
    if (!cell || !cell.trackPiece || cell.prebuilt) return false
    if (cell.type === CELL.STATION || cell.type === CELL.START) return false
    this._removeTrackVisual(cell)
    cell.trackPiece = null
    cell.type = CELL.FLOOR
    return true
  }

  _trackPlaceable(col: number, row: number): boolean {
    const cell = this.getCell(col, row)
    if (!cell) return false
    switch (cell.type) {
      case CELL.VOID:
      case CELL.STATION:
      case CELL.START:
      case CELL.ROCK:
        return false
      default:
        return true
    }
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

  dispose(): void {
    this.scene.remove(this.meshes)
    this.scene.remove(this.railGroup)
    this.hideGhost()
    this.hideHover()
  }
}
