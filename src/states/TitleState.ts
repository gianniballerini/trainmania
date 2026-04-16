import type { Game } from '../Game.js'
import { showOverlay } from '../ui.js'
import { BaseGameState } from './IGameState.js'
import { PlayingState } from './PlayingState.js'

export class TitleState extends BaseGameState {
  enter(game: Game): void {
    showOverlay(
      'TrainMania',
      'Place tracks before the train derails',
      'Start Game',
      () => {
        game.audioManager.init()
        game.audioManager.playMusic([
          '/assets/sound/background_01.webm',
          '/assets/sound/background_02.webm',
        ])
        game.changeState(new PlayingState())
      },
    )
  }
}
