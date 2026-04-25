// ── Types ─────────────────────────────────────────────────────────────────────

export interface ApiScore {
  id:           number
  level_id:     string
  player_name:  string
  time_ms:      number
  coins:        number
  tiles:        number
  submitted_at: number
}

export interface ApiLevelEntry {
  levelId: string
  scores:  ApiScore[]
}

export interface FetchAllScoresResult {
  entries: ApiLevelEntry[]
  ok:      boolean
}

export interface PostScoreResult {
  accepted: boolean
  rank?:    number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function toLevelApiId(numericId: number): string {
  return `level-${String(numericId).padStart(2, '0')}`
}

const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:3000'
  : import.meta.env.VITE_LEADERBOARD_API_URL as string

// NOTE: VITE_HMAC_SECRET is bundled into the client JS. This is an inherent
// limitation of client-side signing and is acceptable for a hobby leaderboard.
const HMAC_SECRET = import.meta.env.VITE_HMAC_SECRET as string

async function importHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(HMAC_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

async function buildSignatureHeader(body: string): Promise<string> {
  const timestamp    = Date.now()
  const signingInput = `${timestamp}.${body}`
  const enc          = new TextEncoder()
  const key          = await importHmacKey()
  const signatureBuf = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput))
  const hexDigest    = Array.from(new Uint8Array(signatureBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `t=${timestamp},v=${hexDigest}`
}

// ── ApiClient ─────────────────────────────────────────────────────────────────

export class ApiClient {
  /** Fetch top-10 scores for every level. Returns ok=false on any error. */
  async fetchAllScores(): Promise<FetchAllScoresResult> {
    try {
      const res = await fetch(`${BASE_URL}/scores`)
      console.log(res);

      if (!res.ok) return { entries: [], ok: false }
      return {
        entries: (await res.json()) as ApiLevelEntry[],
        ok:      true,
      }
    } catch {
      return { entries: [], ok: false }
    }
  }

  /** Check whether a run qualifies for the global top 20. Returns false on error. */
  async qualify(
    levelApiId: string,
    metrics: { coins: number; tiles: number; time_ms: number },
  ): Promise<boolean> {
    try {
      const body = JSON.stringify({
        level_id: levelApiId,
        coins:    metrics.coins,
        tiles:    metrics.tiles,
        time_ms:  metrics.time_ms,
      })
      const res = await fetch(`${BASE_URL}/scores/qualify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (!res.ok) return false
      const data = (await res.json()) as { qualifiable: boolean }
      return data.qualifiable === true
    } catch {
      return false
    }
  }

  /** Submit a score. Returns null on any error. */
  async postScore(payload: {
    level_id:    string
    player_name: string
    coins:       number
    tiles:       number
    time_ms:     number
    timestamp:   number
  }): Promise<PostScoreResult | null> {
    try {
      const body      = JSON.stringify(payload)
      const signature = await buildSignatureHeader(body)
      const res       = await fetch(`${BASE_URL}/scores`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature':  signature,
        },
        body,
      })
      if (!res.ok) return null
      return (await res.json()) as PostScoreResult
    } catch {
      return null
    }
  }
}
