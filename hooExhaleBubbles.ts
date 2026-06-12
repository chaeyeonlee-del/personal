import {
  HOO_BLOW_VOLUME_THRESHOLD,
  createHooBubble,
  getHooBubbleBurstCount,
  type HooBubble,
} from './hooBubbles.ts';

export const HOO_EXHALE_BUBBLE_BURST_INTERVAL_MS = 260;
export const HOO_EXHALE_BUBBLE_SOUND_INTERVAL_MS = 560;

export type HooExhaleBubbleBurstInput = {
  isExhaleActive: boolean;
  volumeLevel: number;
  breathIndex: number;
  nowMs: number;
  lastBurstAtMs: number;
  lastSoundAtMs: number;
  nextSeed: number;
};

export type HooExhaleBubbleBurstResult = {
  bubbles: HooBubble[];
  nextSeed: number;
  nextLastBurstAtMs: number;
  nextLastSoundAtMs: number;
  shouldPlaySound: boolean;
  soundVolume: number;
};

function emptyBurst(input: HooExhaleBubbleBurstInput): HooExhaleBubbleBurstResult {
  return {
    bubbles: [],
    nextSeed: input.nextSeed,
    nextLastBurstAtMs: input.lastBurstAtMs,
    nextLastSoundAtMs: input.lastSoundAtMs,
    shouldPlaySound: false,
    soundVolume: 0,
  };
}

export function createHooExhaleBubbleBurst(input: HooExhaleBubbleBurstInput): HooExhaleBubbleBurstResult {
  const volumeLevel = input.volumeLevel;

  if (!input.isExhaleActive || volumeLevel < HOO_BLOW_VOLUME_THRESHOLD) {
    return emptyBurst(input);
  }

  if (
    input.lastBurstAtMs > 0
    && input.nowMs - input.lastBurstAtMs < HOO_EXHALE_BUBBLE_BURST_INTERVAL_MS
  ) {
    return emptyBurst(input);
  }

  const burstCount = getHooBubbleBurstCount({
    phase: 'exhale',
    volumeLevel,
    breathIndex: input.breathIndex,
  });

  if (burstCount <= 0) {
    return emptyBurst(input);
  }

  let nextSeed = input.nextSeed;
  const bubbles = Array.from({ length: burstCount }).map(() => {
    nextSeed += 1;
    return createHooBubble({
      seed: nextSeed,
      volumeLevel,
      breathIndex: input.breathIndex,
    });
  });

  const shouldPlaySound = input.lastSoundAtMs <= 0
    || input.nowMs - input.lastSoundAtMs >= HOO_EXHALE_BUBBLE_SOUND_INTERVAL_MS;

  return {
    bubbles,
    nextSeed,
    nextLastBurstAtMs: input.nowMs,
    nextLastSoundAtMs: shouldPlaySound ? input.nowMs : input.lastSoundAtMs,
    shouldPlaySound,
    soundVolume: shouldPlaySound ? Math.min(0.86, 0.78 + volumeLevel * 0.08) : 0,
  };
}
