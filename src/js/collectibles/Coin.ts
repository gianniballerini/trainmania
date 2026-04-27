import * as THREE from 'three'

const COIN_BOB_FREQ  = 2.5
const COIN_BOB_AMP   = 0.12
const COIN_SPIN_SPD  = 2.0

const COLLECT_DURATION = 0.4
const COLLECT_FLOAT    = 0.5
const COLLECT_SCALE    = 1.4

export class Coin {
  private _collected     = false
  private _collectElapsed = 0
  private _done          = false

  constructor(
    readonly group: THREE.Group,
    private readonly baseY: number,
  ) {}

  get isDone(): boolean { return this._done }

  update(time: number, delta: number): void {
    if (!this._collected) {
      this.group.position.y = this.baseY + Math.sin(time * COIN_BOB_FREQ) * COIN_BOB_AMP
      this.group.rotation.y += delta * COIN_SPIN_SPD
      return
    }

    this._collectElapsed += delta
    const t = Math.min(this._collectElapsed / COLLECT_DURATION, 1)

    this.group.scale.setScalar(1 + t * (COLLECT_SCALE - 1))
    this.group.position.y = this.baseY + t * COLLECT_FLOAT

    const opacity = 1 - t
    this.group.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        const mat = mesh.material as THREE.MeshLambertMaterial
        if (mat) mat.opacity = opacity
      }
    })

    if (t >= 1) this._done = true
  }

  collect(): void {
    if (this._collected) return
    this._collected = true
    // Clone materials before mutating so we don't affect other coins sharing
    // the same cached material instance.
    this.group.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh && mesh.material && !Array.isArray(mesh.material)) {
        const cloned = (mesh.material as THREE.MeshLambertMaterial).clone()
        cloned.transparent = true
        cloned.depthWrite = false
        mesh.material = cloned
      }
    })
  }

  removeFromScene(scene: THREE.Scene): void {
    scene.remove(this.group)
  }
}
