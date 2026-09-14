import {
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  type BufferGeometry,
  type Texture,
} from 'three'

let sharedGeometry: BufferGeometry | null = null
let sharedTexture: Texture | null = null
let sharedMaterial: MeshBasicMaterial | null = null

export function createHornGeometry() {
  if (sharedGeometry) return sharedGeometry

  const profile = [
    new Vector2(0.2, 0),
    new Vector2(0.22, 0.1),
    new Vector2(0.18, 0.32),
    new Vector2(0.12, 0.58),
    new Vector2(0.07, 0.8),
    new Vector2(0.025, 1),
  ]
  sharedGeometry = new LatheGeometry(profile, 20)
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
  sharedMaterial = new MeshBasicMaterial({
    map: getHornTexture(),
    color: '#1b4f72',
  })
  return sharedMaterial
}

export function createHornMesh() {
  const mesh = new Mesh(createHornGeometry(), createHornMaterial())
  mesh.frustumCulled = false
  return mesh
}
