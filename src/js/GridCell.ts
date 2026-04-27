import type { CellType, Direction, PieceId } from './Constants.js'

export class GridCell {
  constructor(
    public readonly type: CellType,
    public readonly prebuiltPiece?: PieceId,
    public readonly dir?: Direction,
    public readonly hasCoin?: boolean,
  ) {}
}

/** Floor — buildable, no rail */
export const F = (): GridCell => new GridCell('FLOOR')

/** Grass — buildable, no rail */
export const G = (): GridCell => new GridCell('GRASS')

/** Snow — buildable, no rail */
export const Sn = (): GridCell => new GridCell('SNOW')

/** Snow — buildable, no rail */
export const SnX = (): GridCell => new GridCell('SNOW_ROCK')

/** Void — unbuildable, not an obstacle */
export const V = (): GridCell => new GridCell('VOID')

/** Rock — obstacle, unbuildable */
export const X = (): GridCell => new GridCell('ROCK')

/** Pre-built rail cell with an explicit track piece */
export const R = (piece: PieceId): GridCell => new GridCell('RAIL', piece)

/** Train start cell — train spawns here facing the given direction */
export const S = (dir: Direction): GridCell => new GridCell('START', undefined, dir)

/** Station (goal) cell */
export const T = (): GridCell => new GridCell('STATION')

/** Coin wrapper — marks any cell to have a floating collectible coin on top */
export const coin = (cell: GridCell): GridCell =>
  new GridCell(cell.type, cell.prebuiltPiece, cell.dir, true)
