
import { G, R, S, T } from "../GridCell"
import type { Level } from "./Level"

class LevelTest implements Level {
    id = 1
    grid = [
        [G(), G(), G(), G(),              G(), G(), G()],
        [G(), G(), G(), R('CURVE_SE'),    R('CURVE_SW'), G(), G()],
        [G(), G(), G(), R('STRAIGHT_NS'), R('STRAIGHT_NS'), G(), G()],
        [G(), G(), G(), S('S'),           R('STRAIGHT_NS'), G(), G()],
        [G(), G(), G(), R('STRAIGHT_NS'), R('STRAIGHT_NS'), G(), G()],
        [G(), G(), G(), R('CURVE_NE'),    R('CURVE_NW'), G(), G()],
        [G(), G(), G(), T(),              G(), G(), G()],
    ]
    baseSpeed = 5000
    countdown = 10
}

export { LevelTest }
