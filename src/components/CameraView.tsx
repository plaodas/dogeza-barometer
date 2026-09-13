import { useEffect, useRef, useState } from 'react'
import styles from './CameraView.module.css'

type CameraViewProps = {
  compact?: boolean
}

export function CameraView({ compact = false }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [message, setMessage] = useState('カメラ待機中')

  useEffect(() => {
    let stream: MediaStream | null = null
    let cancelled = false

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage('この環境ではカメラを使えません')
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        if (cancelled || !videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setReady(true)
      } catch {
        setMessage('カメラ未接続（ダミー顔で代用）')
      }
    }

    void start()

    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : styles.wide}`}>
      <span className={styles.label}>{ready ? 'LIVE' : 'DUMMY'}</span>
      <video
        ref={videoRef}
        className={styles.video}
        muted
        playsInline
        autoPlay
        style={{ display: ready ? 'block' : 'none' }}
      />
      {!ready && (
        <div className={styles.fallback}>
          <div className={styles.face} aria-hidden="true">
            <span className={styles.head} />
            <span className={styles.body} />
          </div>
          <p>{message}</p>
        </div>
      )}
    </div>
  )
}
