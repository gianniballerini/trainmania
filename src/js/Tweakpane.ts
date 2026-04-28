import { Pane } from 'tweakpane';
import { Settings } from './Settings';

class Tweakpane {
    pane: Pane
    constructor() {
        this.pane = new Pane()
        this.pane = new Pane({
            title: 'Settings',
            expanded: false
        });

        const levelsFolder = (this.pane as any).addFolder({
            title: 'Levels',
            expanded: false
        });

        const lvl_test_btn = levelsFolder.addButton({
            title: 'Level1',
            label: 'Level1',   // optional
        });
        lvl_test_btn.on('click', () => this.loadLevel(0));

        const lvl1_btn = levelsFolder.addButton({
            title: 'Level2',
            label: 'Level2',   // optional
        });
        lvl1_btn.on('click', () => this.loadLevel(1));

        const lvl2_btn = levelsFolder.addButton({
            title: 'Level3',
            label: 'Level3',   // optional
        });
        lvl2_btn.on('click', () => this.loadLevel(2));

        const lvl4_btn = levelsFolder.addButton({
            title: 'Level4',
            label: 'Level4',   // optional
        });
        lvl4_btn.on('click', () => this.loadLevel(3));

        const lvl5_btn = levelsFolder.addButton({
            title: 'Level5',
            label: 'Level5',   // optional
        });
        lvl5_btn.on('click', () => this.loadLevel(4));

        const lvl6_btn = levelsFolder.addButton({
            title: 'Level6',
            label: 'Level6',   // optional
        });
        lvl6_btn.on('click', () => this.loadLevel(5));

        const lvl7_btn = levelsFolder.addButton({
            title: 'Level7',
            label: 'Level7',   // optional
        });
        lvl7_btn.on('click', () => this.loadLevel(6));

        const lvl8_btn = levelsFolder.addButton({
            title: 'Level8',
            label: 'Level8',   // optional
        });
        lvl8_btn.on('click', () => this.loadLevel(7));

        const lvlTest_btn = levelsFolder.addButton({
            title: 'LevelTest',
            label: 'Testing Level',   // optional
        });
        lvlTest_btn.on('click', () => this.loadLevel(8));

        const colorsFolder = (this.pane as any).addFolder({
            title: 'Colors',
            expanded: false
        });

        colorsFolder.addBinding(Settings.colors, 'floor').on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'floor2').on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'rail').on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'station').on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'start').on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'rock').on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'ghostFree',    { label: 'Ghost Free'    }).on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'ghostReplace', { label: 'Ghost Replace' }).on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'ghostInvalid', { label: 'Ghost Invalid' }).on('change', this.updateColors.bind(this));

        const sceneFolder = (this.pane as any).addFolder({
            title: 'Scene',
            expanded: false
        });

        sceneFolder.addBinding(Settings.scene, 'background', {label: 'Background'}).on('change', this.updateSceneLights.bind(this));
        sceneFolder.addBinding(Settings.scene, 'fog', {label: 'Fog Color'}).on('change', this.updateSceneLights.bind(this));
        sceneFolder.addBinding(Settings.scene.ambient, 'color', {label: 'Amb Color'}).on('change', this.updateSceneLights.bind(this));
        sceneFolder.addBinding(Settings.scene.ambient, 'intensity', { min: 0, max: 2, label: 'Amb Int' }).on('change', this.updateSceneLights.bind(this));
        sceneFolder.addBinding(Settings.scene.sun, 'color', {label: 'Sun Color'}).on('change', this.updateSceneLights.bind(this));
        sceneFolder.addBinding(Settings.scene.sun, 'intensity', { min: 0, max: 3, label: 'Sun Int' }).on('change', this.updateSceneLights.bind(this));
        sceneFolder.addBinding(Settings.scene.fill, 'color', {label: 'Fill Color'}).on('change', this.updateSceneLights.bind(this));
        sceneFolder.addBinding(Settings.scene.fill, 'intensity', { min: 0, max: 3, label: 'Fill Int' }).on('change', this.updateSceneLights.bind(this));
        // sceneFolder.addBinding(Settings.scene.rectLight, 'color', {label: 'Rect Light Color'}).on('change', this.updateSceneLights.bind(this));
        // sceneFolder.addBinding(Settings.scene.rectLight, 'intensity', { min: 0, max: 20, label: 'Rect Light Int' }).on('change', this.updateSceneLights.bind(this));

        const cloudFolder = (this.pane as any).addFolder({
            title: 'Clouds',
            expanded: false,
        });

        cloudFolder.addBinding(Settings.scene.clouds, 'scaleMin', { min: 1, max: 20, step: 0.1, label: 'Scale Min' });
        cloudFolder.addBinding(Settings.scene.clouds, 'scaleMax', { min: 1, max: 24, step: 0.1, label: 'Scale Max' });
        cloudFolder.addBinding(Settings.scene.clouds, 'driftSpeedMin', { min: 0, max: 2.5, step: 0.01, label: 'Drift Min' });
        cloudFolder.addBinding(Settings.scene.clouds, 'driftSpeedMax', { min: 0, max: 3, step: 0.01, label: 'Drift Max' });
        cloudFolder.addBinding(Settings.scene.clouds, 'depth', { min: 20, max: 120, step: 0.5, label: 'Depth' });
        cloudFolder.addBinding(Settings.scene.clouds, 'coverX', { min: 0.8, max: 2.5, step: 0.01, label: 'Cover X' });
        cloudFolder.addBinding(Settings.scene.clouds, 'coverY', { min: 0.8, max: 2.5, step: 0.01, label: 'Cover Y' });
        cloudFolder.addBinding(Settings.scene.clouds, 'verticalBias', { min: -0.8, max: 0.8, step: 0.01, label: 'Y Bias' });
        cloudFolder.addBinding(Settings.scene.clouds, 'verticalDrift', { min: 0, max: 0.5, step: 0.005, label: 'Y Drift' });
        cloudFolder.addBinding(Settings.scene.clouds, 'noiseScale', { min: 0.2, max: 5, step: 0.01, label: 'Noise Scale' });
        cloudFolder.addBinding(Settings.scene.clouds, 'dispStrength', { min: 0, max: 0.1, step: 0.001, label: 'Disp Strength' });
        cloudFolder.addBinding(Settings.scene.clouds, 'dispSpeed', { min: 0, max: 0.15, step: 0.001, label: 'Disp Speed' });
    }

    hide(): void {
        this.pane.element.style.display = 'none'
    }

    loadLevel(level: number) {
        window.game?.loadLevel(level)
    }

    updateColors(): void {
        window.game?.grid?.updateColors()
    }

    updateSceneLights(): void {
        window.game?.sceneController.updateLights()
    }

}

export { Tweakpane };
