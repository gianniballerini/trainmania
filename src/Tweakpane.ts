import { Pane } from 'tweakpane';

class Tweakpane {
    pane: Pane
    constructor() {
        this.pane = new Pane()
        this.pane = new Pane({
            title: 'Settings',
            expanded: false
        });

        const lvl1_btn = this.pane.addButton({
            title: 'Level1',
            label: 'Level1',   // optional
        });
        lvl1_btn.on('click', () => this.loadLevel(0));

        const lvl2_btn = this.pane.addButton({
            title: 'Level2',
            label: 'Level2',   // optional
        });
        lvl2_btn.on('click', () => this.loadLevel(1));

        const lvl3_btn = this.pane.addButton({
            title: 'Level3',
            label: 'Level3',   // optional
        });
        lvl3_btn.on('click', () => this.loadLevel(2));

        const lvl4_btn = this.pane.addButton({
            title: 'Level4',
            label: 'Level4',   // optional
        });
        lvl4_btn.on('click', () => this.loadLevel(3));
    }

    loadLevel(level: number) {
        window.game?.loadLevel(level)
    }
}

const tweakpane = new Tweakpane()
export { tweakpane as Tweakpane };
