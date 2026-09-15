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
  const len = Math.max(Math.hypot(x, y), 1)
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
  const upPt = toWrap(forehead)
  const downPt = toWrap(chin)
  const eyeL = toWrap(leftEye)
  const eyeR = toWrap(rightEye)
  const faceWidth = Math.hypot(eyeR.x - eyeL.x, eyeR.y - eyeL.y)
  const faceHeight = Math.hypot(upPt.x - downPt.x, upPt.y - downPt.y)
  if (faceWidth < 2 || faceHeight < 2) return null

  const mobile = isMobileCameraPicker()
  const centerX = (eyeL.x + eyeR.x) * 0.5
  const centerY = (eyeL.y + eyeR.y) * 0.5
  const up = normalize(upPt.x - downPt.x, upPt.y - downPt.y)
  const right = normalize(eyeR.x - eyeL.x, eyeR.y - eyeL.y)
  const upOffset = faceHeight * (mobile ? 0.52 : 0.48)
  const sideOffset = faceWidth * (mobile ? 0.28 : 0.32)
  const crownX = centerX + up.x * upOffset
  const crownY = centerY + up.y * upOffset
  const angle = Math.atan2(-up.y, up.x) - Math.PI / 2
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
