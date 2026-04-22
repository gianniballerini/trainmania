
import { coin, G, R, S, T, V, X } from "../GridCell"
import type { Level } from "./Level"

class Level3 implements Level {
    id = 3
    label = 'Level 3'
    grid = [
        [G(), S('S'),           G(), coin(G()), V(), V(), V()],
        [G(), R('STRAIGHT_NS'), G(),      G(), V(), V(), V()],
        [G(), R('STRAIGHT_NS'), G(),      G(), V(), V(), V()],
        [G(), G(),              G(),      G(), G(), G(), G()],
        [G(), G(),              G(),      G(), G(), V(), G()],
        [V(), V(),              coin(G()),X(), G(), G(), coin(G())],
        [V(), V(),              G(),      G(), G(), T(), G()],
    ]
    baseSpeed = 5000
    countdown = 10
}

export { Level3 }
