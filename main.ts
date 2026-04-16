import { Game } from './src/Game.js'

const canvas = document.querySelector('.game__canvas') as HTMLCanvasElement
const game   = new Game(canvas)

game.boot()
