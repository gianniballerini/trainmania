import type { IGameState } from './IGameState.js';
import { BaseGameState } from './IGameState.js';

export class PausedState extends BaseGameState {
  /** The state that was active before pausing — restored on resume. */
  constructor(readonly previousState: IGameState) {
    super()
  }
  // All update / input methods remain no-ops via BaseGameState.
}
