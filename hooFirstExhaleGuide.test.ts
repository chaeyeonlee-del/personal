import { equal } from 'node:assert/strict';
import { test } from 'node:test';

import { getHooFirstExhaleGuideCopy } from './hooFirstExhaleGuide.ts';

test('first exhale starts with a gentle mic direction', () => {
  equal(getHooFirstExhaleGuideCopy({
    screen: 'breathing',
    breathIndex: 1,
    breathPhase: 'exhale',
    elapsedMs: 0,
    hasDetectedBreath: false,
  }), '마이크 쪽으로 후-우 불어보세요');
});

test('first exhale gives a soft hint after quiet input', () => {
  equal(getHooFirstExhaleGuideCopy({
    screen: 'breathing',
    breathIndex: 1,
    breathPhase: 'exhale',
    elapsedMs: 1500,
    hasDetectedBreath: false,
  }), '조금 더 길게 후-우');
});

test('first exhale immediately confirms when breath is detected', () => {
  equal(getHooFirstExhaleGuideCopy({
    screen: 'breathing',
    breathIndex: 1,
    breathPhase: 'exhale',
    elapsedMs: 200,
    hasDetectedBreath: true,
  }), '좋아요, 방울이 생기고 있어요');
});

test('first exhale guide does not appear after the first breath', () => {
  equal(getHooFirstExhaleGuideCopy({
    screen: 'breathing',
    breathIndex: 2,
    breathPhase: 'exhale',
    elapsedMs: 1600,
    hasDetectedBreath: false,
  }), null);
});

test('first exhale guide does not appear outside exhale', () => {
  equal(getHooFirstExhaleGuideCopy({
    screen: 'breathing',
    breathIndex: 1,
    breathPhase: 'inhale',
    elapsedMs: 1600,
    hasDetectedBreath: false,
  }), null);
});
