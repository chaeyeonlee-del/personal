import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';

import {
  createInitialHooFlowState,
  failHooFinalCapture,
  getHooPhaseCopy,
  progressHooFlow,
  resetHooFlow,
  selectHooMood,
  type HooFlowState,
} from './hooFlow.ts';

test('hoo flow starts with onboarding and no selected mood', () => {
  const state = createInitialHooFlowState();

  deepEqual(state, {
    screen: 'onboarding',
    selectedMood: null,
    breathIndex: 1,
    breathPhase: 'inhale',
    collectedCharacters: 0,
  });
});

test('hoo flow moves from mood selection to preparation', () => {
  const state = selectHooMood(createInitialHooFlowState(), 'busy');

  deepEqual(state, {
    screen: 'prepare',
    selectedMood: 'busy',
    breathIndex: 1,
    breathPhase: 'inhale',
    collectedCharacters: 0,
  });
});

test('hoo flow alternates inhale and exhale for five breaths before completion', () => {
  let state: HooFlowState = {
    screen: 'breathing',
    selectedMood: 'rest',
    breathIndex: 1,
    breathPhase: 'inhale',
    collectedCharacters: 0,
  };

  const steps = Array.from({ length: 10 }, () => {
    state = progressHooFlow(state);
    return `${state.screen}:${state.breathIndex}:${state.breathPhase}`;
  });

  deepEqual(steps, [
    'breathing:1:exhale',
    'breathing:2:inhale',
    'breathing:2:exhale',
    'breathing:3:inhale',
    'breathing:3:exhale',
    'breathing:4:inhale',
    'breathing:4:exhale',
    'breathing:5:inhale',
    'breathing:5:exhale',
    'complete:5:exhale',
  ]);
});

test('hoo flow collects the character when the fifth exhale completes', () => {
  const state = progressHooFlow({
    screen: 'breathing',
    selectedMood: 'sleep',
    breathIndex: 5,
    breathPhase: 'exhale',
    collectedCharacters: 0,
  });

  deepEqual(state, {
    screen: 'complete',
    selectedMood: 'sleep',
    breathIndex: 5,
    breathPhase: 'exhale',
    collectedCharacters: 1,
  });
});

test('hoo flow fails the final capture without collecting a character', () => {
  const state = failHooFinalCapture({
    screen: 'breathing',
    selectedMood: 'sleep',
    breathIndex: 5,
    breathPhase: 'exhale',
    collectedCharacters: 0,
  });

  deepEqual(state, {
    screen: 'failed',
    selectedMood: 'sleep',
    breathIndex: 5,
    breathPhase: 'exhale',
    collectedCharacters: 0,
  });
});

test('hoo phase copy matches the breathing phase', () => {
  deepEqual(getHooPhaseCopy('inhale'), {
    title: '들이쉬세요',
    subtitle: '방울 만들 숨을 모아요',
  });
  deepEqual(getHooPhaseCopy('exhale'), {
    title: '후-우',
    subtitle: '입으로 부드럽게 내보내요',
  });
});

test('hoo flow reset returns to onboarding', () => {
  const state = resetHooFlow({
    screen: 'complete',
    selectedMood: 'sleep',
    breathIndex: 5,
    breathPhase: 'exhale',
    collectedCharacters: 1,
  });

  equal(state.screen, 'onboarding');
  equal(state.selectedMood, null);
});
