import { CELL } from '../Constants.js'
import type { Game } from '../Game.js'
import type { CellData } from '../Grid.js'
import { cellToWorld } from '../Grid.js'
import { BaseGameState } from './IGameState.js'

export class PlayingState extends BaseGameState {
  update(game: Game): void {
    if (game.train && game.train.lerpT >= 1) {
      game.doTick()
    }
  }

  handlePointerMove(game: Game, col: number, row: number, cell: CellData | null): void {
    if (!game.selectedPiece || !game.grid) {
      game.grid?.hideGhost()
      return
    }
    if (cell && cell.type !== CELL.VOID) {
      game.lastHoveredCell = { col, row }
      game.grid.showGhost(col, row, game.selectedPiece)
    } else {
      game.lastHoveredCell = null
      game.grid.hideGhost()
    }
  }

  handleClick(game: Game, col: number, row: number, cell: CellData | null): void {
    if (!game.selectedPiece || !game.grid || !cell || cell.type === CELL.VOID || cell.type === CELL.STATION || cell.type === CELL.START) return
    const placed = game.grid.placeTrack(col, row, game.selectedPiece)
    if (placed) {
      game.currentRotation = 0          // ← reset rotation
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
        game.currentTileType = game.currentTileType === 'STRAIGHT' ? 'CURVE' : 'STRAIGHT'
        game.currentRotation = 0
        idx = Math.floor(Math.random() * 5) + 1
        game.audioManager.playSfx(`toggle_0${idx}`)
        game.updateSelectedPiece()
        break
      case 'S':
        game.currentRotation = (game.currentRotation + 1) % 4
        game.updateSelectedPiece()
        idx = Math.floor(Math.random() * 3) + 1
        game.audioManager.playSfx(`rotate_0${idx}`)
        break
      case 'ENTER': {
        const cell = game.lastHoveredCell
        if (cell) game.currentState.handleClick(game, cell.col, cell.row, game.grid?.getCell(cell.col, cell.row) ?? null)
        break
      }
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
    game.grid.showGhost(col, row, game.selectedPiece)
  }
}
