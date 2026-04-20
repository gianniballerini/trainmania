import type { AudioManager } from './AudioManager.js'
import type { TrainOption } from './Constants.js'

const overlay = document.querySelector<HTMLElement>('.overlay')!
const title   = document.querySelector<HTMLElement>('.overlay__title')!
const sub     = document.querySelector<HTMLElement>('.overlay__sub')!
let   btn     = document.querySelector<HTMLElement>('.overlay__btn')!

const trainPicker = document.querySelector<HTMLElement>('.overlay__train-picker')!
const trainStrip  = document.querySelector<HTMLElement>('.overlay__train-picker__strip')!

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
  newBtn.textContent = btnText
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

// ── Train picker ──────────────────────────────────────────────────────────────

export function showTrainPicker(
  trains: TrainOption[],
  defaultId: string,
  onSelect: (id: string) => void,
): void {
  trainStrip.innerHTML = ''
  trains.forEach((t) => {
    const card = document.createElement('div')
    card.className = 'overlay__train-picker__card'
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
      trainStrip.querySelectorAll('.is-selected').forEach((el) => el.classList.remove('is-selected'))
      card.classList.add('is-selected')
      onSelect(t.id)
    })

    trainStrip.appendChild(card)
  })
  trainPicker.classList.remove('hidden')
}

export function hideTrainPicker(): void {
  trainPicker.classList.add('hidden')
}
