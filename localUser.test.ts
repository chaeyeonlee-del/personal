import { equal } from 'node:assert/strict';
import { test } from 'node:test';

import { createGuestUserId, isGuestUserId } from './localUser.ts';

test('createGuestUserId creates a stable guest-prefixed id shape', () => {
  equal(createGuestUserId(() => 0), 'guest-0000000000');
  equal(isGuestUserId(createGuestUserId(() => 0.5)), true);
});

test('isGuestUserId rejects missing or malformed values', () => {
  equal(isGuestUserId(null), false);
  equal(isGuestUserId('guest'), false);
  equal(isGuestUserId('user-0000000000'), false);
});
