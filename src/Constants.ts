// Directions as vectors [col, row]
export type Direction = 'N' | 'S' | 'E' | 'W'

export const BACKGROUND_TRACKS = [
  '/assets/sound/background_01.webm',
  '/assets/sound/background_02.webm',
]

export const GAME_OVER_TRACKS = [
  '/assets/sound/game_over.webm',
]

export type PieceId =
  | 'STRAIGHT_NS'
  | 'STRAIGHT_EW'
  | 'CURVE_NE'
  | 'CURVE_NW'
  | 'CURVE_SE'
  | 'CURVE_SW'

export type CellType = 'VOID' | 'FLOOR' | 'RAIL' | 'STATION' | 'START' | 'ROCK'

export const DIR: Record<Direction, [number, number]> = {
  N: [0, -1],
  S: [0,  1],
  E: [1,  0],
  W: [-1, 0],
}

export const DIR_NAMES: Direction[] = ['N', 'E', 'S', 'W']

// Opposite direction lookup
export const OPPOSITE: Record<Direction, Direction> = { N: 'S', S: 'N', E: 'W', W: 'E' }

// Track piece definitions
export interface TrackPiece {
  id: PieceId
  label: string
  connections: Partial<Record<Direction, Direction>>
  svgPath: string
}

export const TRACK_PIECES: Record<PieceId, TrackPiece> = {
  STRAIGHT_NS: {
    id: 'STRAIGHT_NS',
    label: 'Straight',
    connections: { N: 'S', S: 'N' },
    svgPath: 'M36 8 L36 56 M36 56 L36 8',
  },
  STRAIGHT_EW: {
    id: 'STRAIGHT_EW',
    label: 'Straight',
    connections: { E: 'W', W: 'E' },
    svgPath: 'M8 28 L56 28',
  },
  CURVE_NE: {
    id: 'CURVE_NE',
    label: 'Curve',
    connections: { N: 'E', E: 'N' },
    svgPath: 'M36 8 Q36 28 56 28',
  },
  CURVE_NW: {
    id: 'CURVE_NW',
    label: 'Curve',
    connections: { N: 'W', W: 'N' },
    svgPath: 'M36 8 Q36 28 8 28',
  },
  CURVE_SE: {
    id: 'CURVE_SE',
    label: 'Curve',
    connections: { S: 'E', E: 'S' },
    svgPath: 'M36 56 Q36 28 56 28',
  },
  CURVE_SW: {
    id: 'CURVE_SW',
    label: 'Curve',
    connections: { S: 'W', W: 'S' },
    svgPath: 'M36 56 Q36 28 8 28',
  },
}

// The 4 hand options the player sees (cycling pool)
export const HAND_POOL: PieceId[] = [
  'STRAIGHT_NS',
  'STRAIGHT_EW',
  'CURVE_NE',
  'CURVE_NW',
  'CURVE_SE',
  'CURVE_SW',
]

// Simplified tile types for the card tray (rotation resolves to a PieceId)
export type TileType = 'STRAIGHT' | 'CURVE'
export const TILE_POOL: TileType[] = ['STRAIGHT', 'CURVE']

export function tileToPieceId(type: TileType, rotation: number): PieceId {
  const r = ((rotation % 4) + 4) % 4
  if (type === 'STRAIGHT') {
    return r % 2 === 0 ? 'STRAIGHT_NS' : 'STRAIGHT_EW'
  }
  // CURVE: 0→NE, 1→SE, 2→SW, 3→NW
  const curveMap: PieceId[] = ['CURVE_NE', 'CURVE_SE', 'CURVE_SW', 'CURVE_NW']
  return curveMap[r]
}

export const CELL = {
  VOID:    'VOID',
  FLOOR:   'FLOOR',
  RAIL:    'RAIL',
  STATION: 'STATION',
  START:   'START',
  ROCK:   'ROCK'
} as const

