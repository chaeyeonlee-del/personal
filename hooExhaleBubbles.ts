import {
  HOO_BLOW_VOLUME_THRESHOLD,
  createHooBubble,
  getHooBubbleBurstCount,
  type HooBubble,
} from './hooBubbles.ts';

export const HOO_EXHALE_BUBBLE_BURST_INTERVAL_MS = 140;

export type HooExhaleBubbleBurstInput = {
  isExhaleActive: boolean;
  volumeLevel: number;
  breathIndex: number;
  nowMs: number;
  lastBurstAtMs: number;
  nextSeed: number;
};

export type HooExhaleBubbleBurstResult = {
  bubbles: HooBubble[];
  nextSeed: number;
  nextLastBurstAtMs: number;
  soundVolume: number;
};

function emptyBurst(input: HooExhaleBubbleBurstInput): HooExhaleBubbleBurstResult {
  return {
    bubbles: [],
    nextSeed: input.nextSeed,
    nextLastBurstAtMs: input.lastBurstAtMs,
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

  return {
    bubbles,
    nextSeed,
    nextLastBurstAtMs: input.nowMs,
    soundVolume: Math.min(1, 0.95 + volumeLevel * 0.05),
  };
}
