import type { AudioManager } from './AudioManager.js'
import type { Game } from './Game.js'

export class SettingsUI {
  private readonly modal:       HTMLElement
  private readonly closeBtn:    HTMLElement
  private readonly tabs:        NodeListOf<HTMLButtonElement>
  private readonly panels:      NodeListOf<HTMLElement>
  private readonly btnMuteAll:  HTMLElement
  private readonly btnMuteMusic: HTMLElement
  private readonly btnMuteSfx:  HTMLElement
  private readonly sliderMusic: HTMLInputElement
  private readonly sliderSfx:   HTMLInputElement

  constructor(
    private readonly audio: AudioManager,
    private readonly game: Game,
  ) {
    this.modal        = document.querySelector('.settings')!
    this.closeBtn     = document.querySelector('.settings__close')!
    this.tabs         = document.querySelectorAll('.settings__tab')
    this.panels       = document.querySelectorAll('.settings__panel')
    this.btnMuteAll   = document.querySelector('.settings__mute-all')!
    this.btnMuteMusic = document.querySelector('.settings__mute-music')!
    this.btnMuteSfx   = document.querySelector('.settings__mute-sfx')!
    this.sliderMusic  = document.querySelector('.settings__music-slider')!
    this.sliderSfx    = document.querySelector('.settings__sfx-slider')!

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
    const { modal, closeBtn, tabs, panels } = this

    document.querySelector<HTMLElement>('.hud__settings-btn')!
      .addEventListener('click', () => this.open())

    closeBtn.addEventListener('click', () => this.close())
    modal.addEventListener('click', (e) => { if (e.target === modal) this.close() })

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t)  => t.classList.remove('active'))
        panels.forEach((p) => p.classList.remove('active'))
        tab.classList.add('active')
        document.querySelector(`.settings__panel--${tab.dataset.tab}`)?.classList.add('active')
      })
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

  private syncButtons(): void {
    const { audio } = this
    this.btnMuteAll.textContent    = audio.isAllMuted   ? '🔇 On'  : '🔇 Off'
    this.btnMuteMusic.textContent  = audio.isMusicMuted ? '🎵 Off' : '🎵 On'
    this.btnMuteSfx.textContent    = audio.isSfxMuted   ? '🔊 Off' : '🔊 On'
    this.btnMuteAll.classList.toggle('muted',   audio.isAllMuted)
    this.btnMuteMusic.classList.toggle('muted', audio.isMusicMuted)
    this.btnMuteSfx.classList.toggle('muted',   audio.isSfxMuted)
  }
}
