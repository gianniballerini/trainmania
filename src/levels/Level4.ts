
import type { Direction } from "../Constants"
import { F, R, V } from "../GridCell"
import type { Level } from "./Level"

class Level4 implements Level {
    id = 4
    grid = [
        [V(), V(), F(), F(), F(), V(), V()],
        [V(), V(), F(), F(), F(), V(), V()],
        [F(), F(), F(), F(), F(), F(), F()],
        [F(), R('STRAIGHT_EW'), F(), F(), F(), F(), F()],
        [F(), F(), F(), F(), F(), F(), F()],
        [V(), V(), F(), F(), F(), V(), V()],
        [V(), V(), F(), F(), F(), V(), V()],
    ]
    trainStart: [number, number] = [0, 3]
    trainDir: Direction = 'E'
    stationPos: [number, number] = [3, 6]
    baseSpeed = 5000
}

export { Level4 }
