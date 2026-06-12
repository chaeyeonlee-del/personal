import { equal, ok } from 'node:assert/strict';
import { test } from 'node:test';

import {
  HOO_BLOW_VOLUME_THRESHOLD,
  createHooBubble,
  getHooBubbleBurstCount,
  normalizeHooMetering,
  normalizeHooWebAmplitude,
} from './hooBubbles.ts';

test('normalizeHooMetering converts silent native metering to zero', () => {
  equal(normalizeHooMetering(-80), 0);
});

test('normalizeHooMetering converts loud native metering close to one', () => {
  ok(normalizeHooMetering(-4) > 0.9);
});

test('normalizeHooWebAmplitude treats quiet browser mic input as silence', () => {
  equal(normalizeHooWebAmplitude(0.0037), 0);
});

test('normalizeHooWebAmplitude makes gentle blowing visible on web', () => {
  ok(normalizeHooWebAmplitude(0.0041) > HOO_BLOW_VOLUME_THRESHOLD);
  ok(normalizeHooWebAmplitude(0.006) > 0.2);
  ok(normalizeHooWebAmplitude(0.012) > 0.55);
});

test('getHooBubbleBurstCount creates no bubbles while inhaling', () => {
  equal(getHooBubbleBurstCount({ phase: 'inhale', volumeLevel: 1, breathIndex: 3 }), 0);
});

test('getHooBubbleBurstCount increases with exhale volume', () => {
  const quietCount = getHooBubbleBurstCount({ phase: 'exhale', volumeLevel: 0.15, breathIndex: 2 });
  const loudCount = getHooBubbleBurstCount({ phase: 'exhale', volumeLevel: 0.9, breathIndex: 2 });

  ok(loudCount > quietCount);
});

test('getHooBubbleBurstCount responds to a gentle blow before users think recognition failed', () => {
  equal(getHooBubbleBurstCount({ phase: 'exhale', volumeLevel: 0, breathIndex: 2 }), 0);
  equal(getHooBubbleBurstCount({ phase: 'exhale', volumeLevel: 0.01, breathIndex: 2 }), 0);
  ok(getHooBubbleBurstCount({ phase: 'exhale', volumeLevel: 0.02, breathIndex: 2 }) >= 7);
  ok(getHooBubbleBurstCount({ phase: 'exhale', volumeLevel: 0.04, breathIndex: 2 }) >= 7);
  ok(getHooBubbleBurstCount({ phase: 'exhale', volumeLevel: 0.14, breathIndex: 2 }) >= 8);
});

test('getHooBubbleBurstCount adds a stronger final capture breath', () => {
  const normalCount = getHooBubbleBurstCount({ phase: 'exhale', volumeLevel: 0.5, breathIndex: 3 });
  const finalCount = getHooBubbleBurstCount({ phase: 'exhale', volumeLevel: 0.5, breathIndex: 5 });

  ok(finalCount > normalCount);
});

test('createHooBubble deterministically maps seed and volume to a visible bubble', () => {
  const bubble = createHooBubble({ seed: 4, volumeLevel: 0.75, breathIndex: 5 });

  ok(bubble.size >= 18);
  ok(bubble.size <= 92);
  ok(bubble.left >= 0);
  ok(bubble.left <= 100);
  ok(bubble.durationMs >= 3200);
  ok(bubble.driftX !== 0);
});

test('createHooBubble creates mixed small and medium bubbles behind the UI', () => {
  const bubbles = Array.from({ length: 12 }, (_, index) => (
    createHooBubble({ seed: index + 1, volumeLevel: 0.95, breathIndex: 2 })
  ));
  const sizes = bubbles.map((bubble) => bubble.size);

  ok(Math.min(...sizes) <= 32);
  ok(Math.max(...sizes) <= 92);
  ok(Math.max(...sizes) - Math.min(...sizes) >= 34);
  // 비눗방울은 마법봉 링(조준점)에서 좁게 태어난다: 일관된 출발 높이 + 가운데 클러스터.
  ok(bubbles.every((bubble) => bubble.top >= 61 && bubble.top <= 66));
  ok(bubbles.every((bubble) => bubble.left >= 44 && bubble.left <= 60));
  ok(bubbles.every((bubble) => bubble.opacity <= 0.72));
});
