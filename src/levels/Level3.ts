
import type { Direction } from "../Constants"
import { F, R, V } from "../GridCell"
import type { Level } from "./Level"

class Level3 implements Level {
    id = 3
    grid = [
        [F(), F(),              F(), F(), V(), V(), V()],
        [F(), R('STRAIGHT_NS'), F(), F(), V(), V(), V()],
        [F(), R('STRAIGHT_NS'), F(), F(), V(), V(), V()],
        [F(), F(),              F(), F(), F(), F(), F()],
        [F(), F(),              F(), F(), F(), F(), F()],
        [V(), V(),              F(), F(), F(), F(), F()],
        [V(), V(),              F(), F(), F(), F(), F()],
    ]
    trainStart: [number, number] = [1, 0]
    trainDir: Direction = 'S'
    stationPos: [number, number] = [5, 6]
    baseSpeed = 5000
}

export { Level3 }
