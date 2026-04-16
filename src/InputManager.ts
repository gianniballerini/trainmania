import * as THREE from 'three'
import type { CameraController } from './CameraController.js'
import type { Game } from './Game.js'
import { CELL_SIZE_EXPORT as CELL_SIZE } from './Grid.js'

export class InputManager {
  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer   = new THREE.Vector2()
  private readonly planeMesh: THREE.Mesh

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly game: Game,
    private readonly cam: CameraController,
  ) {
    this.planeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }),
    )
    this.planeMesh.rotation.x = -Math.PI / 2
    game.scene.add(this.planeMesh)

    this.bindEvents()
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private setPointerNDC(clientX: number, clientY: number): void {
    this.pointer.x =  (clientX / window.innerWidth)  * 2 - 1
    this.pointer.y = -(clientY / window.innerHeight) * 2 + 1
  }

  /** World-space XZ → grid col/row (same formula as Grid.worldToCell). */
  private worldToCell(wx: number, wz: number): { col: number; row: number } {
    const { grid } = this.game
    if (!grid) return { col: 0, row: 0 }
    const cs = CELL_SIZE
    const ox = -(grid.cols * cs) / 2 + cs / 2
    const oz = -(grid.rows * cs) / 2 + cs / 2
    return {
      col: Math.round((wx - ox) / cs),
      row: Math.round((wz - oz) / cs),
    }
  }

  /** Raycast the invisible ground plane → col/row, or null on miss. */
  private hitTestGrid(): { col: number; row: number } | null {
    if (!this.game.grid) return null
    this.raycaster.setFromCamera(this.pointer, this.game.camera)
    const hits: THREE.Intersection[] = []
    this.raycaster.intersectObject(this.planeMesh, false, hits)
    if (!hits.length) return null
    return this.worldToCell(hits[0].point.x, hits[0].point.z)
  }

  // ── Event binding ─────────────────────────────────────────────────────────

  private bindEvents(): void {
    const { canvas, game, cam } = this

    // ── Keyboard ─────────────────────────────────────────────────────────
    window.addEventListener('keydown', (e) => {
      const k = e.key.toUpperCase()
      if (k === 'W' || k === 'A' || k === 'S' || k === 'D') {
        game.keyboardHUD.pressKey(k as 'W' | 'A' | 'S' | 'D')
      }
      game.currentState.handleKeyDown(game, k)
    })

    window.addEventListener('keyup', (e) => {
      const k = e.key.toUpperCase()
      if (k === 'W' || k === 'A' || k === 'S' || k === 'D') {
        game.keyboardHUD.releaseKey(k as 'W' | 'A' | 'S' | 'D')
      }
    })

    // ── Camera orbit ──────────────────────────────────────────────────────
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0 && e.button !== 1 && e.button !== 2) return
      cam.startDrag(e.clientX, e.clientY)
      canvas.style.cursor = 'grabbing'
      e.preventDefault()
    })

    window.addEventListener('mouseup', () => {
      cam.endDrag()
      canvas.style.cursor = ''
    })

    // Global mousemove drives orbit rotation.
    window.addEventListener('mousemove', (e) => {
      cam.onDrag(e.clientX, e.clientY, game.camera)
    })

    // ── Hover ghost ───────────────────────────────────────────────────────
    canvas.addEventListener('mousemove', (e) => {
      if (cam.dragging) {
        game.lastHoveredCell = null
        game.grid?.hideGhost()
        return
      }
      this.setPointerNDC(e.clientX, e.clientY)
      const hit = this.hitTestGrid()
      if (!hit) {
        game.lastHoveredCell = null
        game.grid?.hideGhost()
        return
      }
      const cell = game.grid?.getCell(hit.col, hit.row) ?? null
      game.currentState.handlePointerMove(game, hit.col, hit.row, cell)
    })

    // ── Place track ───────────────────────────────────────────────────────
    canvas.addEventListener('click', (e) => {
      if (cam.isPastThreshold(e.clientX, e.clientY)) return
      this.setPointerNDC(e.clientX, e.clientY)
      const hit = this.hitTestGrid()
      if (!hit) return
      const cell = game.grid?.getCell(hit.col, hit.row) ?? null
      game.currentState.handleClick(game, hit.col, hit.row, cell)
    })

    // ── Remove track ──────────────────────────────────────────────────────
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      if (cam.isPastThreshold(e.clientX, e.clientY)) return
      this.setPointerNDC(e.clientX, e.clientY)
      const hit = this.hitTestGrid()
      if (!hit) return
      game.currentState.handleRightClick(game, hit.col, hit.row)
    })

    // ── Touch ─────────────────────────────────────────────────────────────
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const synth = new MouseEvent('click', { clientX: touch.clientX, clientY: touch.clientY })
      canvas.dispatchEvent(synth)
    }, { passive: false })

    // ── Resize ────────────────────────────────────────────────────────────
    window.addEventListener('resize', () => game.keyboardHUD.resize())
  }
}
