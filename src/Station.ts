import * as THREE from 'three'
import { cellToWorld, Grid } from './Grid.js'

export function buildStation(scene: THREE.Scene, grid: Grid): THREE.Group {
  const [sc, sr] = grid.level.stationPos
  const pos = cellToWorld(sc, sr, grid.cols, grid.rows)

  const group = new THREE.Group()
  group.position.set(pos.x, 0, pos.z)

  // Platform roof
  const roofGeo = new THREE.BoxGeometry(1.6, 0.1, 1.6)
  const roofMat = new THREE.MeshLambertMaterial({ color: 0xd4a843 })
  const roof = new THREE.Mesh(roofGeo, roofMat)
  roof.position.y = 0.8
  roof.castShadow = true
  group.add(roof)

  // Four pillars
  const pillarGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.8, 6)
  const pillarMat = new THREE.MeshLambertMaterial({ color: 0x5c3d2e })
  const pillarOffsets: [number, number][] = [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]
  pillarOffsets.forEach(([x, z]) => {
    const p = new THREE.Mesh(pillarGeo, pillarMat)
    p.position.set(x, 0.4, z)
    group.add(p)
  })

  // Flag pole
  const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6)
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x8b6040 })
  const pole = new THREE.Mesh(poleGeo, poleMat)
  pole.position.set(0.65, 1.2, -0.65)
  group.add(pole)

  // Flag
  const flagGeo = new THREE.PlaneGeometry(0.35, 0.22)
  const flagMat = new THREE.MeshLambertMaterial({ color: 0xc0522a, side: THREE.DoubleSide })
  const flag = new THREE.Mesh(flagGeo, flagMat)
  flag.position.set(0.83, 1.42, -0.65)
  group.add(flag)
  group.userData.flag = flag

  scene.add(group)
  return group
}
