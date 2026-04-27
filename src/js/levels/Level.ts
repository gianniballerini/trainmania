import type { GridCell } from "../GridCell"
import { Level1 } from "./Level1"
import { Level2 } from "./Level2"
import { Level3 } from "./Level3"
import { Level4 } from "./Level4"
import { Level5 } from "./Level5"
import { Level6 } from "./Level6"
import { Level7 } from "./Level7"
import { Level8 } from "./Level8"
import { LevelTest } from "./LevelTest"

export interface Level {
  id: number
  label: string
  grid: GridCell[][]
  baseSpeed: number
  countdown?: number
  coins?: number
}

export const LEVELS: Level[] = [
  new Level1(),
  new Level2(),
  new Level3(),
  new Level4(),
  new Level5(),
  new Level6(),
  new Level7(),
  new Level8(),
  ...(import.meta.env.DEV ? [new LevelTest()] : []),
]
