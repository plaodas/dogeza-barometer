import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_FLOOR_TEXTURE, isFloorTexture } from '../lib/floors'
import type { FloorTexture } from '../types'

const STORAGE_KEY = 'dogeza-barometer.settings'

type Settings = {
  floorTexture: FloorTexture
}

type SettingsContextValue = Settings & {
  setFloorTexture: (texture: FloorTexture) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { floorTexture: DEFAULT_FLOOR_TEXTURE }
    const parsed = JSON.parse(raw) as Partial<Settings>
    return {
      floorTexture: isFloorTexture(parsed.floorTexture)
        ? parsed.floorTexture
        : DEFAULT_FLOOR_TEXTURE,
    }
  } catch {
    return { floorTexture: DEFAULT_FLOOR_TEXTURE }
  }
}

function persistSettings(settings: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(readSettings)

  const setFloorTexture = useCallback((floorTexture: FloorTexture) => {
    setSettings((current) => {
      const next = { ...current, floorTexture }
      persistSettings(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      ...settings,
      setFloorTexture,
    }),
    [settings, setFloorTexture],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider')
  }
  return context
}
