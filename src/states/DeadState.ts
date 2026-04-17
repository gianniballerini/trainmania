import { BACKGROUND_TRACKS, GAME_OVER_TRACKS, LEVELS } from '../Constants.js'
import type { Game } from '../Game.js'
import { showOverlay } from '../ui.js'
import { BaseGameState } from './IGameState.js'
import { PlayingState } from './PlayingState.js'

export class DeadState extends BaseGameState {
  constructor(private readonly derailed: boolean) {
    super()
  }

  enter(game: Game): void {
    game.audioManager.playSfx('loose')
    game.audioManager.switchMusic(GAME_OVER_TRACKS)
    if (this.derailed) {
      game.train?.startDerail()
    } else {
      game.train?.startFall()
    }

    setTimeout(() => {
      showOverlay(
        this.derailed ? '💨 DERAILED' : '🌀 FELL OFF',
        `level ${LEVELS[game.levelIndex].id} — starting over`,
        'Restart',
        async () => {
          game.levelIndex = 0
          await game.loadLevel(0)
          game.audioManager.switchMusic(BACKGROUND_TRACKS)
          game.changeState(new PlayingState())
        },
      )
    }, 1200)
  }
}
