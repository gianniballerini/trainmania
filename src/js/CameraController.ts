import * as THREE from 'three'

const LERP_SPEED        = 3.0
const PAN_LERP_SPEED    = 5.0

// Camera sits on a sphere of this radius from the target
const DIST              = Math.sqrt(14 * 14 + 14 * 14)   // ≈ 19.8

// Fixed pitch (elevation) — no longer mutable via drag
const DEFAULT_PITCH     = Math.PI / 4        // 45°

// Input sensitivity
// Z sensitivity compensates for foreshortening at 45°: world-Z projects to
// ~sin(45°) ≈ 0.707 of its size on screen, so we divide to match X feel.
const PAN_SENSITIVITY   = 0.02              // world units per pixel (X axis)
const Z_PAN_SENSITIVITY = PAN_SENSITIVITY / Math.sin(DEFAULT_PITCH)  // forward/back axis

// Fraction of the total bound range that acts as a soft-resistance zone
const SOFT_ZONE         = 0.25

const INERTIA_DECAY_RATE = 8.0
const INERTIA_EPSILON    = 0.00001

const DRAG_THRESHOLD    = 5

export class CameraController {
  private _dragging        = false
  private _lastDragX       = 0
  private _lastDragY       = 0
  private _startX          = 0
  private _startY          = 0

  private _target          = new THREE.Vector3()
  private _goalTarget      = new THREE.Vector3()

  private _panOffset       = new THREE.Vector3()   // current rendered offset (X and Z)
  private _goalPanOffset   = new THREE.Vector3()   // lerp target for pan offset
  private _panBoundsX      = 7                     // ±bound in world X
  private _panBoundsZ      = 7                     // ±bound in world Z
  private _invertY         = false

  private _velocity = new THREE.Vector2() // x, z momentum stored as x/y
  private _lastDragTime = 0

  // ── Public API ────────────────────────────────────────────────────────────

  setGoalTarget(pos: THREE.Vector3): void {
    this._goalTarget.copy(pos)
  }

  setPanBounds(x: number, z: number): void {
    this._panBoundsX = x
    this._panBoundsZ = z
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
    this._stopInertia()
    this._goalPanOffset.set(0, 0, 0)
  }

  tick(delta: number): void {
    this._target.lerp(this._goalTarget, 1 - Math.exp(-LERP_SPEED * delta))

    // Inertia: only when not dragging
    if (!this._dragging && this._velocity.lengthSq() > INERTIA_EPSILON) {
      const nextGoalX = this._goalPanOffset.x + this._velocity.x * delta
      const nextGoalZ = this._goalPanOffset.z + this._velocity.y * delta
      const clampedGoalX = this._softClamp(nextGoalX, this._panBoundsX)
      const clampedGoalZ = this._softClamp(nextGoalZ, this._panBoundsZ)

      this._goalPanOffset.x = clampedGoalX
      this._goalPanOffset.z = clampedGoalZ

      if (clampedGoalX !== nextGoalX) this._velocity.x = 0
      if (clampedGoalZ !== nextGoalZ) this._velocity.y = 0

      this._velocity.multiplyScalar(Math.exp(-INERTIA_DECAY_RATE * delta))
      if (this._velocity.lengthSq() <= INERTIA_EPSILON) this._stopInertia()
    }

    this._panOffset.lerp(this._goalPanOffset, 1 - Math.exp(-PAN_LERP_SPEED * delta))
  }

  updateOrbit(camera: THREE.Camera): void {
    const radius = DIST * Math.cos(DEFAULT_PITCH)
    const height = DIST * Math.sin(DEFAULT_PITCH)

    const ex = this._target.x + this._panOffset.x
    const ey = this._target.y
    const ez = this._target.z + this._panOffset.z

    camera.position.set(ex, ey + height, ez + radius)
    camera.lookAt(ex, ey, ez)
  }

  reset(camera: THREE.Camera): void {
    this._stopInertia()
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
    this._lastDragTime = performance.now()
    this._stopInertia()
  }

  onDrag(clientX: number, clientY: number, camera: THREE.Camera): void {
    if (!this._dragging) return
    if (!this.isPastThreshold(clientX, clientY)) return

    const now = performance.now()
    const elapsedSeconds = Math.max((now - this._lastDragTime) / 1000, 1 / 240)
    const dx = clientX - this._lastDragX
    const dy = clientY - this._lastDragY
    this._lastDragX = clientX
    this._lastDragY = clientY
    this._lastDragTime = now

    // Horizontal drag → pan in world X
    const newPanX = this._panOffset.x - dx * PAN_SENSITIVITY
    this._panOffset.x = this._softClamp(newPanX, this._panBoundsX)

    // Vertical drag → pan in world Z; drag up = move toward negative Z (deeper into scene)
    // invertY reverses this convention
    const zSign = this._invertY ? 1 : -1
    const newPanZ = this._panOffset.z + zSign * dy * Z_PAN_SENSITIVITY
    this._panOffset.z = this._softClamp(newPanZ, this._panBoundsZ)

    // Capture release velocity in world units per second so inertia is frame-rate independent.
    this._velocity.set(
      (-dx * PAN_SENSITIVITY) / elapsedSeconds,
      (zSign * dy * Z_PAN_SENSITIVITY) / elapsedSeconds,
    )

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

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Soft-clamps value to ±bound. Movement is unrestricted in the centre;
   * inside the outer SOFT_ZONE fraction of the range it scales down linearly
   * to zero at the exact boundary, giving progressive resistance without
   * overshoot.
   */
  private _softClamp(value: number, bound: number): number {
    const softStart = bound * (1 - SOFT_ZONE)
    const abs = Math.abs(value)
    if (abs <= softStart) return value
    if (abs >= bound) return Math.sign(value) * bound
    // Linear resistance: scale remaining travel down as we approach the edge
    const overshoot = abs - softStart
    const zoneSize  = bound - softStart
    const scale     = 1 - overshoot / zoneSize
    return Math.sign(value) * (softStart + overshoot * scale)
  }

  private _stopInertia(): void {
    this._velocity.set(0, 0)
  }
}
