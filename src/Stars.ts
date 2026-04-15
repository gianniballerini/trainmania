import * as THREE from 'three'

export function buildStarfield(scene: THREE.Scene): THREE.Points {
  const count = 800
  const geo   = new THREE.BufferGeometry()
  const pos   = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi   = Math.acos(2 * Math.random() - 1)
    const r     = 80 + Math.random() * 40
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    pos[i * 3 + 2] = r * Math.cos(phi)
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  const mat   = new THREE.PointsMaterial({ color: 0xffeedd, size: 0.18, sizeAttenuation: true })
  const stars = new THREE.Points(geo, mat)
  scene.add(stars)
  return stars
}
