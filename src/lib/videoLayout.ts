import type { FaceLandmark } from '../types'

export type VideoFitRect = {
  x: number
  y: number
  w: number
  h: number
}

export function isIOSSelfiePreview() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  if (/iP(hone|ad|od)/.test(navigator.userAgent)) return true
  return (
    /Macintosh/.test(navigator.userAgent) &&
    'ontouchend' in document &&
    window.matchMedia('(pointer: coarse)').matches
  )
}

export function videoContentRect(video: HTMLVideoElement, wrap: HTMLElement): VideoFitRect {
  const boxW = wrap.clientWidth
  const boxH = wrap.clientHeight
  const vw = Math.max(video.videoWidth, 1)
  const vh = Math.max(video.videoHeight, 1)
  const fit = getComputedStyle(video).objectFit === 'contain' ? 'contain' : 'cover'
  const scale = fit === 'cover' ? Math.max(boxW / vw, boxH / vh) : Math.min(boxW / vw, boxH / vh)
  const w = vw * scale
  const h = vh * scale
  return {
    x: (boxW - w) / 2,
    y: (boxH - h) / 2,
    w,
    h,
  }
}

export function landmarkToWrap(landmark: FaceLandmark, rect: VideoFitRect) {
  return {
    x: rect.x + landmark.x * rect.w,
    y: rect.y + landmark.y * rect.h,
  }
}
