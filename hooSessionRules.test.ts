import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';

import {
  HOO_PREPARE_STEP_MS,
  HOO_TOTAL_BREATHS,
  createHooPhaseCountdownValues,
  createHooPrepareCountdownValues,
  getHooPhaseAdvanceDelayMs,
  getHooPhaseDurationMs,
  isHooFinalBreath,
} from './hooSessionRules.ts';

test('hoo session prepares with a visible 3 2 1 countdown', () => {
  deepEqual(createHooPrepareCountdownValues(), [3, 2, 1]);
  equal(HOO_PREPARE_STEP_MS, 1000);
});

test('hoo session uses exactly five breathing loops', () => {
  equal(HOO_TOTAL_BREATHS, 5);
  equal(isHooFinalBreath(4), false);
  equal(isHooFinalBreath(5), true);
});

test('hoo session exposes phase durations for the app timer', () => {
  equal(getHooPhaseDurationMs('inhale'), 4000);
  equal(getHooPhaseDurationMs('exhale'), 6000);
});

test('hoo session holds on 1 before switching phase copy', () => {
  equal(getHooPhaseAdvanceDelayMs('inhale'), 5000);
  equal(getHooPhaseAdvanceDelayMs('exhale'), 7000);
});

test('hoo session shows visible countdowns for each breathing phase', () => {
  deepEqual(createHooPhaseCountdownValues('inhale'), [4, 3, 2, 1]);
  deepEqual(createHooPhaseCountdownValues('exhale'), [6, 5, 4, 3, 2, 1]);
});
