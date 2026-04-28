export interface CloudsConfig {
    count:         number
    scaleMin:      number
    scaleMax:      number
    driftSpeedMin: number
    driftSpeedMax: number
    depth:         number
    coverX:        number
    coverY:        number
    verticalBias:  number
    verticalDrift: number
    noiseScale:    number
    dispStrength:  number
    dispSpeed:     number
}

export interface ColorsConfig {
    floor: string
    floor2: string
    rail: string
    station: string
    start: string
    rock: string
    ghostFree:    string   // green — free placeable tile
    ghostReplace: string   // blue  — replacing an existing rail
    ghostInvalid: string   // red   — cannot place here
}

class Settings {
    colors: ColorsConfig
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
        clouds: CloudsConfig
    }
    constructor() {
        this.colors = {
            floor:   '#9AB17A',   // moss green
            floor2:  '#E4DFB5',   // alt moss
            rail:    '#c8a86a',   // sandy track bed
            station: '#d4a843',   // gold
            start:   '#5a7aaa',   // slate blue
            rock:         '#8a7a6a',   // grey-brown rock base
            ghostFree:    '#ffee02',   // green  — free tile
            ghostReplace: '#4080ff',   // blue   — replace existing rail
            ghostInvalid: '#ff4040',   // red    — cannot place
        }

        this.scene = {
            background: '#87ceeb', // sky blue
            fog: '#b8dff5',        // light sky blue fog
            ambient: {
                color: '#997575',
                intensity: 0.5,
            },
            sun: {
                color: '#fff19d',
                intensity: 1.5,
            },
            fill: {
                color: '#a5cef8',
                intensity: 1.4,
            },
            rectLight: {
                color: '#ffeedd', // warm off-white
                intensity: 7,
            },
            clouds: {
                count:         10,
                scaleMin:      8,
                scaleMax:      12,
                driftSpeedMin: 0.25,
                driftSpeedMax: 2.0,
                depth:         40,
                coverX:        1.0,
                coverY:        1.2,
                verticalBias:  0,
                verticalDrift: 0.08,
                noiseScale:    0.2,
                dispStrength:  0.024,
                dispSpeed:     0.072,
            },
        }
    }
}

const settings = new Settings();
export { settings as Settings }

