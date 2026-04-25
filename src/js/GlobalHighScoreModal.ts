import type { ApiClient } from './ApiClient.js'

const PLAYER_NAME_KEY = 'trainmania_player_name'

export class GlobalHighScoreModal {
  private readonly modal:     HTMLElement
  private readonly input:     HTMLInputElement
  private readonly errorEl:   HTMLElement
  private readonly submitBtn: HTMLElement
  private readonly skipBtn:   HTMLElement
  private readonly resultEl:  HTMLElement

  // Bound handlers — kept so they can be removed between calls
  private _onSubmit: (() => void) | null = null
  private _onSkip:   (() => void) | null = null

  constructor(private readonly apiClient: ApiClient) {
    this.modal     = document.querySelector<HTMLElement>('.global-score-modal')!
    this.input     = document.querySelector<HTMLInputElement>('.global-score-modal__input')!
    this.errorEl   = document.querySelector<HTMLElement>('.global-score-modal__error')!
    this.submitBtn = document.querySelector<HTMLElement>('.global-score-modal__submit')!
    this.skipBtn   = document.querySelector<HTMLElement>('.global-score-modal__skip')!
    this.resultEl  = document.querySelector<HTMLElement>('.global-score-modal__result')!
  }

  show(
    levelApiId: string,
    metrics: { coins: number; tiles: number; time_ms: number; timestamp: number },
    onDone: () => void,
  ): void {
    this.reset()

    // Pre-fill saved name
    const savedName = localStorage.getItem(PLAYER_NAME_KEY) ?? ''
    this.input.value = savedName

    // Remove any previous listeners
    if (this._onSubmit) this.submitBtn.removeEventListener('click', this._onSubmit)
    if (this._onSkip)   this.skipBtn.removeEventListener('click', this._onSkip)

    this._onSubmit = () => void this.handleSubmit(levelApiId, metrics, onDone)
    this._onSkip   = () => { this.close(); onDone() }

    this.submitBtn.addEventListener('click', this._onSubmit)
    this.skipBtn.addEventListener('click', this._onSkip, { once: true })

    this.modal.classList.remove('hidden')

    // Auto-focus input on next frame so the modal is visible first
    requestAnimationFrame(() => this.input.focus())
  }

  private async handleSubmit(
    levelApiId: string,
    metrics: { coins: number; tiles: number; time_ms: number; timestamp: number },
    onDone: () => void,
  ): Promise<void> {
    const name = this.input.value.trim()

    if (name.length < 1 || name.length > 32) {
      this.showError('Name must be 1–32 characters')
      return
    }

    this.hideError()
    this.setLoading(true)

    const result = await this.apiClient.postScore({
      level_id:    levelApiId,
      player_name: name,
      coins:       metrics.coins,
      tiles:       metrics.tiles,
      time_ms:     metrics.time_ms,
      timestamp:   metrics.timestamp,
    })

    this.setLoading(false)

    if (result === null) {
      this.showError("Couldn't submit — please try again")
      return
    }

    // Persist the name for next time
    try { localStorage.setItem(PLAYER_NAME_KEY, name) } catch { /* ignore */ }

    if (result.accepted && result.rank !== undefined) {
      this.showResult(`🎉 You're rank #${result.rank} globally!`)
    } else {
      // The board may have changed after qualify but before submit.
      this.showResult('That run no longer qualifies globally', true)
    }

    setTimeout(() => { this.close(); onDone() }, 1500)
  }

  private close(): void {
    this.modal.classList.add('hidden')
    if (this._onSubmit) this.submitBtn.removeEventListener('click', this._onSubmit)
    if (this._onSkip)   this.skipBtn.removeEventListener('click', this._onSkip)
    this._onSubmit = null
    this._onSkip   = null
  }

  private reset(): void {
    this.hideError()
    this.resultEl.textContent = ''
    this.resultEl.classList.add('hidden')
    this.resultEl.classList.remove('is-error')
    this.setLoading(false)
  }

  private setLoading(loading: boolean): void {
    this.submitBtn.classList.toggle('is-loading', loading)
  }

  private showError(msg: string): void {
    this.errorEl.textContent = msg
    this.errorEl.classList.remove('hidden')
  }

  private hideError(): void {
    this.errorEl.textContent = ''
    this.errorEl.classList.add('hidden')
  }

  private showResult(msg: string, isError = false): void {
    this.resultEl.textContent = msg
    this.resultEl.classList.toggle('is-error', isError)
    this.resultEl.classList.remove('hidden')
  }
}
