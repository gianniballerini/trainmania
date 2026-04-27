import { R, S, Sn, SnX, T, V, coin } from '../GridCell'
import type { Level } from './Level'

class Level5 implements Level {
    id = 5
    label = 'Level 5'
    grid = [
        [V() , SnX()     , S('S')          , SnX(), Sn()      , Sn(), coin(Sn()), Sn(), Sn()      , Sn() , SnX()     ],
        [V() , Sn()      , R('STRAIGHT_NS'), Sn() , Sn()      , Sn(), Sn()      , Sn(), coin(Sn()), Sn() , Sn()      ],
        [V() , Sn()      , Sn()            , Sn() , coin(Sn()), Sn(), Sn()      , Sn(), Sn()      , Sn() , coin(Sn())],
        [V() , V()       , V()             , V()  , V()       , V() , V()       , V() , Sn()      , Sn() , Sn()      ],
        [V() , V()       , V()             , V()  , V()       , V() , V()       , V() , coin(Sn()), SnX(), Sn()      ],
        [V() , V()       , V()             , V()  , V()       , V() , V()       , V() , Sn()      , Sn() , coin(Sn())],
        [V() , V()       , V()             , V()  , V()       , V() , V()       , V() , Sn()      , Sn() , Sn()      ],
        [V() , coin(Sn()), Sn()            , Sn() , Sn()      , Sn(), Sn()      , Sn(), Sn()      , Sn() , Sn()      ],
        [V() , Sn()      , Sn()            , Sn() , Sn()      , Sn(), coin(Sn()), Sn(), Sn()      , Sn() , Sn()      ],
        [Sn(), Sn()      , Sn()            , Sn() , coin(Sn()), Sn(), Sn()      , Sn(), Sn()      , Sn() , Sn()      ],
        [Sn(), coin(Sn()), Sn()            , Sn() , Sn()      , V() , V()       , V() , V()       , V()  , V()       ],
        [V() , Sn()      , Sn()            , Sn() , V()       , V() , V()       , V() , V()       , V()  , V()       ],
        [V() , V()       , T()             , V()  , V()       , V() , V()       , V() , V()       , V()  , V()       ]
    ]
    baseSpeed = 2000
    countdown = 5
    coins = 10
}

export { Level5 }
