
import { F, R, S, T, V } from "../GridCell"
import type { Level } from "./Level"

class Level3 implements Level {
    id = 3
    grid = [
        [F(), S('S'),           F(), F(), V(), V(), V()],
        [F(), R('STRAIGHT_NS'), F(), F(), V(), V(), V()],
        [F(), R('STRAIGHT_NS'), F(), F(), V(), V(), V()],
        [F(), F(),              F(), F(), F(), F(), F()],
        [F(), F(),              F(), F(), F(), F(), F()],
        [V(), V(),              F(), F(), F(), F(), F()],
        [V(), V(),              F(), F(), F(), T(), F()],
    ]
    baseSpeed = 5000
    countdown = 10
}

export { Level3 }
