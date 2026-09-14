import { AudioAnalyzer } from '../components/AudioAnalyzer'
import { FloorPicker } from '../components/FloorPicker'
import { CameraSwitcher } from '../components/CameraSwitcher'
import { CameraView } from '../components/CameraView'
import { useAudioLevel } from '../hooks/useAudioLevel'
import { useCamera } from '../hooks/useCamera'
import styles from './Home.module.css'

type HomeProps = {
  micEnabled: boolean
  onToggleMic: (enabled: boolean) => void
  onStart: () => void
}

export function Home({ micEnabled, onToggleMic, onStart }: HomeProps) {
  const camera = useCamera()
  const audio = useAudioLevel(micEnabled)

  return (
    <section className={`screen ${styles.screen}`}>
      <header className={styles.hero}>
        <h1 className="title">土下座バロメーター</h1>
        <p className="subtitle">今、床と融合すべきか</p>
      </header>

      <div className={styles.preview}>
        <CameraView
          compact
          videoRef={camera.videoRef}
          ready={camera.ready}
          error={camera.error}
          faded={camera.faded}
          mirrorPreview={camera.mirrorPreview}
        />
        <p className={styles.caption}>顔と声から、土下座タイミングを計測します</p>
      </div>

      <div className={styles.controls}>
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
        <FloorPicker />
        <button type="button" className="btn btn-primary" onClick={onStart}>
          土下座の旅を始める
        </button>
        <p className={styles.note}>表情と声は、カメラとマイクからその場で解析します</p>
      </div>
    </section>
  )
}
