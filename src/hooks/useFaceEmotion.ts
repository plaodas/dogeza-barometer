import { useEffect, useState } from 'react'
import { clamp } from '../lib/scoring'
import type { FaceEmotion } from '../types'

const idleEmotion: FaceEmotion = {
  anger: 8,
  confusion: 10,
  sadness: 6,
  score: 8,
}

function combineFaceScore(anger: number, confusion: number, sadness: number) {
  return clamp(anger * 0.5 + confusion * 0.3 + sadness * 0.2)
}

/**
 * 表情スコア。
 * いまはダミーのゆらぎ。次フェーズで MediaPipe FaceMesh に差し替える。
 */
export function useFaceEmotion(enabled: boolean): FaceEmotion {
  const [emotion, setEmotion] = useState<FaceEmotion>(idleEmotion)

  useEffect(() => {
    if (!enabled) {
      setEmotion(idleEmotion)
      return
    }

    let frame = 0
    const timer = window.setInterval(() => {
      frame += 1
      const surge = frame % 90 > 78 ? 72 : Math.sin(frame / 18) > 0.92 ? 28 : 0
      const anger = clamp(22 + Math.sin(frame / 9) * 18 + Math.random() * 10 + surge)
      const confusion = clamp(22 + Math.cos(frame / 11) * 14 + Math.random() * 8)
      const sadness = clamp(12 + Math.sin(frame / 13 + 1.2) * 10 + Math.random() * 6)
      setEmotion({
        anger,
        confusion,
        sadness,
        score: combineFaceScore(anger, confusion, sadness),
      })
    }, 180)

    return () => window.clearInterval(timer)
  }, [enabled])

  return emotion
}
