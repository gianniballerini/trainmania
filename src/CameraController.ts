import * as THREE from 'three'

export class CameraController {
  private static readonly TARGET         = new THREE.Vector3(0, 0, 0)
  private static readonly RADIUS         = 14
  private static readonly HEIGHT         = 14
  private static readonly DRAG_THRESHOLD = 5

  angle = 0

  private _dragging  = false
  private _lastDragX = 0
  private _startX    = 0
  private _startY    = 0

  updateOrbit(camera: THREE.Camera): void {
    camera.position.set(
      Math.sin(this.angle) * CameraController.RADIUS,
      CameraController.HEIGHT,
      Math.cos(this.angle) * CameraController.RADIUS,
    )
    camera.lookAt(CameraController.TARGET)
  }

  reset(camera: THREE.Camera): void {
    this.angle = 0
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

  isPastThreshold(clientX: number, clientY: number): boolean {
    return Math.hypot(clientX - this._startX, clientY - this._startY) > CameraController.DRAG_THRESHOLD
  }
}
