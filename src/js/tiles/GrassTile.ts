import * as THREE from 'three'
import { loadModelAsset } from '../Assets.js'
import { type ColorsConfig } from '../Settings.js'
import { TileBase } from './TileBase.js'

export class GrassTile extends TileBase {
  readonly id          = 'GRASS'
  readonly label       = 'Grass'
  readonly isPlaceable = true
  readonly isRendered  = true

  private model: THREE.Group | null = null

  async preload(): Promise<void> {
    if (!this.model) {
      this.model = await loadModelAsset({
        modelUrl: '/assets/models/block-grass-low-large.glb',
        targetFootprint: 2.0,
        yOffset: -0.5,
        castShadow: true,
        receiveShadow: true,
      })
    }
  }

  build(position: THREE.Vector3, rotationY = 0): THREE.Group {
    if (!this.model) {
      throw new Error('GrassTile: Model not preloaded!')
    }

    const group = new THREE.Group()
    group.position.set(position.x, 0, position.z)

    const instance = this.model.clone()
    instance.rotation.y = rotationY
    group.add(instance)

    return group
  }

  updateColors(colors: ColorsConfig): void {
    if (!this.model) return
    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshLambertMaterial) {
        child.material.color.set(colors.floor)
      }
    })
  }
}
