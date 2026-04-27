import { CurveTile } from './CurveTile.js'
import { FloorTile } from './FloorTile.js'
import { GrassTile } from './GrassTile.js'
import { RailTile } from './RailTile.js'
import { RockTile } from './RockTile.js'
import { SnowRockTile } from './SnowRockTile.js'
import { SnowTile } from './SnowTile.js'
import { StartTile } from './StartTile.js'
import { StationTile } from './StationTile.js'
import { StraightTile } from './StraightTile.js'
import { TileRegistry } from './TileRegistry.js'

export const tileRegistry = new TileRegistry()

tileRegistry.register(new FloorTile())
tileRegistry.register(new RailTile())
tileRegistry.register(new StartTile())
tileRegistry.register(new StraightTile())
tileRegistry.register(new CurveTile())
tileRegistry.register(new StationTile())
tileRegistry.register(new RockTile())
tileRegistry.register(new GrassTile())
tileRegistry.register(new SnowTile())
tileRegistry.register(new SnowRockTile())

export { CurveTile } from './CurveTile.js'
export { FloorTile } from './FloorTile.js'
export { GrassTile } from './GrassTile.js'
export { RailTile } from './RailTile.js'
export { RockTile } from './RockTile.js'
export { SnowRockTile } from './SnowRockTile.js'
export { SnowTile } from './SnowTile.js'
export { StartTile } from './StartTile.js'
export { StationTile } from './StationTile.js'
export { StraightTile } from './StraightTile.js'
export { TileBase } from './TileBase.js'
export { TileRegistry } from './TileRegistry.js'
export type { ProgressCallback } from './TileRegistry.js'

