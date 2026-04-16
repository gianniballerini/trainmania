import * as THREE from 'three'

const PUFF_COUNT = 32 // 18 smoke + up to 8 burst puffs with headroom

interface Puff {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  life: number
  maxLife: number
  vel: THREE.Vector3
  isBurst: boolean
}

export class SmokeSystem {
  scene: THREE.Scene
  puffs: Puff[]
  timer: number
  interval: number
  private _tmpVec = new THREE.Vector3()

  constructor(scene: THREE.Scene) {
    this.scene    = scene
    this.puffs    = []
    this.timer    = 0
    this.interval = 0.22

    const geo = new THREE.SphereGeometry(0.09, 4, 4)
    const mat = new THREE.MeshBasicMaterial({
      color: 0xccbbaa,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    })

    for (let i = 0; i < PUFF_COUNT; i++) {
      const m = new THREE.Mesh(geo, mat.clone())
      m.visible = false
      scene.add(m)
      this.puffs.push({ mesh: m, life: 0, maxLife: 0, vel: new THREE.Vector3(), isBurst: false })
    }
  }

  _emit(worldPos: THREE.Vector3): void {
    const puff = this.puffs.find(p => !p.mesh.visible)
    if (!puff) return
    puff.isBurst = false
    puff.mesh.visible = true
    puff.mesh.position.copy(worldPos)
    puff.mesh.scale.setScalar(0.5 + Math.random() * 0.5)
    puff.maxLife = 1.2 + Math.random() * 0.6
    puff.life    = 0
    puff.vel.set(
      (Math.random() - 0.5) * 0.4,
      1.2 + Math.random() * 0.6,
      (Math.random() - 0.5) * 0.4
    )
    puff.mesh.material.color.setHex(0xccbbaa)
  }

  emitBurst(worldPos: THREE.Vector3, count = 8): void {
    for (let i = 0; i < count; i++) {
      const puff = this.puffs.find(p => !p.mesh.visible)
      if (!puff) return
      const angle = (i / count) * Math.PI * 2
      const speed = 1.0 + Math.random() * 1.2
      puff.isBurst = true
      puff.mesh.visible = true
      // Spread start positions slightly without allocating — reuse _tmpVec
      this._tmpVec.set(
        (Math.random() - 0.5) * 0.3,
        Math.random() * 0.2,
        (Math.random() - 0.5) * 0.3
      )
      puff.mesh.position.copy(worldPos).add(this._tmpVec)
      puff.mesh.scale.setScalar(0.4 + Math.random() * 0.4)
      puff.maxLife = 0.5 + Math.random() * 0.4
      puff.life    = 0
      puff.vel.set(
        Math.cos(angle) * speed,
        1.5 + Math.random() * 1.0,
        Math.sin(angle) * speed
      )
      puff.mesh.material.color.setHex(0xddaa88)
      puff.mesh.material.opacity = 0.7
    }
  }

  update(delta: number, trainGroup: THREE.Group | undefined, active: boolean): void {
    // Emit train smoke only when active
    if (active && trainGroup) {
      this.timer += delta
      if (this.timer >= this.interval) {
        this.timer = 0
        // Stack world position
        const stackPos = new THREE.Vector3(0, 0.86, -0.38)
        stackPos.applyMatrix4(trainGroup.matrixWorld)
        this._emit(stackPos)
      }
    }

    // Update all visible puffs (including burst puffs that persist after game ends)
    this.puffs.forEach(p => {
      if (!p.mesh.visible) return
      p.life += delta
      const t = p.life / p.maxLife
      if (t >= 1) { p.mesh.visible = false; return }

      p.mesh.position.addScaledVector(p.vel, delta)

      if (p.isBurst) {
        // Smoothstep easing: fast pop then ease off — mirrors InterpolateSmooth from keyframe tracks
        const ease = t * t * (3 - 2 * t)
        p.mesh.scale.setScalar(0.4 + ease * 1.8)
        p.mesh.material.opacity = (1 - ease) * 0.65
      } else {
        p.mesh.scale.setScalar(0.5 + t * 1.4)
        p.mesh.material.opacity = (1 - t) * 0.45
      }
    })
  }

  dispose(): void {
    this.puffs.forEach(p => this.scene.remove(p.mesh))
  }
}
