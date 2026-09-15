import { isMobileCameraPicker } from './cameraDevices'
import { landmarkToWrap, type VideoFitRect } from './videoLayout'
import type { FaceLandmark } from '../types'

const FOREHEAD = 10
const CHIN = 152
const LEFT_EYE = 33
const RIGHT_EYE = 263

export type HornPose = {
  x: number
  y: number
  angle: number
  size: number
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount
}

function lerpAngle(from: number, to: number, amount: number) {
  let diff = to - from
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return from + diff * amount
}

export function hornFollowAmount() {
  return isMobileCameraPicker() ? 0.2 : 0.32
}

export function hornPoses(
  landmarks: FaceLandmark[],
  rect: VideoFitRect,
  level: number,
  flipX = false,
): { left: HornPose; right: HornPose } | null {
  const forehead = landmarks[FOREHEAD]
  const chin = landmarks[CHIN]
  const leftEye = landmarks[LEFT_EYE]
  const rightEye = landmarks[RIGHT_EYE]
  if (!forehead || !chin || !leftEye || !rightEye) return null

  const toWrap = (point: FaceLandmark) => landmarkToWrap(point, rect, flipX)
  const brow = toWrap(forehead)
  const jaw = toWrap(chin)
  const eyeL = toWrap(leftEye)
  const eyeR = toWrap(rightEye)
  const faceWidth = Math.hypot(eyeR.x - eyeL.x, eyeR.y - eyeL.y)
  const faceHeight = Math.hypot(brow.x - jaw.x, brow.y - jaw.y)
  if (faceWidth < 2 || faceHeight < 2) return null

  const midX = (eyeL.x + eyeR.x) * 0.5
  const midY = (eyeL.y + eyeR.y) * 0.5
  // 画面上方向。MediaPipe の 33→263 は人物の左目→右目なので、未反転だと左向きになり角が逆さまになる
  const up = { x: 0, y: -1 }
  const upOffset = faceHeight * 0.58
  const sideOffset = faceWidth * 0.28
  const crownX = midX + up.x * upOffset
  const crownY = midY + up.y * upOffset
  const angle = Math.atan2(up.x, -up.y)
  const size = faceWidth * lerp(0.42, 1.5, level / 100)

  return {
    left: {
      x: crownX - sideOffset,
      y: crownY,
      angle,
      size,
    },
    right: {
      x: crownX + sideOffset,
      y: crownY,
      angle,
      size,
    },
  }
}

export function mixHornPose(previous: HornPose | null, next: HornPose, amount: number): HornPose {
  if (!previous) return next
  return {
    // ランドマーク側ですでに平滑化しているため、位置を再度補間すると顔移動時に角が遅れる
    x: next.x,
    y: next.y,
    angle: lerpAngle(previous.angle, next.angle, amount),
    size: lerp(previous.size, next.size, Math.min(amount, 0.22)),
  }
}
