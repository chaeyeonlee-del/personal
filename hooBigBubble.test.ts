import { equal, ok } from 'node:assert/strict';
import { test } from 'node:test';

import {
  HOO_BIG_BUBBLE_GROWTH_MS,
  HOO_BIG_BUBBLE_MAX_SIZE,
  HOO_BIG_BUBBLE_MIN_SIZE,
  createInitialHooBigBubbleState,
  getHooBigBubbleSize,
  isHooBigBubbleBreath,
  tickHooBigBubble,
} from './hooBigBubble.ts';

test('only the 2nd and 4th breaths use the single big bubble', () => {
  equal(isHooBigBubbleBreath(1), false);
  equal(isHooBigBubbleBreath(2), true);
  equal(isHooBigBubbleBreath(3), false);
  equal(isHooBigBubbleBreath(4), true);
  equal(isHooBigBubbleBreath(5), false);
});

test('the bubble starts at the minimum size', () => {
  const state = createInitialHooBigBubbleState();
  equal(state.progress, 0);
  equal(getHooBigBubbleSize(state.progress), HOO_BIG_BUBBLE_MIN_SIZE);
});

test('a steady exhale grows the bubble over time', () => {
  const first = tickHooBigBubble({
    isExhaleActive: true,
    volumeLevel: 0.4,
    deltaMs: 260,
    state: createInitialHooBigBubbleState(),
  });
  const second = tickHooBigBubble({
    isExhaleActive: true,
    volumeLevel: 0.4,
    deltaMs: 260,
    state: first.state,
  });

  ok(first.state.progress > 0);
  ok(second.state.progress > first.state.progress);
  ok(second.size > first.size);
  equal(first.justPopped, false);
  equal(second.justPopped, false);
});

test('a strong sustained exhale eventually pops the bubble', () => {
  let state = createInitialHooBigBubbleState();
  let popped = false;
  let elapsed = 0;

  // 풀 세기로 불면 GROWTH_MS 근처에서 터져야 한다.
  for (let step = 0; step < 40 && !popped; step += 1) {
    const result = tickHooBigBubble({
      isExhaleActive: true,
      volumeLevel: 1,
      deltaMs: 100,
      state,
    });
    state = result.state;
    elapsed += 100;
    popped = result.justPopped;
  }

  ok(popped);
  ok(elapsed <= HOO_BIG_BUBBLE_GROWTH_MS + 200);
  // 터진 뒤에는 진행도가 0으로 되돌아가고 이번 날숨 동안 잠긴다.
  equal(state.progress, 0);
  equal(state.popped, true);
});

test('the bubble pops only once per breath', () => {
  // 풀 세기로 길게 불어 한 번 터뜨린다.
  let state = createInitialHooBigBubbleState();
  let firstPop = false;
  for (let step = 0; step < 40 && !firstPop; step += 1) {
    const result = tickHooBigBubble({ isExhaleActive: true, volumeLevel: 1, deltaMs: 100, state });
    state = result.state;
    firstPop = result.justPopped;
  }
  ok(firstPop);

  // 계속 불어도 같은 날숨에서는 다시 터지지 않는다.
  let poppedAgain = false;
  for (let step = 0; step < 60; step += 1) {
    const result = tickHooBigBubble({ isExhaleActive: true, volumeLevel: 1, deltaMs: 100, state });
    state = result.state;
    if (result.justPopped) {
      poppedAgain = true;
    }
  }
  equal(poppedAgain, false);
  equal(state.progress, 0);
});

test('a popping tick reports the full size', () => {
  const result = tickHooBigBubble({
    isExhaleActive: true,
    volumeLevel: 1,
    deltaMs: HOO_BIG_BUBBLE_GROWTH_MS,
    state: { progress: 0.99, popped: false },
  });

  equal(result.justPopped, true);
  equal(result.size, HOO_BIG_BUBBLE_MAX_SIZE);
});

test('pausing the breath gently deflates instead of popping', () => {
  const grown = { progress: 0.6, popped: false };
  const result = tickHooBigBubble({
    isExhaleActive: true,
    volumeLevel: 0,
    deltaMs: 400,
    state: grown,
  });

  ok(result.state.progress < grown.progress);
  ok(result.state.progress >= 0);
  equal(result.justPopped, false);
});

test('deflation never goes below zero', () => {
  const result = tickHooBigBubble({
    isExhaleActive: false,
    volumeLevel: 0,
    deltaMs: 100000,
    state: { progress: 0.1, popped: false },
  });

  equal(result.state.progress, 0);
  equal(result.size, HOO_BIG_BUBBLE_MIN_SIZE);
  equal(result.justPopped, false);
});
