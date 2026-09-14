export type CameraKind = 'front' | 'back' | 'virtual'

export type CameraChoice = {
  deviceId: string
  kind: CameraKind
  label: string
}

export const FACING_USER = 'facing:user'
export const FACING_ENVIRONMENT = 'facing:environment'

const KIND_LABEL: Record<CameraKind, string> = {
  front: '正面カメラ',
  back: '背面カメラ',
  virtual: '仮想カメラ',
}

const VIRTUAL_RE =
  /obs|virtual|snap\s*camera|manycam|droidcam|iriun|camo|mmhmm|xsplit|ndi|unity capture|ecamm|streamlabs/i
const BACK_RE = /back|rear|environment|world|背面|後|アウト/i
const FRONT_RE = /front|user|face|facetime|integrated|webcam|正面|前|イン/i

export const CAMERA_FADE_MS = 150
export const CAMERA_DEVICE_KEY = 'dogeza.cameraDeviceId'

export function isMobileCameraPicker() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  if (/iP(hone|ad|od)/.test(navigator.userAgent)) return true
  if (
    /Macintosh/.test(navigator.userAgent) &&
    'ontouchend' in document &&
    window.matchMedia('(pointer: coarse)').matches
  ) {
    return true
  }
  return window.matchMedia('(pointer: coarse)').matches
}

export function readStoredCameraId() {
  try {
    return sessionStorage.getItem(CAMERA_DEVICE_KEY)
  } catch {
    return null
  }
}

export function writeStoredCameraId(deviceId: string) {
  try {
    sessionStorage.setItem(CAMERA_DEVICE_KEY, deviceId)
  } catch {
    // ignore quota / private mode
  }
}

export function classifyCamera(device: MediaDeviceInfo): CameraKind {
  const label = device.label
  if (VIRTUAL_RE.test(label)) return 'virtual'
  if (BACK_RE.test(label)) return 'back'
  if (FRONT_RE.test(label)) return 'front'
  return 'front'
}

function numberDuplicateLabels(choices: CameraChoice[]) {
  const totals: Partial<Record<CameraKind, number>> = {}
  const seen: Partial<Record<CameraKind, number>> = {}
  for (const choice of choices) {
    totals[choice.kind] = (totals[choice.kind] ?? 0) + 1
  }
  return choices.map((choice) => {
    seen[choice.kind] = (seen[choice.kind] ?? 0) + 1
    const base = KIND_LABEL[choice.kind]
    const label = (totals[choice.kind] ?? 0) > 1 ? `${base} ${seen[choice.kind]}` : base
    return { ...choice, label }
  })
}

export function labelCameras(devices: MediaDeviceInfo[]): CameraChoice[] {
  const inputs = devices.filter((device) => device.kind === 'videoinput' && device.deviceId)
  return numberDuplicateLabels(
    inputs.map((device) => ({
      deviceId: device.deviceId,
      kind: classifyCamera(device),
      label: KIND_LABEL[classifyCamera(device)],
    })),
  )
}

export async function listVideoCameras() {
  if (!navigator.mediaDevices?.enumerateDevices) return []
  const devices = await navigator.mediaDevices.enumerateDevices()
  const enumerated = labelCameras(devices)
  if (!isMobileCameraPicker()) return enumerated

  const virtuals = enumerated.filter((device) => device.kind === 'virtual')
  return [
    { deviceId: FACING_USER, kind: 'front' as const, label: KIND_LABEL.front },
    { deviceId: FACING_ENVIRONMENT, kind: 'back' as const, label: KIND_LABEL.back },
    ...virtuals,
  ]
}

export function cameraConstraints(choice?: {
  deviceId?: string | null
  kind?: CameraKind | null
}): MediaStreamConstraints {
  const id = choice?.deviceId
  const kind = choice?.kind
  const facing =
    id === FACING_ENVIRONMENT || kind === 'back'
      ? 'environment'
      : id === FACING_USER || kind === 'front'
        ? 'user'
        : null

  if (facing === 'environment') {
    return { video: { facingMode: { exact: 'environment' } }, audio: false }
  }
  if (facing === 'user') {
    return { video: { facingMode: { ideal: 'user' } }, audio: false }
  }
  if (id) {
    return { video: { deviceId: { exact: id } }, audio: false }
  }
  return { video: { facingMode: { ideal: 'user' } }, audio: false }
}

export function shouldMirrorPreview(kind: CameraKind | null) {
  return kind !== 'back' && kind !== 'virtual'
}

export function persistableCameraId(
  settings: MediaTrackSettings,
  fallbackId?: string | null,
) {
  if (isMobileCameraPicker()) {
    if (settings.facingMode === 'environment' || fallbackId === FACING_ENVIRONMENT) {
      return FACING_ENVIRONMENT
    }
    return FACING_USER
  }
  return settings.deviceId || fallbackId || null
}

export function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function nextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

export async function waitForVideo(video: HTMLVideoElement, timeoutMs = 4000) {
  if (video.readyState >= 2 && video.videoWidth > 0) return

  await Promise.race([
    new Promise<void>((resolve, reject) => {
      const finish = () => {
        video.removeEventListener('loadeddata', finish)
        video.removeEventListener('playing', finish)
        video.removeEventListener('error', fail)
        resolve()
      }
      const fail = () => {
        video.removeEventListener('loadeddata', finish)
        video.removeEventListener('playing', finish)
        video.removeEventListener('error', fail)
        reject(new Error('video'))
      }
      video.addEventListener('loadeddata', finish)
      video.addEventListener('playing', finish)
      video.addEventListener('error', fail)
    }),
    wait(timeoutMs),
  ])
}
