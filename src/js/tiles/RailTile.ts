import * as THREE from 'three'
import type { ColorsConfig } from '../Settings.js'
import { TileBase } from './TileBase.js'

/**
 * Marker tile for cells that have a user-placed (or pre-built) rail.
 * No terrain geometry — the floor beneath is rendered separately.
 * Its sole job is to advertise `isPlaceable = true` so the tile registry
 * can answer placeability for RAIL cells without special-casing.
 */
export class RailTile extends TileBase {
  readonly id          = 'RAIL'
  readonly label       = 'Rail'
  readonly isPlaceable = true
  readonly isRendered  = false

  async preload(): Promise<void> { /* no assets */ }

  build(position: THREE.Vector3): THREE.Group {
    const group = new THREE.Group()
    group.position.set(position.x, 0, position.z)
    return group
  }

  updateColors(_colors: ColorsConfig): void { /* no materials */ }
}
