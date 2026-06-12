import { equal, ok } from 'node:assert/strict';
import { test } from 'node:test';

import { HOO_ENCOURAGEMENTS, pickHooEncouragement } from './hooEncouragement.ts';

test('there is a pool of encouragements to vary each session', () => {
  ok(HOO_ENCOURAGEMENTS.length >= 8);
  // 모든 메시지는 비어 있지 않다.
  ok(HOO_ENCOURAGEMENTS.every((message) => message.trim().length > 0));
});

test('pickHooEncouragement maps the random range across the whole pool', () => {
  equal(pickHooEncouragement(0), HOO_ENCOURAGEMENTS[0]);
  equal(pickHooEncouragement(0.999999), HOO_ENCOURAGEMENTS[HOO_ENCOURAGEMENTS.length - 1]);
  // 항상 풀 안의 실제 메시지를 돌려준다.
  ok(HOO_ENCOURAGEMENTS.includes(pickHooEncouragement(0.5)));
});

test('pickHooEncouragement is safe with out-of-range or NaN input', () => {
  ok(HOO_ENCOURAGEMENTS.includes(pickHooEncouragement(-1)));
  ok(HOO_ENCOURAGEMENTS.includes(pickHooEncouragement(2)));
  ok(HOO_ENCOURAGEMENTS.includes(pickHooEncouragement(Number.NaN)));
});

test('pickHooEncouragement avoids repeating the previous message', () => {
  const previous = HOO_ENCOURAGEMENTS[3];
  // 0.999... 이라도 같은 인덱스에 걸리면 한 칸 비켜 다른 말을 준다.
  const landingOnSame = 3 / HOO_ENCOURAGEMENTS.length + 0.0001;
  const result = pickHooEncouragement(landingOnSame, previous);
  ok(result !== previous);
  ok(HOO_ENCOURAGEMENTS.includes(result));
});
