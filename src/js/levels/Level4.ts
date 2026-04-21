
import { G, R, S, T, V } from "../GridCell"
import type { Level } from "./Level"

class Level4 implements Level {
    id = 4
    grid = [
        [V(), V(), G(), G(), G(), V(), V()],
        [V(), V(), G(), G(), G(), V(), V()],
        [G(), G(), G(), G(), G(), G(), G()],
        [S('E'), R('STRAIGHT_EW'), G(), G(), G(), G(), G()],
        [G(), G(), G(), G(), G(), G(), G()],
        [V(), V(), G(), G(), G(), V(), V()],
        [V(), V(), G(), T(), G(), V(), V()],
    ]
    baseSpeed = 5000
    countdown = 10
}

export { Level4 }
