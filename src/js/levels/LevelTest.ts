
import type { Direction } from "../Constants"
import { G, R } from "../GridCell"
import type { Level } from "./Level"

class LevelTest implements Level {
    id = 1
    grid = [
        [G(), G(), G(), G(),              G(), G(), G()],
        [G(), G(), G(), R('CURVE_SE'),    R('CURVE_SW'), G(), G()],
        [G(), G(), G(), R('STRAIGHT_NS'), R('STRAIGHT_NS'), G(), G()],
        [G(), G(), G(), R('STRAIGHT_NS'), R('STRAIGHT_NS'), G(), G()],
        [G(), G(), G(), R('STRAIGHT_NS'), R('STRAIGHT_NS'), G(), G()],
        [G(), G(), G(), R('CURVE_NE'),    R('CURVE_NW'), G(), G()],
        [G(), G(), G(), G(),              G(), G(), G()],
    ]
    trainStart: [number, number] = [3, 3]
    trainDir: Direction = 'S'
    stationPos: [number, number] = [3, 6]
    baseSpeed = 5000
}

export { LevelTest }
