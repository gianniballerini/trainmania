// ── Types ─────────────────────────────────────────────────────────────────────

export interface LevelScore {
  coins:      number
  totalCoins: number
  tiles:      number   // railsPlaced
  time:       number   // playTime in seconds
  version:    1
}

type ScoreMap = Partial<Record<number, LevelScore>>

// ── Storage key ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'trainmania_scores_v1'

// ── Private helpers ───────────────────────────────────────────────────────────

function load(): ScoreMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as ScoreMap
  } catch {
    return {}
  }
}

function save(scores: ScoreMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
  } catch {
    // Storage unavailable — fail silently
  }
}

/**
 * Returns true if run A is strictly better than run B.
 * Ranking: More Coins → Fewer Tiles → Less Time.
 * On exact tie A is NOT considered better (existing score is kept).
 */
function isBetter(a: LevelScore, b: LevelScore): boolean {
  if (a.coins !== b.coins) return a.coins > b.coins
  if (a.tiles !== b.tiles) return a.tiles < b.tiles
  if (a.time  !== b.time)  return a.time  < b.time
  return false // exact tie — keep existing
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getBestScore(levelId: number): LevelScore | undefined {
  return load()[levelId]
}

export function getAllBestScores(): ScoreMap {
  return load()
}

/**
 * Saves run as best score for levelId only if it strictly beats the current
 * stored best (exact tie keeps the existing score).
 * Returns true when the stored score was updated.
 */
export function tryUpdateBestScore(levelId: number, run: LevelScore): boolean {
  const scores   = load()
  const existing = scores[levelId]
  if (existing && !isBetter(run, existing)) return false
  scores[levelId] = run
  save(scores)
  return true
}
