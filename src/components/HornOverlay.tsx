import { useEffect, useRef, type RefObject } from 'react'
import {
  AmbientLight,
  Color,
  DirectionalLight,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
  type Mesh,
} from 'three'
import { createHornMaterial, createHornMesh } from '../lib/hornMesh'
import { getHornColor } from '../lib/scoring'
import { landmarkToWrap, videoContentRect } from '../lib/videoLayout'
import type { FaceLandmark } from '../types'
import styles from './HornOverlay.module.css'

const LEFT_HORN = 109
const RIGHT_HORN = 338
const FOREHEAD = 10
const CHIN = 152
const LEFT_EYE = 33
const RIGHT_EYE = 263

type HornOverlayProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  landmarksRef: RefObject<FaceLandmark[] | null>
  dogezaLevel: number
}

type Pose = {
  x: number
  y: number
  angle: number
  size: number
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount
}

function poseFor(
  landmarks: FaceLandmark[],
  index: number,
  rect: ReturnType<typeof videoContentRect>,
  level: number,
): Pose | null {
  const anchor = landmarks[index]
  const forehead = landmarks[FOREHEAD]
  const chin = landmarks[CHIN]
  const leftEye = landmarks[LEFT_EYE]
  const rightEye = landmarks[RIGHT_EYE]
  if (!anchor || !forehead || !chin || !leftEye || !rightEye) return null

  const point = landmarkToWrap(anchor, rect)
  const up = landmarkToWrap(forehead, rect)
  const down = landmarkToWrap(chin, rect)
  const eyeL = landmarkToWrap(leftEye, rect)
  const eyeR = landmarkToWrap(rightEye, rect)
  const faceWidth = Math.hypot(eyeR.x - eyeL.x, eyeR.y - eyeL.y)
  const faceHeight = Math.hypot(up.x - down.x, up.y - down.y)
  const upLen = Math.max(Math.hypot(up.x - down.x, up.y - down.y), 1)
  const upX = (up.x - down.x) / upLen
  const upY = (up.y - down.y) / upLen
  const centerX = (eyeL.x + eyeR.x) / 2
  const centerY = (eyeL.y + eyeR.y) / 2
  const outX = point.x - centerX
  const outY = point.y - centerY
  const outLen = Math.max(Math.hypot(outX, outY), 1)
  const dirX = upX * 0.9 + (outX / outLen) * 0.22
  const dirY = upY * 0.9 + (outY / outLen) * 0.22
  const worldDirX = dirX
  const worldDirY = -dirY
  const angle = Math.atan2(worldDirY, worldDirX) - Math.PI / 2
  const crownX = point.x + upX * faceHeight * 0.14
  const crownY = point.y + upY * faceHeight * 0.14
  const size = faceWidth * lerp(0.42, 1.5, level / 100)

  return { x: crownX, y: crownY, angle, size }
}

export function HornOverlay({ videoRef, landmarksRef, dogezaLevel }: HornOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const levelRef = useRef(dogezaLevel)

  useEffect(() => {
    levelRef.current = dogezaLevel
  }, [dogezaLevel])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = canvas?.parentElement
    if (!canvas || !wrap) return

    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setClearColor(0x000000, 0)
    const scene = new Scene()
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    camera.position.z = 5

    const left = createHornMesh()
    const right = createHornMesh()
    const material = createHornMaterial()
    left.visible = false
    right.visible = false
    const ambient = new AmbientLight(0xffffff, 1.6)
    const key = new DirectionalLight(0xffffff, 1.3)
    key.position.set(0.4, 1.2, 4)
    scene.add(left, right, ambient, key)

    const tint = new Color(getHornColor(0))
    const targetTint = new Color(getHornColor(0))
    let smoothLevel = 0
    let leftPose: Pose | null = null
    let rightPose: Pose | null = null
    let raf = 0
    let disposed = false

    const resize = () => {
      const width = wrap.clientWidth
      const height = wrap.clientHeight
      if (width === 0 || height === 0) return
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(width, height, false)
      camera.left = -width / 2
      camera.right = width / 2
      camera.top = height / 2
      camera.bottom = -height / 2
      camera.updateProjectionMatrix()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(wrap)
    window.visualViewport?.addEventListener('resize', resize)
    window.addEventListener('orientationchange', resize)
    resize()

    const applyPose = (mesh: Mesh, next: Pose, previous: Pose | null) => {
      const mixed = previous
        ? {
            x: lerp(previous.x, next.x, 0.35),
            y: lerp(previous.y, next.y, 0.35),
            angle: lerp(previous.angle, next.angle, 0.28),
            size: lerp(previous.size, next.size, 0.22),
          }
        : next
      mesh.position.set(mixed.x - wrap.clientWidth / 2, -(mixed.y - wrap.clientHeight / 2), 0)
      mesh.rotation.set(0.45, 0, mixed.angle)
      mesh.scale.setScalar(mixed.size)
      mesh.visible = true
      return mixed
    }

    const tick = () => {
      if (disposed) return
      const video = videoRef.current
      const landmarks = landmarksRef.current
      const width = wrap.clientWidth

      if (!video || !landmarks || video.readyState < 2 || width === 0) {
        left.visible = false
        right.visible = false
        leftPose = null
        rightPose = null
      } else {
        const rect = videoContentRect(video, wrap)
        smoothLevel = lerp(smoothLevel, levelRef.current, 0.18)
        const nextLeft = poseFor(landmarks, LEFT_HORN, rect, smoothLevel)
        const nextRight = poseFor(landmarks, RIGHT_HORN, rect, smoothLevel)
        if (nextLeft && nextRight) {
          leftPose = applyPose(left, nextLeft, leftPose)
          rightPose = applyPose(right, nextRight, rightPose)
          targetTint.set(getHornColor(smoothLevel))
          tint.lerp(targetTint, 0.2)
          material.color.copy(tint)
          material.emissive.copy(tint)
          material.emissiveIntensity = 0.45
        } else {
          left.visible = false
          right.visible = false
        }
      }

      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      observer.disconnect()
      window.visualViewport?.removeEventListener('resize', resize)
      window.removeEventListener('orientationchange', resize)
      scene.remove(left, right)
      renderer.dispose()
    }
  }, [landmarksRef, videoRef])

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}

export type { HornOverlayProps }
