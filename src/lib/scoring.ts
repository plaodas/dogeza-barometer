import type { DogezaStatus } from '../types'

export const ALERT_THRESHOLD = 80

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

export function calcDogezaLevel(
  faceScore: number,
  volumeScore: number,
  wpmScore: number,
) {
  return clamp(faceScore * 0.6 + volumeScore * 0.3 + wpmScore * 0.1)
}

export function getDogezaStatus(level: number): DogezaStatus {
  if (level >= ALERT_THRESHOLD) return '土下座推奨'
  if (level >= 60) return '危険'
  if (level >= 30) return 'やや危険'
  return '平常'
}

export function getMeterColor(level: number) {
  if (level >= ALERT_THRESHOLD) return '#ff1a2d'
  if (level >= 60) return '#d7263d'
  if (level >= 30) return '#f2c94c'
  return '#1b4f72'
}

const floorMessages = {
  low: [
    '床はまだ遠くにあります',
    'プライドがあなたを支えています',
    '地面は静かに様子を見ています',
    '今日はまだ床の気配はありません'
  ],
  midLow: [
    '床があなたに気づき始めました',
    '地面がそっと近寄ってきています',
    '視界の下端に床が顔を出しました',
    '床が“やあ”と挨拶してきました',
    '床との距離が縮んでいます',
    '地面があなたを歓迎し始めました'
  ],
  midHigh: [
    '床があなたの方へ歩み寄っています',
    '地面があなたを包み込もうとしています',
    '床が“準備できてるよ”と言っています',
    'あなたのプライドより床のほうが近くなってきました',
    '床の重力が少し強まっています',
    'あなたの膝が床のことを考え始めました'
  ],
  high: [
    '床があなたを引き寄せています',
    '地面があなたを求めています',
    '床があなたの名前を呼んでいます',
    '床の吸引力が増しています',
    'あなたと床の距離が危険なほど近いです',
    '床があなたの到着を心待ちにしています'
  ],
  alert: [
    '床があなたを飲み込もうとしています',
    '地面があなたを抱きしめようとしています',
    '床との運命の距離がゼロになりつつあります',
    '床があなたを受け入れる準備を完了しました',
    'あなたのプライドは床の前で崩れ落ちています'
  ]
}

function getResultComment(level: number) {
  if (level >= 90) return random(floorMessages.alert)
  if (level >= 70) return random(floorMessages.high)
  if (level >= 50) return random(floorMessages.midHigh)
  if (level >= 30) return random(floorMessages.midLow)
  return random(floorMessages.low)
}

function random(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function needleAngle(level: number) {
  return -135 + (clamp(level) / 100) * 270
}
