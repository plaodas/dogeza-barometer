import { useSettings } from '../context/SettingsContext'
import { FLOOR_OPTIONS } from '../lib/floors'
import styles from './FloorPicker.module.css'

export function FloorPicker() {
  const { floorTexture, setFloorTexture } = useSettings()

  return (
    <fieldset className={`panel ${styles.wrap}`}>
      <legend className={styles.legend}>土下座する床</legend>
      <div className={styles.grid}>
        {FLOOR_OPTIONS.map((option) => {
          const selected = floorTexture === option.id
          return (
            <label
              key={option.id}
              className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
            >
              <input
                className={styles.input}
                type="radio"
                name="floor-texture"
                value={option.id}
                checked={selected}
                onChange={() => setFloorTexture(option.id)}
              />
              <span className={styles.swatch} aria-hidden="true">
                <span className={`floor floor--${option.id} floor--preview`} />
              </span>
              <span className={styles.label}>{option.label}</span>
              <span className={styles.blurb}>{option.blurb}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
