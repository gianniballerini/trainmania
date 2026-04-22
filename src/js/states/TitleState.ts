import soundDefs from '../../data/sounds.json'
import { BACKGROUND_TRACKS, DEFAULT_TRAIN_ID, TRAIN_OPTIONS } from '../Constants.js'
import type { Game } from '../Game.js'
import { Train } from '../Train.js'
import { hideOverlayLoadBar, hideTrainPicker, setOverlayBtnDisabled, showOverlay, showOverlayLoadBar, showTrainPicker } from '../ui.js'
import { BaseGameState } from './IGameState.js'
import { PlayingState } from './PlayingState.js'

export class TitleState extends BaseGameState {
  enter(game: Game): void {
    let selectedTrainId = DEFAULT_TRAIN_ID

    showTrainPicker(TRAIN_OPTIONS, selectedTrainId, (id) => {
      selectedTrainId = id
    })

    showOverlay(
      'TrainMania',
      'Place tracks before the train derails',
      'Start Game',
      async () => {
        Train.setModel(selectedTrainId)
        await Train.preload()
        game.rebuildTrain()
        hideTrainPicker()
        game.audioManager.init()
        game.audioManager.preloadSfx(soundDefs)
        game.audioManager.playMusic(BACKGROUND_TRACKS)
        game.changeState(new PlayingState())
      },
    )

    showOverlayLoadBar()
    setOverlayBtnDisabled(true)
    game.assetsReady.then(() => {
      hideOverlayLoadBar()
      setOverlayBtnDisabled(false)
    }).catch(console.error)
  }
}
