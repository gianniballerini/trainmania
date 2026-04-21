import type { CellType, PieceId } from './Constants.js'

export class GridCell {
  constructor(
    public readonly type: CellType,
    public readonly prebuiltPiece?: PieceId,
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
