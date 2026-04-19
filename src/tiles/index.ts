import { CurveTile } from './CurveTile.js'
import { RockTile } from './RockTile.js'
import { StationTile } from './StationTile.js'
import { StraightTile } from './StraightTile.js'
import { TileRegistry } from './TileRegistry.js'

export const tileRegistry = new TileRegistry()

tileRegistry.register(new StraightTile())
tileRegistry.register(new CurveTile())
tileRegistry.register(new StationTile())
tileRegistry.register(new RockTile())

export { CurveTile } from './CurveTile.js'
export { RockTile } from './RockTile.js'
export { StationTile } from './StationTile.js'
export { StraightTile } from './StraightTile.js'
export { TileBase } from './TileBase.js'
export { TileRegistry } from './TileRegistry.js'
export type { ProgressCallback } from './TileRegistry.js'

