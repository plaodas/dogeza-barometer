import type { CameraChoice } from '../lib/cameraDevices'
import styles from './CameraSwitcher.module.css'

type CameraSwitcherProps = {
  devices: CameraChoice[]
  selectedDeviceId: string | null
  switching: boolean
  onSelect: (deviceId: string) => void
}

export function CameraSwitcher({
  devices,
  selectedDeviceId,
  switching,
  onSelect,
}: CameraSwitcherProps) {
  if (devices.length === 0) return null

  return (
    <>
      <fieldset className={`panel ${styles.wrap}`}>
        <legend className={styles.legend}>カメラ</legend>
        <div className={styles.list}>
          {devices.map((device) => {
            const selected = device.deviceId === selectedDeviceId
            return (
              <button
                key={device.deviceId}
                type="button"
                className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
                disabled={switching}
                aria-pressed={selected}
                onClick={() => onSelect(device.deviceId)}
              >
                {device.label}
              </button>
            )
          })}
        </div>
      </fieldset>
      {switching && (
        <div className={styles.toast} role="status" aria-live="polite">
          カメラを切り替えています
        </div>
      )}
    </>
  )
}
