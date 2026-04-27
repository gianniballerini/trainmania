import { P, S, T, X, coin } from '../GridCell'
import type { Level } from './Level'

class Level7 implements Level {
    id = 7
    label = 'Level 7'
    grid = [
        [X(), X()   , X(), X()      , X()      , X()      , X(), X(), X()],
        [X(), P()   , P(), P()      , coin(P()), P()      , P(), P(), X()],
        [X(), S('E'), P(), coin(P()), coin(P()), coin(P()), P(), T(), X()],
        [X(), P()   , P(), P()      , coin(P()), P()      , P(), P(), X()],
        [X(), X()   , X(), X()      , X()      , X()      , X(), X(), X()]
    ]
    baseSpeed = 3000
    countdown = 10
    coins = 5
}

export { Level7 }
