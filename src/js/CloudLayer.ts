import * as THREE from 'three'
import { Settings } from './Settings.js'
import cloudFrag from './shaders/cloud.frag.glsl?raw'
import cloudVert from './shaders/cloud.vert.glsl?raw'


// ─── CloudDetails ───────────────────────────────────────────────────────────

const CLOUD_DETAILS = [
    {
        url: '/images/clouds/cloud_1.png',
        original_size: {
            width: 524,
            height: 122
        },
      foot_print: 0.8,
    },
    {
        url: '/images/clouds/cloud_2.png',
        original_size: {
            width: 814,
            height: 164
        },
      foot_print: 1.0,
    },
    {
        url: '/images/clouds/cloud_3.png',
        original_size: {
            width: 680,
            height: 177
        },
      foot_print: 0.8,
    },
    {
        url: '/images/clouds/cloud_4.png',
        original_size: {
            width: 701,
            height: 170
        },
      foot_print: 0.8,
    },
    {
        url: '/images/clouds/cloud_5.png',
        original_size: {
            width: 242,
            height: 179
        },
      foot_print: 0.2,
    },
    {
        url: '/images/clouds/cloud_6.png',
        original_size: {
            width: 1184,
            height: 489
        },
      foot_print: 1,
    },
    {
        url: '/images/clouds/cloud_7.png',
        original_size: {
            width: 464,
            height: 234
        },
      foot_print: 0.8,
    }
]

// ─── Internal types ───────────────────────────────────────────────────────────

interface CloudInstance {
  mesh:    THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  textureIndex: number
  baseWidth: number
  baseHeight: number
  sizeT: number
  speedT: number
  verticalJitter: number
  direction: number
  coordX: number
  coordY: number
  depthOffsetT: number
}

// ─── Noise generation ─────────────────────────────────────────────────────────

/**
 * Generates a 256×256 canvas-based value-noise texture.
 * Uses a coarse 16×16 grid of random values with smoothstep interpolation so
 * the result looks organic rather than like pure white noise.
 */
function generateNoiseTexture(size = 256): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width  = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const GRID   = 16
  const stride = GRID + 1
  const grid: number[] = Array.from({ length: stride * stride }, () => Math.random())

  const smooth = (t: number): number => t * t * (3 - 2 * t) // smoothstep
  const lerp   = (a: number, b: number, t: number): number => a + (b - a) * smooth(t)

  const imageData = ctx.createImageData(size, size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * GRID
      const fy = (y / size) * GRID
      const ix = Math.floor(fx)
      const iy = Math.floor(fy)
      const tx = fx - ix
      const ty = fy - iy

      const v = lerp(
        lerp(grid[iy * stride + ix],       grid[iy * stride + ix + 1],       tx),
        lerp(grid[(iy + 1) * stride + ix], grid[(iy + 1) * stride + ix + 1], tx),
        ty,
      )

      const byte = Math.round(v * 255)
      const i    = (y * size + x) * 4
      imageData.data[i]     = byte
      imageData.data[i + 1] = byte
      imageData.data[i + 2] = byte
      imageData.data[i + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)

  const tex    = new THREE.CanvasTexture(canvas)
  tex.wrapS    = THREE.RepeatWrapping
  tex.wrapT    = THREE.RepeatWrapping
  return tex
}

// ─── CloudLayer ───────────────────────────────────────────────────────────────

/**
 * Self-contained sky cloud system.
 *
 * Responsibilities (all internal — nothing leaks to other classes):
 *   - Loading the 7 hand-drawn cloud textures
 *   - Generating the procedural noise texture
 *   - Spawning billboard cloud meshes with custom ShaderMaterial
 *   - Animating drift (world-space translation) and edge erosion (shader uniforms)
 *   - Disposing GPU resources on teardown
 *
 * Callers only need three surface methods:
 *   new CloudLayer(scene)   constructor – spawns everything
 *   .update(delta, elapsed) – call once per frame
 *   .dispose()              – clean up GPU resources and remove from scene
 */
export class CloudLayer {
  private readonly group:   THREE.Group   = new THREE.Group()
  private readonly clouds:  CloudInstance[] = []
  private readonly noiseTex: THREE.Texture
  private readonly loadedTextures: Map<number, THREE.Texture> = new Map()
  private readonly layerCenter = new THREE.Vector3()
  private readonly basisForward = new THREE.Vector3(0, 0, -1)
  private readonly basisRight = new THREE.Vector3(1, 0, 0)
  private readonly basisUp = new THREE.Vector3(0, 1, 0)
  private static readonly DEPTH_JITTER = 2.0
  private static readonly MIN_SPAWN_DISTANCE = 0.42

  // Shared geometry for all cloud quads (1×1 unit; size passed via uniform)
  private readonly planeGeo: THREE.PlaneGeometry = new THREE.PlaneGeometry(1, 1)

  constructor(private readonly scene: THREE.Scene, private readonly camera: THREE.Camera) {
    this.noiseTex = generateNoiseTexture()
    scene.add(this.group)

    // Load cloud textures; each mesh becomes visible once its texture is ready
    const loader = new THREE.TextureLoader()
    CLOUD_DETAILS.forEach((detail, idx) => {
      loader.load(
        detail.url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace
          this.loadedTextures.set(idx, tex)
          this._tryAssignTextures()
        },
        undefined,
        () => {
          console.warn(`[CloudLayer] Failed to load cloud texture: ${detail.url}`)
        },
      )
    })

    this._updateLayerBasis()
    this._spawnClouds()
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private _spawnClouds(): void {
    for (let i = 0; i < Settings.scene.clouds.count; i++) {
      const detailIndex = Math.floor(Math.random() * CLOUD_DETAILS.length)
      const detail = CLOUD_DETAILS[detailIndex]
      const baseWidth = detail.foot_print
      const baseHeight = baseWidth * (detail.original_size.height / detail.original_size.width)

      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uCloudTex:    { value: null },           // assigned async once loaded
          uNoiseTex:    { value: this.noiseTex },
          uTime:        { value: 0 },
          uNoiseScale:  { value: Settings.scene.clouds.noiseScale },
          uDispStrength:{ value: Settings.scene.clouds.dispStrength },
          uDispSpeed:   { value: Settings.scene.clouds.dispSpeed },
          uSize:        { value: new THREE.Vector2(baseWidth, baseHeight) },
        },
        vertexShader:   cloudVert,
        fragmentShader: cloudFrag,
        transparent:    true,
        depthWrite:     false,
        depthTest:      true,
        fog:            false,
        side:           THREE.DoubleSide,
      })

      const mesh = new THREE.Mesh(this.planeGeo, mat)
      mesh.renderOrder = 10 + i
      mesh.visible     = false  // hidden until texture loaded
      // Custom vertex expansion can exceed the static plane bounds.
      mesh.frustumCulled = false

      const direction = Math.random() < 0.5 ? -1 : 1

      const [coordX, coordY] = this._pickSpawnCoords()

      const cloud: CloudInstance = {
        mesh,
        textureIndex: detailIndex,
        baseWidth,
        baseHeight,
        sizeT: Math.random(),
        speedT: Math.random(),
        verticalJitter: Math.random() - 0.5,
        direction,
        coordX,
        coordY,
        depthOffsetT: Math.random() * 2 - 1,
      }

      this._applyCloudTransform(cloud)
      this.clouds.push(cloud)

      this.group.add(mesh)
    }
  }

  private _pickSpawnCoords(): [number, number] {
    const maxAttempts = 30
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = (Math.random() - 0.5) * 2
      const y = (Math.random() - 0.5) * 2

      let overlaps = false
      for (const existing of this.clouds) {
        const dx = x - existing.coordX
        const dy = y - existing.coordY
        if (Math.hypot(dx, dy) < CloudLayer.MIN_SPAWN_DISTANCE) {
          overlaps = true
          break
        }
      }

      if (!overlaps) return [x, y]
    }

    return [(Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2]
  }

  private _updateLayerBasis(): { halfWidth: number; halfHeight: number } {
    const cfg = Settings.scene.clouds
    const camera = this.camera as THREE.PerspectiveCamera

    this.camera.getWorldDirection(this.basisForward)
    this.basisForward.normalize()
    this.basisRight.setFromMatrixColumn(this.camera.matrixWorld, 0).normalize()
    this.basisUp.setFromMatrixColumn(this.camera.matrixWorld, 1).normalize()

    this.layerCenter.copy(this.camera.position).addScaledVector(this.basisForward, cfg.depth)

    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * cfg.depth
    const halfWidth = halfHeight * camera.aspect
    return { halfWidth, halfHeight }
  }

  private _applyCloudTransform(cloud: CloudInstance): void {
    const cfg = Settings.scene.clouds
    const scale = cfg.scaleMin + cloud.sizeT * (cfg.scaleMax - cfg.scaleMin)
    const width = cloud.baseWidth * scale
    const height = cloud.baseHeight * scale
    const { halfWidth, halfHeight } = this._updateLayerBasis()
    const offsetX = cloud.coordX * halfWidth * cfg.coverX
    const offsetY = (cloud.coordY + cfg.verticalBias) * halfHeight * cfg.coverY
    const offsetDepth = cloud.depthOffsetT * CloudLayer.DEPTH_JITTER

    cloud.mesh.position.copy(this.layerCenter)
    cloud.mesh.position.addScaledVector(this.basisForward, offsetDepth)
    cloud.mesh.position.addScaledVector(this.basisRight, offsetX)
    cloud.mesh.position.addScaledVector(this.basisUp, offsetY)

    cloud.mesh.material.uniforms.uSize.value.set(width, height)
    cloud.mesh.material.uniforms.uNoiseScale.value = cfg.noiseScale
    cloud.mesh.material.uniforms.uDispStrength.value = cfg.dispStrength
    cloud.mesh.material.uniforms.uDispSpeed.value = cfg.dispSpeed
  }

  /** Once textures have loaded, distribute them across waiting cloud meshes. */
  private _tryAssignTextures(): void {
    if (this.loadedTextures.size === 0) return

    this.clouds.forEach((cloud) => {
      if (cloud.mesh.material.uniforms.uCloudTex.value !== null) return
      const tex = this.loadedTextures.get(cloud.textureIndex)
      if (!tex) return
      cloud.mesh.material.uniforms.uCloudTex.value = tex
      cloud.mesh.material.needsUpdate = true
      cloud.mesh.visible = true
    })
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * @param delta   Seconds since last frame — drives drift translation.
   * @param elapsed Total elapsed seconds since game start — drives noise animation.
   */
  update(delta: number, elapsed: number): void {
    const cfg = Settings.scene.clouds
    const speedSpan = Math.max(0, cfg.driftSpeedMax - cfg.driftSpeedMin)
    const { halfWidth, halfHeight } = this._updateLayerBasis()
    const wrapX = Math.max(0.001, (halfWidth * cfg.coverX) + cfg.scaleMax)
    const wrapY = Math.max(0.001, (halfHeight * cfg.coverY) + cfg.scaleMax)

    for (const cloud of this.clouds) {
      // Advance noise erosion uniform
      cloud.mesh.material.uniforms.uTime.value = elapsed

      const speed = cfg.driftSpeedMin + cloud.speedT * speedSpan
      cloud.coordX += (cloud.direction * speed * delta) / wrapX
      cloud.coordY += (cloud.verticalJitter * speed * cfg.verticalDrift * delta) / wrapY

      if (cloud.coordX > 1) cloud.coordX -= 2
      if (cloud.coordX < -1) cloud.coordX += 2

      if (cloud.coordY > 1) cloud.coordY -= 2
      if (cloud.coordY < -1) cloud.coordY += 2

      this._applyCloudTransform(cloud)
    }
  }

  /** Remove all cloud meshes from the scene and free GPU resources. */
  dispose(): void {
    this.planeGeo.dispose()
    this.noiseTex.dispose()
    for (const tex of this.loadedTextures.values()) tex.dispose()
    for (const cloud of this.clouds) cloud.mesh.material.dispose()
    this.scene.remove(this.group)
    this.clouds.length = 0
    this.loadedTextures.clear()
  }
}
