import { createPortal } from 'react-dom'
import styles from './AlertModal.module.css'

type AlertModalProps = {
  level: number
  onBow: () => void
  onClose: () => void
}

export function AlertModal({
  level,
  onBow,
  onClose,
}: AlertModalProps) {
  return createPortal(
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="alert-title">
      <div className={`panel ${styles.modal}`}>
        <p className={styles.kicker}>ALERT</p>
        <h2 id="alert-title" className={styles.headline}>
          土下座チャンス到来
        </h2>
        <p className={styles.maxLabel}>MAX</p>
        <p className={styles.level}>{Math.round(level)}</p>
        <div className={styles.actions}>
          <button type="button" className="btn btn-primary" onClick={onBow}>
            土下座する
          </button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
