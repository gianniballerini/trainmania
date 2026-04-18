import type { AudioManager } from './AudioManager.js'

const overlay = document.querySelector<HTMLElement>('.overlay')!
const title   = document.querySelector<HTMLElement>('.overlay__title')!
const sub     = document.querySelector<HTMLElement>('.overlay__sub')!
let   btn     = document.querySelector<HTMLElement>('.overlay__btn')!

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
