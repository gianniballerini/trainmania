import type { GridCell } from "../GridCell"
import { Level1 } from "./Level1"
import { Level2 } from "./Level2"
import { Level3 } from "./Level3"
import { Level4 } from "./Level4"
import { LevelTest } from "./LevelTest"

export interface Level {
  id: number
  grid: GridCell[][]
  baseSpeed: number
}

export const LEVELS: Level[] = [
  new Level1(),
  new Level2(),
  new Level3(),
  new Level4(),
  new LevelTest(),
]
