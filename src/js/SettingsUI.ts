import type { AudioManager } from './AudioManager.js'
import { TRAIN_OPTIONS } from './Constants.js'
import type { Game } from './Game.js'
import { Train } from './Train.js'
import { showTrainPickerModal } from './ui.js'

export class SettingsUI {
  private readonly modal:       HTMLElement
  private readonly modalBox:    HTMLElement
  private readonly closeBtn:    HTMLElement
  private readonly tabs:        NodeListOf<HTMLButtonElement>
  private readonly panels:      NodeListOf<HTMLElement>

  private readonly hudMutAll:  HTMLElement
  private readonly btnMuteAll:  HTMLElement
  private readonly btnMuteMusic: HTMLElement
  private readonly btnMuteSfx:  HTMLElement
  private readonly sliderMusic: HTMLInputElement
  private readonly sliderSfx:   HTMLInputElement
  private readonly btnInvertY:  HTMLButtonElement

  constructor(
    private readonly audio: AudioManager,
    private readonly game: Game,
  ) {
    this.modal        = document.querySelector('.settings')!
    this.modalBox     = document.querySelector('.settings__box')!
    this.closeBtn     = document.querySelector('.settings__close')!
    this.tabs         = document.querySelectorAll('.settings__tab')
    this.panels       = document.querySelectorAll('.settings__panel')

    this.hudMutAll   = document.querySelector('.hud__mute-btn')!
    this.btnMuteAll   = document.querySelector('.settings__mute-all')!
    this.btnMuteMusic = document.querySelector('.settings__mute-music')!
    this.btnMuteSfx   = document.querySelector('.settings__mute-sfx')!

    this.sliderMusic  = document.querySelector('.settings__music-slider')!
    this.sliderSfx    = document.querySelector('.settings__sfx-slider')!
    this.btnInvertY   = document.querySelector('.settings__invert-y-btn')!

    this.syncInvertY()
    this.bindEvents()
  }

  // ── Open / close ──────────────────────────────────────────────────────────

  open(): void {
    this.game.pause()
    this.modal.classList.remove('hidden')
  }

  close(): void {
    this.modal.classList.add('hidden')
    this.game.resume()
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private bindEvents(): void {
    const { modal, modalBox, closeBtn, tabs, panels } = this

    document.querySelector<HTMLElement>('.hud__settings-btn')!
      .addEventListener('click', () => this.open())

    closeBtn.addEventListener('click', () => this.close())
    modal.addEventListener('click', (e) => { if (e.target === modal) this.close() })
    document.addEventListener('pointerdown', (e) => {
      if (modal.classList.contains('hidden')) return
      const target = e.target as Node | null
      if (!target || modalBox.contains(target)) return
      this.close()
    })

    document.querySelector<HTMLElement>('.settings__change-train')!
      .addEventListener('click', () => this.changeTrain())

    this.btnInvertY.addEventListener('click', () => {
      this.game.cameraController.invertY = !this.game.cameraController.invertY
      this.syncInvertY()
    })

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t)  => t.classList.remove('active'))
        panels.forEach((p) => p.classList.remove('active'))
        tab.classList.add('active')
        document.querySelector(`.settings__panel--${tab.dataset.tab}`)?.classList.add('active')
      })
    })

    this.hudMutAll.addEventListener('click', () => {
      this.audio.muteAll(!this.audio.isAllMuted)
      this.syncButtons()
    })

    this.btnMuteAll.addEventListener('click', () => {
      this.audio.muteAll(!this.audio.isAllMuted)
      this.syncButtons()
    })
    this.btnMuteMusic.addEventListener('click', () => {
      this.audio.muteMusic(!this.audio.isMusicMuted)
      this.syncButtons()
    })
    this.btnMuteSfx.addEventListener('click', () => {
      this.audio.muteSfx(!this.audio.isSfxMuted)
      this.syncButtons()
    })

    this.sliderMusic.addEventListener('input', () =>
      this.audio.setMusicVolume(parseFloat(this.sliderMusic.value)))
    this.sliderSfx.addEventListener('input', () =>
      this.audio.setSfxVolume(parseFloat(this.sliderSfx.value)))
  }

  changeTrain(): void {
    const currentId = Train.getModelId()
    showTrainPickerModal(TRAIN_OPTIONS, currentId, async (id) => {
      if (id === currentId) return
      Train.setModel(id)
      await Train.preload()
      this.game.rebuildTrain()
    })
  }

  private syncButtons(): void {
    const { audio } = this
    const toggle = (btn: HTMLElement, muted: boolean) => {
      const [imgOn, imgOff] = btn.querySelectorAll<HTMLImageElement>('img')
      const [hudImgOn, hudImgOff] = this.hudMutAll.querySelectorAll<HTMLImageElement>('img')

      hudImgOn.classList.toggle('hidden', muted)
      hudImgOff.classList.toggle('hidden', !muted)
      imgOn.classList.toggle('hidden', muted)
      imgOff.classList.toggle('hidden', !muted)

      btn.classList.toggle('muted', muted)
    }
    toggle(this.btnMuteAll,   audio.isAllMuted)
    toggle(this.btnMuteMusic, audio.isMusicMuted)
    toggle(this.btnMuteSfx,   audio.isSfxMuted)
  }

  private syncInvertY(): void {
    const on = this.game.cameraController.invertY
    this.btnInvertY.textContent = on ? 'On' : 'Off'
    this.btnInvertY.classList.toggle('on', on)
  }
}
