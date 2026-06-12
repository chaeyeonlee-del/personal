export const HOO_TOTAL_BREATHS = 5;
export const HOO_PREPARE_COUNTDOWN_VALUES = [3, 2, 1] as const;
export const HOO_PREPARE_STEP_MS = 1000;
export const HOO_PHASE_FINAL_COUNT_HOLD_MS = 1000;

type HooRuleBreathPhase = 'inhale' | 'exhale';

const HOO_PHASE_DURATION_MS: Record<HooRuleBreathPhase, number> = {
  inhale: 4000,
  exhale: 6000,
};

export function createHooPrepareCountdownValues() {
  return [...HOO_PREPARE_COUNTDOWN_VALUES];
}

export function createHooPhaseCountdownValues(phase: HooRuleBreathPhase) {
  const durationSeconds = Math.ceil(getHooPhaseDurationMs(phase) / 1000);

  return Array.from({ length: durationSeconds }, (_, index) => durationSeconds - index);
}

export function getHooPhaseDurationMs(phase: HooRuleBreathPhase) {
  return HOO_PHASE_DURATION_MS[phase];
}

export function getHooPhaseAdvanceDelayMs(phase: HooRuleBreathPhase) {
  return getHooPhaseDurationMs(phase) + HOO_PHASE_FINAL_COUNT_HOLD_MS;
}

export function isHooFinalBreath(breathIndex: number) {
  return breathIndex >= HOO_TOTAL_BREATHS;
}
