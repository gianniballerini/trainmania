const overlay = document.getElementById('overlay')!
const title   = document.getElementById('overlay-title')!
const sub     = document.getElementById('overlay-sub')!
const btn     = document.getElementById('overlay-btn')!

export function showOverlay(
  titleText: string,
  subText: string,
  btnText: string,
  onBtn: () => void
): void {
  title.textContent = titleText
  sub.textContent   = subText
  btn.textContent   = btnText
  overlay.classList.remove('hidden')

  // Remove previous listener
  const newBtn = btn.cloneNode(true) as HTMLElement
  btn.replaceWith(newBtn)
  newBtn.textContent = btnText
  document.getElementById('overlay-btn')!.addEventListener('click', () => {
    hideOverlay()
    onBtn()
  })
}

export function hideOverlay(): void {
  overlay.classList.add('hidden')
}
