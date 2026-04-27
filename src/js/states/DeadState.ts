import { BACKGROUND_TRACKS, GAME_OVER_TRACKS } from '../Constants.js'
import type { Game } from '../Game.js'
import { LEVELS } from '../levels/Level.js'
import { showOverlay } from '../ui.js'
import { BaseGameState } from './IGameState.js'
import { PlayingState } from './PlayingState.js'
import { TitleState } from './TitleState.js'

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
        this.derailed ? 'DERAILED' : 'FELL OFF',
        `level ${LEVELS[game.levelIndex].id} — starting over`,
        'Main Menu',
        () => {
          game.changeState(new TitleState())
        },
        async () => {
          game.audioManager.switchMusic(BACKGROUND_TRACKS)
          await game.loadLevel(game.levelIndex)
          game.changeState(new PlayingState())
        },
      )
    }, 1200)
  }
}
