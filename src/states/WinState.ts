import { LEVELS } from '../Constants.js'
import type { Game } from '../Game.js'
import { showOverlay } from '../ui.js'
import { BaseGameState } from './IGameState.js'
import { PlayingState } from './PlayingState.js'
import { TitleState } from './TitleState.js'

export class WinState extends BaseGameState {
  enter(game: Game): void {
    setTimeout(() => {
      const hasNext = game.levelIndex + 1 < LEVELS.length
      showOverlay(
        '🚉 ARRIVED',
        hasNext ? `level ${game.levelIndex + 1} cleared` : 'all levels complete!',
        hasNext ? 'Next Level' : 'Play Again',
        async () => {
          if (hasNext) {
            game.levelIndex++
            await game.loadLevel(game.levelIndex)
            game.changeState(new PlayingState())
          } else {
            game.levelIndex = 0
            await game.loadLevel(0)
            game.changeState(new TitleState())
          }
        },
      )
    }, 600)
  }
}
