import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CAMERA_FADE_MS,
  cameraConstraints,
  FACING_ENVIRONMENT,
  FACING_USER,
  listVideoCameras,
  nextFrame,
  persistableCameraId,
  readStoredCameraId,
  shouldMirrorPreview,
  stopStream,
  wait,
  waitForVideo,
  writeStoredCameraId,
  type CameraChoice,
  type CameraKind,
} from '../lib/cameraDevices'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const devicesRef = useRef<CameraChoice[]>([])
  const selectedRef = useRef<string | null>(null)
  const kindRef = useRef<CameraKind | null>(null)
  const switchSeq = useRef(0)
  const switchingRef = useRef(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devices, setDevices] = useState<CameraChoice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [kind, setKind] = useState<CameraKind | null>(null)
  const [switching, setSwitching] = useState(false)
  const [faded, setFaded] = useState(false)
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    devicesRef.current = devices
  }, [devices])

  useEffect(() => {
    selectedRef.current = selectedDeviceId
  }, [selectedDeviceId])

  useEffect(() => {
    kindRef.current = kind
  }, [kind])

  const refreshDevices = useCallback(async (preferredId?: string | null, facingMode?: string) => {
    const next = await listVideoCameras()
    setDevices(next)
    const byFacing =
      facingMode === 'environment' || preferredId === FACING_ENVIRONMENT
        ? FACING_ENVIRONMENT
        : facingMode === 'user' || preferredId === FACING_USER
          ? FACING_USER
          : null
    const activeId =
      (byFacing && next.some((device) => device.deviceId === byFacing) && byFacing) ||
      (preferredId && next.some((device) => device.deviceId === preferredId) && preferredId) ||
      next[0]?.deviceId ||
      null
    const activeKind = next.find((device) => device.deviceId === activeId)?.kind ?? 'front'
    setSelectedDeviceId(activeId)
    setKind(activeKind)
    return next
  }, [])

  const releaseCamera = useCallback(async () => {
    const video = videoRef.current
    if (video) {
      video.pause()
      video.srcObject = null
    }
    stopStream(streamRef.current)
    streamRef.current = null
    await wait(80)
  }, [])

  const attachStream = useCallback(
    async (stream: MediaStream, requestedId?: string | null) => {
      const video = videoRef.current
      if (!video) throw new Error('video')
      stopStream(streamRef.current)
      streamRef.current = stream
      video.srcObject = stream
      await video.play()
      await waitForVideo(video)

      const settings = stream.getVideoTracks()[0]?.getSettings() ?? {}
      const deviceId = persistableCameraId(settings, requestedId)
      if (deviceId) writeStoredCameraId(deviceId)
      await refreshDevices(deviceId, settings.facingMode)
      setReady(true)
      setError(null)
      setGeneration((current) => current + 1)
    },
    [refreshDevices],
  )

  const requestStream = useCallback(async (choice?: { deviceId?: string | null; kind?: CameraKind | null }) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('unsupported')
    }

    const wantsBack = choice?.kind === 'back' || choice?.deviceId === FACING_ENVIRONMENT
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia(cameraConstraints(choice))
    } catch {
      if (wantsBack) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
      } else if (choice?.deviceId && !choice.deviceId.startsWith('facing:')) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { ideal: choice.deviceId } },
          audio: false,
        })
      } else {
        throw new Error('denied')
      }
    }

    const facing = stream.getVideoTracks()[0]?.getSettings().facingMode
    if (wantsBack && facing === 'user') {
      stopStream(stream)
      throw new Error('not-back')
    }
    return stream
  }, [])

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const stored = readStoredCameraId()
        const stream = await requestStream({
          deviceId: stored,
          kind: stored === FACING_ENVIRONMENT ? 'back' : stored === FACING_USER ? 'front' : null,
        })
        if (cancelled) {
          stopStream(stream)
          return
        }
        await attachStream(stream, stored)
      } catch {
        if (!cancelled) {
          setError('カメラ未接続（ダミー顔で代用）')
          setReady(false)
        }
      }
    }

    void start()

    const onDeviceChange = () => {
      void refreshDevices(selectedRef.current)
    }
    navigator.mediaDevices?.addEventListener?.('devicechange', onDeviceChange)

    return () => {
      cancelled = true
      navigator.mediaDevices?.removeEventListener?.('devicechange', onDeviceChange)
      stopStream(streamRef.current)
      streamRef.current = null
    }
  }, [attachStream, refreshDevices, requestStream])

  const switchCamera = useCallback(
    async (deviceId: string) => {
      if (!deviceId || deviceId === selectedRef.current || switchingRef.current) return
      const choice = devicesRef.current.find((device) => device.deviceId === deviceId)
      if (!choice) return

      const previous = {
        deviceId: selectedRef.current,
        kind: kindRef.current,
      }
      const seq = ++switchSeq.current
      switchingRef.current = true
      setSwitching(true)
      setFaded(true)
      await wait(CAMERA_FADE_MS)
      if (seq !== switchSeq.current) return

      try {
        await releaseCamera()
        if (seq !== switchSeq.current) return
        const stream = await requestStream(choice)
        if (seq !== switchSeq.current) {
          stopStream(stream)
          return
        }
        await attachStream(stream, choice.deviceId)
      } catch {
        try {
          const restored = await requestStream(previous)
          if (seq === switchSeq.current) {
            await attachStream(restored, previous.deviceId)
          } else {
            stopStream(restored)
          }
        } catch {
          if (seq === switchSeq.current) {
            setError('カメラを切り替えられませんでした')
          }
        }
      }

      if (seq !== switchSeq.current) return
      await nextFrame()
      setFaded(false)
      await wait(CAMERA_FADE_MS)
      if (seq === switchSeq.current) {
        switchingRef.current = false
        setSwitching(false)
      }
    },
    [attachStream, releaseCamera, requestStream],
  )

  return {
    videoRef,
    ready,
    error,
    devices,
    selectedDeviceId,
    switching,
    faded,
    generation,
    mirrorPreview: shouldMirrorPreview(kind),
    switchCamera,
  }
}
