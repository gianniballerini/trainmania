import { TileRegistry } from './TileRegistry.js'
import { StraightTile } from './StraightTile.js'
import { CurveTile } from './CurveTile.js'
import { StationTile } from './StationTile.js'

export const tileRegistry = new TileRegistry()

tileRegistry.register(new StraightTile())
tileRegistry.register(new CurveTile())
tileRegistry.register(new StationTile())

export type { ProgressCallback } from './TileRegistry.js'
export { TileBase } from './TileBase.js'
export { TileRegistry } from './TileRegistry.js'
export { StraightTile } from './StraightTile.js'
export { CurveTile } from './CurveTile.js'
export { StationTile } from './StationTile.js'
