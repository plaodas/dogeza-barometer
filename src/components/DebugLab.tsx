import type { ReactNode } from 'react'
import { useDebugLab } from '../context/DebugLabContext'
import styles from './DebugLab.module.css'

export function DebugUnlockTitle({ children }: { children: string }) {
  const { handleTitleTap } = useDebugLab()

  return (
    <h1 className={`title ${styles.title}`} onClick={handleTitleTap}>
      {children}
    </h1>
  )
}

export function DebugLab({ children }: { children: ReactNode }) {
  const { open } = useDebugLab()
  if (!open) return null

  return (
    <div className={styles.lab}>
      <p className={styles.label}>実験室</p>
      {children}
    </div>
  )
}
