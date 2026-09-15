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

function normalize(x: number, y: number) {
  const len = Math.hypot(x, y)
  if (len < 1e-6) return { x: 0, y: -1 }
  return { x: x / len, y: y / len }
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
  let right = normalize(eyeR.x - eyeL.x, eyeR.y - eyeL.y)
  let up = { x: -right.y, y: right.x }
  if (up.x * (brow.x - midX) + up.y * (brow.y - midY) < 0) {
    up = { x: -up.x, y: -up.y }
  }
  // 映像が正立なのにランドマーク上だけ顔が横倒しのときは、画面の上へ置く
  if (Math.abs(up.x) > Math.abs(up.y)) {
    up = { x: 0, y: -1 }
    right = { x: 1, y: 0 }
  }

  const upOffset = faceHeight * 0.58
  const sideOffset = faceWidth * 0.28
  const crownX = midX + up.x * upOffset
  const crownY = midY + up.y * upOffset
  const angle = Math.atan2(right.y, right.x)
  const size = faceWidth * lerp(0.42, 1.5, level / 100)

  return {
    left: {
      x: crownX - right.x * sideOffset,
      y: crownY - right.y * sideOffset,
      angle,
      size,
    },
    right: {
      x: crownX + right.x * sideOffset,
      y: crownY + right.y * sideOffset,
      angle,
      size,
    },
  }
}

export function mixHornPose(previous: HornPose | null, next: HornPose, amount: number): HornPose {
  if (!previous) return next
  return {
    x: lerp(previous.x, next.x, amount),
    y: lerp(previous.y, next.y, amount),
    angle: lerp(previous.angle, next.angle, amount),
    size: lerp(previous.size, next.size, Math.min(amount, 0.22)),
  }
}
