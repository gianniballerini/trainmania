import * as THREE from 'three'
import { Settings } from './Settings.js'

class SceneController {

    ambient_light: THREE.AmbientLight
    sun_light: THREE.DirectionalLight
    fill_light: THREE.DirectionalLight
    // rect_light: THREE.RectAreaLight

    constructor(private scene: THREE.Scene) {
        this.scene = scene
        this.ambient_light = this.scene.children.find((child) => child instanceof THREE.AmbientLight) as THREE.AmbientLight
        this.sun_light = this.scene.children.find((child) => child instanceof THREE.DirectionalLight && child.castShadow) as THREE.DirectionalLight
        this.fill_light = this.scene.children.find((child) => child instanceof THREE.DirectionalLight && !child.castShadow) as THREE.DirectionalLight
        // this.rect_light = this.scene.children.find((child) => child instanceof THREE.RectAreaLight) as THREE.RectAreaLight
    }

    updateLights()
    {
        this.ambient_light.color.set(Settings.scene.ambient.color)
        this.ambient_light.intensity = Settings.scene.ambient.intensity
        this.sun_light.color.set(Settings.scene.sun.color)
        this.sun_light.intensity = Settings.scene.sun.intensity
        this.fill_light.color.set(Settings.scene.fill.color)
        this.fill_light.intensity = Settings.scene.fill.intensity
        // this.rect_light.color.set(Settings.scene.rectLight.color)
        // this.rect_light.intensity = Settings.scene.rectLight.intensity

        ;(this.scene.background as THREE.Color).set(Settings.scene.background)
        if (this.scene.fog instanceof THREE.FogExp2) {
            this.scene.fog.color.set(Settings.scene.fog)
        }
    }
}

export { SceneController }
