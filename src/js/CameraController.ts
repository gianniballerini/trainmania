import * as THREE from 'three'

const LERP_SPEED        = 3.0
const PAN_LERP_SPEED    = 5.0

// Camera sits on a sphere of this radius from the target
const DIST              = Math.sqrt(14 * 14 + 14 * 14)   // ≈ 19.8

// Pitch (elevation) limits in radians
const DEFAULT_PITCH     = Math.PI / 4        // 45°
const MIN_PITCH         = (20 * Math.PI) / 180
const MAX_PITCH         = (70 * Math.PI) / 180

// Input sensitivity
const PAN_SENSITIVITY   = 0.05              // world units per pixel
const PITCH_SENSITIVITY = 0.004            // radians per pixel

const DRAG_THRESHOLD    = 5

export class CameraController {
  private _dragging        = false
  private _lastDragX       = 0
  private _lastDragY       = 0
  private _startX          = 0
  private _startY          = 0

  private _target          = new THREE.Vector3()
  private _goalTarget      = new THREE.Vector3()

  private _pitch           = DEFAULT_PITCH
  private _panOffset       = new THREE.Vector3()   // current rendered offset (X only)
  private _goalPanOffset   = new THREE.Vector3()   // lerp target for pan offset
  private _panBounds       = 7                     // clamped to ±_panBounds in world X
  private _invertY         = false

  // ── Public API ────────────────────────────────────────────────────────────

  setGoalTarget(pos: THREE.Vector3): void {
    this._goalTarget.copy(pos)
  }

  setPanBounds(n: number): void {
    this._panBounds = n
  }

  get invertY(): boolean {
    return this._invertY
  }

  set invertY(value: boolean) {
    this._invertY = value
    try { localStorage.setItem('trainmania_invertCameraY', value ? '1' : '0') } catch { /* ignore */ }
  }

  loadPreferences(): void {
    try {
      this._invertY = localStorage.getItem('trainmania_invertCameraY') === '1'
    } catch { /* ignore */ }
  }

  /** Smoothly lerp the pan offset back to zero (call on tile/train focus). */
  resetPan(): void {
    this._goalPanOffset.set(0, 0, 0)
  }

  tick(delta: number): void {
    this._target.lerp(this._goalTarget, 1 - Math.exp(-LERP_SPEED * delta))
    this._panOffset.lerp(this._goalPanOffset, 1 - Math.exp(-PAN_LERP_SPEED * delta))
  }

  updateOrbit(camera: THREE.Camera): void {
    const radius = DIST * Math.cos(this._pitch)
    const height = DIST * Math.sin(this._pitch)

    const ex = this._target.x + this._panOffset.x
    const ey = this._target.y
    const ez = this._target.z

    camera.position.set(ex, ey + height, ez + radius)
    camera.lookAt(ex, ey, ez)
  }

  reset(camera: THREE.Camera): void {
    this._pitch = DEFAULT_PITCH
    this._panOffset.set(0, 0, 0)
    this._goalPanOffset.set(0, 0, 0)
    this._target.set(0, 0, 0)
    this._goalTarget.set(0, 0, 0)
    this.updateOrbit(camera)
  }

  startDrag(clientX: number, clientY: number): void {
    this._dragging  = true
    this._lastDragX = clientX
    this._lastDragY = clientY
    this._startX    = clientX
    this._startY    = clientY
  }

  onDrag(clientX: number, clientY: number, camera: THREE.Camera): void {
    if (!this._dragging) return
    if (!this.isPastThreshold(clientX, clientY)) return

    const dx = clientX - this._lastDragX
    const dy = clientY - this._lastDragY
    this._lastDragX = clientX
    this._lastDragY = clientY

    // Horizontal drag → pan in world X (camera-right)
    const newPanX = this._panOffset.x - dx * PAN_SENSITIVITY
    this._panOffset.x = Math.max(-this._panBounds, Math.min(this._panBounds, newPanX))

    // Vertical drag → pitch; default: drag up = lower angle (invert reverses this)
    const pitchSign = this._invertY ? -1 : 1
    this._pitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, this._pitch + pitchSign * dy * PITCH_SENSITIVITY))

    // Keep goal in sync while the user is actively dragging (no pull-back)
    this._goalPanOffset.copy(this._panOffset)

    this.updateOrbit(camera)
  }

  endDrag(): void {
    this._dragging = false
  }

  get dragging(): boolean {
    return this._dragging
  }

  isPastThreshold(clientX: number, clientY: number): boolean {
    return Math.hypot(clientX - this._startX, clientY - this._startY) > DRAG_THRESHOLD
  }
}
