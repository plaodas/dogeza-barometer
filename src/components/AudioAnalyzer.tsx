import styles from './AudioAnalyzer.module.css'

type AudioAnalyzerProps = {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  volumeScore: number
  wpm: number
}

const BAR_COUNT = 8

export function AudioAnalyzer({
  enabled,
  onToggle,
  volumeScore,
  wpm,
}: AudioAnalyzerProps) {
  return (
    <div className={`panel ${styles.wrap}`}>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => onToggle(event.target.checked)}
        />
        マイク {enabled ? 'ON' : 'OFF'}
      </label>
      <div className={styles.row}>
        <span>荒ぶりゲージ</span>
        <div className={styles.bars} aria-hidden="true">
          {Array.from({ length: BAR_COUNT }, (_, index) => {
            const threshold = ((index + 1) / BAR_COUNT) * 100
            const active = enabled && volumeScore >= threshold - 8
            return (
              <span
                key={index}
                className={styles.bar}
                style={{
                  height: `${10 + index * 2.4}px`,
                  opacity: active ? 1 : 0.18,
                }}
              />
            )
          })}
        </div>
      </div>
      <div className={styles.row}>
        <span>推定話速</span>
        <strong>{enabled ? `${Math.round(wpm)} WPM` : '---'}</strong>
      </div>
    </div>
  )
}
