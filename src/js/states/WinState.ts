import { toLevelApiId } from '../ApiClient.js'
import type { Game } from '../Game.js'
import { tryUpdateBestScore } from '../LeaderboardStore.js'
import { LEVELS } from '../levels/Level.js'
import { showWinOverlay } from '../ui.js'
import { BaseGameState } from './IGameState.js'
import { PlayingState } from './PlayingState.js'
import { TitleState } from './TitleState.js'

export class WinState extends BaseGameState {
  enter(game: Game): void {
    // Persist personal best before showing win overlay
    const isNewBest = tryUpdateBestScore(LEVELS[game.levelIndex].id, {
      coins:      game.coinCount,
      totalCoins: game.totalCoins,
      tiles:      game.railsPlaced,
      time:       game.playTime,
      version:    1,
    })

    // Fire qualify check immediately (non-blocking) so the network request is
    // already in-flight by the time the player clicks the win overlay button.
    const levelApiId = toLevelApiId(LEVELS[game.levelIndex].id)
    const time_ms    = Math.round(game.playTime * 1000)
    const metrics    = { coins: game.coinCount, tiles: game.railsPlaced, time_ms }
    const qualifyPromise = game.apiClient?.qualify(levelApiId, metrics) ?? Promise.resolve(false)

    setTimeout(() => {
      game.audioManager.playSfx('whistle')
      const hasNext = game.levelIndex + 1 < LEVELS.length

      const proceed = async (): Promise<void> => {
        if (hasNext) {
          game.levelIndex++
          await game.loadLevel(game.levelIndex)
          game.changeState(new PlayingState())
        } else {
          game.levelIndex = 0
          await game.loadLevel(0)
          game.changeState(new TitleState())
        }
      }

      showWinOverlay(
        '🚉 ARRIVED',
        hasNext ? `level ${game.levelIndex + 1} cleared` : 'all levels complete!',
        { time: game.playTime, coins: game.coinCount, totalCoins: game.totalCoins, railsPlaced: game.railsPlaced },
        hasNext ? 'Next Level' : 'Play Again',
        async () => {
          const qualifies = await qualifyPromise
          if (qualifies && game.globalHighScoreModal) {
            game.globalHighScoreModal.show(
              levelApiId,
              { ...metrics, timestamp: Date.now() },
              proceed,
            )
          } else {
            await proceed()
          }
        },
        isNewBest,
      )
    }, 600)
  }
}
