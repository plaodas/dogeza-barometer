import { useSettings } from '../context/SettingsContext'

type FloorProps = {
  height?: string
}

export function Floor({ height }: FloorProps) {
  const { floorTexture } = useSettings()

  return (
    <div
      className={`floor floor--${floorTexture}`}
      style={height ? { height } : undefined}
    />
  )
}
