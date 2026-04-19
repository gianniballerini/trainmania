import type { Direction } from "../Constants"
import type { GridCell } from "../GridCell"
import { Level1 } from "./Level1"
import { Level2 } from "./Level2"
import { Level3 } from "./Level3"
import { Level4 } from "./Level4"

export interface Level {
  id: number
  grid: GridCell[][]
  trainStart: [number, number]
  trainDir: Direction
  stationPos: [number, number]
  baseSpeed: number
}

export const LEVELS: Level[] = [
  new Level1(),
  new Level2(),
  new Level3(),
  new Level4(),
]
