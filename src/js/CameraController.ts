import * as THREE from 'three'

const LERP_SPEED = 3.0

export class CameraController {
  private static readonly RADIUS         = 14
  private static readonly HEIGHT         = 14
  private static readonly DRAG_THRESHOLD = 5

  angle = 0

  private _dragging    = false
  private _lastDragX   = 0
  private _startX      = 0
  private _startY      = 0
  private _target      = new THREE.Vector3()
  private _goalTarget  = new THREE.Vector3()

  setGoalTarget(pos: THREE.Vector3): void {
    this._goalTarget.copy(pos)
  }

  tick(delta: number): void {
    this._target.lerp(this._goalTarget, 1 - Math.exp(-LERP_SPEED * delta))
  }

  updateOrbit(camera: THREE.Camera): void {
    camera.position.set(
      this._target.x + Math.sin(this.angle) * CameraController.RADIUS,
      CameraController.HEIGHT,
      this._target.z + Math.cos(this.angle) * CameraController.RADIUS,
    )
    camera.lookAt(this._target)
  }

  reset(camera: THREE.Camera): void {
    this.angle = 0
    this._target.set(0, 0, 0)
    this._goalTarget.set(0, 0, 0)
    this.updateOrbit(camera)
  }

  startDrag(clientX: number, clientY: number): void {
    this._dragging  = true
    this._lastDragX = clientX
    this._startX    = clientX
    this._startY    = clientY
  }

  onDrag(clientX: number, clientY: number, camera: THREE.Camera): void {
    if (!this._dragging) return
    if (!this.isPastThreshold(clientX, clientY)) return
    const dx = clientX - this._lastDragX
    this._lastDragX = clientX
    this.angle -= dx * 0.01
    this.updateOrbit(camera)
  }

  endDrag(): void {
    this._dragging = false
  }

  get dragging(): boolean {
    return this._dragging
  }

  get isSettled(): boolean {
    return !this._dragging && this._target.distanceTo(this._goalTarget) < 0.01
  }

  isPastThreshold(clientX: number, clientY: number): boolean {
    return Math.hypot(clientX - this._startX, clientY - this._startY) > CameraController.DRAG_THRESHOLD
  }
}
