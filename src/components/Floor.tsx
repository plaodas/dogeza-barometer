import { useSettings } from '../context/SettingsContext'

type FloorProps = {
  height?: string
  pinned?: boolean
}

export function Floor({ height, pinned = false }: FloorProps) {
  const { floorTexture } = useSettings()

  return (
    <div
      className={`floor floor--${floorTexture}${pinned ? ' floor--pinned' : ''}`}
      style={height ? { height } : undefined}
    />
  )
}
