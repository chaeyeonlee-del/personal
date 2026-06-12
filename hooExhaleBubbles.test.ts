import { equal, ok } from 'node:assert/strict';
import { test } from 'node:test';

import {
  HOO_EXHALE_BUBBLE_BURST_INTERVAL_MS,
  createHooExhaleBubbleBurst,
} from './hooExhaleBubbles.ts';

test('createHooExhaleBubbleBurst does nothing outside active exhale', () => {
  const result = createHooExhaleBubbleBurst({
    isExhaleActive: false,
    volumeLevel: 1,
    breathIndex: 2,
    nowMs: 1000,
    lastBurstAtMs: 0,
    nextSeed: 0,
  });

  equal(result.bubbles.length, 0);
  equal(result.nextSeed, 0);
  equal(result.nextLastBurstAtMs, 0);
});

test('createHooExhaleBubbleBurst creates bubbles from current exhale volume', () => {
  const result = createHooExhaleBubbleBurst({
    isExhaleActive: true,
    volumeLevel: 0.4,
    breathIndex: 2,
    nowMs: 1000,
    lastBurstAtMs: 0,
    nextSeed: 0,
  });

  ok(result.bubbles.length >= 7);
  equal(result.nextSeed, result.bubbles.length);
  equal(result.nextLastBurstAtMs, 1000);
  ok(result.soundVolume >= 0.95);
});

test('createHooExhaleBubbleBurst responds strongly to very soft blowing', () => {
  const result = createHooExhaleBubbleBurst({
    isExhaleActive: true,
    volumeLevel: 0.04,
    breathIndex: 2,
    nowMs: 1000,
    lastBurstAtMs: 0,
    nextSeed: 0,
  });

  ok(result.bubbles.length >= 7);
  equal(result.nextSeed, result.bubbles.length);
  equal(result.nextLastBurstAtMs, 1000);
  ok(result.soundVolume >= 0.95);
});

test('createHooExhaleBubbleBurst does not create bubbles without measured exhale volume', () => {
  const result = createHooExhaleBubbleBurst({
    isExhaleActive: true,
    volumeLevel: 0,
    breathIndex: 2,
    nowMs: 1000,
    lastBurstAtMs: 0,
    nextSeed: 0,
  });

  equal(result.bubbles.length, 0);
  equal(result.nextSeed, 0);
  equal(result.nextLastBurstAtMs, 0);
  equal(result.soundVolume, 0);
});

test('createHooExhaleBubbleBurst throttles bursts that are too close together', () => {
  const result = createHooExhaleBubbleBurst({
    isExhaleActive: true,
    volumeLevel: 0.8,
    breathIndex: 2,
    nowMs: 1100,
    lastBurstAtMs: 1000,
    nextSeed: 8,
  });

  equal(result.bubbles.length, 0);
  equal(result.nextSeed, 8);
  equal(result.nextLastBurstAtMs, 1000);
});

test('createHooExhaleBubbleBurst keeps making bubbles while volume is held during exhale', () => {
  const first = createHooExhaleBubbleBurst({
    isExhaleActive: true,
    volumeLevel: 0.5,
    breathIndex: 3,
    nowMs: 1000,
    lastBurstAtMs: 0,
    nextSeed: 0,
  });
  const second = createHooExhaleBubbleBurst({
    isExhaleActive: true,
    volumeLevel: 0.5,
    breathIndex: 3,
    nowMs: 1000 + HOO_EXHALE_BUBBLE_BURST_INTERVAL_MS,
    lastBurstAtMs: first.nextLastBurstAtMs,
    nextSeed: first.nextSeed,
  });

  ok(first.bubbles.length > 0);
  ok(second.bubbles.length > 0);
  ok(second.nextSeed > first.nextSeed);
});

test('createHooExhaleBubbleBurst keeps making bubbles on the final capture breath', () => {
  const first = createHooExhaleBubbleBurst({
    isExhaleActive: true,
    volumeLevel: 0.5,
    breathIndex: 5,
    nowMs: 1000,
    lastBurstAtMs: 0,
    nextSeed: 0,
  });
  const second = createHooExhaleBubbleBurst({
    isExhaleActive: true,
    volumeLevel: 0.5,
    breathIndex: 5,
    nowMs: 1000 + HOO_EXHALE_BUBBLE_BURST_INTERVAL_MS,
    lastBurstAtMs: first.nextLastBurstAtMs,
    nextSeed: first.nextSeed,
  });

  ok(first.bubbles.length > 1);
  ok(second.bubbles.length > 1);
  ok(second.nextSeed > first.nextSeed);
});
