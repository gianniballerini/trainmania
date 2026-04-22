import { Game } from './src/js/Game.js'

const canvas = document.querySelector('.game__canvas') as HTMLCanvasElement
const game   = new Game(canvas)
window.game = game

if (import.meta.env.DEV) {
    game.enableDevTools()
}

game.boot()
