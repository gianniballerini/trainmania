import type { CellType, Direction, PieceId } from '../Constants.js'
import { type GridCell } from '../GridCell.js'
import { LEVELS } from '../levels/Level.js'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditorCell {
  type: CellType
  piece?: PieceId
  dir?: Direction
  hasCoin: boolean
}

interface PaletteItem {
  id: string
  label: string
  color: string
  make: () => EditorCell
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_ROWS = 7
const DEFAULT_COLS = 7

const TILE_COLORS: Record<string, string> = {
  VOID:      '#1a1a2e',
  FLOOR:     '#c8a97a',
  GRASS:     '#4a7c59',
  SNOW:      '#d6eaf8',
  SNOW_ROCK: '#85929e',
  ROCK:      '#5d6d7e',
  RAIL:      '#2c3e50',
  START:     '#e67e22',
  STATION:   '#8e44ad',
}

const PALETTE: PaletteItem[] = [
  // Terrain
  { id: 'VOID',      label: 'Void',      color: TILE_COLORS.VOID,      make: () => ({ type: 'VOID',      hasCoin: false }) },
  { id: 'FLOOR',     label: 'Floor',     color: TILE_COLORS.FLOOR,     make: () => ({ type: 'FLOOR',     hasCoin: false }) },
  { id: 'GRASS',     label: 'Grass',     color: TILE_COLORS.GRASS,     make: () => ({ type: 'GRASS',     hasCoin: false }) },
  { id: 'SNOW',      label: 'Snow',      color: TILE_COLORS.SNOW,      make: () => ({ type: 'SNOW',      hasCoin: false }) },
  { id: 'SNOW_ROCK', label: 'SnowRock',  color: TILE_COLORS.SNOW_ROCK, make: () => ({ type: 'SNOW_ROCK', hasCoin: false }) },
  { id: 'ROCK',      label: 'Rock',      color: TILE_COLORS.ROCK,      make: () => ({ type: 'ROCK',      hasCoin: false }) },
  // Special
  { id: 'STATION',   label: 'Station',   color: TILE_COLORS.STATION,   make: () => ({ type: 'STATION',   hasCoin: false }) },
  { id: 'START_N',   label: 'Start ↑',   color: TILE_COLORS.START,     make: () => ({ type: 'START',     dir: 'N', hasCoin: false }) },
  { id: 'START_S',   label: 'Start ↓',   color: TILE_COLORS.START,     make: () => ({ type: 'START',     dir: 'S', hasCoin: false }) },
  { id: 'START_E',   label: 'Start →',   color: TILE_COLORS.START,     make: () => ({ type: 'START',     dir: 'E', hasCoin: false }) },
  { id: 'START_W',   label: 'Start ←',   color: TILE_COLORS.START,     make: () => ({ type: 'START',     dir: 'W', hasCoin: false }) },
  // Rail pieces
  { id: 'STRAIGHT_NS', label: '║ NS',    color: TILE_COLORS.RAIL,      make: () => ({ type: 'RAIL', piece: 'STRAIGHT_NS', hasCoin: false }) },
  { id: 'STRAIGHT_EW', label: '═ EW',    color: TILE_COLORS.RAIL,      make: () => ({ type: 'RAIL', piece: 'STRAIGHT_EW', hasCoin: false }) },
  { id: 'CURVE_NE',    label: '╚ NE',    color: TILE_COLORS.RAIL,      make: () => ({ type: 'RAIL', piece: 'CURVE_NE',    hasCoin: false }) },
  { id: 'CURVE_NW',    label: '╝ NW',    color: TILE_COLORS.RAIL,      make: () => ({ type: 'RAIL', piece: 'CURVE_NW',    hasCoin: false }) },
  { id: 'CURVE_SE',    label: '╔ SE',    color: TILE_COLORS.RAIL,      make: () => ({ type: 'RAIL', piece: 'CURVE_SE',    hasCoin: false }) },
  { id: 'CURVE_SW',    label: '╗ SW',    color: TILE_COLORS.RAIL,      make: () => ({ type: 'RAIL', piece: 'CURVE_SW',    hasCoin: false }) },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeVoid(): EditorCell {
  return { type: 'VOID', hasCoin: false }
}

function fromGridCell(cell: GridCell): EditorCell {
  return {
    type: cell.type,
    piece: cell.prebuiltPiece,
    dir: cell.dir,
    hasCoin: cell.hasCoin ?? false,
  }
}

function cellLabel(cell: EditorCell): string {
  if (cell.type === 'VOID') return ''
  if (cell.type === 'START') return `S(${cell.dir ?? ''})`
  if (cell.type === 'STATION') return 'T'
  if (cell.type === 'RAIL') return cell.piece?.replace('STRAIGHT_', '').replace('CURVE_', '⌒') ?? 'R'
  const abbrev: Partial<Record<CellType, string>> = {
    FLOOR: 'F', GRASS: 'G', SNOW: 'Sn', SNOW_ROCK: 'SnX', ROCK: 'X',
  }
  return abbrev[cell.type] ?? cell.type
}

// ─── LevelEditor ─────────────────────────────────────────────────────────────

export class LevelEditor {
  private grid: EditorCell[][]
  private rows: number
  private cols: number
  private selectedTool: PaletteItem = PALETTE[0]
  private isPainting = false

  constructor() {
    this.rows = DEFAULT_ROWS
    this.cols = DEFAULT_COLS
    this.grid = this.makeBlankGrid(this.rows, this.cols)
    this.buildPalette()
    this.buildLevelSelector()
    this.bindControls()
    this.render()
  }

  // ── Grid helpers ────────────────────────────────────────────────────────────

  private makeBlankGrid(rows: number, cols: number): EditorCell[][] {
    return Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => makeVoid()),
    )
  }

  private blankRow(): EditorCell[] {
    return Array.from({ length: this.cols }, () => makeVoid())
  }

  private blankCol(): EditorCell[] {
    return Array.from({ length: this.rows }, () => makeVoid())
  }

  // ── Level selector ──────────────────────────────────────────────────────────

  private buildLevelSelector(): void {
    const sel = document.getElementById('level-select') as HTMLSelectElement
    LEVELS.forEach((level) => {
      const opt = document.createElement('option')
      opt.value = String(level.id)
      opt.textContent = level.label
      sel.appendChild(opt)
    })
  }

  private loadLevel(id: number): void {
    const level = LEVELS.find((l) => l.id === id)
    if (!level) return

    this.rows = level.grid.length
    this.cols = level.grid[0]?.length ?? DEFAULT_COLS
    this.grid = level.grid.map((row) => row.map(fromGridCell))

    // Populate meta inputs
    ;(document.getElementById('meta-id')       as HTMLInputElement).value = String(level.id)
    ;(document.getElementById('meta-label')    as HTMLInputElement).value = level.label
    ;(document.getElementById('meta-speed')    as HTMLInputElement).value = String(level.baseSpeed)
    ;(document.getElementById('meta-countdown') as HTMLInputElement).value = String(level.countdown ?? 10)
    ;(document.getElementById('meta-coins')    as HTMLInputElement).value = level.coins != null ? String(level.coins) : ''

    // Clear generated output so it isn't stale
    ;(document.getElementById('code-output') as HTMLTextAreaElement).value = ''

    this.render()
  }

  // ── Palette ─────────────────────────────────────────────────────────────────

  private buildPalette(): void {
    const container = document.getElementById('palette')!
    PALETTE.forEach((item) => {
      const el = document.createElement('div')
      el.className = 'palette-item'
      el.style.backgroundColor = item.color
      el.textContent = item.label
      el.dataset.id = item.id
      if (item.id === this.selectedTool.id) el.classList.add('selected')
      el.addEventListener('click', () => this.selectTool(item, el))
      container.appendChild(el)
    })
  }

  private selectTool(item: PaletteItem, el: HTMLElement): void {
    this.selectedTool = item
    document.querySelectorAll('.palette-item').forEach((p) => p.classList.remove('selected'))
    el.classList.add('selected')
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  render(): void {
    const container = document.getElementById('grid-container')!
    container.style.gridTemplateColumns = `repeat(${this.cols}, 44px)`
    container.innerHTML = ''

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c]
        const el = document.createElement('div')
        el.className = 'grid-cell'
        el.style.backgroundColor = TILE_COLORS[cell.type] ?? '#333'

        const labelEl = document.createElement('span')
        labelEl.className = 'cell-label'
        labelEl.textContent = cellLabel(cell)
        el.appendChild(labelEl)

        if (cell.hasCoin) {
          const coin = document.createElement('span')
          coin.className = 'coin-dot'
          coin.textContent = '●'
          el.appendChild(coin)
        }

        el.addEventListener('mousedown', (e) => {
          e.preventDefault()
          if (e.button === 2) {
            this.toggleCoin(r, c)
          } else {
            this.isPainting = true
            this.paintCell(r, c)
          }
        })
        el.addEventListener('mouseenter', () => {
          if (this.isPainting) this.paintCell(r, c)
        })
        el.addEventListener('contextmenu', (e) => e.preventDefault())

        container.appendChild(el)
      }
    }
  }

  // ── Cell editing ─────────────────────────────────────────────────────────────

  private paintCell(r: number, c: number): void {
    const newCell = this.selectedTool.make()
    // preserve coin when overwriting a non-VOID cell if the new type supports coins
    if (this.grid[r][c].hasCoin && newCell.type !== 'VOID') {
      newCell.hasCoin = true
    }
    this.grid[r][c] = newCell
    this.refreshCell(r, c)
  }

  private toggleCoin(r: number, c: number): void {
    const cell = this.grid[r][c]
    if (cell.type === 'VOID') return
    cell.hasCoin = !cell.hasCoin
    this.refreshCell(r, c)
  }

  private refreshCell(r: number, c: number): void {
    const container = document.getElementById('grid-container')!
    const index = r * this.cols + c
    const existing = container.children[index] as HTMLElement | undefined
    if (!existing) return

    const cell = this.grid[r][c]
    existing.style.backgroundColor = TILE_COLORS[cell.type] ?? '#333'

    const labelEl = existing.querySelector('.cell-label')!
    labelEl.textContent = cellLabel(cell)

    const existingCoin = existing.querySelector('.coin-dot')
    if (cell.hasCoin && !existingCoin) {
      const coin = document.createElement('span')
      coin.className = 'coin-dot'
      coin.textContent = '●'
      existing.appendChild(coin)
    } else if (!cell.hasCoin && existingCoin) {
      existingCoin.remove()
    }
  }

  // ── Resize ───────────────────────────────────────────────────────────────────

  private addRow(edge: 'top' | 'bottom'): void {
    const row = this.blankRow()
    if (edge === 'top') this.grid.unshift(row)
    else this.grid.push(row)
    this.rows++
    this.render()
  }

  private removeRow(edge: 'top' | 'bottom'): void {
    if (this.rows <= 1) return
    if (edge === 'top') this.grid.shift()
    else this.grid.pop()
    this.rows--
    this.render()
  }

  private addCol(edge: 'left' | 'right'): void {
    this.grid.forEach((row) => {
      if (edge === 'left') row.unshift(makeVoid())
      else row.push(makeVoid())
    })
    this.cols++
    this.render()
  }

  private removeCol(edge: 'left' | 'right'): void {
    if (this.cols <= 1) return
    this.grid.forEach((row) => {
      if (edge === 'left') row.shift()
      else row.pop()
    })
    this.cols--
    this.render()
  }

  // ── Code generation ──────────────────────────────────────────────────────────

  private generateCode(): string {
    // Determine which shorthand functions are used
    const used = new Set<string>()
    let hasCoin = false

    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.type === 'VOID')           used.add('V')
        else if (cell.type === 'FLOOR')     used.add('F')
        else if (cell.type === 'GRASS')     used.add('G')
        else if (cell.type === 'SNOW')      used.add('Sn')
        else if (cell.type === 'SNOW_ROCK') used.add('SnX')
        else if (cell.type === 'ROCK')      used.add('X')
        else if (cell.type === 'RAIL')      used.add('R')
        else if (cell.type === 'START')     used.add('S')
        else if (cell.type === 'STATION')   used.add('T')
        if (cell.hasCoin) hasCoin = true
      }
    }
    if (hasCoin) used.add('coin')

    const imports = [...used].join(', ')

    // Build per-cell expressions, then pad columns for alignment
    const expressions: string[][] = this.grid.map((row) =>
      row.map((cell) => {
        let base: string
        if (cell.type === 'VOID')           base = 'V()'
        else if (cell.type === 'FLOOR')     base = 'F()'
        else if (cell.type === 'GRASS')     base = 'G()'
        else if (cell.type === 'SNOW')      base = 'Sn()'
        else if (cell.type === 'SNOW_ROCK') base = 'SnX()'
        else if (cell.type === 'ROCK')      base = 'X()'
        else if (cell.type === 'STATION')   base = 'T()'
        else if (cell.type === 'START')     base = `S('${cell.dir ?? 'S'}')`
        else if (cell.type === 'RAIL')      base = `R('${cell.piece ?? 'STRAIGHT_NS'}')`
        else                                base = 'V()'

        return cell.hasCoin ? `coin(${base})` : base
      }),
    )

    // Column widths for alignment
    const colWidths = Array.from({ length: this.cols }, (_, c) =>
      Math.max(...expressions.map((row) => row[c].length)),
    )

    const meta = this.getMeta()
    const indent = '        '
    const gridRows = expressions
      .map((row) => {
        const cells = row.map((expr, c) => expr.padEnd(colWidths[c])).join(', ')
        return `${indent}[${cells}]`
      })
      .join(',\n')

    const coinsLine = meta.coins !== null ? `\n    coins = ${meta.coins}` : ''

    return [
      `import { ${imports} } from '../GridCell'`,
      `import type { Level } from './Level'`,
      ``,
      `class Level${meta.id} implements Level {`,
      `    id = ${meta.id}`,
      `    label = '${meta.label}'`,
      `    grid = [`,
      gridRows,
      `    ]`,
      `    baseSpeed = ${meta.baseSpeed}`,
      `    countdown = ${meta.countdown}${coinsLine}`,
      `}`,
      ``,
      `export { Level${meta.id} }`,
    ].join('\n')
  }

  private getMeta() {
    const id        = parseInt((document.getElementById('meta-id') as HTMLInputElement).value) || 1
    const label     = (document.getElementById('meta-label') as HTMLInputElement).value || `Level ${id}`
    const baseSpeed = parseInt((document.getElementById('meta-speed') as HTMLInputElement).value) || 3000
    const countdown = parseInt((document.getElementById('meta-countdown') as HTMLInputElement).value) || 10
    const coinsRaw  = (document.getElementById('meta-coins') as HTMLInputElement).value.trim()
    const coins     = coinsRaw !== '' ? parseInt(coinsRaw) : null
    return { id, label, baseSpeed, countdown, coins }
  }

  // ── Controls wiring ──────────────────────────────────────────────────────────

  private bindControls(): void {
    // Stop painting when mouse is released anywhere
    document.addEventListener('mouseup', () => { this.isPainting = false })

    // Level selector
    const sel = document.getElementById('level-select') as HTMLSelectElement
    sel.addEventListener('change', () => {
      if (sel.value === '') {
        this.rows = DEFAULT_ROWS
        this.cols = DEFAULT_COLS
        this.grid = this.makeBlankGrid(this.rows, this.cols)
        ;(document.getElementById('code-output') as HTMLTextAreaElement).value = ''
        this.render()
      } else {
        this.loadLevel(parseInt(sel.value))
      }
    })

    // Resize buttons
    document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action!
        const edge   = btn.dataset.edge as 'top' | 'bottom' | 'left' | 'right'
        if (action === 'add-row')    this.addRow(edge as 'top' | 'bottom')
        if (action === 'remove-row') this.removeRow(edge as 'top' | 'bottom')
        if (action === 'add-col')    this.addCol(edge as 'left' | 'right')
        if (action === 'remove-col') this.removeCol(edge as 'left' | 'right')
      })
    })

    // Generate
    document.getElementById('generate-btn')!.addEventListener('click', () => {
      const code = this.generateCode()
      ;(document.getElementById('code-output') as HTMLTextAreaElement).value = code
    })

    // Copy
    document.getElementById('copy-btn')!.addEventListener('click', async () => {
      const ta = document.getElementById('code-output') as HTMLTextAreaElement
      if (!ta.value) {
        ta.value = this.generateCode()
      }
      try {
        await navigator.clipboard.writeText(ta.value)
        const btn = document.getElementById('copy-btn')!
        btn.textContent = 'Copied!'
        setTimeout(() => { btn.textContent = 'Copy' }, 1500)
      } catch {
        ta.select()
        document.execCommand('copy')
      }
    })
  }
}
