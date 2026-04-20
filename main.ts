import { Game } from './src/js/Game.js'
import { Tweakpane } from './src/js/Tweakpane.js'

const canvas = document.querySelector('.game__canvas') as HTMLCanvasElement
const game   = new Game(canvas)
const tweakpane = Tweakpane
window.game = game

game.boot()
