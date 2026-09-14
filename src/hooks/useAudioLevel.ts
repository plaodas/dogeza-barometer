import { useEffect, useState } from 'react'
import { dbToScore, rmsToDb, SpeechPaceTracker, wpmToScore } from '../lib/audioLevel'
import type { AudioLevels } from '../types'

const silentAudio: AudioLevels = {
  volumeDb: -60,
  volumeScore: 0,
  wpm: 0,
  wpmScore: 0,
  error: null,
}

export function useAudioLevel(enabled: boolean): AudioLevels {
  const [audio, setAudio] = useState<AudioLevels>(silentAudio)

  useEffect(() => {
    if (!enabled) {
      setAudio(silentAudio)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setAudio({ ...silentAudio, error: 'この環境ではマイクを使えません' })
      return
    }

    let cancelled = false
    let stream: MediaStream | null = null
    let context: AudioContext | null = null
    let raf = 0
    let lastPublish = 0
    let smoothDb = -60
    const pace = new SpeechPaceTracker()

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        context = new AudioContext()
        await context.resume()
        const source = context.createMediaStreamSource(stream)
        const highpass = context.createBiquadFilter()
        highpass.type = 'highpass'
        highpass.frequency.value = 180
        const gain = context.createGain()
        gain.gain.value = 1.5
        const analyser = context.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.55
        source.connect(highpass)
        highpass.connect(gain)
        gain.connect(analyser)

        const samples = new Float32Array(analyser.fftSize)

        const tick = (now: number) => {
          if (cancelled || !context) return
          analyser.getFloatTimeDomainData(samples)

          let sum = 0
          for (const sample of samples) sum += sample * sample
          const rms = Math.sqrt(sum / samples.length)
          const db = rmsToDb(rms)
          smoothDb += (db - smoothDb) * (db > smoothDb ? 0.62 : 0.16)
          const wpm = pace.update(rms, now)

          if (now - lastPublish > 80) {
            lastPublish = now
            setAudio({
              volumeDb: smoothDb,
              volumeScore: dbToScore(smoothDb),
              wpm,
              wpmScore: wpmToScore(wpm),
              error: null,
            })
          }

          raf = requestAnimationFrame(tick)
        }

        raf = requestAnimationFrame(tick)
      } catch {
        if (!cancelled) {
          setAudio({ ...silentAudio, error: 'マイクを許可してください' })
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((track) => track.stop())
      void context?.close()
    }
  }, [enabled])

  return audio
}
