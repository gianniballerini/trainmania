import { Group, Vector3 } from 'three'
import { loadModelAsset } from '../Assets.js'
import { TileBase } from './TileBase.js'

export class RockTile extends TileBase {
  readonly id = 'ROCK'
  readonly label = 'Rock'

  private model: Group | null = null

  async preload(): Promise<void> {
    if (!this.model) {
      this.model = await loadModelAsset({
        modelUrl: '/assets/models/tile_rock.glb',
        targetFootprint: 2.0,
        yOffset: 0,
        castShadow: true,
        receiveShadow: true,
      })
    }
  }

  build(position: Vector3, rotationY = 0): Group {
    if (!this.model) {
      throw new Error('RockTile: Model not preloaded!')
    }

    const instance = this.model.clone()
    instance.position.copy(position)
    instance.rotation.y = rotationY
    return instance
  }
}
