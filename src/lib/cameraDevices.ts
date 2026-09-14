export type CameraKind = 'front' | 'back' | 'virtual'

export type CameraChoice = {
  deviceId: string
  kind: CameraKind
  label: string
}

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

export function labelCameras(devices: MediaDeviceInfo[]): CameraChoice[] {
  const inputs = devices.filter((device) => device.kind === 'videoinput' && device.deviceId)
  const kinds = inputs.map(classifyCamera)
  const totals: Partial<Record<CameraKind, number>> = {}
  const seen: Partial<Record<CameraKind, number>> = {}

  for (const kind of kinds) {
    totals[kind] = (totals[kind] ?? 0) + 1
  }

  return inputs.map((device, index) => {
    const kind = kinds[index]
    seen[kind] = (seen[kind] ?? 0) + 1
    const base = KIND_LABEL[kind]
    const label = (totals[kind] ?? 0) > 1 ? `${base} ${seen[kind]}` : base
    return { deviceId: device.deviceId, kind, label }
  })
}

export async function listVideoCameras() {
  if (!navigator.mediaDevices?.enumerateDevices) return []
  const devices = await navigator.mediaDevices.enumerateDevices()
  return labelCameras(devices)
}

export function cameraConstraints(deviceId?: string | null): MediaStreamConstraints {
  if (deviceId) {
    return {
      video: { deviceId: { exact: deviceId } },
      audio: false,
    }
  }
  return {
    video: { facingMode: 'user' },
    audio: false,
  }
}

export function shouldMirrorPreview(kind: CameraKind | null) {
  return kind !== 'back' && kind !== 'virtual'
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
