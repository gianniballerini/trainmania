
import { G, R, S, T, X } from "../GridCell"
import type { Level } from "./Level"

class Level2 implements Level {
    id = 2
    grid = [
        [G(), G(), G(), S('S'),            G(), G(), G()],
        [G(), G(), G(), R('STRAIGHT_NS'), G(), G(), G()],
        [G(), G(), G(), R('STRAIGHT_NS'), G(), G(), G()],
        [G(), G(), G(), G(),              G(), G(), G()],
        [G(), G(), G(), X(),              G(), G(), G()],
        [G(), G(), G(), G(),              G(), G(), G()],
        [G(), G(), G(), T(),              G(), G(), G()],
    ]
    baseSpeed = 5000
    countdown = 10
}

export { Level2 }
