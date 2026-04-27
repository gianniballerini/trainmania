import { toLevelApiId, type ApiLevelEntry, type ApiScore } from './ApiClient.js'
import type { Game } from './Game.js'
import { getAllBestScores, type LevelScore } from './LeaderboardStore.js'
import { PlayingState } from './states/PlayingState.js'

// ── Production level metadata ─────────────────────────────────────────────────

const PRODUCTION_LEVELS = [
  { id: 1, label: 'Level 1' },
  { id: 2, label: 'Level 2' },
  { id: 3, label: 'Level 3' },
  { id: 4, label: 'Level 4' },
  { id: 5, label: 'Level 5' },
  { id: 6, label: 'Level 6' },
]

// ── Controller ────────────────────────────────────────────────────────────────

export class LeaderboardUI {
  private readonly modal:    HTMLElement
  private readonly modalBox: HTMLElement
  private readonly closeBtn: HTMLElement
  private readonly tabs:     NodeListOf<HTMLButtonElement>
  private readonly panels:   NodeListOf<HTMLElement>

  /** Whether the game was in PlayingState when the modal opened. */
  private wasPlaying = false

  private globalScores: ApiLevelEntry[] = []
  private globalScoresStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle'

  constructor(private readonly game: Game) {
    this.modal    = document.querySelector('.leaderboard')!
    this.modalBox = document.querySelector('.leaderboard__box')!
    this.closeBtn = document.querySelector('.leaderboard__close')!
    this.tabs     = document.querySelectorAll('.leaderboard__tab')
    this.panels   = document.querySelectorAll('.leaderboard__panel')

    this.bindEvents()
  }

  // ── Open / close ──────────────────────────────────────────────────────────

  open(): void {
    this.wasPlaying = this.game.currentState instanceof PlayingState
    if (this.wasPlaying) this.game.pause()

    if (this.globalScoresStatus === 'idle') {
      this.globalScoresStatus = 'loading'
    }

    // Render immediately with whatever we have.
    this.render()
    this.modal.classList.remove('hidden')

    // Fetch fresh global scores, then re-render level panels
    if (this.game.apiClient) {
      this.game.apiClient.fetchAllScores().then(({ entries, ok }) => {
        if (ok) {
          this.globalScores = entries
          this.globalScoresStatus = 'ready'
        } else if (this.globalScores.length === 0) {
          this.globalScoresStatus = 'error'
        }

        // Only re-render if the modal is still open
        if (this.isOpen) {
          const localScores = getAllBestScores()
          PRODUCTION_LEVELS.forEach(({ id }) => {
            this.renderLevel(id, localScores[id])
          })
        }
      })
    }
  }

  get isOpen(): boolean {
    return !this.modal.classList.contains('hidden')
  }

  close(): void {
    this.modal.classList.add('hidden')
    if (this.wasPlaying) this.game.resume()
    this.wasPlaying = false
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private bindEvents(): void {
    const { modal, modalBox, closeBtn, tabs } = this

    document.querySelector<HTMLElement>('.hud__leaderboard-btn')!
      .addEventListener('click', () => this.open())

    document.querySelector<HTMLElement>('.overlay__leaderboard-btn')
      ?.addEventListener('click', () => this.open())

    closeBtn.addEventListener('click', () => this.close())
    modal.addEventListener('click', (e) => { if (e.target === modal) this.close() })

    document.addEventListener('pointerdown', (e) => {
      if (modal.classList.contains('hidden')) return
      const target = e.target as Node | null
      if (!target || modalBox.contains(target)) return
      this.close()
    })

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'))
        this.panels.forEach((p) => p.classList.remove('active'))
        tab.classList.add('active')
        modal
          .querySelector(`.leaderboard__panel--${tab.dataset.tab}`)
          ?.classList.add('active')
      })
    })
  }

  /** Re-reads localStorage and re-renders all panels. */
  private render(): void {
    const scores = getAllBestScores()
    this.renderPersonal(scores)
    PRODUCTION_LEVELS.forEach(({ id }) => this.renderLevel(id, scores[id]))
  }

  private renderPersonal(scores: Partial<Record<number, LevelScore>>): void {
    const panel = this.modal.querySelector('.leaderboard__panel--personal')!
    panel.innerHTML = ''

    const table = document.createElement('table')
    table.className = 'lb-table'

    const thead = document.createElement('thead')
    thead.innerHTML = `
    <tr>
        <th class="lb-table__head-label">Level</th>
        <th class="lb-table__head-stat">Coins</th>
        <th class="lb-table__head-stat">Tiles</th>
        <th class="lb-table__head-stat">Time</th>
      </tr>`
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    PRODUCTION_LEVELS.forEach(({ id, label }) => {
      const s  = scores[id]
      const tr = document.createElement('tr')
      if (s) {
        tr.innerHTML = `
          <td class="lb-table__label">${label}</td>
          <td class="lb-table__stat">${s.coins}<span class="lb-table__total">/${s.totalCoins}</span></td>
          <td class="lb-table__stat">${s.tiles}</td>
          <td class="lb-table__stat">${formatTime(s.time)}</td>`
      } else {
        tr.innerHTML = `
          <td class="lb-table__label">${label}</td>
          <td class="lb-table__empty" colspan="3">No score yet</td>`
      }
      tbody.appendChild(tr)
    })
    table.appendChild(tbody)
    panel.appendChild(table)
  }

  private renderLevel(
    levelId: number,
    localScore: LevelScore | undefined,
  ): void {
    const panel = this.modal.querySelector(`.leaderboard__panel--level-${levelId}`)!
    panel.innerHTML = ''

    // ── Personal best ─────────────────────────────────────────────────────
    if (localScore) {
      const heading = document.createElement('p')
      heading.className = 'lb-section-heading'
      heading.textContent = 'My Best'
      panel.appendChild(heading)

      const table = document.createElement('table')
      table.className = 'lb-table lb-table--single'

      const thead = document.createElement('thead')
      thead.innerHTML = `
        <tr>
          <th class="lb-table__head-stat">Coins</th>
          <th class="lb-table__head-stat">Tiles</th>
          <th class="lb-table__head-stat">Time</th>
        </tr>`
      table.appendChild(thead)

      const tbody = document.createElement('tbody')
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td class="lb-table__stat">${localScore.coins}<span class="lb-table__total">/${localScore.totalCoins}</span></td>
        <td class="lb-table__stat">${localScore.tiles}</td>
        <td class="lb-table__stat">${formatTime(localScore.time)}</td>`
      tbody.appendChild(tr)
      table.appendChild(tbody)
      panel.appendChild(table)
    }

    // ── Global top 10 ─────────────────────────────────────────────────────
    const globalHeading = document.createElement('p')
    globalHeading.className = 'lb-section-heading'
    globalHeading.textContent = 'Global Top 10'
    panel.appendChild(globalHeading)

    if (this.globalScoresStatus === 'loading' || this.globalScoresStatus === 'idle') {
      const loading = document.createElement('p')
      loading.className = 'lb-loading'
      loading.textContent = 'Loading…'
      panel.appendChild(loading)
      return
    }

    if (this.globalScoresStatus === 'error') {
      const error = document.createElement('p')
      error.className = 'lb-error'
      error.textContent = 'Could not load global scores'
      panel.appendChild(error)
      return
    }

    const levelApiId = toLevelApiId(levelId)
    const entry      = this.globalScores.find((e) => e.levelId === levelApiId)
    const apiScores: ApiScore[] = entry?.scores ?? []

    if (apiScores.length === 0) {
      const empty = document.createElement('p')
      empty.className = 'lb-empty'
      empty.textContent = 'No global scores yet'
      panel.appendChild(empty)
      return
    }

    const table = document.createElement('table')
    table.className = 'lb-table lb-table--global'

    const thead = document.createElement('thead')
    thead.innerHTML = `
      <tr>
        <th class="lb-table__head-rank">#</th>
        <th class="lb-table__head-label">Name</th>
        <th class="lb-table__head-stat">Coins</th>
        <th class="lb-table__head-stat">Tiles</th>
        <th class="lb-table__head-stat">Time</th>
      </tr>`
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    apiScores.forEach((s, i) => {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td class="lb-table__rank">${i + 1}</td>
        <td class="lb-table__label">${escapeHtml(s.player_name)}</td>
        <td class="lb-table__stat">${s.coins}</td>
        <td class="lb-table__stat">${s.tiles}</td>
        <td class="lb-table__stat">${formatTimeMs(s.time_ms)}</td>`
      tbody.appendChild(tr)
    })
    table.appendChild(tbody)
    panel.appendChild(table)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return m > 0 ? `${m}:${s}` : `${Math.floor(seconds)}s`
}

function formatTimeMs(ms: number): string {
  return formatTime(ms / 1000)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
