import { LEVELS } from '../Constants.js'
import type { Game } from '../Game.js'
import { showOverlay } from '../ui.js'
import { BaseGameState } from './IGameState.js'
import { PlayingState } from './PlayingState.js'

export class DeadState extends BaseGameState {
  constructor(private readonly derailed: boolean) {
    super()
  }

  enter(game: Game): void {
    if (this.derailed) {
      game.train?.startDerail()
    } else {
      game.train?.startFall()
    }

    setTimeout(() => {
      showOverlay(
        this.derailed ? '💨 DERAILED' : '🌀 FELL OFF',
        `level ${LEVELS[game.levelIndex].id} — starting over`,
        'Start Over',
        async () => {
          game.levelIndex = 0
          await game.loadLevel(0)
          game.changeState(new PlayingState())
        },
      )
    }, 1200)
  }
}
