import { clamp } from './scoring'

export function rmsToDb(rms: number) {
  return clamp(20 * Math.log10(Math.max(rms, 1e-6)), -60, 0)
}

export function dbToScore(db: number) {
  if (db <= -42) return 0
  return clamp(((db + 42) / 40) * 100)
}

export function wpmToScore(wpm: number) {
  return clamp(((wpm - 40) / 110) * 100)
}

export class SpeechPaceTracker {
  private peaks: number[] = []
  private speaking = false
  private prevRms = 0
  private rising = false
  private lastPeak = 0
  private noiseFloor = 0.01
  private smoothWpm = 0

  update(rms: number, now: number) {
    this.noiseFloor += (Math.min(rms, this.noiseFloor) - this.noiseFloor) * 0.04
    if (rms < this.noiseFloor) {
      this.noiseFloor = rms * 0.25 + this.noiseFloor * 0.75
    }

    const speechOn = Math.max(0.005, this.noiseFloor * 2.8)
    const speechOff = Math.max(0.003, this.noiseFloor * 1.4)

    if (this.speaking) {
      if (rms < speechOff) this.speaking = false
    } else if (rms > speechOn) {
      this.speaking = true
    }

    if (this.speaking && rms > this.prevRms) {
      this.rising = true
    } else if (this.rising && rms < this.prevRms && now - this.lastPeak > 55) {
      this.peaks.push(now)
      this.lastPeak = now
      this.rising = false
    }

    this.prevRms = rms
    this.peaks = this.peaks.filter((time) => now - time < 4000)

    const syllablesPerSec = this.peaks.length / 4
    const nextWpm = this.speaking || this.peaks.length > 0 ? syllablesPerSec * 60 : 0
    this.smoothWpm += (nextWpm - this.smoothWpm) * (nextWpm > this.smoothWpm ? 0.42 : 0.14)
    if (!this.speaking && this.peaks.length === 0) {
      this.smoothWpm *= 0.92
    }

    return clamp(this.smoothWpm, 0, 240)
  }
}
