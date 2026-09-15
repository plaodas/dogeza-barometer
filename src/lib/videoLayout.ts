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

export function fittedVideoRect(
  boxW: number,
  boxH: number,
  videoW: number,
  videoH: number,
): VideoFitRect {
  const vw = Math.max(videoW, 1)
  const vh = Math.max(videoH, 1)
  const scale = Math.max(boxW / vw, boxH / vh)
  const w = vw * scale
  const h = vh * scale
  return {
    x: (boxW - w) / 2,
    y: (boxH - h) / 2,
    w,
    h,
  }
}

export function layoutVideoCover(video: HTMLVideoElement, stage: HTMLElement) {
  const rect = fittedVideoRect(
    stage.clientWidth,
    stage.clientHeight,
    video.videoWidth,
    video.videoHeight,
  )
  video.style.width = `${rect.w}px`
  video.style.height = `${rect.h}px`
  video.style.left = `${rect.x}px`
  video.style.top = `${rect.y}px`
}

export function videoContentRect(video: HTMLVideoElement, wrap: HTMLElement): VideoFitRect {
  return fittedVideoRect(
    wrap.clientWidth,
    wrap.clientHeight,
    video.videoWidth,
    video.videoHeight,
  )
}

export function landmarkToWrap(landmark: FaceLandmark, rect: VideoFitRect, flipX = false) {
  const nx = flipX ? 1 - landmark.x : landmark.x
  return {
    x: rect.x + nx * rect.w,
    y: rect.y + landmark.y * rect.h,
  }
}
