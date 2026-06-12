// 2·4번째 호흡에서는 작은 방울을 흩뿌리는 대신, 큰 비눗방울 하나를 천천히 키워
// 잘 불었을 때 "펑" 터뜨리는 성취감을 준다. 세기(volume)보다 "길고 일정하게"
// 부는 것에 반응하도록 시간 기반으로 차오르고, 멈추면 부드럽게 빠진다(벌이 아니라 후퇴).

import { HOO_BLOW_VOLUME_THRESHOLD } from './hooBubbles.ts';

// 큰 방울 한 개로 부는 호흡(1·3·5는 기존 흩뿌리기, 5는 피날레).
export const HOO_BIG_BUBBLE_BREATH_INDICES: readonly number[] = [2, 4];

// 렌더 지름(디자인 px, 기준폭 390). 화면에서는 s()로 반응형 변환해 사용한다.
// 링 구멍(≈99px)을 채우며 시작해 화면을 시원하게 채울 만큼 크게 자란다.
export const HOO_BIG_BUBBLE_MIN_SIZE = 100;
export const HOO_BIG_BUBBLE_MAX_SIZE = 320;

// 풀 세기로 불 때 터지기까지 걸리는 유지 시간. 1초 남짓만 불어도 쑥 커져 터지도록 짧게.
export const HOO_BIG_BUBBLE_GROWTH_MS = 1050;
// 안 불 때 차오른 양이 완전히 빠지기까지 걸리는 시간(천천히 줄어든다).
export const HOO_BIG_BUBBLE_DECAY_MS = 3200;
// 게이트(노이즈 바닥값)만 넘으면 살짝 분 입김도 거의 풀세기로 취급 — 약하게 불어도 잘 커진다.
export const HOO_BIG_BUBBLE_MIN_ACTIVE = 0.85;

export function isHooBigBubbleBreath(breathIndex: number): boolean {
  return HOO_BIG_BUBBLE_BREATH_INDICES.includes(breathIndex);
}

export type HooBigBubbleState = {
  // 0..1. 1에 도달하면 터진다.
  progress: number;
  // 이번 날숨에서 이미 터졌는지. 한 호흡당 한 번만 터뜨린다(호흡이 바뀌면 초기화).
  popped: boolean;
};

export function createInitialHooBigBubbleState(): HooBigBubbleState {
  return { progress: 0, popped: false };
}

export type HooBigBubbleTickInput = {
  isExhaleActive: boolean;
  volumeLevel: number;
  deltaMs: number;
  state: HooBigBubbleState;
};

export type HooBigBubbleTickResult = {
  state: HooBigBubbleState;
  size: number;
  justPopped: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getHooBigBubbleSize(progress: number): number {
  const normalized = clamp(progress, 0, 1);

  return HOO_BIG_BUBBLE_MIN_SIZE + normalized * (HOO_BIG_BUBBLE_MAX_SIZE - HOO_BIG_BUBBLE_MIN_SIZE);
}

export function tickHooBigBubble(input: HooBigBubbleTickInput): HooBigBubbleTickResult {
  const deltaMs = Math.max(0, input.deltaMs);
  const isBlowing = input.isExhaleActive && input.volumeLevel >= HOO_BLOW_VOLUME_THRESHOLD;

  // 이번 날숨에서 이미 터졌으면 더는 차오르지 않는다(한 호흡 = 한 번의 성취).
  if (input.state.popped) {
    return {
      state: input.state,
      size: getHooBigBubbleSize(0),
      justPopped: false,
    };
  }

  let progress = clamp(input.state.progress, 0, 1);

  if (isBlowing) {
    const activeVolume = clamp(
      (input.volumeLevel - HOO_BLOW_VOLUME_THRESHOLD) / (1 - HOO_BLOW_VOLUME_THRESHOLD),
      0,
      1,
    );
    // 약하게 불어도 최소 추진력을 주되, 세게 불면 더 빨리 차오른다.
    const effort = Math.max(HOO_BIG_BUBBLE_MIN_ACTIVE, activeVolume);
    progress += (effort * deltaMs) / HOO_BIG_BUBBLE_GROWTH_MS;
  } else {
    progress -= deltaMs / HOO_BIG_BUBBLE_DECAY_MS;
  }

  if (progress >= 1) {
    // 터짐: 이번 날숨에서는 더 차오르지 않도록 잠근다.
    return {
      state: { progress: 0, popped: true },
      size: getHooBigBubbleSize(1),
      justPopped: true,
    };
  }

  progress = clamp(progress, 0, 1);

  return {
    state: { progress, popped: false },
    size: getHooBigBubbleSize(progress),
    justPopped: false,
  };
}
