
import { coin, G, P, R, S, T, V, X } from "../GridCell"
import type { Level } from "./Level"

class Level4 implements Level {
    id = 4
    label = 'Level 4'
    grid = [
        [V(), V(), G(), coin(G()), G(), V(), V(),V()],
        [V(), V(), G(), G(), G(), V(), V(),V()],
        [X(), V(), X(), G(), G(), G(), G(),V()],
        [S('E'), R('STRAIGHT_EW'), G(), G(), P(), P(), coin(G()), G()],
        [X(), G(), G(), G(), G(), G(), G(),V()],
        [V(), V(), G(), G(), G(), V(), V(),V()],
        [V(), V(), G(), T(), G(), V(), V(),V()],
    ]
    baseSpeed = 5000
    countdown = 10
}

export { Level4 }
