import * as THREE from 'three'

const PUFF_COUNT = 18

interface Puff {
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
  life: number
  maxLife: number
  vel: THREE.Vector3
}

export class SmokeSystem {
  scene: THREE.Scene
  puffs: Puff[]
  timer: number
  interval: number

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
      this.puffs.push({ mesh: m, life: 0, maxLife: 0, vel: new THREE.Vector3() })
    }
  }

  _emit(worldPos: THREE.Vector3): void {
    const puff = this.puffs.find(p => !p.mesh.visible)
    if (!puff) return
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
  }

  update(delta: number, trainGroup: THREE.Group | undefined, active: boolean): void {
    if (!active || !trainGroup) return

    // Emit
    this.timer += delta
    if (this.timer >= this.interval) {
      this.timer = 0
      // Stack world position
      const stackPos = new THREE.Vector3(0, 0.86, -0.38)
      stackPos.applyMatrix4(trainGroup.matrixWorld)
      this._emit(stackPos)
    }

    // Update puffs
    this.puffs.forEach(p => {
      if (!p.mesh.visible) return
      p.life += delta
      const t = p.life / p.maxLife
      if (t >= 1) { p.mesh.visible = false; return }

      p.mesh.position.addScaledVector(p.vel, delta)
      p.mesh.scale.setScalar(0.5 + t * 1.4)
      p.mesh.material.opacity = (1 - t) * 0.45
    })
  }

  dispose(): void {
    this.puffs.forEach(p => this.scene.remove(p.mesh))
  }
}
