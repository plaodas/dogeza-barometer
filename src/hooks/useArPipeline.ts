/**
 * Camera switch protocol for MediaPipe + Three.js.
 * Pause tracking while the stream is torn down, then bump calibrationKey
 * so horn poses start from the new camera instead of lerping from the old one.
 */
export function useArPipeline(switching: boolean, generation: number) {
  return {
    paused: switching,
    calibrationKey: generation,
  }
}
