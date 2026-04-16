import * as THREE from 'three'
import { loadModelAsset } from './Assets.js'

type KeyName = 'W' | 'A' | 'S' | 'D'

interface KeyState {
  group: THREE.Group
  meshes: THREE.Mesh[]
  baseY: number
  targetY: number
}

const GOLD_EMISSIVE      = new THREE.Color(0xd4a017)
const GOLD_EMISSIVE_INT  = 1.2
const DEFAULT_EMISSIVE   = new THREE.Color(0x000000)

const PRESS_DEPTH = 0.06
const LERP_SPEED  = 18   // units per second — fast spring-back

/** Positions in X/Z for WASD layout (W sits above ASD row). */
const KEY_LAYOUT: Record<KeyName, { pos: [number, number]; model: string }> = {
  W: { pos: [0.45, -0.45], model: '/assets/models/w_key.glb' },
  A: { pos: [0,     0],    model: '/assets/models/a_key.glb' },
  S: { pos: [0.45,  0],    model: '/assets/models/s_key.glb' },
  D: { pos: [0.9,   0],    model: '/assets/models/d_key.glb' },
}

export class KeyboardHUD {
  private scene    = new THREE.Scene()
  private camera: THREE.PerspectiveCamera
  private keys     = new Map<KeyName, KeyState>()

  // Viewport metrics (recomputed on resize)
  private vpSize   = 200
  private vpPad    = 32
  private vpLeft   = 0
  private vpBottom = 0

  constructor() {
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50)
    this.camera.position.set(0.45, 1.8, 1.6)
    this.camera.lookAt(0.45, 0, -0.1)

    // Rect area light — pointing down from y=5
    const rectLight = new THREE.RectAreaLight(0xffeedd, 4, 6, 6)
    rectLight.position.set(0, 5, 0)
    rectLight.rotation.x = -Math.PI / 2
    this.scene.add(rectLight)

    this.computeViewport()
  }

  async load(): Promise<void> {
    const names: KeyName[] = ['W', 'A', 'S', 'D']

    // Load all four instances in parallel, each with its own model
    const groups = await Promise.all(
      names.map((name) =>
        loadModelAsset({
          modelUrl: KEY_LAYOUT[name].model,
          targetFootprint: 0.4,
          castShadow: false,
          receiveShadow: false,
        })
      )
    )

    for (let i = 0; i < names.length; i++) {
      const name  = names[i]
      const group = groups[i]
      const [x, z] = KEY_LAYOUT[name].pos
      group.position.set(x, 0, z)

      const meshes: THREE.Mesh[] = []
      group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) meshes.push(child as THREE.Mesh)
      })

      this.scene.add(group)
      this.keys.set(name, { group, meshes, baseY: 0, targetY: 0 })
    }
  }

  pressKey(key: KeyName): void {
    const k = this.keys.get(key)
    if (!k) return
    k.targetY = k.baseY - PRESS_DEPTH
    this.setEmissive(k, GOLD_EMISSIVE, GOLD_EMISSIVE_INT)
  }

  releaseKey(key: KeyName): void {
    const k = this.keys.get(key)
    if (!k) return
    k.targetY = k.baseY
    this.setEmissive(k, DEFAULT_EMISSIVE, 0)
  }

  private setEmissive(k: KeyState, color: THREE.Color, intensity: number): void {
    for (const mesh of k.meshes) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      for (const mat of mats) {
        const m = mat as THREE.MeshStandardMaterial
        if (m.emissive !== undefined) {
          m.emissive.copy(color)
          m.emissiveIntensity = intensity
        }
      }
    }
  }

  update(delta: number): void {
    for (const k of this.keys.values()) {
      const diff = k.targetY - k.group.position.y
      if (Math.abs(diff) < 0.001) {
        k.group.position.y = k.targetY
      } else {
        k.group.position.y += diff * Math.min(1, LERP_SPEED * delta)
      }
    }
  }

  /** Render the HUD on top of the main scene via scissor/viewport. */
  render(renderer: THREE.WebGLRenderer): void {
    // Preserve renderer state
    const autoClear = renderer.autoClear
    renderer.autoClear = false

    renderer.setScissorTest(true)
    renderer.setScissor(this.vpLeft, this.vpBottom, this.vpSize, this.vpSize)
    renderer.setViewport(this.vpLeft, this.vpBottom, this.vpSize, this.vpSize)
    renderer.clearDepth()
    renderer.render(this.scene, this.camera)

    // Restore
    renderer.setScissorTest(false)
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight)
    renderer.autoClear = autoClear
  }

  /** Recompute viewport position (call on window resize). */
  resize(): void {
    this.computeViewport()
  }

  private computeViewport(): void {
    // bottom-left corner, with padding
    this.vpLeft   = this.vpPad
    this.vpBottom = this.vpPad
  }
}
