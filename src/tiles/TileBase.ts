import type { Group, Vector3 } from 'three'

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
 *   2. Implement `id`, `label`, `preload()`, and `build()`.
 *   3. Register the instance in `src/tiles/index.ts`.
 *   Done — no other files need changing.
 */
export abstract class TileBase {
  abstract readonly id: string
  abstract readonly label: string

  /** Load and cache assets. Must be safe to call multiple times (idempotent). */
  abstract preload(): Promise<void>

  /**
   * Build a scene group for one instance of this tile.
   * @param position  World-space centre of the cell.
   * @param rotationY Y-axis rotation in radians (default 0).
   */
  abstract build(position: Vector3, rotationY?: number): Group
}
