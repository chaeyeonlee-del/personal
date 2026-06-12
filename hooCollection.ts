import {
  HOO_COLLECTION_CATALOG,
  HOO_COLLECTION_TOTAL,
  type HooCollectionCategory,
  type HooCollectionCharacter,
} from './hooCollectionCatalog.ts';

export type HooCollectionCapture = {
  characterId: string;
  firstCapturedAt: string;
  lastCapturedAt: string;
  captureCount: number;
};

export type HooCollectionState = {
  captures: Record<string, HooCollectionCapture>;
  recentCharacterId: string | null;
};

export type HooCollectionSummary = {
  capturedCount: number;
  totalCount: number;
  recentCharacterId: string | null;
};

export type HooCollectionViewItem = {
  character: HooCollectionCharacter;
  captured: boolean;
  selectedImageKey: string;
  capture: HooCollectionCapture | null;
};

export function createInitialHooCollectionState(): HooCollectionState {
  return {
    captures: {},
    recentCharacterId: null,
  };
}

function getNextUncapturedHooCollectionCharacter(state: HooCollectionState) {
  return HOO_COLLECTION_CATALOG.find((character) => !state.captures[character.id])
    ?? HOO_COLLECTION_CATALOG[HOO_COLLECTION_CATALOG.length - 1];
}

export function chooseRandomHooCollectionSessionCharacter(
  state: HooCollectionState,
  random: () => number = Math.random,
) {
  const uncapturedCharacters = HOO_COLLECTION_CATALOG.filter((character) => !state.captures[character.id]);
  const characterPool = uncapturedCharacters.length > 0 ? uncapturedCharacters : HOO_COLLECTION_CATALOG;
  const randomIndex = Math.max(0, Math.min(characterPool.length - 1, Math.floor(random() * characterPool.length)));

  return characterPool[randomIndex] ?? HOO_COLLECTION_CATALOG[0];
}

export function recordHooCollectionCapture(
  state: HooCollectionState,
  capturedAt = new Date(),
  capturedCharacter: HooCollectionCharacter = getNextUncapturedHooCollectionCharacter(state),
) {
  const capturedAtIso = capturedAt.toISOString();
  const currentCapture = state.captures[capturedCharacter.id] ?? null;
  const nextCapture: HooCollectionCapture = currentCapture
    ? {
        ...currentCapture,
        lastCapturedAt: capturedAtIso,
        captureCount: currentCapture.captureCount + 1,
      }
    : {
        characterId: capturedCharacter.id,
        firstCapturedAt: capturedAtIso,
        lastCapturedAt: capturedAtIso,
        captureCount: 1,
      };

  return {
    state: {
      captures: {
        ...state.captures,
        [capturedCharacter.id]: nextCapture,
      },
      recentCharacterId: capturedCharacter.id,
    },
    capturedCharacter,
    isNewCapture: currentCapture === null,
  };
}

export function getHooCollectionSummary(state: HooCollectionState): HooCollectionSummary {
  return {
    capturedCount: Object.keys(state.captures).length,
    totalCount: HOO_COLLECTION_TOTAL,
    recentCharacterId: state.recentCharacterId,
  };
}

export function getHooCollectionViewItems(
  state: HooCollectionState,
  category: HooCollectionCategory = 'all',
): HooCollectionViewItem[] {
  return HOO_COLLECTION_CATALOG
    .filter((character) => category === 'all' || character.category === category)
    .map((character) => {
      const capture = state.captures[character.id] ?? null;

      return {
        character,
        captured: capture !== null,
        selectedImageKey: capture ? character.imageKey : character.emptyImageKey,
        capture,
      };
    });
}

export function parseStoredHooCollectionState(storedValue: string | null): HooCollectionState {
  try {
    const parsedValue = storedValue ? JSON.parse(storedValue) : null;

    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
      return createInitialHooCollectionState();
    }

    const capturesSource = (parsedValue as { captures?: unknown }).captures;
    const captures: Record<string, HooCollectionCapture> = {};

    if (capturesSource && typeof capturesSource === 'object' && !Array.isArray(capturesSource)) {
      Object.entries(capturesSource).forEach(([characterId, capture]) => {
        if (
          HOO_COLLECTION_CATALOG.some((character) => character.id === characterId)
          && capture
          && typeof capture === 'object'
          && !Array.isArray(capture)
        ) {
          const candidate = capture as Partial<HooCollectionCapture>;
          if (
            candidate.characterId === characterId
            && typeof candidate.firstCapturedAt === 'string'
            && typeof candidate.lastCapturedAt === 'string'
            && typeof candidate.captureCount === 'number'
          ) {
            captures[characterId] = {
              characterId,
              firstCapturedAt: candidate.firstCapturedAt,
              lastCapturedAt: candidate.lastCapturedAt,
              captureCount: candidate.captureCount,
            };
          }
        }
      });
    }

    const recentCharacterId =
      typeof (parsedValue as { recentCharacterId?: unknown }).recentCharacterId === 'string'
      && captures[(parsedValue as { recentCharacterId: string }).recentCharacterId]
        ? (parsedValue as { recentCharacterId: string }).recentCharacterId
        : null;

    return {
      captures,
      recentCharacterId,
    };
  } catch {
    return createInitialHooCollectionState();
  }
}
