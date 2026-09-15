import { DebugUnlockTitle } from '../components/DebugLab'
import { getResultComment } from '../lib/scoring'
import type { SessionResult } from '../types'
import styles from './Result.module.css'

type ResultProps = {
  result: SessionResult
  onRetry: () => void
  onHome: () => void
}

export function Result({ result, onRetry, onHome }: ResultProps) {
  return (
    <section className={`screen ${styles.screen}`}>
      <header>
        <DebugUnlockTitle>土下座の結果</DebugUnlockTitle>
        <p className="subtitle">今日の床との距離</p>
      </header>

      <div className={`panel ${styles.card}`}>
        <p className={styles.kicker}>RESULT</p>
        <div className={styles.stats}>
          <div>
            <span className={styles.statValue}>{Math.round(result.maxLevel)}</span>
            <span className={styles.statLabel}>今日の最高土下座レベル</span>
          </div>
          <div>
            <span className={styles.statValue}>{result.recommendCount}</span>
            <span className={styles.statLabel}>土下座推奨回数</span>
          </div>
        </div>
        <p className={styles.comment}>{getResultComment(result.maxLevel)}</p>
      </div>

      <div className={`btn-row ${styles.actions}`}>
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          もう一度計測する
        </button>
        <button type="button" className={`btn btn-ghost ${styles.home}`} onClick={onHome}>
          ホームへ戻る
        </button>
      </div>
    </section>
  )
}
