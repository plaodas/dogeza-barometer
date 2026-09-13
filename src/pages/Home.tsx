import { AudioAnalyzer } from '../components/AudioAnalyzer'
import { CameraView } from '../components/CameraView'
import styles from './Home.module.css'

type HomeProps = {
  micEnabled: boolean
  onToggleMic: (enabled: boolean) => void
  onStart: () => void
}

export function Home({ micEnabled, onToggleMic, onStart }: HomeProps) {
  return (
    <section className={`screen ${styles.screen}`}>
      <header className={styles.hero}>
        <h1 className="title">土下座バロメーター</h1>
        <p className="subtitle">今、床と和解すべきか</p>
      </header>

      <div className={styles.preview}>
        <CameraView compact />
        <p className={styles.caption}>顔と声から、土下座タイミングを計測します</p>
      </div>

      <div className={styles.controls}>
        <AudioAnalyzer
          enabled={micEnabled}
          onToggle={onToggleMic}
          volumeScore={micEnabled ? 36 : 0}
          wpm={micEnabled ? 120 : 0}
        />
        <button type="button" className="btn btn-primary" onClick={onStart}>
          土下座の旅を始める
        </button>
        <p className={styles.note}>この段階では表情・音声はダミー値です</p>
      </div>
    </section>
  )
}
