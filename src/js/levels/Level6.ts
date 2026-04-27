import { S, Sn, SnX, T, coin } from '../GridCell'
import type { Level } from './Level'

class Level6 implements Level {
    id = 6
    label = 'Level 6'
    grid = [
        [SnX(), SnX()     , SnX()     , S('S')    , SnX(), SnX()     , SnX()     , SnX()     , SnX()     , SnX(), SnX()     , SnX(), SnX()     , SnX()     , SnX()     , SnX()     , SnX(), SnX()     , SnX()     , SnX()     , SnX()     , SnX()],
        [SnX(), coin(Sn()), coin(Sn()), coin(Sn()), Sn() , coin(Sn()), coin(Sn()), coin(Sn()), coin(Sn()), Sn() , coin(Sn()), Sn() , coin(Sn()), Sn()      , Sn()      , coin(Sn()), Sn() , coin(Sn()), coin(Sn()), coin(Sn()), coin(Sn()), SnX()],
        [SnX(), coin(Sn()), Sn()      , Sn()      , Sn() , coin(Sn()), Sn()      , Sn()      , coin(Sn()), Sn() , coin(Sn()), Sn() , coin(Sn()), coin(Sn()), Sn()      , coin(Sn()), Sn() , coin(Sn()), Sn()      , Sn()      , Sn()      , SnX()],
        [SnX(), coin(Sn()), Sn()      , Sn()      , Sn() , coin(Sn()), Sn()      , Sn()      , coin(Sn()), Sn() , coin(Sn()), Sn() , coin(Sn()), coin(Sn()), coin(Sn()), coin(Sn()), Sn() , coin(Sn()), coin(Sn()), coin(Sn()), coin(Sn()), SnX()],
        [SnX(), coin(Sn()), Sn()      , Sn()      , Sn() , coin(Sn()), Sn()      , Sn()      , coin(Sn()), Sn() , coin(Sn()), Sn() , coin(Sn()), Sn()      , coin(Sn()), coin(Sn()), Sn() , Sn()      , Sn()      , Sn()      , coin(Sn()), SnX()],
        [SnX(), coin(Sn()), coin(Sn()), coin(Sn()), Sn() , coin(Sn()), coin(Sn()), coin(Sn()), coin(Sn()), Sn() , coin(Sn()), Sn() , coin(Sn()), Sn()      , Sn()      , coin(Sn()), Sn() , coin(Sn()), coin(Sn()), coin(Sn()), coin(Sn()), SnX()],
        [SnX(), SnX()     , SnX()     , SnX()     , SnX(), SnX()     , SnX()     , SnX()     , SnX()     , SnX(), SnX()     , SnX(), SnX()     , SnX()     , SnX()     , SnX()     , SnX(), T()       , SnX()     , SnX()     , SnX()     , SnX()]
    ]
    baseSpeed = 5000
    countdown = 5
    coins = 56
}

export { Level6 }
