import * as THREE from 'three'
import { CardTray } from './src/Cards.js'
import { CELL, LEVELS, PieceId } from './src/Constants.js'
import { CELL_SIZE_EXPORT as CELL_SIZE, Grid, loadTrackAssets, worldToCell } from './src/Grid.js'
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

let grid: Grid | undefined
let train: Train | undefined
let smoke: SmokeSystem | undefined
let stationGroup: THREE.Group | undefined

let selectedPiece: PieceId | null = null
let cards: CardTray

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

// ── Card tray ─────────────────────────────────────────────────────────────────
cards = new CardTray((pieceId) => { selectedPiece = pieceId })

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

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    cards.rotateSelected()
    selectedPiece = cards.getSelected()
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
    cards.useSelected()
    selectedPiece = null
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
  const canGrab = e.button === 1 || e.button === 2 || (e.button === 0 && !selectedPiece)
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
    cards.useSelected()
    selectedPiece = null
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
        `level ${LEVELS[levelIndex].id} — try again`,
        'Retry',
        () => loadLevel(levelIndex)
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
}

// ── Boot ──────────────────────────────────────────────────────────────────────
showOverlay(
  'TrainMania',
  'Place tracks before the train derails',
  'Start Game',
  () => {
    levelIndex = 0
    loadLevel(0)
  }
)

animate()
