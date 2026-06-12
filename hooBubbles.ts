import type { HooBreathPhase } from './hooFlow.ts';
import { isHooFinalBreath } from './hooSessionRules.ts';

export const HOO_BLOW_VOLUME_THRESHOLD = 0.012;
export const HOO_BUBBLE_RISE_EXTRA_MS = 500;

export type HooBubble = {
  id: string;
  left: number;
  top: number;
  size: number;
  driftX: number;
  durationMs: number;
  delayMs: number;
  opacity: number;
};

export type HooBubbleBurstInput = {
  phase: HooBreathPhase;
  volumeLevel: number;
  breathIndex: number;
};

export type HooBubbleInput = {
  seed: number;
  volumeLevel: number;
  breathIndex: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function seededUnit(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;

  return value - Math.floor(value);
}

export function normalizeHooMetering(metering: number | null | undefined) {
  if (typeof metering !== 'number' || Number.isNaN(metering)) {
    return 0;
  }

  if (metering >= 0 && metering <= 1) {
    return metering;
  }

  return clamp((metering + 80) / 76, 0, 1);
}

export function normalizeHooWebAmplitude(amplitude: number | null | undefined) {
  if (typeof amplitude !== 'number' || Number.isNaN(amplitude)) {
    return 0;
  }

  const noiseFloor = 0.0038;
  if (amplitude <= noiseFloor) {
    return 0;
  }

  return Math.pow(clamp((amplitude - noiseFloor) / 0.01, 0, 1), 0.42);
}

export function getHooBubbleBurstCount({ phase, volumeLevel, breathIndex }: HooBubbleBurstInput) {
  if (phase !== 'exhale') {
    return 0;
  }

  const normalizedVolume = clamp(volumeLevel, 0, 1);
  if (normalizedVolume < HOO_BLOW_VOLUME_THRESHOLD) {
    return 0;
  }

  const activeVolume = (normalizedVolume - HOO_BLOW_VOLUME_THRESHOLD) / (1 - HOO_BLOW_VOLUME_THRESHOLD);
  const finalBreathBonus = isHooFinalBreath(breathIndex) ? 2 : 0;

  return 3 + Math.floor(activeVolume * 6) + finalBreathBonus;
}

export function createHooBubble({ seed, volumeLevel, breathIndex }: HooBubbleInput): HooBubble {
  const normalizedVolume = clamp(volumeLevel, 0, 1);
  const sideJitter = seededUnit(seed + 1);
  const liftJitter = seededUnit(seed + 2);
  const sizeJitter = seededUnit(seed + 3);
  const staggerJitter = seededUnit(seed + 5);
  const clusterJitter = seededUnit(seed + 7);
  const direction = seed % 2 === 0 ? 1 : -1;
  // 크기를 실제 볼륨에 연동: 약하게 불면 작은 물방울, 세게 불면 큰 비눗방울.
  const baseSize = clusterJitter < 0.62
    ? 12 + sizeJitter * 10 + normalizedVolume * 6
    : 24 + sizeJitter * 18 + normalizedVolume * 32;
  const finalBreathBonus = isHooFinalBreath(breathIndex) ? 6 : 0;

  return {
    id: `bubble-${breathIndex}-${seed}`,
    // 마법봉 링 근처에서 태어나되 시작점과 타이밍을 넓혀 한 덩어리로 뭉쳐 보이지 않게 한다.
    left: clamp(52 + (sideJitter - 0.5) * 18, 43, 61),
    top: clamp(60 - liftJitter * 8, 52, 60),
    size: clamp(baseSize + finalBreathBonus, 16, 86),
    // 상승하면서 좌우로 벌어지는 폭(부채꼴 확산)을 더 키워 "가운데에서 위로 퍼지는" 느낌 강화.
    driftX: direction * (62 + sideJitter * 94),
    durationMs: 2700 + HOO_BUBBLE_RISE_EXTRA_MS + Math.round(liftJitter * 1300),
    delayMs: Math.round(staggerJitter * 680),
    opacity: 0.38 + normalizedVolume * 0.22 + clusterJitter * 0.08,
  };
}
