import {
    Box3,
    Group, Mesh,
    MeshLambertMaterial, MeshPhongMaterial,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    Object3D,
    SRGBColorSpace,
    Texture,
    TextureLoader,
    Vector3,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

export interface AssetLoadOptions {
  modelUrl: string
  colorMapUrl?: string
  targetFootprint?: number
  yOffset?: number
  rotationY?: number
  castShadow?: boolean
  receiveShadow?: boolean
}

const gltfLoader = new GLTFLoader()
const textureLoader = new TextureLoader()
const modelCache = new Map<string, Object3D>()
const textureCache = new Map<string, Texture>()
const warnedAssets = new Set<string>()

export async function loadModelAsset(options: AssetLoadOptions): Promise<Group> {
  const {
    modelUrl,
    colorMapUrl,
    targetFootprint = 1.2,
    yOffset = 0,
    rotationY = 0,
    castShadow = true,
    receiveShadow = true,
  } = options

  let baseModel = modelCache.get(modelUrl)
  if (!baseModel) {
    const gltf = await gltfLoader.loadAsync(modelUrl)
    baseModel = gltf.scene
    modelCache.set(modelUrl, baseModel)
  }

  const instance = cloneSkeleton(baseModel) as Group

  let colorMap: Texture | null = null
  if (colorMapUrl) {
    colorMap = await loadColorMap(colorMapUrl)
  }

  instance.traverse((obj) => {
    if (!(obj as Mesh).isMesh) return
    const mesh = obj as Mesh
    mesh.castShadow = castShadow
    mesh.receiveShadow = receiveShadow

    if (colorMap) {
      applyColorMap(mesh, colorMap)
    }
  })

  normalizeObject(instance, targetFootprint, yOffset)
  instance.rotation.y = rotationY

  return instance
}

async function loadColorMap(url: string): Promise<Texture> {
  const cached = textureCache.get(url)
  if (cached) return cached

  const texture = await textureLoader.loadAsync(url)
  texture.colorSpace = SRGBColorSpace
  texture.flipY = false
  texture.anisotropy = 8
  textureCache.set(url, texture)
  return texture
}

function applyColorMap(mesh: Mesh, texture: Texture): void {
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
  mats.forEach((material) => {
    const typed = material as MeshStandardMaterial | MeshPhysicalMaterial | MeshLambertMaterial | MeshPhongMaterial
    if ('map' in typed) typed.map = texture
    typed.needsUpdate = true
  })
}

export function normalizeObject(root: Object3D, targetFootprint = 1.2, yOffset = 0): void {
  root.updateMatrixWorld(true)
  const box = new Box3().setFromObject(root)
  const size = new Vector3()
  const center = new Vector3()
  box.getSize(size)
  box.getCenter(center)

  const footprint = Math.max(size.x, size.z)
  if (footprint > 0) {
    const scale = targetFootprint / footprint
    root.scale.multiplyScalar(scale)
  }

  root.updateMatrixWorld(true)
  const scaledBox = new Box3().setFromObject(root)
  const scaledCenter = new Vector3()
  scaledBox.getCenter(scaledCenter)

  root.position.x -= scaledCenter.x
  root.position.z -= scaledCenter.z
  root.position.y -= scaledBox.min.y - yOffset
}

export function warnAssetLoadFailureOnce(label: string, url: string, error: unknown): void {
  const key = `${label}:${url}`
  if (warnedAssets.has(key)) return
  warnedAssets.add(key)
  console.warn(`[Assets] Could not load ${label} from ${url}. Keeping fallback visuals.`, error)
}
