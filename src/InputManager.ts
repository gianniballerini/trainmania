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

    // ── Action helpers (shared by keyboard, mouse, touch, HUD buttons) ────
    const rotateL = document.querySelector<HTMLElement>('.hud__rotate-btn--left')
    const rotateR = document.querySelector<HTMLElement>('.hud__rotate-btn--right')
    const swapBtn = document.querySelector<HTMLElement>('.hud__swap-btn')

    const withActive = (el: HTMLElement, fn: () => void) => {
      el.classList.add('is-active')
      fn()
      const clear = () => el.classList.remove('is-active')
      el.addEventListener('mouseup',    clear, { once: true })
      el.addEventListener('mouseleave', clear, { once: true })
      el.addEventListener('touchend',   clear, { once: true })
    }

    const doRotateL = () => {
      game.currentRotation = (game.currentRotation + 3) % 4
      game.updateSelectedPiece()
      const idx = Math.floor(Math.random() * 3) + 1
      game.audioManager.playSfx(`rotate_0${idx}`)
    }
    const doRotateR = () => {
      game.currentRotation = (game.currentRotation + 1) % 4
      game.updateSelectedPiece()
      const idx = Math.floor(Math.random() * 3) + 1
      game.audioManager.playSfx(`rotate_0${idx}`)
    }
    const doSwap = () => {
      game.currentTileType = game.currentTileType === 'STRAIGHT' ? 'CURVE' : 'STRAIGHT'
      game.currentRotation = 0
      game.updateSelectedPiece()
      const idx = Math.floor(Math.random() * 5) + 1
      game.audioManager.playSfx(`toggle_0${idx}`)
    }

    // ── Keyboard ─────────────────────────────────────────────────────────
    const flashBtn = (el: HTMLElement | null) => {
      if (!el) return
      el.classList.add('is-active')
      setTimeout(() => el.classList.remove('is-active'), 150)
    }

    window.addEventListener('keydown', (e) => {
      const key = e.key.toUpperCase()
      game.currentState.handleKeyDown(game, key)

      if (key === 'A') flashBtn(rotateL)
      else if (key === 'D') flashBtn(rotateR)
      else if (key === 'S') flashBtn(swapBtn)
    })
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return
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

    // ── Middle click → rotate ─────────────────────────────────────────────
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 1) return
      e.preventDefault()
      doRotateR()
      flashBtn(rotateR)
    })

    // ── Right click → swap ────────────────────────────────────────────────
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      doSwap()
      flashBtn(swapBtn)
    })

    // ── Touch ─────────────────────────────────────────────────────────────
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const synth = new MouseEvent('click', { clientX: touch.clientX, clientY: touch.clientY })
      canvas.dispatchEvent(synth)
    }, { passive: false })

    // ── HTML action buttons ───────────────────────────────────────────────
    if (rotateL) {
      rotateL.addEventListener('mousedown', () => withActive(rotateL, doRotateL))
      rotateL.addEventListener('touchstart', (e) => { e.preventDefault(); withActive(rotateL, doRotateL) }, { passive: false })
    }
    if (rotateR) {
      rotateR.addEventListener('mousedown', () => withActive(rotateR, doRotateR))
      rotateR.addEventListener('touchstart', (e) => { e.preventDefault(); withActive(rotateR, doRotateR) }, { passive: false })
    }
    if (swapBtn) {
      swapBtn.addEventListener('mousedown', () => withActive(swapBtn, doSwap))
      swapBtn.addEventListener('touchstart', (e) => { e.preventDefault(); withActive(swapBtn, doSwap) }, { passive: false })
    }
  }
}
