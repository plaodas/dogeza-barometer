import { useEffect, useRef, useState } from 'react'
import { AlertModal } from '../components/AlertModal'
import { Floor } from '../components/Floor'
import { AudioAnalyzer } from '../components/AudioAnalyzer'
import { CameraSwitcher } from '../components/CameraSwitcher'
import { CameraView } from '../components/CameraView'
import { Meter } from '../components/Meter'
import { useArPipeline } from '../hooks/useArPipeline'
import { useAudioLevel } from '../hooks/useAudioLevel'
import { useCamera } from '../hooks/useCamera'
import { useDogezaLevel } from '../hooks/useDogezaLevel'
import { useFaceEmotion } from '../hooks/useFaceEmotion'
import { ALERT_THRESHOLD } from '../lib/scoring'
import type { SessionResult } from '../types'
import styles from './Measure.module.css'

type MeasureProps = {
  micEnabled: boolean
  onToggleMic: (enabled: boolean) => void
  onFinish: (result: SessionResult) => void
}

function statusClass(status: string) {
  if (status === '土下座推奨') return 'status-chip status-chip--alert'
  if (status === '危険') return 'status-chip status-chip--hot'
  if (status === 'やや危険') return 'status-chip status-chip--warn'
  return 'status-chip status-chip--ok'
}

function faceBadge(ready: boolean, modelReady: boolean, detected: boolean) {
  if (!ready) return 'DUMMY'
  if (!modelReady) return '読込中'
  if (!detected) return '顔なし'
  return '解析中'
}

export function Measure({ micEnabled, onToggleMic, onFinish }: MeasureProps) {
  const camera = useCamera()
  const ar = useArPipeline(camera.switching, camera.generation)
  const face = useFaceEmotion(camera.videoRef, true, ar.paused, ar.calibrationKey)
  const audio = useAudioLevel(micEnabled)
  const [forcedLevel, setForcedLevel] = useState<number | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMax, setAlertMax] = useState(0)
  const [maxLevel, setMaxLevel] = useState(0)
  const [recommendCount, setRecommendCount] = useState(0)
  const armedRef = useRef(true)

  const dogeza = useDogezaLevel(face.score, audio.volumeScore, audio.wpmScore, forcedLevel)
  const sink = dogeza.level * 0.28
  const floorHeight = 14 + dogeza.level * 0.72

  useEffect(() => {
    setMaxLevel((current) => Math.max(current, dogeza.level))

    if (dogeza.level >= ALERT_THRESHOLD && armedRef.current) {
      armedRef.current = false
      setRecommendCount((count) => count + 1)
      setAlertMax(dogeza.level)
      setAlertOpen(true)
    }

    if (alertOpen) {
      setAlertMax((current) => Math.max(current, dogeza.level))
    }

    if (dogeza.level < 70) {
      armedRef.current = true
    }
  }, [alertOpen, dogeza.level])

  return (
    <section className={`screen ${styles.screen}`}>
      <div className="screen--sinking" style={{ transform: `translateY(${sink}px)` }}>
        <div className={styles.top}>
          <CameraView
            compact
            videoRef={camera.videoRef}
            ready={camera.ready}
            error={camera.error}
            badge={faceBadge(camera.ready, face.modelReady, face.detected)}
            landmarksRef={face.landmarksRef}
            dogezaLevel={dogeza.level}
            faded={camera.faded}
            mirrorPreview={camera.mirrorPreview}
            arPaused={ar.paused}
            arGeneration={ar.calibrationKey}
          />
          {camera.ready && !camera.switching && face.modelReady && !face.detected && (
            <p className={styles.hint}>顔をカメラに向けてください</p>
          )}
        </div>

        <div className={styles.meterBlock}>
          <Meter level={dogeza.level} />
          <div className={statusClass(dogeza.status)}>{dogeza.status}</div>
          <div className={styles.breakdown}>
            <div>
              表情
              <strong>{Math.round(dogeza.faceScore)}</strong>
            </div>
            <div>
              音量
              <strong>{Math.round(dogeza.volumeScore)}</strong>
            </div>
            <div>
              話速
              <strong>{Math.round(dogeza.wpmScore)}</strong>
            </div>
          </div>
          <div className={styles.emotions}>
            <span>怒り {Math.round(face.anger)}</span>
            <span>困惑 {Math.round(face.confusion)}</span>
            <span>悲しみ {Math.round(face.sadness)}</span>
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <AudioAnalyzer
          enabled={micEnabled}
          onToggle={onToggleMic}
          volumeScore={audio.volumeScore}
          volumeDb={audio.volumeDb}
          wpm={audio.wpm}
          error={audio.error}
        />
        <CameraSwitcher
          devices={camera.devices}
          selectedDeviceId={camera.selectedDeviceId}
          switching={camera.switching}
          onSelect={camera.switchCamera}
        />
        <div className={`panel ${styles.demo}`}>
          <label>
            デモ用スライダー
            <span>{forcedLevel === null ? '自動' : Math.round(forcedLevel)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={forcedLevel ?? Math.round(dogeza.level)}
            onChange={(event) => setForcedLevel(Number(event.target.value))}
          />
          <div className={styles.demoActions}>
            <button type="button" className="btn btn-ghost" onClick={() => setForcedLevel(85)}>
              80まで上げる
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setForcedLevel(null)}>
              実測に戻す
            </button>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onFinish({ maxLevel, recommendCount })}
        >
          計測を終える
        </button>
      </div>

      <Floor height={`${floorHeight}vh`} />

      {alertOpen && (
        <AlertModal
          level={alertMax}
          onMentalBow={() => setAlertOpen(false)}
          onRealBow={() => setAlertOpen(false)}
          onClose={() => setAlertOpen(false)}
        />
      )}
    </section>
  )
}
