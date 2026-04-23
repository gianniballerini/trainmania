/**
 * AudioManager — handles background music and sound effects.
 *
 * Music: sequential playlist via HTMLAudioElement (streams efficiently).
 * SFX:   one-shot playback via Web Audio API (precise, low-latency).
 *       Call `preloadSfx()` at startup to decode and cache all buffers.
 *       Then call `playSfx(name)` for instant zero-latency playback.
 *
 * Browser autoplay policy: call `init()` from inside a user gesture handler
 * before attempting to play anything.
 */

export interface SoundDef {
  name:    string
  path:    string
  volume?: number
}

export class AudioManager {
  // ── State ──────────────────────────────────────────────────────────────────
  private _musicVolume = 0.5
  private _sfxVolume   = 0.7
  private _mutedMusic  = false
  private _mutedSfx    = false
  private _mutedAll    = false

  // ── Music playback ─────────────────────────────────────────────────────────
  private _tracks: string[] = []
  private _trackIndex       = 0
  private _audioEl          = new Audio()
  private _musicStarted     = false

  // ── Web Audio (SFX) ───────────────────────────────────────────────────────
  private _ctx: AudioContext | null = null
  private _sfxGain: GainNode | null = null
  private _sfxCache = new Map<string, { buffer: AudioBuffer; volume: number }>()

  // ── Web Audio (Music graph) ───────────────────────────────────────────────
  private _musicSource:      MediaElementAudioSourceNode | null = null
  private _lowpassFilter:    BiquadFilterNode | null           = null
  private _pauseGain:        GainNode | null                   = null
  private _musicGain:        GainNode | null                   = null

  // ── Web Audio (SFX graph) ─────────────────────────────────────────────────
  private _sfxLowpassFilter: BiquadFilterNode | null           = null
  private _sfxPauseGain:     GainNode | null                   = null

  // ── Init (call once from first user gesture) ───────────────────────────────
  init(): void {
    if (this._ctx) return
    this._ctx     = new AudioContext()
    this._sfxGain = this._ctx.createGain()
    this._sfxGain.gain.value = this._mutedAll || this._mutedSfx ? 0 : this._sfxVolume

    // SFX graph: _sfxGain → sfxLowpassFilter → sfxPauseGain → destination
    this._sfxLowpassFilter                    = this._ctx.createBiquadFilter()
    this._sfxLowpassFilter.type               = 'lowpass'
    this._sfxLowpassFilter.frequency.value    = 20000
    this._sfxPauseGain                        = this._ctx.createGain()
    this._sfxPauseGain.gain.value             = 1.0
    this._sfxGain.connect(this._sfxLowpassFilter)
    this._sfxLowpassFilter.connect(this._sfxPauseGain)
    this._sfxPauseGain.connect(this._ctx.destination)

    // Music graph: _audioEl → lowpassFilter → pauseGain → musicGain → destination
    this._musicSource            = this._ctx.createMediaElementSource(this._audioEl)
    this._lowpassFilter          = this._ctx.createBiquadFilter()
    this._lowpassFilter.type     = 'lowpass'
    this._lowpassFilter.frequency.value = 20000
    this._pauseGain              = this._ctx.createGain()
    this._pauseGain.gain.value   = 1.0
    this._musicGain              = this._ctx.createGain()
    this._musicGain.gain.value   = this._effectiveMusicVolume()
    this._musicSource.connect(this._lowpassFilter)
    this._lowpassFilter.connect(this._pauseGain)
    this._pauseGain.connect(this._musicGain)
    this._musicGain.connect(this._ctx.destination)

    // Resume context if it was suspended (mobile browsers)
    if (this._ctx.state === 'suspended') {
      this._ctx.resume()
    }
  }

  // ── Music ──────────────────────────────────────────────────────────────────

  /**
   * Start the music playlist. Tracks play sequentially and loop indefinitely.
   * Call after `init()` has been called.
   */
  playMusic(tracks: string[]): void {
    if (!tracks.length) return
    // Already playing — don't interrupt the current track
    if (this._musicStarted) return
    this._tracks       = tracks
    this._trackIndex   = 0
    this._musicStarted = true
    this._loadAndPlayTrack()
  }

  stopMusic(): void {
    this._musicStarted = false
    this._audioEl.pause()
    this._audioEl.src = ''
  }

  /**
   * Immediately switch to a new playlist, replacing whatever is playing.
   */
  switchMusic(tracks: string[]): void {
    this._musicStarted = false
    this._audioEl.pause()
    this._audioEl.src = ''
    this._tracks       = []
    this.playMusic(tracks)
  }

  setMusicVolume(value: number): void {
    this._musicVolume = clamp01(value)
    if (this._musicGain) this._musicGain.gain.value = this._effectiveMusicVolume()
  }

  muteMusic(muted: boolean): void {
    this._mutedMusic = muted
    if (this._musicGain) this._musicGain.gain.value = this._effectiveMusicVolume()
  }

  get isMusicMuted(): boolean { return this._mutedMusic || this._mutedAll }
  get musicVolume():  number  { return this._musicVolume }

  // ── SFX ───────────────────────────────────────────────────────────────────

  /**
   * Decode and cache all SFX buffers up-front. Call once at startup (after
   * `init()`) so that `playSfx()` is instant and allocation-free at runtime.
   */
  async preloadSfx(defs: SoundDef[]): Promise<void> {
    if (!this._ctx) return
    await Promise.all(defs.map(async (def) => {
      try {
        const response = await fetch(def.path)
        const arrayBuf = await response.arrayBuffer()
        const audioBuf = await this._ctx!.decodeAudioData(arrayBuf)
        this._sfxCache.set(def.name, { buffer: audioBuf, volume: def.volume ?? 1 })
      } catch {
        // Non-critical — silently ignore missing SFX files
      }
    }))
  }

  /**
   * Play a cached sound effect by name (see `preloadSfx`).
   * Requires `init()` and `preloadSfx()` to have been called first.
   */
  playSfx(name: string): void {
    if (!this._ctx || !this._sfxGain) return
    if (this._mutedAll || this._mutedSfx) return
    const entry = this._sfxCache.get(name)
    if (!entry) return
    const source  = this._ctx.createBufferSource()
    source.buffer = entry.buffer
    if (entry.volume !== 1) {
      const gain        = this._ctx.createGain()
      gain.gain.value   = entry.volume
      source.connect(gain)
      gain.connect(this._sfxGain)
    } else {
      source.connect(this._sfxGain)
    }
    source.start(0)
  }

  setSfxVolume(value: number): void {
    this._sfxVolume = clamp01(value)
    if (this._sfxGain) {
      this._sfxGain.gain.value = this._effectiveSfxVolume()
    }
  }

  muteSfx(muted: boolean): void {
    this._mutedSfx = muted
    if (this._sfxGain) {
      this._sfxGain.gain.value = this._effectiveSfxVolume()
    }
  }

  get isSfxMuted(): boolean { return this._mutedSfx || this._mutedAll }
  get sfxVolume():  number  { return this._sfxVolume }

  // ── Master mute ────────────────────────────────────────────────────────────

  muteAll(muted: boolean): void {
    this._mutedAll = muted
    if (this._musicGain) this._musicGain.gain.value = this._effectiveMusicVolume()
    if (this._sfxGain) {
      this._sfxGain.gain.value = this._effectiveSfxVolume()
    }
  }

  get isAllMuted(): boolean { return this._mutedAll }

  // ── Pause effect ──────────────────────────────────────────────────────────

  /**
   * Apply or remove the classic "paused" muffling effect on both music and SFX.
   * Use `setMusicPaused` / `setSfxPaused` to control each channel independently.
   */
  setPaused(paused: boolean, rampDuration = 0.3): void {
    this.setMusicPaused(paused, rampDuration)
    // this.setSfxPaused(paused, rampDuration)
  }

  /** Muffling effect for music only — lowpass (300 Hz ↔ 20 kHz) + gain dip. */
  setMusicPaused(paused: boolean, rampDuration = 0.3): void {
    if (!this._ctx || !this._lowpassFilter || !this._pauseGain) return
    const t = this._ctx.currentTime + rampDuration
    this._lowpassFilter.frequency.linearRampToValueAtTime(paused ? 300 : 20000, t)
    this._pauseGain.gain.linearRampToValueAtTime(paused ? 0.6 : 1.0, t)
  }

  /** Muffling effect for SFX only — lowpass (300 Hz ↔ 20 kHz) + gain dip. */
  setSfxPaused(paused: boolean, rampDuration = 0.3): void {
    if (!this._ctx || !this._sfxLowpassFilter || !this._sfxPauseGain) return
    const t = this._ctx.currentTime + rampDuration
    this._sfxLowpassFilter.frequency.linearRampToValueAtTime(paused ? 300 : 20000, t)
    this._sfxPauseGain.gain.linearRampToValueAtTime(paused ? 0.6 : 1.0, t)
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _loadAndPlayTrack(): void {
    if (!this._musicStarted || !this._tracks.length) return

    const url             = this._tracks[this._trackIndex]
    this._audioEl.src     = url
    this._audioEl.onended = () => {
      this._trackIndex = (this._trackIndex + 1) % this._tracks.length
      this._loadAndPlayTrack()
    }
    this._audioEl.play().catch(() => {
      // Autoplay blocked — this shouldn't happen if init() was called from a
      // user gesture, but guard anyway.
    })
  }

  private _effectiveMusicVolume(): number {
    return (this._mutedAll || this._mutedMusic) ? 0 : this._musicVolume
  }

  private _effectiveSfxVolume(): number {
    return (this._mutedAll || this._mutedSfx) ? 0 : this._sfxVolume
  }
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}
