import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { useEffect, useRef, useState, type RefObject } from 'react'
import {
  blendshapesToMap,
  emotionFromBlendshapes,
  smoothEmotion,
} from '../lib/faceEmotion'
import type { FaceEmotion } from '../types'

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
): FaceEmotion {
  const [emotion, setEmotion] = useState<FaceEmotion>(idleEmotion)
  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const emotionRef = useRef(idleEmotion)

  useEffect(() => {
    emotionRef.current = emotion
  }, [emotion])

  useEffect(() => {
    if (!enabled) {
      setEmotion(idleEmotion)
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

      if (video && landmarker && video.readyState >= 2 && now > lastTimestamp) {
        lastTimestamp = now
        try {
          const result = landmarker.detectForVideo(video, now)
          const categories = result.faceBlendshapes[0]?.categories ?? []
          const detected = (result.faceLandmarks[0]?.length ?? 0) > 0
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
    }
  }, [enabled, videoRef])

  return emotion
}
