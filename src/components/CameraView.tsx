import type { RefObject } from 'react'
import type { FaceLandmark } from '../types'
import { HornOverlay } from './HornOverlay'
import { isIOSSelfiePreview } from '../lib/videoLayout'
import styles from './CameraView.module.css'

type CameraViewProps = {
  compact?: boolean
  videoRef: RefObject<HTMLVideoElement | null>
  ready: boolean
  error?: string | null
  badge?: string
  landmarksRef?: RefObject<FaceLandmark[] | null>
  dogezaLevel?: number
}

export function CameraView({
  compact = false,
  videoRef,
  ready,
  error,
  badge,
  landmarksRef,
  dogezaLevel = 0,
}: CameraViewProps) {
  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : styles.wide}`}>
      <span className={styles.label}>{badge ?? (ready ? 'LIVE' : 'DUMMY')}</span>
      <div className={styles.stage}>
        <video
          ref={videoRef}
          className={`${styles.video} ${isIOSSelfiePreview() ? styles.undoNativeMirror : ''}`}
          muted
          playsInline
          autoPlay
          style={{ opacity: ready ? 1 : 0 }}
        />
        {landmarksRef && (
          <HornOverlay
            videoRef={videoRef}
            landmarksRef={landmarksRef}
            dogezaLevel={dogezaLevel}
          />
        )}
      </div>
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
