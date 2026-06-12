import { HOO_TOTAL_BREATHS, isHooFinalBreath } from './hooSessionRules.ts';

export type HooMood = 'busy' | 'rest' | 'tension' | 'sleep';

export type HooScreen = 'onboarding' | 'mood' | 'prepare' | 'breathing' | 'complete' | 'failed' | 'collection';

export type HooBreathPhase = 'inhale' | 'exhale';

export type HooFlowState = {
  screen: HooScreen;
  selectedMood: HooMood | null;
  breathIndex: number;
  breathPhase: HooBreathPhase;
  collectedCharacters: number;
};

export type HooPhaseCopy = {
  title: string;
  subtitle: string;
};

export function createInitialHooFlowState(): HooFlowState {
  return {
    screen: 'onboarding',
    selectedMood: null,
    breathIndex: 1,
    breathPhase: 'inhale',
    collectedCharacters: 0,
  };
}

export function resetHooFlow(_: HooFlowState): HooFlowState {
  return createInitialHooFlowState();
}

export function openHooMoodSelection(state: HooFlowState): HooFlowState {
  return {
    ...state,
    screen: 'mood',
    selectedMood: null,
    breathIndex: 1,
    breathPhase: 'inhale',
  };
}

// 무드 선택 화면을 거치지 않고 온보딩에서 바로 준비 화면으로 진입한다(원페이지 플로우).
export function beginHooSession(state: HooFlowState): HooFlowState {
  return {
    ...state,
    screen: 'prepare',
    breathIndex: 1,
    breathPhase: 'inhale',
  };
}

export function selectHooMood(state: HooFlowState, selectedMood: HooMood): HooFlowState {
  return {
    ...state,
    screen: 'prepare',
    selectedMood,
    breathIndex: 1,
    breathPhase: 'inhale',
  };
}

export function startHooBreathing(state: HooFlowState): HooFlowState {
  return {
    ...state,
    screen: 'breathing',
    breathIndex: 1,
    breathPhase: 'inhale',
  };
}

export function progressHooFlow(state: HooFlowState): HooFlowState {
  if (state.screen !== 'breathing') {
    return state;
  }

  if (state.breathPhase === 'inhale') {
    return {
      ...state,
      breathPhase: 'exhale',
    };
  }

  if (isHooFinalBreath(state.breathIndex)) {
    return {
      ...state,
      screen: 'complete',
      breathIndex: HOO_TOTAL_BREATHS,
      breathPhase: 'exhale',
      collectedCharacters: state.collectedCharacters + 1,
    };
  }

  return {
    ...state,
    breathIndex: state.breathIndex + 1,
    breathPhase: 'inhale',
  };
}

export function failHooFinalCapture(state: HooFlowState): HooFlowState {
  if (state.screen !== 'breathing' || state.breathPhase !== 'exhale' || !isHooFinalBreath(state.breathIndex)) {
    return state;
  }

  return {
    ...state,
    screen: 'failed',
    breathIndex: HOO_TOTAL_BREATHS,
    breathPhase: 'exhale',
  };
}

export function restartHooBreathing(state: HooFlowState): HooFlowState {
  return {
    ...state,
    screen: 'prepare',
    breathIndex: 1,
    breathPhase: 'inhale',
  };
}

export function getHooPhaseCopy(phase: HooBreathPhase): HooPhaseCopy {
  return phase === 'inhale'
    ? {
        title: '들이쉬세요',
        subtitle: '방울 만들 숨을 모아요',
      }
    : {
        title: '후-우',
        subtitle: '입으로 부드럽게 내보내요',
      };
}
