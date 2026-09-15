import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { FaceLandmark } from '../types'
import { HornOverlay } from './HornOverlay'
import { isIOSSelfiePreview, layoutVideoCover } from '../lib/videoLayout'
import styles from './CameraView.module.css'

type CameraViewProps = {
  compact?: boolean
  videoRef: RefObject<HTMLVideoElement | null>
  ready: boolean
  error?: string | null
  badge?: string
  landmarksRef?: RefObject<FaceLandmark[] | null>
  dogezaLevel?: number
  faded?: boolean
  mirrorPreview?: boolean
  arPaused?: boolean
  arGeneration?: number
}

export function CameraView({
  compact = false,
  videoRef,
  ready,
  error,
  badge,
  landmarksRef,
  dogezaLevel = 0,
  faded = false,
  mirrorPreview = true,
  arPaused = false,
  arGeneration = 0,
}: CameraViewProps) {
  const stageRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const video = videoRef.current
    const stage = stageRef.current
    if (!video || !stage) return

    const layout = () => layoutVideoCover(video, stage)
    layout()
    video.addEventListener('loadedmetadata', layout)
    video.addEventListener('resize', layout)
    const observer = new ResizeObserver(layout)
    observer.observe(stage)
    return () => {
      video.removeEventListener('loadedmetadata', layout)
      video.removeEventListener('resize', layout)
      observer.disconnect()
    }
  }, [arGeneration, ready, videoRef])
  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : styles.wide}`}>
      <span className={styles.label}>{badge ?? (ready ? 'LIVE' : 'DUMMY')}</span>
      <div
        ref={stageRef}
        className={`${styles.stage} ${faded ? styles.stageFaded : ''}`}
      >
        <video
          ref={videoRef}
          className={`${styles.video} ${mirrorPreview && !isIOSSelfiePreview() ? styles.videoMirrored : ''}`}
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
            paused={arPaused}
            generation={arGeneration}
            mirrorX={mirrorPreview && !isIOSSelfiePreview()}
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
