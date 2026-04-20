class Settings {
    colors: {
        floor: string,
        floor2: string,
        rail: string,
        station: string,
        start: string,
        rock: string,
        ghost: string
    }
    scene: {
        background: string,
        fog: string,
        ambient: {
            color: string,
            intensity: number,
        },
        sun: {
            color: string,
            intensity: number,
        },
        fill: {
            color: string,
            intensity: number,
        },
        rectLight: {
            color: string,
            intensity: number,
        }
    }
    constructor() {
        this.colors = {
            floor:   '#9AB17A',   // moss green
            floor2:  '#E4DFB5',   // alt moss
            rail:    '#c8a86a',   // sandy track bed
            station: '#d4a843',   // gold
            start:   '#5a7aaa',   // slate blue
            rock:    '#8a7a6a',   // grey-brown rock base
            ghost:   '#ffffff',   // white for ghost tiles
        }

        this.scene = {
            background: '#87ceeb', // sky blue
            fog: '#b8dff5',        // light sky blue fog
            ambient: {
                color: '#ffffff', // pure white
                intensity: 1.2,
            },
            sun: {
                color: '#fff8e0', // bright warm white
                intensity: 2.8,
            },
            fill: {
                color: '#aad4ff', // light sky blue
                intensity: 0.8,
            },
            rectLight: {
                color: '#ffeedd', // warm off-white
                intensity: 7,
            }
        }
    }
}

const settings = new Settings();
export { settings as Settings }

