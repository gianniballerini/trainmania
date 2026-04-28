import soundDefs from '../../data/sounds.json'
import { BACKGROUND_TRACKS, DEFAULT_TRAIN_ID, TRAIN_OPTIONS } from '../Constants.js'
import type { Game } from '../Game.js'
import { isLevelUnlocked } from '../LeaderboardStore.js'
import { LEVELS } from '../levels/Level.js'
import { Train } from '../Train.js'
import { hideLevelPicker, hideOverlayLoadBar, hideTrainPicker, setOverlayBtnDisabled, showLevelPicker, showOverlay, showOverlayLoadBar, showTrainPicker } from '../ui.js'
import { BaseGameState } from './IGameState.js'
import { PlayingState } from './PlayingState.js'

export class TitleState extends BaseGameState {
  enter(game: Game): void {
    const savedTrainId = (() => {
      try { return localStorage.getItem('trainmania_selectedTrain') ?? DEFAULT_TRAIN_ID } catch { return DEFAULT_TRAIN_ID }
    })()
    let selectedTrainId = TRAIN_OPTIONS.some(o => o.id === savedTrainId) ? savedTrainId : DEFAULT_TRAIN_ID

    const unlockedOptions = LEVELS.filter(l => isLevelUnlocked(l.id))
    let selectedLevelId = unlockedOptions[unlockedOptions.length - 1]?.id ?? 1

    showTrainPicker(TRAIN_OPTIONS, selectedTrainId, (id) => {
      selectedTrainId = id
      try { localStorage.setItem('trainmania_selectedTrain', id) } catch { /* ignore */ }
    })

    showLevelPicker(LEVELS, selectedLevelId, (id) => {
      selectedLevelId = id
    })

    showOverlay(
      'TrainMania',
      'Place tracks before the train derails',
      'Start Game',
      async () => {
        Train.setModel(selectedTrainId)
        await Train.preload()
        game.levelIndex = LEVELS.findIndex(l => l.id === selectedLevelId)
        if (game.levelIndex < 0) game.levelIndex = 0
        await game.loadLevel(game.levelIndex)
        hideTrainPicker()
        hideLevelPicker()
        game.audioManager.init()
        game.audioManager.preloadSfx(soundDefs)
        game.audioManager.switchMusic(BACKGROUND_TRACKS)
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
