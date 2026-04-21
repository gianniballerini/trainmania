import * as THREE from 'three'
import { loadModelAsset, warnAssetLoadFailureOnce } from '../Assets.js'
import type { ColorsConfig } from '../Settings.js'
import { TileBase } from './TileBase.js'

const MODEL_OPTIONS = {
  modelUrl: '/assets/models/track.glb',
  targetFootprint: 2.0,
  yOffset: 0,
  rotationY: 0,
  castShadow: true,
  receiveShadow: true,
}

export class StraightTile extends TileBase {
  readonly id          = 'STRAIGHT'
  readonly label       = 'Straight'
  readonly isPlaceable = true
  readonly isRendered  = false  // track-overlay only; no terrain base box

  private _model: THREE.Group | null = null
  private _loaded = false

  async preload(): Promise<void> {
    if (this._loaded) return
    this._loaded = true
    try {
      this._model = await loadModelAsset(MODEL_OPTIONS)
    } catch (err) {
      warnAssetLoadFailureOnce('straight track', MODEL_OPTIONS.modelUrl, err)
    }
  }

  /**
   * @param position  World-space cell centre.
   * @param rotationY 0 = N↔S, Math.PI/2 = E↔W
   */
  build(position: THREE.Vector3, rotationY = 0): THREE.Group {
    const group = new THREE.Group()
    group.position.set(position.x, 0.02, position.z)

    if (this._model) {
      const clone = this._model.clone()
      clone.rotation.y = rotationY
      group.add(clone)
    }

    return group
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  updateColors(_colors: ColorsConfig): void { /* track materials are not theme-aware */ }
}
