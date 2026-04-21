
import { F, R, S, T, X } from "../GridCell"
import type { Level } from "./Level"

class Level2 implements Level {
    id = 2
    grid = [
        [F(), F(), F(), S('S'),            F(), F(), F()],
        [F(), F(), F(), R('STRAIGHT_NS'), F(), F(), F()],
        [F(), F(), F(), R('STRAIGHT_NS'), F(), F(), F()],
        [F(), F(), F(), F(),              F(), F(), F()],
        [F(), F(), F(), X(),              F(), F(), F()],
        [F(), F(), F(), F(),              F(), F(), F()],
        [F(), F(), F(), T(),              F(), F(), F()],
    ]
    baseSpeed = 5000
    countdown = 10
}

export { Level2 }
