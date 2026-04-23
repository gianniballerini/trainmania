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

  /** Raycast against the train group → true if hit. */
  private hitTestTrain(): boolean {
    if (!this.game.train) return false
    this.raycaster.setFromCamera(this.pointer, this.game.camera)
    const hits: THREE.Intersection[] = []
    this.raycaster.intersectObject(this.game.train.group, true, hits)
    return hits.length > 0
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
    const rotateBtn = document.querySelector<HTMLElement>('.hud__action-btn--rotate')
    const placeBtn = document.querySelector<HTMLElement>('.hud__action-btn--place')
    const swapBtn = document.querySelector<HTMLElement>('.hud__action-btn--swap')

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
    const doPlace = () => {
      const cell = game.lastHoveredCell
      if (!cell) return
      game.currentState.handleClick(game, cell.col, cell.row, game.grid?.getCell(cell.col, cell.row) ?? null)
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
      if (['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT', 'ESCAPE'].includes(key)) e.preventDefault()
      if (key === 'ESCAPE' && game.leaderboardUI?.isOpen) {
        game.leaderboardUI.close()
        return
      }
      game.currentState.handleKeyDown(game, key)

      if (key === 'A') flashBtn(swapBtn)
      else if (key === 'S') flashBtn(rotateBtn)
      else if (key === 'ENTER' || key === ' ') flashBtn(placeBtn)
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
        game.grid?.hideHover()
        return
      }
      this.setPointerNDC(e.clientX, e.clientY)
      const hit = this.hitTestGrid()
      if (!hit) {
        game.grid?.hideHover()
        return
      }
      game.grid?.showHover(hit.col, hit.row)
    })

    // ── Place track (two-click: first click focuses, second click places) ─
    canvas.addEventListener('click', (e) => {
      if (cam.isPastThreshold(e.clientX, e.clientY)) return
      this.setPointerNDC(e.clientX, e.clientY)

      // Click on train → toggle follow, deselect ghost
      if (this.hitTestTrain()) {
        game.followTrain = !game.followTrain
        if (game.followTrain) {
          game.lastHoveredCell = null
          game.grid?.hideGhost()
        }
        cam.resetPan()
        return
      }

      // Click on grid → cancel train follow
      game.followTrain = false
      const hit = this.hitTestGrid()
      if (!hit) return
      const cell = game.grid?.getCell(hit.col, hit.row) ?? null
      const prev = game.lastHoveredCell
      if (prev && prev.col === hit.col && prev.row === hit.row) {
        // Second click on focused tile → place
        game.currentState.handleClick(game, hit.col, hit.row, cell)
      } else {
        // First click → focus the tile (show ghost)
        cam.resetPan()
        game.currentState.handlePointerMove(game, hit.col, hit.row, cell)
      }
    })

    // ── Middle click → rotate ─────────────────────────────────────────────
    canvas.addEventListener('mousedown', (e) => {
      if (e.button !== 1) return
      e.preventDefault()
      doRotateL()
      flashBtn(rotateBtn)
    })

    // ── Right click → swap ────────────────────────────────────────────────
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      doSwap()
      flashBtn(swapBtn)
    })

    // ── Touch ─────────────────────────────────────────────────────────────
    // First touch sets touch mode so Game can adapt behaviour.
    window.addEventListener('touchstart', () => { game.isTouchMode = true }, { once: true, passive: true })

    // Single-finger drag → orbit camera.
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      cam.startDrag(t.clientX, t.clientY)
    }, { passive: true })

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1) return
      e.preventDefault()
      const t = e.touches[0]
      cam.onDrag(t.clientX, t.clientY, game.camera)
    }, { passive: false })

    // Two-tap model: first tap focuses a tile (shows ghost), second tap places.
    // If the finger moved past the drag threshold it was a drag, not a tap.
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault()
      const touch = e.changedTouches[0]
      if (cam.isPastThreshold(touch.clientX, touch.clientY)) {
        cam.endDrag()
        return
      }
      cam.endDrag()
      this.setPointerNDC(touch.clientX, touch.clientY)

      // Tap on train → toggle follow, deselect ghost
      if (this.hitTestTrain()) {
        game.followTrain = !game.followTrain
        if (game.followTrain) {
          game.lastHoveredCell = null
          game.grid?.hideGhost()
        }
        cam.resetPan()
        return
      }

      // Tap on grid → cancel train follow
      game.followTrain = false
      const hit = this.hitTestGrid()
      if (!hit) return
      const cell = game.grid?.getCell(hit.col, hit.row) ?? null
      const prev = game.lastHoveredCell
      if (prev && prev.col === hit.col && prev.row === hit.row) {
        // Second tap on the focused tile → place
        game.currentState.handleClick(game, hit.col, hit.row, cell)
        game.lastHoveredCell = null
        game.showDefaultGhost()
      } else {
        // First tap → focus the tile (shows ghost)
        cam.resetPan()
        game.currentState.handlePointerMove(game, hit.col, hit.row, cell)
      }
    }, { passive: false })

    // ── HTML action buttons ───────────────────────────────────────────────
    if (rotateBtn) {
      rotateBtn.addEventListener('mousedown', () => withActive(rotateBtn, doRotateL))
      rotateBtn.addEventListener('touchstart', (e) => { e.preventDefault(); withActive(rotateBtn, doRotateL) }, { passive: false })
    }
    if (placeBtn) {
      placeBtn.addEventListener('mousedown', () => withActive(placeBtn, doPlace))
      placeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); withActive(placeBtn, doPlace) }, { passive: false })
    }
    if (swapBtn) {
      swapBtn.addEventListener('mousedown', () => withActive(swapBtn, doSwap))
      swapBtn.addEventListener('touchstart', (e) => { e.preventDefault(); withActive(swapBtn, doSwap) }, { passive: false })
    }
  }
}
