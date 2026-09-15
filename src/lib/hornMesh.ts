import {
  ConeGeometry,
  Mesh,
  MeshStandardMaterial,
  TextureLoader,
  SRGBColorSpace,
  type Texture,
  Euler,
  DoubleSide,
} from 'three'
import type { FaceLandmark } from '../types'

function faceRotation(landmarks: FaceLandmark[]) {
  const leftEye = landmarks[105]
  const rightEye = landmarks[334]
  const nose = landmarks[1]
  const forehead = landmarks[10]

  const roll = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x)
  const pitch = Math.atan2(forehead.y - nose.y, forehead.z - nose.z)
  const yaw = Math.atan2(rightEye.z - leftEye.z, rightEye.x - leftEye.x)

  return new Euler(pitch, yaw, roll)
}

let sharedGeometry: ConeGeometry | null = null
let sharedTexture: Texture | null = null
let sharedMaterial: MeshStandardMaterial | null = null

export function createHornGeometry() {
  if (sharedGeometry) return sharedGeometry
  sharedGeometry = new ConeGeometry(0.15, 0.65, 16)
  return sharedGeometry
}

function getHornTexture() {
  if (sharedTexture) return sharedTexture
  sharedTexture = new TextureLoader().load('/textures/horn.png')
  sharedTexture.colorSpace = SRGBColorSpace
  return sharedTexture
}

export function createHornMaterial() {
  if (sharedMaterial) return sharedMaterial
  sharedMaterial = new MeshStandardMaterial({
    map: getHornTexture(),
    color: '#f2c94c',
    side: DoubleSide,
  })
  return sharedMaterial
}

export function createHornMesh() {
  const mesh = new Mesh(createHornGeometry(), createHornMaterial())
  mesh.frustumCulled = false
  return mesh
}

export function placeHorns(leftHorn: Mesh, rightHorn: Mesh, landmarks: FaceLandmark[]) {
  const left = landmarks[105]
  const right = landmarks[334]

  leftHorn.position.set(left.x, left.y + 0.1, left.z)
  rightHorn.position.set(right.x, right.y + 0.1, right.z)

  const rot = faceRotation(landmarks)
  leftHorn.rotation.copy(rot)
  rightHorn.rotation.copy(rot)
}
