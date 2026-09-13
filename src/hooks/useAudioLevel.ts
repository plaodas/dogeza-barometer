import { useEffect, useState } from 'react'
import { clamp } from '../lib/scoring'
import type { AudioLevels } from '../types'

const silentAudio: AudioLevels = {
  volumeDb: -60,
  volumeScore: 0,
  wpm: 0,
  wpmScore: 0,
}

function dbToScore(db: number) {
  return clamp(((db + 60) / 55) * 100)
}

function wpmToScore(wpm: number) {
  return clamp(((wpm - 80) / 140) * 100)
}

/**
 * 音量と話速。
 * いまはダミー。次フェーズで WebAudio API に差し替える。
 */
export function useAudioLevel(enabled: boolean): AudioLevels {
  const [audio, setAudio] = useState<AudioLevels>(silentAudio)

  useEffect(() => {
    if (!enabled) {
      setAudio(silentAudio)
      return
    }

    let frame = 0
    const timer = window.setInterval(() => {
      frame += 1
      const burst = frame % 90 > 78 ? 28 : Math.sin(frame / 14) > 0.88 ? 14 : 0
      const volumeDb = clamp(-48 + Math.sin(frame / 7) * 16 + Math.random() * 8 + burst, -60, -5)
      const wpm = clamp(110 + Math.cos(frame / 10) * 40 + Math.random() * 20 + burst * 2, 0, 240)
      setAudio({
        volumeDb,
        volumeScore: dbToScore(volumeDb),
        wpm,
        wpmScore: wpmToScore(wpm),
      })
    }, 160)

    return () => window.clearInterval(timer)
  }, [enabled])

  return audio
}
