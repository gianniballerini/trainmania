import * as THREE from 'three'
import { CELL_H, CELL_SIZE, GAP } from '../Constants.js'
import type { ColorsConfig } from '../Settings.js'

/**
 * Base class for all tile types.
 *
 * Lifecycle:
 *   1. `preload()` — called once during the loading screen; loads and caches
 *      the GLB (or other assets). Must be idempotent.
 *   2. `build(position, rotationY?)` — called synchronously whenever a tile
 *      instance is placed on the grid. Assumes `preload()` has resolved.
 *      Returns a `THREE.Group` ready to be added to the scene.
 *
 * Adding a new tile type:
 *   1. Create `src/tiles/MyTile.ts` extending `TileBase`.
 *   2. Implement `id`, `label`, `isPlaceable`, `isRendered`, `preload()`, `build()`, and `updateColors()`.
 *   3. Register the instance in `src/tiles/index.ts`.
 *   Done — no other files need changing.
 */
export abstract class TileBase {
  abstract readonly id: string
  abstract readonly label: string

  /** Whether a track piece can be placed on this tile type. */
  abstract readonly isPlaceable: boolean

  /** Whether this tile produces visible geometry. VOID tiles return false. */
  abstract readonly isRendered: boolean

  /** Load and cache assets. Must be safe to call multiple times (idempotent). */
  abstract preload(): Promise<void>

  /**
   * Build a scene group for one instance of this tile.
   * The group position should be set to the world-space cell centre.
   * @param position  World-space centre of the cell.
   * @param rotationY Y-axis rotation in radians (default 0).
   */
  abstract build(position: THREE.Vector3, rotationY?: number): THREE.Group

  /** Update tile materials to match new color settings. */
  abstract updateColors(colors: ColorsConfig): void

  /**
   * Build a standard base box for terrain tiles.
   * The returned mesh uses local-space offset so it sits flush with the
   * ground plane when the parent group is at Y=0.
   */
  protected buildBaseBox(mat: THREE.Material): THREE.Mesh {
    const geo = new THREE.BoxGeometry(CELL_SIZE - GAP, CELL_H, CELL_SIZE - GAP)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.position.set(0, -CELL_H / 2, 0)
    return mesh
  }
}
