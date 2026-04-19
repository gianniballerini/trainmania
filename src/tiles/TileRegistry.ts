import type { TileBase } from './TileBase.js'

export type ProgressCallback = (loaded: number, total: number) => void

export class TileRegistry {
  private readonly tiles = new Map<string, TileBase>()

  register(tile: TileBase): void {
    this.tiles.set(tile.id, tile)
  }

  has(id: string): boolean {
    return this.tiles.has(id)
  }

  get(id: string): TileBase {
    const tile = this.tiles.get(id)
    if (!tile) throw new Error(`[TileRegistry] No tile registered for id "${id}"`)
    return tile
  }

  /**
   * Call `preload()` on every registered tile sequentially, reporting progress
   * after each one resolves.
   */
  async preloadAll(onProgress?: ProgressCallback): Promise<void> {
    const all = [...this.tiles.values()]
    const total = all.length
    let loaded = 0
    for (const tile of all) {
      await tile.preload()
      loaded++
      onProgress?.(loaded, total)
    }
  }

  get size(): number {
    return this.tiles.size
  }
}
