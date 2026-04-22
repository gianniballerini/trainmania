import type { IGameState } from './IGameState.js';
import { BaseGameState } from './IGameState.js';
import type { Game } from '../Game.js'

export class PausedState extends BaseGameState {
  /** The state that was active before pausing — restored on resume. */
  constructor(readonly previousState: IGameState) {
    super()
  }

  handleKeyDown(game: Game, key: string): void {
    if (key === 'ESCAPE') {
      game.settingsUI?.close()
      if (game.currentState instanceof PausedState) game.resume()
    }
  }
}
