import * as THREE from 'three'
import { loadModelAsset, warnAssetLoadFailureOnce } from '../Assets.js'
import { Settings, type ColorsConfig } from '../Settings.js'
import { TileBase } from './TileBase.js'

export interface StationTileOptions {
  /** Optional GLB path. If omitted, uses procedural geometry. */
  modelUrl?: string
}

export class StationTile extends TileBase {
  readonly id          = 'STATION'
  readonly label       = 'Station'
  readonly isPlaceable = false
  readonly isRendered  = true

  private _model: THREE.Group | null = null
  private _loaded = false
  private readonly _modelUrl: string | null
  private readonly _baseMat = new THREE.MeshLambertMaterial({
    color: new THREE.Color(Settings.colors.station),
  })

  constructor(options: StationTileOptions = {}) {
    super()
    this._modelUrl = options.modelUrl ?? null
  }

  async preload(): Promise<void> {
    if (this._loaded) return
    this._loaded = true
    if (!this._modelUrl) return   // no GLB configured → use procedural fallback
    try {
      this._model = await loadModelAsset({ modelUrl: this._modelUrl, targetFootprint: 2.0 })
    } catch (err) {
      warnAssetLoadFailureOnce('station', this._modelUrl, err)
    }
  }

  /**
   * @param position  World-space cell centre.
   * @param rotationY Optional Y rotation (default 0).
   * @returns A `THREE.Group` with `userData.flag` set (for flag wave animation).
   */
  build(position: THREE.Vector3, rotationY = 0): THREE.Group {
    const group = new THREE.Group()
    group.position.set(position.x, 0, position.z)
    group.rotation.y = rotationY
    group.add(this.buildBaseBox(this._baseMat))

    if (this._model) {
      const clone = this._model.clone()
      group.add(clone)
      return group
    }

    // Procedural fallback (migrated from Station.ts)
    const roofGeo = new THREE.BoxGeometry(1.6, 0.1, 1.6)
    const roofMat = new THREE.MeshLambertMaterial({ color: 0xd4a843 })
    const roof = new THREE.Mesh(roofGeo, roofMat)
    roof.position.y = 0.8
    roof.castShadow = true
    group.add(roof)

    const pillarGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.8, 6)
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x5c3d2e })
    const pillarOffsets: [number, number][] = [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]
    pillarOffsets.forEach(([x, z]) => {
      const p = new THREE.Mesh(pillarGeo, pillarMat)
      p.position.set(x, 0.4, z)
      group.add(p)
    })

    const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6)
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x8b6040 })
    const pole = new THREE.Mesh(poleGeo, poleMat)
    pole.position.set(0.65, 1.2, -0.65)
    group.add(pole)

    const flagGeo = new THREE.PlaneGeometry(0.35, 0.22)
    const flagMat = new THREE.MeshLambertMaterial({ color: 0xc0522a, side: THREE.DoubleSide })
    const flag = new THREE.Mesh(flagGeo, flagMat)
    flag.position.set(0.83, 1.42, -0.65)
    group.add(flag)

    // Exposed for flag-wave animation in Game.ts
    group.userData.flag = flag

    return group
  }

  updateColors(colors: ColorsConfig): void {
    this._baseMat.color.set(colors.station)
  }
}
