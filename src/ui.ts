const overlay = document.querySelector<HTMLElement>('.overlay')!
const title   = document.querySelector<HTMLElement>('.overlay__title')!
const sub     = document.querySelector<HTMLElement>('.overlay__sub')!
const btn     = document.querySelector<HTMLElement>('.overlay__btn')!

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
  document.querySelector<HTMLElement>('.overlay__btn')!.addEventListener('click', () => {
    hideOverlay()
    onBtn()
  })
}

export function hideOverlay(): void {
  overlay.classList.add('hidden')
}
