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
  const finalBreathBonus = isHooFinalBreath(breathIndex) ? 3 : 0;

  return 7 + Math.floor(activeVolume * 14) + finalBreathBonus;
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
    // 마법봉 링(조준점, x≈52%) 중심에 좁게 모여 태어난 뒤, driftX로 올라가며 부채처럼 퍼진다.
    left: clamp(52 + (sideJitter - 0.5) * 10, 46, 58),
    // 막대 중간 링 근처에서 출발해 손잡이 아래쪽에서 와다다 생기는 느낌을 줄인다.
    top: clamp(58.5 - liftJitter * 4.5, 54, 59),
    size: clamp(baseSize + finalBreathBonus, 16, 86),
    // 상승하면서 좌우로 벌어지는 폭(부채꼴 확산)을 더 키워 "가운데에서 위로 퍼지는" 느낌 강화.
    driftX: direction * (58 + sideJitter * 78),
    durationMs: 2700 + HOO_BUBBLE_RISE_EXTRA_MS + Math.round(liftJitter * 1300),
    // 같은 burst라도 방울마다 시작 시점을 0~240ms 흩어서 "또르르" 흘러나오게(뭉침 방지).
    delayMs: Math.round(staggerJitter * 320),
    opacity: 0.38 + normalizedVolume * 0.22 + clusterJitter * 0.08,
  };
}
