import { CELL } from '../Constants.js'
import type { Game } from '../Game.js'
import type { CellData } from '../Grid.js'
import { cellToWorld } from '../Grid.js'
import { BaseGameState } from './IGameState.js'

export class PlayingState extends BaseGameState {
  private countdown = 0;
  private countdownActive = true;
  private _initialised = false;

  enter(game: Game): void {
    game.playTimeStamp = performance.now()
    if (!this._initialised) {
      const levelCountdown = game.grid?.level.countdown ?? 10
      this.countdown = levelCountdown
      this.countdownActive = levelCountdown > 0
      this._initialised = true
    }
    game.updateCountdown(this.countdownActive ? this.countdown : null);
    game.setSpeedBtnEnabled(!this.countdownActive);
  }

  update(game: Game, delta: number): void {
    if (this.countdownActive) {

      this.countdown -= delta;
      if (this.countdown > 0)
      {
        game.updateCountdown(Math.ceil(this.countdown));
        game.setSpeedBtnEnabled(false);
        return;
      } else {
        this.countdownActive = false;
        game.updateCountdown(null);
        game.setSpeedBtnEnabled(true);
      }
    }
    if (game.train && game.train.lerpT >= 1) {
      game.doTick();
    }
  }

  skipCountdown(game: Game): void {
    this.countdown = 0
  }

  exit(game: Game): void {
    game.playTimeAccumulated += (performance.now() - game.playTimeStamp) / 1000
    game.updateCountdown(null);
    game.setSpeedBtnEnabled(true);
  }

  handlePointerMove(game: Game, col: number, row: number, cell: CellData | null): void {
    if (!game.selectedPiece || !game.grid) {
      game.grid?.hideGhost()
      return
    }
    if (cell && cell.type !== CELL.VOID) {
      game.lastHoveredCell = { col, row }
      game.grid.showGhost(col, row, game.selectedPiece)
      game.updatePlaceBtn(cell.trackPiece !== null)
      this._playGhostSfx(game)
    } else {
      game.lastHoveredCell = null
      game.grid.hideGhost()
      game.updatePlaceBtn(false)
    }
  }

  handleClick(game: Game, col: number, row: number, cell: CellData | null): void {
    if (!game.selectedPiece || !game.grid || !cell || cell.type === CELL.VOID || cell.type === CELL.STATION) return
    const placed = game.grid.placeTrack(col, row, game.selectedPiece)
    if (placed) {
      game.railsPlaced++
      game.updateRailsDisplay()
      game.updateSelectedPiece()        // ← refresh ghost/selected piece
      game.grid.hideGhost()
      game.showDefaultGhost()
      const idx = Math.floor(Math.random() * 5).toString().padStart(3, '0')
      game.audioManager.playSfx(`impactMining_${idx}`)
    }
  }

  handleRightClick(game: Game, col: number, row: number): void {
    if (!game.grid) return
    const removed = game.grid.removeTrack(col, row)
    if (removed && game.smoke) {
      const pos = cellToWorld(col, row, game.grid.cols, game.grid.rows)
      pos.y = 0.3
      game.smoke.emitBurst(pos)
      const idx = Math.floor(Math.random() * 5).toString().padStart(3, '0')
      game.audioManager.playSfx(`impactPlate_${idx}`)
    }
  }

  handleKeyDown(game: Game, key: string): void {
    let idx: number
    switch (key) {
      case 'A':
        if (game.currentTileType === 'STRAIGHT') {
          game.rotateCurrentTile(1)
          idx = Math.floor(Math.random() * 3) + 1
          game.audioManager.playSfx(`rotate_0${idx}`)
          break
        }
        game.selectTileType('STRAIGHT')
        idx = Math.floor(Math.random() * 5) + 1
        game.audioManager.playSfx(`toggle_0${idx}`)
        break
      case 'S':
        if (game.currentTileType === 'CURVE') {
          game.rotateCurrentTile(1)
          idx = Math.floor(Math.random() * 3) + 1
          game.audioManager.playSfx(`rotate_0${idx}`)
          break
        }
        game.selectTileType('CURVE')
        idx = Math.floor(Math.random() * 5) + 1
        game.audioManager.playSfx(`toggle_0${idx}`)
        break
      case " ":
      case 'ENTER': {
        const cell = game.lastHoveredCell
        if (cell) game.currentState.handleClick(game, cell.col, cell.row, game.grid?.getCell(cell.col, cell.row) ?? null)
        break
      }
      case 'ESCAPE':
        game.settingsUI?.open()
        break
      case 'ARROWUP':
        this._moveGhost(game, 0, -1)
        break
      case 'ARROWDOWN':
        this._moveGhost(game, 0, 1)
        break
      case 'ARROWLEFT':
        this._moveGhost(game, -1, 0)
        break
      case 'ARROWRIGHT':
        this._moveGhost(game, 1, 0)
        break
    }
  }

  private _moveGhost(game: Game, dc: number, dr: number): void {
    if (!game.grid || !game.selectedPiece) return
    const current = game.lastHoveredCell
    const col = (current?.col ?? 0) + dc
    const row = (current?.row ?? 0) + dr
    const cell = game.grid.getCell(col, row)
    if (!cell || cell.type === CELL.VOID) return
    game.lastHoveredCell = { col, row }
    this._playGhostSfx(game)
    game.grid.showGhost(col, row, game.selectedPiece)
    game.updatePlaceBtn(cell.trackPiece !== null)
  }

  private _playGhostSfx(game: Game): void {
    const idx = Math.floor(Math.random() * 2)
    game.audioManager.playSfx(`drop_0${idx}`)
  }
}
