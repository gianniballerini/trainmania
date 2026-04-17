const overlay = document.querySelector<HTMLElement>('.overlay')!
const title   = document.querySelector<HTMLElement>('.overlay__title')!
const sub     = document.querySelector<HTMLElement>('.overlay__sub')!
let   btn     = document.querySelector<HTMLElement>('.overlay__btn')!

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
