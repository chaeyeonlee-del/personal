import type { HooBreathPhase, HooScreen } from './hooFlow.ts';

export const HOO_FIRST_EXHALE_HINT_DELAY_MS = 1500;
export const HOO_FIRST_EXHALE_DETECTION_THRESHOLD = 0.06;

export type HooFirstExhaleGuideInput = {
  screen: HooScreen;
  breathIndex: number;
  breathPhase: HooBreathPhase;
  elapsedMs: number;
  hasDetectedBreath: boolean;
};

export function getHooFirstExhaleGuideCopy({
  screen,
  breathIndex,
  breathPhase,
  elapsedMs,
  hasDetectedBreath,
}: HooFirstExhaleGuideInput) {
  if (screen !== 'breathing' || breathIndex !== 1 || breathPhase !== 'exhale') {
    return null;
  }

  if (hasDetectedBreath) {
    return '좋아요, 방울이 생기고 있어요';
  }

  if (elapsedMs >= HOO_FIRST_EXHALE_HINT_DELAY_MS) {
    return '조금 더 길게 후-우';
  }

  return '마이크 쪽으로 후-우 불어보세요';
}
