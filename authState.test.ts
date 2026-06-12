import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';

import {
  createGuestAuthState,
  createSignedInAuthState,
  isAuthState,
  shouldOfferLogin,
} from './authState.ts';

test('createGuestAuthState creates a guest auth state', () => {
  const createdAt = new Date(2026, 4, 22, 8, 0);

  deepEqual(createGuestAuthState('guest-0000000000', createdAt), {
    status: 'guest',
    user: {
      auth_provider: 'guest',
      created_at: createdAt.toISOString(),
      user_id: 'guest-0000000000',
    },
  });
});

test('createSignedInAuthState creates a provider auth state', () => {
  const createdAt = new Date(2026, 4, 22, 8, 0);

  deepEqual(
    createSignedInAuthState({
      createdAt,
      email: 'person@example.com',
      provider: 'apple',
      userId: 'user-123',
    }),
    {
      status: 'signed-in',
      user: {
        auth_provider: 'apple',
        created_at: createdAt.toISOString(),
        email: 'person@example.com',
        user_id: 'user-123',
      },
    },
  );
});

test('isAuthState validates persisted auth state shape', () => {
  equal(isAuthState(createGuestAuthState('guest-0000000000')), true);
  equal(isAuthState(createSignedInAuthState({ provider: 'google', userId: 'user-123' })), true);
  equal(isAuthState({ status: 'signed-in', user: { auth_provider: 'guest', created_at: 'now', user_id: 'guest' } }), false);
});

test('shouldOfferLogin returns true only for guest users', () => {
  equal(shouldOfferLogin(createGuestAuthState('guest-0000000000')), true);
  equal(shouldOfferLogin(createSignedInAuthState({ provider: 'google', userId: 'user-123' })), false);
});
