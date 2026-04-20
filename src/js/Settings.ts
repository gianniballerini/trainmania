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
            background: '#0e0c18', // near-black purple
            fog: '#0e0c18',        // same as background
            ambient: {
                color: '#ffeedd', // warm off-white
                intensity: 0.6,
            },
            sun: {
                color: '#ffd580', // warm light orange
                intensity: 1.6,
            },
            fill: {
                color: '#8090cc', // cool periwinkle
                intensity: 0.4,
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

