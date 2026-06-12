import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';

import {
  HOO_COLLECTION_CATALOG,
  HOO_COLLECTION_TOTAL,
  getHooCollectionCharacter,
  getHooCollectionCharactersByCategory,
} from './hooCollectionCatalog.ts';
import {
  chooseRandomHooCollectionSessionCharacter,
  createInitialHooCollectionState,
  getHooCollectionSummary,
  getHooCollectionViewItems,
  recordHooCollectionCapture,
} from './hooCollection.ts';

test('hoo collection catalog keeps stable ids, names, categories, and asset keys', () => {
  equal(HOO_COLLECTION_TOTAL, 30);
  deepEqual(HOO_COLLECTION_CATALOG.slice(0, 3).map((character) => character.name), [
    '나비 후우',
    '참새 후우',
    '무지개 후우',
  ]);
  deepEqual(HOO_COLLECTION_CATALOG.slice(0, 3).map((character) => character.category), [
    'sky',
    'sky',
    'sea',
  ]);
  equal(getHooCollectionCharacter('collection-01-butterfly')?.imageKey, 'hoo-collection-01-butterfly');
  equal(getHooCollectionCharacter('collection-01-butterfly')?.emptyImageKey, 'hoo-collection-empty-01-butterfly');
});

test('getHooCollectionCharactersByCategory returns all characters for 전체 and filtered rows for tabs', () => {
  equal(getHooCollectionCharactersByCategory('all').length, HOO_COLLECTION_TOTAL);
  deepEqual(
    getHooCollectionCharactersByCategory('sky').map((character) => character.id).slice(0, 3),
    ['collection-01-butterfly', 'collection-02-sparrow', 'collection-09-peacock-feather'],
  );
});

test('recordHooCollectionCapture unlocks the next character and preserves previous captures', () => {
  const firstCapturedAt = new Date('2026-06-12T01:00:00.000Z');
  const secondCapturedAt = new Date('2026-06-12T02:00:00.000Z');

  const first = recordHooCollectionCapture(createInitialHooCollectionState(), firstCapturedAt);
  const second = recordHooCollectionCapture(first.state, secondCapturedAt);

  equal(first.capturedCharacter?.id, 'collection-01-butterfly');
  equal(second.capturedCharacter?.id, 'collection-02-sparrow');
  deepEqual(Object.keys(second.state.captures), ['collection-01-butterfly', 'collection-02-sparrow']);
  deepEqual(second.state.captures['collection-01-butterfly'], {
    characterId: 'collection-01-butterfly',
    firstCapturedAt: firstCapturedAt.toISOString(),
    lastCapturedAt: firstCapturedAt.toISOString(),
    captureCount: 1,
  });
  equal(second.state.recentCharacterId, 'collection-02-sparrow');
});

test('chooseRandomHooCollectionSessionCharacter picks from uncaptured characters only', () => {
  const first = recordHooCollectionCapture(createInitialHooCollectionState(), new Date('2026-06-12T01:00:00.000Z'));
  const selected = chooseRandomHooCollectionSessionCharacter(first.state, () => 0);

  equal(selected.id, 'collection-02-sparrow');
});

test('recordHooCollectionCapture records the character selected for the session', () => {
  const selectedCharacter = HOO_COLLECTION_CATALOG[5];
  const capturedAt = new Date('2026-06-12T03:00:00.000Z');
  const result = recordHooCollectionCapture(createInitialHooCollectionState(), capturedAt, selectedCharacter);

  equal(result.capturedCharacter.id, selectedCharacter.id);
  equal(result.state.recentCharacterId, selectedCharacter.id);
  equal(result.state.captures[selectedCharacter.id]?.firstCapturedAt, capturedAt.toISOString());
});

test('recordHooCollectionCapture repeats the recent character after the catalog is complete', () => {
  let state = createInitialHooCollectionState();

  for (let index = 0; index < HOO_COLLECTION_TOTAL; index += 1) {
    state = recordHooCollectionCapture(state, new Date(2026, 5, 12, 8, index)).state;
  }

  const repeated = recordHooCollectionCapture(state, new Date(2026, 5, 13, 8, 0));

  equal(repeated.capturedCharacter?.id, 'collection-32-dazed-snowflake-alt');
  equal(repeated.isNewCapture, false);
  equal(repeated.state.captures['collection-32-dazed-snowflake-alt']?.captureCount, 2);
});

test('getHooCollectionSummary and view items expose captured, recent, and empty image state', () => {
  let state = createInitialHooCollectionState();
  state = recordHooCollectionCapture(state, new Date('2026-06-12T01:00:00.000Z')).state;
  state = recordHooCollectionCapture(state, new Date('2026-06-12T02:00:00.000Z')).state;

  deepEqual(getHooCollectionSummary(state), {
    capturedCount: 2,
    totalCount: HOO_COLLECTION_TOTAL,
    recentCharacterId: 'collection-02-sparrow',
  });

  const items = getHooCollectionViewItems(state).slice(0, 3);

  deepEqual(
    items.map((item) => ({
      id: item.character.id,
      captured: item.captured,
      selectedImageKey: item.selectedImageKey,
    })),
    [
      { id: 'collection-01-butterfly', captured: true, selectedImageKey: 'hoo-collection-01-butterfly' },
      { id: 'collection-02-sparrow', captured: true, selectedImageKey: 'hoo-collection-02-sparrow' },
      { id: 'collection-03-rainbow-jellyfish', captured: false, selectedImageKey: 'hoo-collection-empty-03-rainbow-jellyfish' },
    ],
  );
});
