import { Game } from './src/Game.js'
import { Tweakpane } from './src/Tweakpane.js'

const canvas = document.querySelector('.game__canvas') as HTMLCanvasElement
const game   = new Game(canvas)
const tweakpane = Tweakpane
window.game = game

game.boot()
