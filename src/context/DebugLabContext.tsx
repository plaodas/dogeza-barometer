import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'dogeza-barometer.debug-lab'
const TAP_COUNT = 5
const TAP_WINDOW_MS = 2000

type DebugLabContextValue = {
  open: boolean
  handleTitleTap: () => void
}

const DebugLabContext = createContext<DebugLabContextValue | null>(null)

function queryDebugOverride(): boolean | null {
  try {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('debug')) return null
    const value = params.get('debug')
    if (value === '0' || value === 'false') return false
    return true
  } catch {
    return null
  }
}

function readStoredOpen(): boolean | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored === '1') return true
    if (stored === '0') return false
  } catch {
    // Private mode or blocked storage should not break the app.
  }
  return null
}

function persistOpen(open: boolean) {
  try {
    sessionStorage.setItem(STORAGE_KEY, open ? '1' : '0')
  } catch {
    // Ignore quota / privacy errors.
  }
}

function readLabOpen(): boolean {
  const query = queryDebugOverride()
  if (query !== null) return query
  const stored = readStoredOpen()
  if (stored !== null) return stored
  return import.meta.env.DEV
}

export function DebugLabProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(readLabOpen)
  const tapsRef = useRef(0)
  const windowRef = useRef(0)

  const handleTitleTap = useCallback(() => {
    const now = Date.now()
    if (now - windowRef.current > TAP_WINDOW_MS) {
      tapsRef.current = 0
    }
    windowRef.current = now
    tapsRef.current += 1

    if (tapsRef.current < TAP_COUNT) return

    tapsRef.current = 0
    setOpen((current) => {
      const next = !current
      persistOpen(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      open,
      handleTitleTap,
    }),
    [open, handleTitleTap],
  )

  return <DebugLabContext.Provider value={value}>{children}</DebugLabContext.Provider>
}

export function useDebugLab() {
  const context = useContext(DebugLabContext)
  if (!context) {
    throw new Error('useDebugLab must be used within DebugLabProvider')
  }
  return context
}
