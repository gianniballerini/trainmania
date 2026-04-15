import { PieceId, TILE_POOL, tileToPieceId, TileType, TRACK_PIECES } from './Constants.js'

// SVG icons for the two base tile types (un-rotated; rotation is applied via CSS transform)
const TILE_ICONS: Record<TileType, string> = {
  STRAIGHT: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="27" y="4" width="5" height="56" rx="2" fill="#aaa"/>
    <rect x="20" y="4" width="3" height="56" rx="1.5" fill="#888"/>
    <rect x="41" y="4" width="3" height="56" rx="1.5" fill="#888"/>
    <rect x="18" y="14" width="28" height="5" rx="2" fill="#8b6040"/>
    <rect x="18" y="28" width="28" height="5" rx="2" fill="#8b6040"/>
    <rect x="18" y="42" width="28" height="5" rx="2" fill="#8b6040"/>
  </svg>`,
  CURVE: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 4 Q32 32 60 32" stroke="#aaa" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M24 4 Q24 40 60 40" stroke="#888" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M40 4 Q40 24 60 24" stroke="#888" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`,
}

interface TileSlot {
  type: TileType | null
  rotation: number
}

const CARD_COUNT = 4
const REFILL_DELAY_MS = 900

export class CardTray {
  onCardSelect: (pieceId: PieceId | null) => void
  hand: TileSlot[]
  selected: number | null
  el: HTMLElement

  constructor(onCardSelect: (pieceId: PieceId | null) => void) {
    this.onCardSelect = onCardSelect
    this.hand         = []
    this.selected     = null

    this.el = document.getElementById('cards')!
    this._initHand()
    this._render()
  }

  _randomSlot(): TileSlot {
    return {
      type: TILE_POOL[Math.floor(Math.random() * TILE_POOL.length)],
      rotation: 0,
    }
  }

  _initHand(): void {
    for (let i = 0; i < CARD_COUNT; i++) {
      this.hand.push(this._randomSlot())
    }
  }

  _resolvedPieceId(slot: TileSlot): PieceId | null {
    if (!slot.type) return null
    return tileToPieceId(slot.type, slot.rotation)
  }

  _render(): void {
    this.el.innerHTML = ''
    this.hand.forEach((slot, i) => {
      const div = document.createElement('div')
      const isEmpty = slot.type === null
      div.className = 'card' + (isEmpty ? ' empty' : '') + (this.selected === i ? ' selected' : '')

      if (slot.type) {
        const rotDeg = slot.rotation * 90
        const piece = TRACK_PIECES[this._resolvedPieceId(slot)!]
        div.innerHTML = `
          <div class="card-icon" style="transform: rotate(${rotDeg}deg)">${TILE_ICONS[slot.type]}</div>
          <div class="card-name">${piece.label}</div>
        `
        div.addEventListener('click', () => this._selectCard(i))
        div.addEventListener('contextmenu', (e) => {
          e.preventDefault()
          this._rotateCard(i)
        })
      }
      this.el.appendChild(div)
    })
  }

  _selectCard(index: number): void {
    if (this.hand[index].type === null) return
    if (this.selected === index) {
      this.selected = null
    } else {
      this.selected = index
    }
    this._render()
    this._emitSelection()
  }

  _rotateCard(index: number): void {
    const slot = this.hand[index]
    if (!slot.type) return
    slot.rotation = (slot.rotation + 1) % 4
    this._render()
    if (this.selected === index) {
      this._emitSelection()
    }
  }

  rotateSelected(): void {
    if (this.selected === null) return
    this._rotateCard(this.selected)
  }

  _emitSelection(): void {
    if (this.selected !== null) {
      this.onCardSelect(this._resolvedPieceId(this.hand[this.selected]))
    } else {
      this.onCardSelect(null)
    }
  }

  useSelected(): PieceId | null {
    if (this.selected === null) return null
    const slot = this.hand[this.selected]
    const pieceId = this._resolvedPieceId(slot)
    if (!pieceId) return null

    this.hand[this.selected] = { type: null, rotation: 0 }
    const usedIndex = this.selected
    this.selected = null
    this._render()
    this.onCardSelect(null)

    // Refill after delay
    setTimeout(() => {
      this.hand[usedIndex] = this._randomSlot()
      this._render()
    }, REFILL_DELAY_MS)

    return pieceId
  }

  getSelected(): PieceId | null {
    if (this.selected === null) return null
    return this._resolvedPieceId(this.hand[this.selected])
  }

  clearSelection(): void {
    this.selected = null
    this._render()
    this.onCardSelect(null)
  }

  reset(): void {
    this.hand     = []
    this.selected = null
    this._initHand()
    this._render()
  }
}
