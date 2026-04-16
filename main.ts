import * as THREE from 'three'
import { AudioManager } from './src/AudioManager.js'
import { CELL, LEVELS, PieceId, TileType, tileToPieceId } from './src/Constants.js'
import { CELL_SIZE_EXPORT as CELL_SIZE, Grid, loadTrackAssets, worldToCell } from './src/Grid.js'
import { KeyboardHUD } from './src/KeyboardHUD.js'
import { createScene } from './src/scene.js'
import { SmokeSystem } from './src/Smoke.js'
import { buildStarfield } from './src/Stars.js'
import { buildStation } from './src/Station.js'
import { Train } from './src/Train.js'
import { showOverlay } from './src/ui.js'

// ── State ─────────────────────────────────────────────────────────────────────
const STATE = {
  TITLE:   'TITLE',
  PLAYING: 'PLAYING',
  PAUSED:  'PAUSED',
  DEAD:    'DEAD',
  WIN:     'WIN',
} as const
type GameState = typeof STATE[keyof typeof STATE]

let state: GameState = STATE.TITLE
let levelIndex = 0

const audioManager = new AudioManager()

let grid: Grid | undefined
let train: Train | undefined
let smoke: SmokeSystem | undefined
let stationGroup: THREE.Group | undefined

let selectedPiece: PieceId | null = null
let currentTileType: TileType = 'STRAIGHT'
let currentRotation = 0

// Speed
let lerpSpeed     = 1     // cells per second (lerp rate)
let stepCount      = 0
const SPEED_ACCEL  = 1.05  // multiply lerpSpeed every step
const MAX_SPEED    = 4.0   // cells per second cap
let baseSpeed      = 1     // initial lerpSpeed for this level

// Three.js
const canvas = document.getElementById('game-canvas')
const { renderer, scene, camera } = createScene(canvas)

buildStarfield(scene)

// Raycaster
const raycaster = new THREE.Raycaster()
const pointer   = new THREE.Vector2()
const planeMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })
)
planeMesh.rotation.x = -Math.PI / 2
scene.add(planeMesh)

// HUD elements
const speedBar = document.getElementById('speed-bar')!
const levelNum = document.getElementById('level-num')!

// ── Derive selectedPiece from tile type + rotation ───────────────────────────
function updateSelectedPiece(): void {
  selectedPiece = tileToPieceId(currentTileType, currentRotation)
}
updateSelectedPiece()

// ── Camera orbit controls ─────────────────────────────────────────────────────
const CAM_TARGET = new THREE.Vector3(0, 0, 0)
const CAM_RADIUS = 14
const CAM_HEIGHT = 14
let camAngle = 0
let isOrbitDragging = false
let lastDragX = 0

function updateCameraOrbit(): void {
  camera.position.set(
    Math.sin(camAngle) * CAM_RADIUS,
    CAM_HEIGHT,
    Math.cos(camAngle) * CAM_RADIUS,
  )
  camera.lookAt(CAM_TARGET)
}

updateCameraOrbit()

// ── Keyboard HUD ──────────────────────────────────────────────────────────────
const keyboardHUD = new KeyboardHUD()

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  const k = e.key.toUpperCase()
  if (k === 'W' || k === 'A' || k === 'S' || k === 'D') {
    keyboardHUD.pressKey(k as 'W' | 'A' | 'S' | 'D')
  }
  if (state !== STATE.PLAYING) return
  switch (k) {
    case 'W': currentTileType = 'STRAIGHT'; updateSelectedPiece(); break
    case 'S': currentTileType = 'CURVE';    updateSelectedPiece(); break
    case 'A': currentRotation = (currentRotation + 3) % 4; updateSelectedPiece(); break
    case 'D': currentRotation = (currentRotation + 1) % 4; updateSelectedPiece(); break
  }
})
window.addEventListener('keyup', (e) => {
  const k = e.key.toUpperCase()
  if (k === 'W' || k === 'A' || k === 'S' || k === 'D') {
    keyboardHUD.releaseKey(k as 'W' | 'A' | 'S' | 'D')
  }
})

// ── Input ─────────────────────────────────────────────────────────────────────
function getPointerNDC(clientX: number, clientY: number): void {
  pointer.x =  (clientX / window.innerWidth)  * 2 - 1
  pointer.y = -(clientY / window.innerHeight) * 2 + 1
}

function onMouseMove(e: MouseEvent): void {
  if (isOrbitDragging) {
    grid?.hideGhost()
    return
  }
  getPointerNDC(e.clientX, e.clientY)
  if (state !== STATE.PLAYING || !selectedPiece || !grid) { grid?.hideGhost(); return }
  const cell = raycastGrid(pointer)
  if (cell) grid.showGhost(cell.col, cell.row, selectedPiece ?? undefined)
  else grid.hideGhost()
}

function onCanvasClick(e: MouseEvent): void {
  if (state !== STATE.PLAYING || !selectedPiece || !grid) return
  getPointerNDC(e.clientX, e.clientY)
  const cell = raycastGrid(pointer)
  if (!cell) return
  if (cell.type === CELL.VOID) return

  const placed = grid.placeTrack(cell.col, cell.row, selectedPiece)
  if (placed) {
    grid.hideGhost()
  }
}

function onTouch(e: TouchEvent): void {
  e.preventDefault()
  const touch = e.touches[0]
  const synth = new MouseEvent('click', { clientX: touch.clientX, clientY: touch.clientY })
  canvas!.dispatchEvent(synth)
}

function raycastGrid(ndc: THREE.Vector2): import('./src/Grid.js').CellData | null {
  if (!grid) return null
  raycaster.setFromCamera(ndc, camera)

  const hits: THREE.Intersection[] = []
  raycaster.intersectObject(planeMesh, false, hits)
  if (!hits.length) return null

  const { x, z } = hits[0].point
  const { col, row } = worldToCell(x, z, grid.cols, grid.rows)

  return grid.getCell(col, row)
}

canvas!.addEventListener('mousemove', onMouseMove)
canvas!.addEventListener('click', onCanvasClick)
canvas!.addEventListener('touchstart', onTouch, { passive: false })
canvas!.addEventListener('contextmenu', (e) => e.preventDefault())
canvas!.addEventListener('mousedown', (e: MouseEvent) => {
  const canGrab = e.button === 1 || e.button === 2
  if (!canGrab) return
  isOrbitDragging = true
  lastDragX = e.clientX
  canvas!.style.cursor = 'grabbing'
  e.preventDefault()
})
window.addEventListener('mouseup', () => {
  isOrbitDragging = false
  canvas!.style.cursor = ''
})
window.addEventListener('resize', () => keyboardHUD.resize())
window.addEventListener('mousemove', (e: MouseEvent) => {
  if (!isOrbitDragging) return
  const dx = e.clientX - lastDragX
  lastDragX = e.clientX
  camAngle -= dx * 0.01
  updateCameraOrbit()
})

// ── Because ES modules don't support require, inline worldToCell ──────────────
function worldToCellFallback(wx: number, wz: number): { col: number; row: number } {
  const cs = CELL_SIZE
  const ox = -(grid!.cols * cs) / 2 + cs / 2
  const oz = -(grid!.rows * cs) / 2 + cs / 2
  return {
    col: Math.round((wx - ox) / cs),
    row: Math.round((wz - oz) / cs),
  }
}

// Patch the click handler to use the fallback directly
canvas!.removeEventListener('click', onCanvasClick)
canvas!.addEventListener('click', (e: MouseEvent) => {
  if (state !== STATE.PLAYING || !selectedPiece || !grid) return
  getPointerNDC(e.clientX, e.clientY)
  raycaster.setFromCamera(pointer, camera)
  const hits: THREE.Intersection[] = []
  raycaster.intersectObject(planeMesh, false, hits)
  if (!hits.length) return
  const { col, row } = worldToCellFallback(hits[0].point.x, hits[0].point.z)
  const cell = grid.getCell(col, row)
  if (!cell || cell.type === CELL.VOID) return
  const placed = grid.placeTrack(cell.col, cell.row, selectedPiece)
  if (placed) {
    grid.hideGhost()
  }
})

canvas!.removeEventListener('mousemove', onMouseMove)
canvas!.addEventListener('mousemove', (e: MouseEvent) => {
  getPointerNDC(e.clientX, e.clientY)
  if (state !== STATE.PLAYING || !selectedPiece || !grid) { grid?.hideGhost(); return }
  raycaster.setFromCamera(pointer, camera)
  const hits: THREE.Intersection[] = []
  raycaster.intersectObject(planeMesh, false, hits)
  if (!hits.length) { grid.hideGhost(); return }
  const { col, row } = worldToCellFallback(hits[0].point.x, hits[0].point.z)
  const cell = grid.getCell(col, row)
  if (cell && cell.type !== CELL.VOID) grid.showGhost(col, row, selectedPiece ?? undefined)
  else grid.hideGhost()
})

// ── Game flow ─────────────────────────────────────────────────────────────────
async function loadLevel(idx: number): Promise<void> {
  // Tear down previous
  if (grid)         { grid.dispose() }
  if (train)        { train.dispose() }
  if (smoke)        { smoke.dispose() }
  if (stationGroup) { scene.remove(stationGroup) }

  const levelDef = LEVELS[idx]
  stepCount      = 0

  // Compute initial lerpSpeed from baseSpeed (ms → cells/sec)
  baseSpeed      = 1000 / levelDef.baseSpeed
  lerpSpeed      = baseSpeed

  levelNum.textContent = String(levelDef.id)
  updateSpeedBar(0)

  await loadTrackAssets()
  grid         = new Grid(scene, levelDef)
  train        = new Train(scene, grid)
  train.lerpSpeed = lerpSpeed
  smoke        = new SmokeSystem(scene)
  stationGroup = buildStation(scene, grid)

  // Reset camera orbit on level load
  camAngle = 0
  updateCameraOrbit()

  state = STATE.PLAYING
}

function updateSpeedBar(t: number): void {
  const pct = t * 100
  speedBar.style.width      = pct + '%'
  speedBar.style.background = t < 0.5
    ? `hsl(${30 + t * 40}, 80%, 55%)`
    : `hsl(${70 - (t - 0.5) * 100}, 80%, 50%)`
}

function doTick(): void {
  if (state !== STATE.PLAYING || !train) return

  const result = train.step()
  stepCount++

  // Accelerate
  lerpSpeed = Math.min(MAX_SPEED, lerpSpeed * SPEED_ACCEL)
  if (train) train.lerpSpeed = lerpSpeed
  const speedT = (lerpSpeed - baseSpeed) / (MAX_SPEED - baseSpeed)
  updateSpeedBar(Math.min(1, speedT))

  if (result.ok && result.won) {
    state = STATE.WIN
    setTimeout(() => {
      const hasNext = levelIndex + 1 < LEVELS.length
      showOverlay(
        '🚉 ARRIVED',
        hasNext ? `level ${levelIndex + 1} cleared` : 'all levels complete!',
        hasNext ? 'Next Level' : 'Play Again',
        () => {
          if (hasNext) {
            levelIndex++
            loadLevel(levelIndex)
          } else {
            levelIndex = 0
            loadLevel(0)
          }
        }
      )
    }, 600)
    return
  }

  if (!result.ok) {
    state = STATE.DEAD
    if (result.derailed) {
      train.startDerail()
    } else {
      train.startFall()
    }
    setTimeout(() => {
      showOverlay(
        result.derailed ? '💨 DERAILED' : '🌀 FELL OFF',
        `level ${LEVELS[levelIndex].id} — starting over`,
        'Start Over',
        () => { levelIndex = 0; loadLevel(0) }
      )
    }, 1200)
  }
}

// ── Render loop ───────────────────────────────────────────────────────────────
let lastTime = performance.now()

function animate(): void {
  requestAnimationFrame(animate)
  const now   = performance.now()
  const delta = Math.min((now - lastTime) / 1000, 0.1)
  lastTime = now

  // Train tick — trigger next step as soon as previous lerp completes
  if (state === STATE.PLAYING && train && train.lerpT >= 1) {
    doTick()
  }

  // Update train animation
  if (train) train.update(delta)
  if (smoke) smoke.update(delta, train?.group, state === STATE.PLAYING)

  // Station flag sway
  const flag = stationGroup?.userData?.flag as THREE.Mesh | undefined
  if (flag) {
    flag.rotation.y = Math.sin(now * 0.003) * 0.3
  }

  renderer.render(scene, camera)

  // Render keyboard HUD on top
  keyboardHUD.update(delta)
  keyboardHUD.render(renderer)
}

// ── Settings modal ────────────────────────────────────────────────────────────
const settingsModal = document.getElementById('settings-modal')!
const btnSettings   = document.getElementById('btn-settings')!
const settingsClose = document.getElementById('settings-close')!
const settingsTabs  = document.querySelectorAll<HTMLButtonElement>('.settings-tab')
const tabPanels     = document.querySelectorAll<HTMLElement>('.tab-panel')

const btnMuteAll   = document.getElementById('btn-mute-all')!
const btnMuteMusic = document.getElementById('btn-mute-music')!
const btnMuteSfx   = document.getElementById('btn-mute-sfx')!
const sliderMusic  = document.getElementById('slider-music-vol') as HTMLInputElement
const sliderSfx    = document.getElementById('slider-sfx-vol')   as HTMLInputElement

function openSettings(): void { settingsModal.classList.remove('hidden') }
function closeSettings(): void { settingsModal.classList.add('hidden') }

btnSettings.addEventListener('click', openSettings)
settingsClose.addEventListener('click', closeSettings)
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeSettings()
})

settingsTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    settingsTabs.forEach((t) => t.classList.remove('active'))
    tabPanels.forEach((p) => p.classList.remove('active'))
    tab.classList.add('active')
    document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('active')
  })
})

function syncMuteButtons(): void {
  const allMuted   = audioManager.isAllMuted
  const musicMuted = audioManager.isMusicMuted
  const sfxMuted   = audioManager.isSfxMuted
  btnMuteAll.textContent   = allMuted   ? '🔇 On'  : '🔇 Off'
  btnMuteMusic.textContent = musicMuted ? '🎵 Off' : '🎵 On'
  btnMuteSfx.textContent   = sfxMuted   ? '🔊 Off' : '🔊 On'
  btnMuteAll.classList.toggle('muted', allMuted)
  btnMuteMusic.classList.toggle('muted', musicMuted)
  btnMuteSfx.classList.toggle('muted', sfxMuted)
}

btnMuteAll.addEventListener('click', () => {
  audioManager.muteAll(!audioManager.isAllMuted)
  syncMuteButtons()
})

btnMuteMusic.addEventListener('click', () => {
  audioManager.muteMusic(!audioManager.isMusicMuted)
  syncMuteButtons()
})

btnMuteSfx.addEventListener('click', () => {
  audioManager.muteSfx(!audioManager.isSfxMuted)
  syncMuteButtons()
})

sliderMusic.addEventListener('input', () => {
  audioManager.setMusicVolume(parseFloat(sliderMusic.value))
})

sliderSfx.addEventListener('input', () => {
  audioManager.setSfxVolume(parseFloat(sliderSfx.value))
})

// ── Boot ──────────────────────────────────────────────────────────────────────
keyboardHUD.load().then(() => {
  showOverlay(
    'TrainMania',
    'Place tracks before the train derails',
    'Start Game',
    () => {
      // First user gesture — safe to start AudioContext + music
      audioManager.init()
      audioManager.playMusic([
        '/assets/sound/background_01.webm',
        '/assets/sound/background_02.webm',
      ])
      levelIndex = 0
      loadLevel(0)
    }
  )

  animate()
})
