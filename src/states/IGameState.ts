import type { Game } from '../Game.js'
import type { CellData } from '../Grid.js'

export interface IGameState {
  enter(game: Game): void
  exit(game: Game): void
  update(game: Game, delta: number): void
  handlePointerMove(game: Game, col: number, row: number, cell: CellData | null): void
  handleClick(game: Game, col: number, row: number, cell: CellData | null): void
  handleRightClick(game: Game, col: number, row: number): void
  handleKeyDown(game: Game, key: string): void
}

// Base class with no-op defaults — extend and override only what you need.
export class BaseGameState implements IGameState {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  enter(_game: Game): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  exit(_game: Game): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_game: Game, _delta: number): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handlePointerMove(_game: Game, _col: number, _row: number, _cell: CellData | null): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleClick(_game: Game, _col: number, _row: number, _cell: CellData | null): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRightClick(_game: Game, _col: number, _row: number): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleKeyDown(_game: Game, _key: string): void {}
}
