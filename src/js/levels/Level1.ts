
import type { Direction } from "../Constants"
import { G, R } from "../GridCell"
import type { Level } from "./Level"

class Level1 implements Level {
    id = 1
    grid = [
        [G(), G(), G(), G(),              G(), G(), G()],
        [G(), G(), G(), R('STRAIGHT_NS'), G(), G(), G()],
        [G(), G(), G(), R('STRAIGHT_NS'), G(), G(), G()],
        [G(), G(), G(), G(),              G(), G(), G()],
        [G(), G(), G(), G(),              G(), G(), G()],
        [G(), G(), G(), G(),              G(), G(), G()],
        [G(), G(), G(), G(),              G(), G(), G()],
    ]
    trainStart: [number, number] = [3, 0]
    trainDir: Direction = 'S'
    stationPos: [number, number] = [3, 6]
    baseSpeed = 5000
}

export { Level1 }
