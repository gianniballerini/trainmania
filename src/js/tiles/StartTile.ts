import * as THREE from 'three'
import { Settings, type ColorsConfig } from '../Settings.js'
import { TileBase } from './TileBase.js'

export class StartTile extends TileBase {
  readonly id        = 'START'
  readonly label     = 'Start'
  readonly isPlaceable = true
  readonly isRendered  = true

  private readonly mat = new THREE.MeshLambertMaterial({
    color: new THREE.Color(Settings.colors.start),
  })

  async preload(): Promise<void> { /* no assets */ }

  build(position: THREE.Vector3): THREE.Group {
    const group = new THREE.Group()
    group.position.set(position.x, 0, position.z)
    group.add(this.buildBaseBox(this.mat))
    return group
  }

  updateColors(colors: ColorsConfig): void {
    this.mat.color.set(colors.start)
  }
}
