export { }

declare global {
    interface Window {
        game: import('./Game.js').Game
    }
}
