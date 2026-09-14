import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  blendshapesToMap,
  emotionFromBlendshapes,
  smoothEmotion,
} from '../lib/faceEmotion'
import type { FaceEmotion, FaceLandmark } from '../types'

const idleEmotion: FaceEmotion = {
  anger: 6,
  confusion: 8,
  sadness: 5,
  score: 6,
  detected: false,
  modelReady: false,
}

const WASM_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

async function createFaceLandmarker() {
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE)
  const options = {
    runningMode: 'VIDEO' as const,
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
    numFaces: 1,
    minFaceDetectionConfidence: 0.3,
    minFacePresenceConfidence: 0.3,
    minTrackingConfidence: 0.3,
  }

  try {
    return await FaceLandmarker.createFromOptions(fileset, {
      ...options,
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    })
  } catch {
    return await FaceLandmarker.createFromOptions(fileset, {
      ...options,
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
    })
  }
}

export function useFaceEmotion(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled: boolean,
  paused = false,
  calibrationKey = 0,
): FaceEmotion & {
  landmarksRef: RefObject<FaceLandmark[] | null>
  matrixRef: RefObject<number[] | null>
} {
  const [emotion, setEmotion] = useState<FaceEmotion>(idleEmotion)
  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const emotionRef = useRef(idleEmotion)
  const landmarksRef = useRef<FaceLandmark[] | null>(null)
  const matrixRef = useRef<number[] | null>(null)
  const pausedRef = useRef(paused)
  const calibrationRef = useRef(calibrationKey)
  const appliedCalibration = useRef(calibrationKey)

  useEffect(() => {
    emotionRef.current = emotion
  }, [emotion])

  useEffect(() => {
    pausedRef.current = paused
    if (paused) {
      landmarksRef.current = null
      matrixRef.current = null
    }
  }, [paused])

  useEffect(() => {
    calibrationRef.current = calibrationKey
    landmarksRef.current = null
    matrixRef.current = null
  }, [calibrationKey])

  useEffect(() => {
    if (!enabled) {
      setEmotion(idleEmotion)
      landmarksRef.current = null
      matrixRef.current = null
      return
    }

    let cancelled = false
    let raf = 0
    let lastTimestamp = -1
    let lastPublish = 0

    async function start() {
      try {
        const landmarker = await createFaceLandmarker()
        if (cancelled) {
          landmarker.close()
          return
        }
        landmarkerRef.current = landmarker
        setEmotion((current) => ({ ...current, modelReady: true }))
        raf = requestAnimationFrame(tick)
      } catch {
        if (!cancelled) {
          setEmotion({ ...idleEmotion, modelReady: false })
        }
      }
    }

    function tick(now: number) {
      const video = videoRef.current
      const landmarker = landmarkerRef.current
      if (cancelled) return

      if (pausedRef.current) {
        landmarksRef.current = null
        matrixRef.current = null
        raf = requestAnimationFrame(tick)
        return
      }

      if (appliedCalibration.current !== calibrationRef.current) {
        appliedCalibration.current = calibrationRef.current
        lastTimestamp = -1
      }

      if (video && landmarker && video.readyState >= 2 && now > lastTimestamp) {
        lastTimestamp = now
        try {
          const result = landmarker.detectForVideo(video, now)
          const landmarks = result.faceLandmarks[0]
          const detected = (landmarks?.length ?? 0) > 0
          landmarksRef.current = detected ? landmarks : null
          matrixRef.current = detected
            ? (result.facialTransformationMatrixes[0]?.data ?? null)
            : null

          const categories = result.faceBlendshapes[0]?.categories ?? []
          const next = detected
            ? emotionFromBlendshapes(blendshapesToMap(categories))
            : { anger: 5, confusion: 6, sadness: 4, score: 5 }
          const smoothed = {
            ...smoothEmotion(emotionRef.current, next),
            detected,
            modelReady: true,
          }
          emotionRef.current = smoothed
          if (now - lastPublish > 80) {
            lastPublish = now
            setEmotion(smoothed)
          }
        } catch {
          // タイムスタンプが戻ったフレームは捨てる
        }
      }

      raf = requestAnimationFrame(tick)
    }

    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      landmarkerRef.current?.close()
      landmarkerRef.current = null
      landmarksRef.current = null
      matrixRef.current = null
    }
  }, [enabled, videoRef])

  return { ...emotion, landmarksRef, matrixRef }
}
