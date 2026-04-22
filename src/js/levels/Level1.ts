
import { coin, G, R, S, T, V } from "../GridCell"
import type { Level } from "./Level"

class Level1 implements Level {
    id = 1
    label = 'Level 1'
    grid = [
        [V(), V(), G(), S('S'),                G(), V(), V()],
        [V(), V(), G(), R('STRAIGHT_NS'),      G(), V(), V()],
        [V(), V(), G(), coin(R('STRAIGHT_NS')),G(), V(), V()],
        [V(), V(), G(), G(),                   G(), V(), V()],
        [V(), V(), G(), G(),                   G(), V(), V()],
        [V(), V(), G(), G(),                   G(), V(), V()],
        [V(), V(), G(), T(),                   G(), V(), V()],
    ]
    baseSpeed = 3000
    countdown = 5
    coins = 1
}

export { Level1 }
