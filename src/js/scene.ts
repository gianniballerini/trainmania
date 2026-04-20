import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'
import { Settings } from './Settings'

export function createScene(canvas: HTMLElement | null): {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
} {
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas ?? undefined,
    antialias: true,
    alpha: false,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.5

  RectAreaLightUniformsLib.init()

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(Settings.scene.background)
  scene.fog = new THREE.FogExp2(Settings.scene.fog, 0.02)

  // Camera — isometric-ish perspective
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200)
  camera.position.set(0, 14, 14)
  camera.lookAt(0, 0, 0)

  // Ambient
  const ambient = new THREE.AmbientLight(Settings.scene.ambient.color, Settings.scene.ambient.intensity)
  scene.add(ambient)

  // Key light — warm sun from NW
  const sun = new THREE.DirectionalLight(Settings.scene.sun.color, Settings.scene.sun.intensity)
  sun.position.set(-8, 18, 10)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 0.5
  sun.shadow.camera.far = 80
  sun.shadow.camera.left = -20
  sun.shadow.camera.right = 20
  sun.shadow.camera.top = 20
  sun.shadow.camera.bottom = -20
  sun.shadow.bias = -0.001
  scene.add(sun)

  // Fill — cool from opposite
  const fill = new THREE.DirectionalLight(Settings.scene.fill.color, Settings.scene.fill.intensity)
  fill.position.set(10, 8, -8)
  scene.add(fill)

  // Rect area light — pointing down from y=5
  // const rectLight = new THREE.RectAreaLight(Settings.scene.rectLight.color, Settings.scene.rectLight.intensity, 6, 6)
  // rectLight.position.set(0, 4, 0)
  // rectLight.rotation.x = -Math.PI / 2
  // scene.add(rectLight)

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  return { renderer, scene, camera }
}
