
import type { Direction } from "../Constants"
import { F, R } from "../GridCell"
import type { Level } from "./Level"

class LevelTest implements Level {
    id = 1
    grid = [
        [F(), F(), F(), F(),              F(), F(), F()],
        [F(), F(), F(), R('CURVE_SE'),    R('CURVE_SW'), F(), F()],
        [F(), F(), F(), R('STRAIGHT_NS'), R('STRAIGHT_NS'), F(), F()],
        [F(), F(), F(), R('STRAIGHT_NS'), R('STRAIGHT_NS'), F(), F()],
        [F(), F(), F(), R('STRAIGHT_NS'), R('STRAIGHT_NS'), F(), F()],
        [F(), F(), F(), R('CURVE_NE'),    R('CURVE_NW'), F(), F()],
        [F(), F(), F(), F(),              F(), F(), F()],
    ]
    trainStart: [number, number] = [3, 3]
    trainDir: Direction = 'S'
    stationPos: [number, number] = [3, 6]
    baseSpeed = 5000
}

export { LevelTest }
