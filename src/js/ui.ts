import type { AudioManager } from './AudioManager.js'
import type { TrainOption } from './Constants.js'

const overlay     = document.querySelector<HTMLElement>('.overlay')!
const title       = document.querySelector<HTMLElement>('.overlay__title')!
const sub         = document.querySelector<HTMLElement>('.overlay__sub')!
let   btn         = document.querySelector<HTMLElement>('.overlay__btn')!
const scoreEl     = document.querySelector<HTMLElement>('.overlay__score')!
const scoreTimeEl = document.querySelector<HTMLElement>('.overlay__score-time')!
const scoreCoinsEl = document.querySelector<HTMLElement>('.overlay__score-coins')!

const trainPicker = document.querySelector<HTMLElement>('.overlay__train-picker')!
const trainStrip  = document.querySelector<HTMLElement>('.overlay__train-picker__strip')!

const trainPickerModal      = document.querySelector<HTMLElement>('.train-picker-modal')!
const trainPickerModalStrip = document.querySelector<HTMLElement>('.train-picker-modal__strip')!
let   trainPickerModalConfirmBtn = document.querySelector<HTMLElement>('.train-picker-modal__confirm')!

const loadingScreen  = document.querySelector<HTMLElement>('.loading-screen')!
const loadingBarFill = document.querySelector<HTMLElement>('.loading-screen__bar-fill')!
const loadingLabel   = document.querySelector<HTMLElement>('.loading-screen__label')!

// ── Loading screen ────────────────────────────────────────────────────────────

export function showLoadingScreen(): void {
  loadingScreen.classList.remove('hidden')
  loadingBarFill.style.width = '0%'
  loadingLabel.textContent = 'Loading…'
}

export function updateLoadingProgress(loaded: number, total: number): void {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0
  loadingBarFill.style.width = `${pct}%`
  loadingLabel.textContent = `Loading… ${loaded} / ${total}`
}

export function hideLoadingScreen(): void {
  loadingScreen.classList.add('hidden')
}

export function initUiSfx(audio: AudioManager): void {
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-sfx-click]')
    if (target) audio.playSfx('click')
  })

  // Blur any button after a pointer click so keyboard events (Space, Enter)
  // are never swallowed by a focused button.
  document.addEventListener('pointerup', () => {
    (document.activeElement as HTMLElement)?.blur()
  }, { capture: true })
}


export function showOverlay(
  titleText: string,
  subText: string,
  btnText: string,
  onBtn: () => void
): void {
  title.textContent = titleText
  sub.textContent   = subText
  overlay.classList.remove('hidden')

  // Replace node to drop any previous click listener, then update live reference
  const newBtn = btn.cloneNode(true) as HTMLElement
  const btnSpan = newBtn.querySelector('span')!
  btnSpan.textContent = btnText
  btn.replaceWith(newBtn)
  btn = newBtn
  btn.addEventListener('click', () => {
    hideOverlay()
    onBtn()
  }, { once: true })
}

export function hideOverlay(): void {
  overlay.classList.add('hidden')
}

export interface WinScore {
  time: number
  coins: number
  totalCoins: number
}

export function showWinOverlay(
  titleText: string,
  subText: string,
  score: WinScore,
  btnText: string,
  onBtn: () => void
): void {
  const m = Math.floor(score.time / 60)
  const s = Math.floor(score.time % 60).toString().padStart(2, '0')
  scoreTimeEl.textContent  = `${m}:${s}`
  scoreCoinsEl.textContent = score.totalCoins > 0 ? `${score.coins} / ${score.totalCoins}` : ''
  scoreEl.classList.toggle('hidden', score.totalCoins === 0)
  showOverlay(titleText, subText, btnText, onBtn)
}

// ── Train picker (shared) ─────────────────────────────────────────────────────

function renderTrainStrip(
  strip: HTMLElement,
  trains: TrainOption[],
  defaultId: string,
  onSelect: (id: string) => void,
): void {
  strip.innerHTML = ''
  trains.forEach((t) => {
    const card = document.createElement('div')
    card.className = 'train-card'
    if (t.id === defaultId) card.classList.add('is-selected')
    card.dataset.trainId = t.id

    const img = document.createElement('img')
    img.src = `/images/thumbnails/${t.id}.png`
    img.alt = t.label
    card.appendChild(img)

    const label = document.createElement('span')
    label.textContent = t.label
    card.appendChild(label)

    card.addEventListener('click', () => {
      strip.querySelectorAll('.is-selected').forEach((el) => el.classList.remove('is-selected'))
      card.classList.add('is-selected')
      onSelect(t.id)
    })

    strip.appendChild(card)
  })

  // Scroll to selected card
  const selected = strip.querySelector<HTMLElement>('.is-selected')
  if (selected) selected.scrollIntoView({ block: 'nearest', inline: 'center' })
}

// ── Title-screen inline picker ────────────────────────────────────────────────

export function showTrainPicker(
  trains: TrainOption[],
  defaultId: string,
  onSelect: (id: string) => void,
): void {
  renderTrainStrip(trainStrip, trains, defaultId, onSelect)
  trainPicker.classList.remove('hidden')
}

export function hideTrainPicker(): void {
  trainPicker.classList.add('hidden')
}

// ── Standalone "Choose Train" modal ───────────────────────────────────────────

export function showTrainPickerModal(
  trains: TrainOption[],
  currentId: string,
  onConfirm: (id: string) => void,
): void {
  let selectedId = currentId
  renderTrainStrip(trainPickerModalStrip, trains, currentId, (id) => { selectedId = id })
  trainPickerModal.classList.remove('hidden')

  // Backdrop click closes without applying
  const backdropHandler = (e: MouseEvent) => {
    if (e.target === trainPickerModal) {
      hideTrainPickerModal()
      trainPickerModal.removeEventListener('click', backdropHandler)
    }
  }
  trainPickerModal.addEventListener('click', backdropHandler)

  // Close button
  const closeBtn = trainPickerModal.querySelector<HTMLElement>('.train-picker-modal__close')!
  const closeBtnHandler = () => {
    hideTrainPickerModal()
    closeBtn.removeEventListener('click', closeBtnHandler)
  }
  closeBtn.addEventListener('click', closeBtnHandler)

  // Swap confirm button node to drop any stale listener
  const newBtn = trainPickerModalConfirmBtn.cloneNode(true) as HTMLElement
  trainPickerModalConfirmBtn.replaceWith(newBtn)
  trainPickerModalConfirmBtn = newBtn
  trainPickerModalConfirmBtn.addEventListener('click', () => {
    hideTrainPickerModal()
    onConfirm(selectedId)
  }, { once: true })
}

export function hideTrainPickerModal(): void {
  trainPickerModal.classList.add('hidden')
}
