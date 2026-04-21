
import { G, R, S, T } from "../GridCell"
import type { Level } from "./Level"

class Level1 implements Level {
    id = 1
    grid = [
        [G(), G(), G(), S('S'),            G(), G(), G()],
        [G(), G(), G(), R('STRAIGHT_NS'), G(), G(), G()],
        [G(), G(), G(), R('STRAIGHT_NS'), G(), G(), G()],
        [G(), G(), G(), G(),              G(), G(), G()],
        [G(), G(), G(), G(),              G(), G(), G()],
        [G(), G(), G(), G(),              G(), G(), G()],
        [G(), G(), G(), T(),              G(), G(), G()],
    ]
    baseSpeed = 5000
}

export { Level1 }
