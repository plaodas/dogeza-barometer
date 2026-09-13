import type { CSSProperties } from 'react'
import { getMeterColor, needleAngle } from '../lib/scoring'

type MeterProps = {
  level: number
}

const ARC_LENGTH = 212

export function Meter({ level }: MeterProps) {
  const rounded = Math.round(level)
  const color = getMeterColor(level)
  const dash = (rounded / 100) * ARC_LENGTH
  const needleClass =
    level >= 80
      ? 'meter__needle meter__needle--rage'
      : level >= 60
        ? 'meter__needle meter__needle--tremor'
        : 'meter__needle'

  return (
    <div
      className={`meter${level >= 80 ? ' meter--alert' : ''}`}
      style={{ '--needle-angle': `${needleAngle(level)}deg` } as CSSProperties}
    >
      <svg className="meter__svg" viewBox="0 0 200 200" aria-hidden="true">
        <circle
          className="meter__rim"
          cx="100"
          cy="100"
          r="86"
          fill="#0b1622"
          stroke="#2b4258"
          strokeWidth="8"
        />
        <circle cx="100" cy="100" r="72" fill="#102033" stroke="rgba(242,201,76,0.18)" strokeWidth="2" />
        <circle
          cx="100"
          cy="100"
          r="68"
          fill="none"
          stroke="#1b2f40"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${ARC_LENGTH} 999`}
          transform="rotate(135 100 100)"
        />
        <circle
          cx="100"
          cy="100"
          r="68"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} 999`}
          transform="rotate(135 100 100)"
        />
        <g className={needleClass}>
          <polygon points="100,28 106,108 94,108" fill="var(--color-needle)" />
          <circle cx="100" cy="100" r="8" fill="var(--color-needle)" />
          <circle cx="100" cy="100" r="3.5" fill="#2a1a00" />
        </g>
      </svg>
      <div className="meter__readout">
        <div className="meter__value">{rounded}</div>
        <div className="meter__unit">土下座Lv</div>
      </div>
    </div>
  )
}
