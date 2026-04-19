
import type { Direction } from "../Constants"
import { F, R } from "../GridCell"
import type { Level } from "./Level"

class Level1 implements Level {
    id = 1
    grid = [
        [F(), F(), F(), F(),              F(), F(), F()],
        [F(), F(), F(), R('STRAIGHT_NS'), F(), F(), F()],
        [F(), F(), F(), R('STRAIGHT_NS'), F(), F(), F()],
        [F(), F(), F(), F(),              F(), F(), F()],
        [F(), F(), F(), F(),              F(), F(), F()],
        [F(), F(), F(), F(),              F(), F(), F()],
        [F(), F(), F(), F(),              F(), F(), F()],
    ]
    trainStart: [number, number] = [3, 0]
    trainDir: Direction = 'S'
    stationPos: [number, number] = [3, 6]
    baseSpeed = 5000
}

export { Level1 }
