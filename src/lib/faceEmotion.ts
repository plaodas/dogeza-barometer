import { clamp } from './scoring'

type BlendMap = Record<string, number>

export function combineFaceScore(anger: number, confusion: number, sadness: number) {
  const peak = Math.max(anger, confusion, sadness)
  const mix = anger * 0.5 + confusion * 0.3 + sadness * 0.2
  return clamp(peak * 0.88 + mix * 0.12)
}

export function blendshapesToMap(
  categories: Array<{ categoryName: string; score: number }>,
): BlendMap {
  const map: BlendMap = {}
  for (const category of categories) {
    map[category.categoryName] = category.score
  }
  return map
}

function pick(map: BlendMap, name: string) {
  return map[name] ?? 0
}

function avg(map: BlendMap, names: string[]) {
  return names.reduce((sum, name) => sum + pick(map, name), 0) / names.length
}

function scaled(value: number, gain: number, floor = 0.05) {
  return clamp((value - floor) * gain)
}

export function emotionFromBlendshapes(map: BlendMap) {
  const browDown = avg(map, ['browDownLeft', 'browDownRight'])
  const browAsym = Math.abs(pick(map, 'browDownLeft') - pick(map, 'browDownRight'))
  const browInner = pick(map, 'browInnerUp')
  const squint = avg(map, ['eyeSquintLeft', 'eyeSquintRight'])
  const sneer = avg(map, ['noseSneerLeft', 'noseSneerRight'])
  const press = avg(map, ['mouthPressLeft', 'mouthPressRight'])
  const frown = avg(map, ['mouthFrownLeft', 'mouthFrownRight'])
  const lower = avg(map, ['mouthLowerDownLeft', 'mouthLowerDownRight'])
  const pucker = pick(map, 'mouthPucker')
  const mouthAsym = Math.abs(pick(map, 'mouthLeft') - pick(map, 'mouthRight'))
  const lookDown = avg(map, ['eyeLookDownLeft', 'eyeLookDownRight'])
  const smile = avg(map, ['mouthSmileLeft', 'mouthSmileRight'])
  const jaw = pick(map, 'jawOpen')
  const stretch = avg(map, ['mouthStretchLeft', 'mouthStretchRight'])

  const anger = scaled(
    browDown * 0.42 + squint * 0.2 + sneer * 0.16 + press * 0.12 + jaw * 0.06 + stretch * 0.04,
    320,
  )
  const confusion = scaled(
    browInner * 0.34 + browAsym * 0.28 + pucker * 0.22 + mouthAsym * 0.16,
    330,
  )
  const sadness = scaled(
    frown * 0.4 + lower * 0.22 + browInner * 0.22 + lookDown * 0.08 - smile * 0.22,
    310,
    0.04,
  )

  return {
    anger,
    confusion,
    sadness,
    score: combineFaceScore(anger, confusion, sadness),
  }
}

export function smoothEmotion(
  current: { anger: number; confusion: number; sadness: number; score: number },
  next: { anger: number; confusion: number; sadness: number; score: number },
) {
  const mix = (from: number, to: number) =>
    from + (to - from) * (to > from ? 0.62 : 0.14)
  const anger = mix(current.anger, next.anger)
  const confusion = mix(current.confusion, next.confusion)
  const sadness = mix(current.sadness, next.sadness)
  return {
    anger,
    confusion,
    sadness,
    score: combineFaceScore(anger, confusion, sadness),
  }
}
