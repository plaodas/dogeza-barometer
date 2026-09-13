import type { RefObject } from 'react'
import styles from './CameraView.module.css'

type CameraViewProps = {
  compact?: boolean
  videoRef: RefObject<HTMLVideoElement | null>
  ready: boolean
  error?: string | null
  badge?: string
}

export function CameraView({
  compact = false,
  videoRef,
  ready,
  error,
  badge,
}: CameraViewProps) {
  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : styles.wide}`}>
      <span className={styles.label}>{badge ?? (ready ? 'LIVE' : 'DUMMY')}</span>
      <video
        ref={videoRef}
        className={styles.video}
        muted
        playsInline
        autoPlay
        style={{ opacity: ready ? 1 : 0 }}
      />
      {!ready && (
        <div className={styles.fallback}>
          <div className={styles.face} aria-hidden="true">
            <span className={styles.head} />
            <span className={styles.body} />
          </div>
          <p>{error ?? 'カメラ待機中'}</p>
        </div>
      )}
    </div>
  )
}
