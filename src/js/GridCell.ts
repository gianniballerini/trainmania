import type { CellType, Direction, PieceId } from './Constants.js'

export class GridCell {
  constructor(
    public readonly type: CellType,
    public readonly prebuiltPiece?: PieceId,
    public readonly dir?: Direction,
  ) {}
}

/** Floor — buildable, no rail */
export const F = (): GridCell => new GridCell('FLOOR')

/** Grass — buildable, no rail */
export const G = (): GridCell => new GridCell('GRASS')

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
