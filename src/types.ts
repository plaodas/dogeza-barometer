export type Screen = 'home' | 'measure' | 'result'

export type DogezaStatus = '平常' | 'やや危険' | '危険' | '土下座推奨'

export type FaceEmotion = {
  anger: number
  confusion: number
  sadness: number
  score: number
}

export type AudioLevels = {
  volumeDb: number
  volumeScore: number
  wpm: number
  wpmScore: number
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
