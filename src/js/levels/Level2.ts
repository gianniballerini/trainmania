
import { coin, G, R, S, T, X } from "../GridCell"
import type { Level } from "./Level"

class Level2 implements Level {
    id = 2
    grid = [
        [G(), G(),       S('S'),           G(),        G()],
        [G(), G(),       R('STRAIGHT_NS'), G(),        G()],
        [G(), G(),       R('STRAIGHT_NS'), G(),        G()],
        [G(), G(),       G(),              G(),        G()],
        [G(), coin(G()), X(),              coin(G()),  G()],
        [G(), G(),       G(),              G(),        G()],
        [G(), G(),       T(),              G(),        G()],
    ]
    baseSpeed = 5000
    countdown = 10
}

export { Level2 }
