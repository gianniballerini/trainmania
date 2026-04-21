
import { G, R, S, T, V } from "../GridCell"
import type { Level } from "./Level"

class Level3 implements Level {
    id = 3
    grid = [
        [G(), S('S'),           G(), G(), V(), V(), V()],
        [G(), R('STRAIGHT_NS'), G(), G(), V(), V(), V()],
        [G(), R('STRAIGHT_NS'), G(), G(), V(), V(), V()],
        [G(), G(),              G(), G(), G(), G(), G()],
        [G(), G(),              G(), G(), G(), G(), G()],
        [V(), V(),              G(), G(), G(), G(), G()],
        [V(), V(),              G(), G(), G(), T(), G()],
    ]
    baseSpeed = 5000
    countdown = 10
}

export { Level3 }
