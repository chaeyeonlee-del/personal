import { equal } from 'node:assert/strict';
import { test } from 'node:test';

import { getSoundToggleLabel, toDefaultSoundLabel } from './sessionAudio.ts';

test('toDefaultSoundLabel normalizes MVP background sound names', () => {
  equal(toDefaultSoundLabel('Rain'), 'Rain');
  equal(toDefaultSoundLabel('Water'), 'Ocean');
  equal(toDefaultSoundLabel('Night'), 'Night Forest');
});

test('getSoundToggleLabel describes the active sound state', () => {
  equal(getSoundToggleLabel('Ocean', true), 'Ocean on');
  equal(getSoundToggleLabel('Ocean', false), 'Sound off');
});
