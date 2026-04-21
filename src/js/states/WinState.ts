import type { Game } from '../Game.js'
import { LEVELS } from '../levels/Level.js'
import { showWinOverlay } from '../ui.js'
import { BaseGameState } from './IGameState.js'
import { PlayingState } from './PlayingState.js'
import { TitleState } from './TitleState.js'

export class WinState extends BaseGameState {
  enter(game: Game): void {
    setTimeout(() => {
      game.audioManager.playSfx('whistle')
      const hasNext = game.levelIndex + 1 < LEVELS.length
      showWinOverlay(
        '🚉 ARRIVED',
        hasNext ? `level ${game.levelIndex + 1} cleared` : 'all levels complete!',
        { time: game.playTime, coins: game.coinCount, totalCoins: game.totalCoins },
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
