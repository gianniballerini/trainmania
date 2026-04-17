import { BACKGROUND_TRACKS } from '../Constants.js'
import soundDefs from '../data/sounds.json'
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
        game.audioManager.preloadSfx(soundDefs)
        game.audioManager.playMusic(BACKGROUND_TRACKS)
        game.changeState(new PlayingState())
      },
    )
  }
}
