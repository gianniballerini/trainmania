
import { F, R, S, T, V } from "../GridCell"
import type { Level } from "./Level"

class Level4 implements Level {
    id = 4
    grid = [
        [V(), V(), F(), F(), F(), V(), V()],
        [V(), V(), F(), F(), F(), V(), V()],
        [F(), F(), F(), F(), F(), F(), F()],
        [S('E'), R('STRAIGHT_EW'), F(), F(), F(), F(), F()],
        [F(), F(), F(), F(), F(), F(), F()],
        [V(), V(), F(), F(), F(), V(), V()],
        [V(), V(), F(), T(), F(), V(), V()],
    ]
    baseSpeed = 5000
}

export { Level4 }
