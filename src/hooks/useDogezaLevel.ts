import { useMemo } from 'react'
import { calcDogezaLevel, getDogezaStatus } from '../lib/scoring'
import type { DogezaBreakdown } from '../types'

export function useDogezaLevel(
  faceScore: number,
  volumeScore: number,
  wpmScore: number,
  forcedLevel: number | null = null,
): DogezaBreakdown {
  return useMemo(() => {
    const computed = calcDogezaLevel(faceScore, volumeScore, wpmScore)
    const level = forcedLevel ?? computed

    return {
      level,
      status: getDogezaStatus(level),
      faceScore,
      volumeScore,
      wpmScore,
    }
  }, [faceScore, volumeScore, wpmScore, forcedLevel])
}
