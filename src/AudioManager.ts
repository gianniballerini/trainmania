/**
 * AudioManager — handles background music and sound effects.
 *
 * Music: sequential playlist via HTMLAudioElement (streams efficiently).
 * SFX:   one-shot playback via Web Audio API (precise, low-latency).
 *
 * Browser autoplay policy: call `init()` from inside a user gesture handler
 * before attempting to play anything.
 */
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

  // ── Init (call once from first user gesture) ───────────────────────────────
  init(): void {
    if (this._ctx) return
    this._ctx     = new AudioContext()
    this._sfxGain = this._ctx.createGain()
    this._sfxGain.gain.value = this._mutedAll || this._mutedSfx ? 0 : this._sfxVolume
    this._sfxGain.connect(this._ctx.destination)
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

  setMusicVolume(value: number): void {
    this._musicVolume        = clamp01(value)
    this._audioEl.volume     = this._effectiveMusicVolume()
  }

  muteMusic(muted: boolean): void {
    this._mutedMusic         = muted
    this._audioEl.volume     = this._effectiveMusicVolume()
  }

  get isMusicMuted(): boolean { return this._mutedMusic || this._mutedAll }
  get musicVolume():  number  { return this._musicVolume }

  // ── SFX ───────────────────────────────────────────────────────────────────

  /**
   * Play a one-shot sound effect. Requires `init()` to have been called.
   * @param url Path to the audio file (e.g. '/assets/sound/click.webm')
   */
  async playSfx(url: string): Promise<void> {
    if (!this._ctx || !this._sfxGain) return
    if (this._mutedAll || this._mutedSfx) return
    try {
      const response = await fetch(url)
      const arrayBuf = await response.arrayBuffer()
      const audioBuf = await this._ctx.decodeAudioData(arrayBuf)
      const source   = this._ctx.createBufferSource()
      source.buffer  = audioBuf
      source.connect(this._sfxGain)
      source.start(0)
    } catch {
      // Non-critical — silently ignore missing SFX files
    }
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
    this._mutedAll           = muted
    this._audioEl.volume     = this._effectiveMusicVolume()
    if (this._sfxGain) {
      this._sfxGain.gain.value = this._effectiveSfxVolume()
    }
  }

  get isAllMuted(): boolean { return this._mutedAll }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _loadAndPlayTrack(): void {
    if (!this._musicStarted || !this._tracks.length) return

    const url             = this._tracks[this._trackIndex]
    this._audioEl.src     = url
    this._audioEl.volume  = this._effectiveMusicVolume()
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
