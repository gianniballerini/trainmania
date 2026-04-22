import * as THREE from 'three'
import { loadModelAsset } from '../Assets.js'
import { type ColorsConfig } from '../Settings.js'
import { TileBase } from './TileBase.js'

export class StationTile extends TileBase {
  readonly id          = 'STATION'
  readonly label       = 'Station'
  readonly isPlaceable = false
  readonly isRendered  = true

  private model: THREE.Group | null = null
  private grassModel: THREE.Group | null = null

  async preload(): Promise<void> {
    if (this.model) return
    this.model = await loadModelAsset({
      modelUrl: '/assets/models/station.glb',
      targetFootprint: 2.0,
      castShadow: true,
      receiveShadow: true,
    })
    this.grassModel = await loadModelAsset({
      modelUrl: '/assets/models/block-grass-low-large.glb',
      targetFootprint: 2.0,
      yOffset: -0.5,
      castShadow: true,
      receiveShadow: true,
    })
  }

  build(position: THREE.Vector3, rotationY = 0): THREE.Group {
    if (!this.model) {
      throw new Error('StationTile: Model not preloaded!')
    }

    const group = new THREE.Group()
    group.position.set(position.x, 0, position.z)

    if (this.grassModel) {
      const grass = this.grassModel.clone()
      group.add(grass)
    }

    const instance = this.model.clone()
    instance.rotation.y = rotationY + Math.PI
    group.add(instance)

    return group
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateColors(_colors: ColorsConfig): void { /* station materials are not theme-aware */ }
}
