import * as THREE from 'three'
import { loadModelAsset, warnAssetLoadFailureOnce } from '../Assets.js'
import { CELL_H } from '../Constants.js'
import { Game } from '../Game.js'
import { cellToWorld, type CellData } from '../Grid.js'

const COIN_MODEL_URL = '/assets/models/coin-gold.glb'
const COIN_HEIGHT    = CELL_H + 0.55
const COIN_BOB_FREQ  = 2.5
const COIN_BOB_AMP   = 0.12
const COIN_SPIN_SPD  = 2.0

interface CoinEntry {
  group: THREE.Group
  baseY: number
}

export class CoinSystem {
  private readonly scene: THREE.Scene
  private _entries: CoinEntry[] = []
  private _time = 0

  totalCoins = 0

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  /** Load and place coin models for all cells flagged with hasCoin. */
  async build(cells: CellData[], cols: number, rows: number): Promise<void> {
    for (const cell of cells) {
      if (!cell.hasCoin) continue
      const pos = cellToWorld(cell.col, cell.row, cols, rows)
      try {
        const group = await loadModelAsset({
          modelUrl: COIN_MODEL_URL,
          targetFootprint: 0.55,
          yOffset: 0,
          castShadow: true,
          receiveShadow: false,
        })
        group.position.set(pos.x, COIN_HEIGHT, pos.z)
        this.scene.add(group)
        cell.coinGroup = group
        this._entries.push({ group, baseY: COIN_HEIGHT })
        this.totalCoins++
      } catch (err) {
        warnAssetLoadFailureOnce('coin-gold', COIN_MODEL_URL, err)
      }
    }
  }

  /** Animate all active coins. Call every frame with delta seconds. */
  update(delta: number): void {
    this._time += delta
    for (const entry of this._entries) {
      entry.group.position.y = entry.baseY + Math.sin(this._time * COIN_BOB_FREQ) * COIN_BOB_AMP
      entry.group.rotation.y += delta * COIN_SPIN_SPD
    }
  }

  /**
   * Collect the coin on the given cell.
   * Returns true if a coin was collected, false if there was none.
   */
  collect(cell: CellData, game: Game): boolean {
    if (!cell.hasCoin || !cell.coinGroup) return false
    this.scene.remove(cell.coinGroup)
    this._entries = this._entries.filter(e => e.group !== cell.coinGroup)
    cell.coinGroup = null
    cell.hasCoin = false
    game.audioManager.playSfx(`coin`)
    return true
  }

  dispose(): void {
    for (const entry of this._entries) {
      this.scene.remove(entry.group)
    }
    this._entries = []
    this.totalCoins = 0
  }
}
