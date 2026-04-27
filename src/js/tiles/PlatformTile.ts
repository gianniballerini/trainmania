import * as THREE from 'three'
import { loadModelAsset } from '../Assets.js'
import { type ColorsConfig } from '../Settings.js'
import { TileBase } from './TileBase.js'

const FALL_DURATION = 0.6
const FALL_DISTANCE = 2.5
const FALL_DELAY    = 2.0

interface FallingEntry {
  group: THREE.Group
  trackMesh: THREE.Group | null
  elapsed: number
  delay: number
}

export class PlatformTile extends TileBase {
  readonly id          = 'PLATFORM'
  readonly label       = 'Platform'
  readonly isPlaceable = true
  readonly isRendered  = true

  private model: THREE.Group | null = null
  private _falling: FallingEntry[] = []

  async preload(): Promise<void> {
    if (!this.model) {
      this.model = await loadModelAsset({
        modelUrl: '/assets/models/platform.glb',
        targetFootprint: 2.0,
        yOffset: -0.5,
        castShadow: true,
        receiveShadow: true,
      })
    }
  }

  build(position: THREE.Vector3, rotationY = 0): THREE.Group {
    if (!this.model) {
      throw new Error('PlatformTile: Model not preloaded!')
    }

    const group = new THREE.Group()
    group.position.set(position.x, 0, position.z)

    const instance = this.model.clone()
    instance.rotation.y = rotationY
    group.add(instance)

    return group
  }

  fall(group: THREE.Group, trackMesh: THREE.Group | null): void {
    this._falling.push({ group, trackMesh, elapsed: 0, delay: FALL_DELAY })

  }

  update(delta: number): void {
    this._falling = this._falling.filter(entry => {
      if (entry.delay > 0) {
        entry.delay -= delta
        if (entry.delay <= 0) {
          entry.trackMesh?.removeFromParent()
          entry.trackMesh = null
        }
        return true
      }
      entry.elapsed += delta
      const t = Math.min(entry.elapsed / FALL_DURATION, 1)
      entry.group.position.y = -t * FALL_DISTANCE
      if (t >= 1) {
        entry.group.removeFromParent()
        return false
      }
      return true
    })
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
