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

export function getResultComment(maxLevel: number) {
  if (maxLevel >= ALERT_THRESHOLD) return 'あなたのプライドは風前の灯です'
  if (maxLevel >= 60) return '額を床に近づけたほうがいいです'
  if (maxLevel >= 30) return '床が気になり始めましたね'
  return '今日はまだプライドが健在です'
}

export function needleAngle(level: number) {
  return -135 + (clamp(level) / 100) * 270
}
