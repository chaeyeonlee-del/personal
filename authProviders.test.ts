import { deepEqual, equal, throws } from 'node:assert/strict';
import { test } from 'node:test';

import {
  createSignedInConnection,
  getPreviewAuthConnection,
  isSupabaseAuthUserId,
} from './authProviders.ts';

test('createSignedInConnection normalizes a provider session for app auth state', () => {
  const createdAt = new Date('2026-05-27T04:30:00.000Z');

  deepEqual(
    createSignedInConnection({
      accessToken: 'session-token',
      createdAt,
      email: 'user@example.com',
      provider: 'apple',
      userId: '7f8ed8aa-9b69-47d5-a18d-2f8a8d1d5f17',
    }),
    {
      accessToken: 'session-token',
      authState: {
        status: 'signed-in',
        user: {
          auth_provider: 'apple',
          created_at: '2026-05-27T04:30:00.000Z',
          email: 'user@example.com',
          user_id: '7f8ed8aa-9b69-47d5-a18d-2f8a8d1d5f17',
        },
      },
    },
  );
});

test('getPreviewAuthConnection reads provider-specific preview users first', () => {
  const createdAt = new Date('2026-05-27T04:30:00.000Z');

  const apple = getPreviewAuthConnection(
    'apple',
    {
      EXPO_PUBLIC_APPLE_AUTH_PREVIEW_USER_ID: '1b93ba10-44f8-4a75-a38d-b6f9fc45f951',
      EXPO_PUBLIC_AUTH_PREVIEW_EMAIL: 'apple@example.com',
      EXPO_PUBLIC_AUTH_PREVIEW_USER_ID: '00000000-0000-4000-8000-000000000000',
    },
    createdAt,
  );
  const google = getPreviewAuthConnection(
    'google',
    {
      EXPO_PUBLIC_AUTH_PREVIEW_USER_ID: '00000000-0000-4000-8000-000000000000',
      EXPO_PUBLIC_GOOGLE_AUTH_PREVIEW_USER_ID: '0a2a8658-841a-4f17-9805-f7df55f7fa90',
    },
    createdAt,
  );

  equal(apple?.authState.user.user_id, '1b93ba10-44f8-4a75-a38d-b6f9fc45f951');
  equal(apple?.authState.user.email, 'apple@example.com');
  equal(google?.authState.user.user_id, '0a2a8658-841a-4f17-9805-f7df55f7fa90');
});

test('getPreviewAuthConnection returns null without preview user env', () => {
  equal(getPreviewAuthConnection('apple', {}), null);
});

test('isSupabaseAuthUserId accepts Supabase auth UUIDs only', () => {
  equal(isSupabaseAuthUserId('7f8ed8aa-9b69-47d5-a18d-2f8a8d1d5f17'), true);
  equal(isSupabaseAuthUserId('apple-user'), false);
  equal(isSupabaseAuthUserId('google-user'), false);
  equal(isSupabaseAuthUserId(undefined), false);
});

test('createSignedInConnection rejects provider-only user ids', () => {
  throws(
    () =>
      createSignedInConnection({
        provider: 'google',
        userId: 'google-user',
      }),
    /Supabase auth UUID/,
  );
});

test('getPreviewAuthConnection returns null for non-Supabase preview user ids', () => {
  equal(
    getPreviewAuthConnection('apple', {
      EXPO_PUBLIC_APPLE_AUTH_PREVIEW_USER_ID: 'apple-user',
      EXPO_PUBLIC_AUTH_PREVIEW_USER_ID: '00000000-0000-4000-8000-000000000000',
    }),
    null,
  );
  equal(
    getPreviewAuthConnection('google', {
      EXPO_PUBLIC_AUTH_PREVIEW_USER_ID: 'google-user',
    }),
    null,
  );
});
