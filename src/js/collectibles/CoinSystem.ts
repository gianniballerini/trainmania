import * as THREE from 'three'
import { loadModelAsset, warnAssetLoadFailureOnce } from '../Assets.js'
import { CELL_H } from '../Constants.js'
import { Game } from '../Game.js'
import { cellToWorld, type CellData } from '../Grid.js'
import { Coin } from './Coin.js'

const COIN_MODEL_URL = '/assets/models/coin-gold.glb'
const COIN_HEIGHT    = CELL_H + 0.2

export class CoinSystem {
  private readonly scene: THREE.Scene
  private _coins: Coin[] = []
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
        this._coins.push(new Coin(group, COIN_HEIGHT))
        this.totalCoins++
      } catch (err) {
        warnAssetLoadFailureOnce('coin-gold', COIN_MODEL_URL, err)
      }
    }
  }

  /** Animate all active coins. Call every frame with delta seconds. */
  update(delta: number): void {
    this._time += delta
    for (const coin of this._coins) {
      coin.update(this._time, delta)
    }
    // Clean up coins whose collect animation has finished
    this._coins = this._coins.filter(coin => {
      if (coin.isDone) {
        coin.removeFromScene(this.scene)
        return false
      }
      return true
    })
  }

  /**
   * Collect the coin on the given cell.
   * Returns true if a coin was collected, false if there was none.
   */
  collect(cell: CellData, game: Game): boolean {
    if (!cell.hasCoin || !cell.coinGroup) return false
    const coin = this._coins.find(c => c.group === cell.coinGroup)
    coin?.collect()
    // Clear cell references immediately so the coin can't be double-collected
    cell.coinGroup = null
    cell.hasCoin = false
    game.audioManager.playSfx(`coin`)
    return true
  }

  dispose(): void {
    for (const coin of this._coins) {
      coin.removeFromScene(this.scene)
    }
    this._coins = []
    this.totalCoins = 0
  }
}
