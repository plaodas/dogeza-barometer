import type { FloorTexture } from '../types'

export const FLOOR_OPTIONS: {
  id: FloorTexture
  label: string
  blurb: string
}[] = [
  { id: 'tatami', label: '和室の畳', blurb: '頭をつける儀式' },
  { id: 'carpet', label: '会議室', blurb: '上司に謝る床' },
  { id: 'shrine', label: '神社の床', blurb: '神に詫びる板' },
]

export const DEFAULT_FLOOR_TEXTURE: FloorTexture = 'tatami'

export function isFloorTexture(value: unknown): value is FloorTexture {
  return FLOOR_OPTIONS.some((option) => option.id === value)
}
