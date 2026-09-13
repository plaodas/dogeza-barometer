import { useState } from 'react'
import { Home } from './pages/Home'
import { Measure } from './pages/Measure'
import { Result } from './pages/Result'
import type { Screen, SessionResult } from './types'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [micEnabled, setMicEnabled] = useState(true)
  const [result, setResult] = useState<SessionResult>({
    maxLevel: 0,
    recommendCount: 0,
  })

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <Home
          micEnabled={micEnabled}
          onToggleMic={setMicEnabled}
          onStart={() => setScreen('measure')}
        />
      )}
      {screen === 'measure' && (
        <Measure
          micEnabled={micEnabled}
          onToggleMic={setMicEnabled}
          onFinish={(nextResult) => {
            setResult(nextResult)
            setScreen('result')
          }}
        />
      )}
      {screen === 'result' && (
        <Result
          result={result}
          onRetry={() => setScreen('measure')}
        />
      )}
      {screen !== 'measure' && <div className="floor" />}
    </div>
  )
}
