import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CAMERA_FADE_MS,
  cameraConstraints,
  listVideoCameras,
  nextFrame,
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

  const refreshDevices = useCallback(async (preferredId?: string | null) => {
    const next = await listVideoCameras()
    setDevices(next)
    const activeId =
      preferredId && next.some((device) => device.deviceId === preferredId)
        ? preferredId
        : next[0]?.deviceId ?? null
    setSelectedDeviceId(activeId)
    setKind(next.find((device) => device.deviceId === activeId)?.kind ?? 'front')
    return next
  }, [])

  const attachStream = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current
    if (!video) throw new Error('video')
    stopStream(streamRef.current)
    streamRef.current = stream
    video.srcObject = stream
    await video.play()
    await waitForVideo(video)

    const settings = stream.getVideoTracks()[0]?.getSettings() ?? {}
    const deviceId = settings.deviceId ?? readStoredCameraId()
    if (deviceId) writeStoredCameraId(deviceId)
    const listed = await refreshDevices(deviceId)
    const matched = listed.find((device) => device.deviceId === deviceId)
    setKind(matched?.kind ?? (settings.facingMode === 'environment' ? 'back' : 'front'))
    setReady(true)
    setError(null)
    setGeneration((current) => current + 1)
  }, [refreshDevices])

  const requestStream = useCallback(async (deviceId?: string | null) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('unsupported')
    }
    try {
      return await navigator.mediaDevices.getUserMedia(cameraConstraints(deviceId))
    } catch {
      if (deviceId) {
        return navigator.mediaDevices.getUserMedia(cameraConstraints(null))
      }
      throw new Error('denied')
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const stream = await requestStream(readStoredCameraId())
        if (cancelled) {
          stopStream(stream)
          return
        }
        await attachStream(stream)
      } catch {
        if (!cancelled) {
          setError('カメラ未接続（ダミー顔で代用）')
          setReady(false)
        }
      }
    }

    void start()

    const onDeviceChange = () => {
      void refreshDevices(streamRef.current?.getVideoTracks()[0]?.getSettings().deviceId)
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
      if (!deviceId || deviceId === selectedDeviceId || switchingRef.current) return
      const seq = ++switchSeq.current
      switchingRef.current = true
      setSwitching(true)
      setFaded(true)
      await wait(CAMERA_FADE_MS)
      if (seq !== switchSeq.current) return

      try {
        const stream = await requestStream(deviceId)
        if (seq !== switchSeq.current) {
          stopStream(stream)
          return
        }
        await attachStream(stream)
      } catch {
        if (seq === switchSeq.current) {
          setError('カメラを切り替えられませんでした')
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
    [attachStream, requestStream, selectedDeviceId],
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
