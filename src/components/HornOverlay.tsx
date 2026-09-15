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
import { hornFollowAmount, hornPoses, mixHornPose, type HornPose } from '../lib/hornPose'
import { getHornColor } from '../lib/scoring'
import { videoContentRect } from '../lib/videoLayout'
import type { FaceLandmark } from '../types'
import styles from './HornOverlay.module.css'

type HornOverlayProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  landmarksRef: RefObject<FaceLandmark[] | null>
  dogezaLevel: number
  paused?: boolean
  generation?: number
  mirrorX?: boolean
}

type Pose = HornPose

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount
}

export function HornOverlay({
  videoRef,
  landmarksRef,
  dogezaLevel,
  paused = false,
  generation = 0,
  mirrorX = false,
}: HornOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const levelRef = useRef(dogezaLevel)
  const pausedRef = useRef(paused)
  const generationRef = useRef(generation)
  const mirrorXRef = useRef(mirrorX)

  useEffect(() => {
    levelRef.current = dogezaLevel
  }, [dogezaLevel])

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    generationRef.current = generation
  }, [generation])

  useEffect(() => {
    mirrorXRef.current = mirrorX
  }, [mirrorX])

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
    let appliedGeneration = generationRef.current
    let appliedMirror = mirrorXRef.current
    let raf = 0
    let disposed = false

    const applyCamera = () => {
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

    const observer = new ResizeObserver(applyCamera)
    observer.observe(wrap)
    window.visualViewport?.addEventListener('resize', applyCamera)
    window.addEventListener('orientationchange', applyCamera)
    applyCamera()

    const follow = hornFollowAmount()

    const applyPose = (mesh: Mesh, next: Pose, previous: Pose | null) => {
      const mixed = mixHornPose(previous, next, follow)
      mesh.position.set(mixed.x - wrap.clientWidth / 2, -(mixed.y - wrap.clientHeight / 2), 0)
      mesh.rotation.set(0.35, 0, mixed.angle)
      mesh.scale.setScalar(mixed.size)
      mesh.visible = true
      return mixed
    }

    const tick = () => {
      if (disposed) return
      const video = videoRef.current
      const landmarks = landmarksRef.current
      const width = wrap.clientWidth

      if (
        appliedGeneration !== generationRef.current ||
        appliedMirror !== mirrorXRef.current
      ) {
        appliedGeneration = generationRef.current
        appliedMirror = mirrorXRef.current
        leftPose = null
        rightPose = null
        smoothLevel = 0
        applyCamera()
      }

      if (pausedRef.current || !video || !landmarks || video.readyState < 2 || width === 0) {
        left.visible = false
        right.visible = false
        if (pausedRef.current) {
          leftPose = null
          rightPose = null
        }
      } else {
        const rect = videoContentRect(video, wrap)
        smoothLevel = lerp(smoothLevel, levelRef.current, 0.18)
        const poses = hornPoses(landmarks, rect, smoothLevel, mirrorXRef.current)
        if (poses) {
          leftPose = applyPose(left, poses.left, leftPose)
          rightPose = applyPose(right, poses.right, rightPose)
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
      window.visualViewport?.removeEventListener('resize', applyCamera)
      window.removeEventListener('orientationchange', applyCamera)
      scene.remove(left, right)
      renderer.dispose()
    }
  }, [landmarksRef, videoRef])

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}

export type { HornOverlayProps }
