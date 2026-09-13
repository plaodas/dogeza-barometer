import { AudioAnalyzer } from '../components/AudioAnalyzer'
import { FloorPicker } from '../components/FloorPicker'
import { CameraView } from '../components/CameraView'
import { useCamera } from '../hooks/useCamera'
import styles from './Home.module.css'

type HomeProps = {
  micEnabled: boolean
  onToggleMic: (enabled: boolean) => void
  onStart: () => void
}

export function Home({ micEnabled, onToggleMic, onStart }: HomeProps) {
  const camera = useCamera()

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
        />
        <p className={styles.caption}>顔と声から、土下座タイミングを計測します</p>
      </div>

      <div className={styles.controls}>
        <AudioAnalyzer
          enabled={micEnabled}
          onToggle={onToggleMic}
          volumeScore={micEnabled ? 36 : 0}
          wpm={micEnabled ? 120 : 0}
        />
        <FloorPicker />
        <button type="button" className="btn btn-primary" onClick={onStart}>
          土下座の旅を始める
        </button>
        <p className={styles.note}>表情はカメラから解析します。音声はまだダミーです</p>
      </div>
    </section>
  )
}
