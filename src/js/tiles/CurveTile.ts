import * as THREE from 'three'
import { loadModelAsset, warnAssetLoadFailureOnce } from '../Assets.js'
import { TileBase } from './TileBase.js'

const CELL_SIZE = 2.0
const RAIL_W    = 0.08
const RAIL_H    = 0.06
const TIE_W     = 0.12
const TIE_H     = 0.04
const TIE_L     = CELL_SIZE * 0.36

const STEEL_MAT = new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
const TIE_MAT   = new THREE.MeshLambertMaterial({ color: 0x8b6040 })

const MODEL_OPTIONS = {
  modelUrl: '/assets/models/track_curve_03.glb',
  targetFootprint: 2.0,
  yOffset: 0,
  rotationY: 0,
  castShadow: true,
  receiveShadow: true,
}

// Rotation to apply for each curve variant (model base orientation = NE at rotY=0)
export const CURVE_ROTATION: Record<string, number> = {
  NE:  0,
  EN:  0,
  SE: -Math.PI / 2,
  ES: -Math.PI / 2,
  SW:  Math.PI,
  WS:  Math.PI,
  NW:  Math.PI / 2,
  WN:  Math.PI / 2,
}

export class CurveTile extends TileBase {
  readonly id    = 'CURVE'
  readonly label = 'Curve'

  private _model: THREE.Group | null = null
  private _loaded = false

  async preload(): Promise<void> {
    if (this._loaded) return
    this._loaded = true
    try {
      this._model = await loadModelAsset(MODEL_OPTIONS)
    } catch (err) {
      warnAssetLoadFailureOnce('curve track', MODEL_OPTIONS.modelUrl, err)
    }
  }

  /**
   * @param position  World-space cell centre.
   * @param rotationY Rotation from CURVE_ROTATION (0=NE, −π/2=SE, π=SW, π/2=NW)
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

    // Procedural fallback — NE base orientation wrapped in a rotated sub-group.
    // fromDir=N [0,-1], toDir=E [1,0]
    const sub = new THREE.Group()
    sub.rotation.y = rotationY

    const s = CELL_SIZE / 2
    const OFFSETS = [-0.13, 0.13]

    OFFSETS.forEach(off => {
      const perpEntry: [number, number] = [-off, 0]   // perp to N: [ez*off, ex*off] = [-1*off, 0]
      const perpExit:  [number, number] = [0, off]    // perp to E: [ez2*off, ex2*off] = [0*off, 1*off]

      const pts = [
        new THREE.Vector3(perpEntry[0] * CELL_SIZE,        RAIL_H, -s + perpEntry[1] * CELL_SIZE),
        new THREE.Vector3(perpEntry[0] * CELL_SIZE * 0.5,  RAIL_H,      perpEntry[1] * CELL_SIZE * 0.5),
        new THREE.Vector3(perpExit[0]  * CELL_SIZE * 0.5,  RAIL_H,      perpExit[1]  * CELL_SIZE * 0.5),
        new THREE.Vector3(s + perpExit[0] * CELL_SIZE,     RAIL_H,      perpExit[1]  * CELL_SIZE),
      ]

      const curve  = new THREE.CatmullRomCurve3(pts)
      const tubeGeo = new THREE.TubeGeometry(curve, 8, RAIL_W / 2, 4, false)
      sub.add(new THREE.Mesh(tubeGeo, STEEL_MAT))
    })

    for (let i = 0; i <= 3; i++) {
      const t  = i / 3
      const cx = s * t          // ex*s*(1-t) + ex2*s*t = 0 + s*t
      const cz = -s * (1 - t)   // ez*s*(1-t) + ez2*s*t = -s*(1-t) + 0
      const tieGeo = new THREE.BoxGeometry(TIE_L * 0.8, TIE_H, TIE_W * 0.5)
      const tie = new THREE.Mesh(tieGeo, TIE_MAT)
      tie.position.set(cx * 0.5, TIE_H / 2, cz * 0.5)
      sub.add(tie)
    }

    group.add(sub)
    return group
  }
}
