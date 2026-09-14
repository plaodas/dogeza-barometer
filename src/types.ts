export type Screen = 'home' | 'measure' | 'result'

export type FloorTexture = 'tatami' | 'carpet' | 'shrine'

export type DogezaStatus = '平常' | 'やや危険' | '危険' | '土下座推奨'

export type FaceLandmark = {
  x: number
  y: number
  z: number
}

export type FaceEmotion = {
  anger: number
  confusion: number
  sadness: number
  score: number
  detected: boolean
  modelReady: boolean
}

export type AudioLevels = {
  volumeDb: number
  volumeScore: number
  wpm: number
  wpmScore: number
  error: string | null
}

export type SessionResult = {
  maxLevel: number
  recommendCount: number
}

export type DogezaBreakdown = {
  level: number
  status: DogezaStatus
  faceScore: number
  volumeScore: number
  wpmScore: number
}
