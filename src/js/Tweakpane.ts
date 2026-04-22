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

        const levelsFolder = this.pane.addFolder({
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

        const lvl3_btn = levelsFolder.addButton({
            title: 'Level4',
            label: 'Level4',   // optional
        });
        lvl3_btn.on('click', () => this.loadLevel(3));

        const lvl4_btn = levelsFolder.addButton({
            title: 'LevelTest',
            label: 'Testing Level',   // optional
        });
        lvl4_btn.on('click', () => this.loadLevel(4));

        const colorsFolder = this.pane.addFolder({
            title: 'Colors',
            expanded: false
        });

        colorsFolder.addBinding(Settings.colors, 'floor').on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'floor2').on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'rail').on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'station').on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'start').on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'rock').on('change', this.updateColors.bind(this));
        colorsFolder.addBinding(Settings.colors, 'ghost').on('change', this.updateColors.bind(this));

        const sceneFolder = this.pane.addFolder({
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
    }

    hide(): void {
        this.pane.element.style.display = 'none'
    }

    loadLevel(level: number) {
        window.game?.loadLevel(level)
    }

    updateColors(): void {
        window.game?.grid.updateColors()
    }

    updateSceneLights(): void {
        window.game?.sceneController.updateLights()
    }

}

export { Tweakpane };
