import * as THREE from 'three'
import { loadModelAsset, warnAssetLoadFailureOnce } from '../Assets.js'
import { TileBase } from './TileBase.js'

const CELL_SIZE = 2.0
const TW        = CELL_SIZE * 0.7
const RAIL_W    = 0.08
const RAIL_H    = 0.06
const TIE_W     = 0.12
const TIE_H     = 0.04
const TIE_L     = CELL_SIZE * 0.36

const STEEL_MAT   = new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
const TIE_MAT     = new THREE.MeshLambertMaterial({ color: 0x8b6040 })

const MODEL_OPTIONS = {
  modelUrl: '/assets/models/track.glb',
  targetFootprint: 2.0,
  yOffset: 0,
  rotationY: 0,
  castShadow: true,
  receiveShadow: true,
}

export class StraightTile extends TileBase {
  readonly id    = 'STRAIGHT'
  readonly label = 'Straight'

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
      return group
    }

    // Procedural fallback — build NS orientation, wrap in a rotated sub-group
    const sub = new THREE.Group()
    sub.rotation.y = rotationY

    const railGeo = new THREE.BoxGeometry(RAIL_W, RAIL_H, TW)
    const r1 = new THREE.Mesh(railGeo, STEEL_MAT)
    r1.position.set(-CELL_SIZE * 0.13, RAIL_H / 2, 0)
    const r2 = r1.clone()
    r2.position.set(CELL_SIZE * 0.13, RAIL_H / 2, 0)
    sub.add(r1, r2)

    const tieGeo = new THREE.BoxGeometry(TIE_L, TIE_H, TIE_W * 0.5)
    for (let i = -2; i <= 2; i++) {
      const t = new THREE.Mesh(tieGeo, TIE_MAT)
      t.position.set(0, TIE_H / 2, i * (TW / 5))
      sub.add(t)
    }

    group.add(sub)
    return group
  }
}
