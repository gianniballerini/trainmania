import { G, P, S, T, V, coin } from '../GridCell'
import type { Level } from './Level'

class Level8 implements Level {
    id = 8
    label = 'Level 8'
    grid = [
        [V(), V()      , V()      , V()      , V(), V(), V(), V()      , V()      , V()      , V(), V(), V(), V()      , V()      , V()      ],
        [V(), V()      , V()      , V()      , V(), V(), G(), G()      , V()      , G()      , G(), V(), V(), V()      , V()      , V()      ],
        [V(), V()      , V()      , V()      , V(), G(), G(), G()      , T()      , G()      , G(), G(), V(), V()      , V()      , V()      ],
        [V(), V()      , V()      , V()      , V(), G(), G(), coin(G()), coin(G()), coin(G()), G(), G(), V(), V()      , V()      , V()      ],
        [V(), V()      , V()      , V()      , V(), V(), G(), G()      , G()      , G()      , G(), V(), V(), V()      , V()      , V()      ],
        [V(), V()      , V()      , V()      , V(), V(), V(), G()      , G()      , G()      , V(), V(), V(), V()      , V()      , V()      ],
        [V(), V()      , V()      , V()      , V(), V(), V(), V()      , G()      , V()      , V(), V(), V(), V()      , V()      , V()      ],
        [V(), V()      , V()      , V()      , V(), V(), V(), V()      , P()      , V()      , V(), V(), V(), V()      , V()      , V()      ],
        [V(), V()      , V()      , V()      , V(), V(), V(), V()      , P()      , V()      , V(), V(), V(), V()      , V()      , V()      ],
        [V(), V()      , V()      , V()      , V(), V(), V(), V()      , P()      , V()      , V(), V(), V(), V()      , V()      , V()      ],
        [V(), coin(G()), G()      , G()      , V(), V(), V(), G()      , G()      , G()      , V(), V(), V(), G()      , G()      , coin(G())],
        [V(), G()      , coin(G()), G()      , P(), P(), P(), coin(G()), coin(P()), coin(G()), P(), P(), P(), G()      , coin(G()), G()      ],
        [V(), G()      , G()      , coin(G()), V(), V(), V(), G()      , G()      , G()      , V(), V(), V(), coin(G()), G()      , G()      ],
        [V(), V()      , P()      , V()      , V(), V(), V(), V()      , P()      , V()      , V(), V(), V(), V()      , P()      , V()      ],
        [V(), V()      , coin(P()), V()      , V(), V(), V(), V()      , coin(P()), V()      , V(), V(), V(), V()      , coin(P()), V()      ],
        [V(), V()      , P()      , V()      , V(), V(), V(), V()      , P()      , V()      , V(), V(), V(), V()      , P()      , V()      ],
        [V(), G()      , G()      , coin(G()), V(), V(), V(), G()      , G()      , G()      , V(), V(), V(), coin(G()), G()      , G()      ],
        [V(), G()      , coin(G()), G()      , P(), P(), P(), G()      , G()      , G()      , P(), P(), P(), G()      , coin(G()), G()      ],
        [V(), coin(G()), G()      , G()      , V(), V(), V(), G()      , G()      , G()      , V(), V(), V(), G()      , G()      , coin(G())],
        [V(), V()      , V()      , V()      , V(), V(), V(), V()      , S('N')   , V()      , V(), V(), V(), V()      , V()      , V()      ]
    ]
    baseSpeed = 5000
    countdown = 5
    coins = 21
}

export { Level8 }
