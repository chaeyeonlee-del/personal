import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';

import {
  getSupabaseConfig,
  shouldSyncSessionRecord,
  syncSessionRecordsToSupabase,
  syncSessionRecordToSupabase,
  toSupabaseRecordRow,
} from './supabaseRecords.ts';
import type { SessionRecord } from './checkins.ts';

const record: SessionRecord = {
  record_id: 'user-123-korea-rain-2026-05-22T11:03:00.000Z',
  user_id: 'user-123',
  session_id: 'korea-rain',
  session_name: 'Korea Rain',
  started_at: '2026-05-22T11:00:00.000Z',
  completed_at: '2026-05-22T11:03:00.000Z',
  duration_seconds: 180,
  completed: true,
};

test('getSupabaseConfig reads Expo public env values', () => {
  deepEqual(
    getSupabaseConfig({
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon',
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
    }),
    {
      anonKey: 'anon',
      url: 'https://example.supabase.co',
    },
  );
});

test('getSupabaseConfig carries the runtime access token for signed-in writes', () => {
  deepEqual(
    getSupabaseConfig(
      {
        EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon',
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      },
      'session-token',
    ),
    {
      accessToken: 'session-token',
      anonKey: 'anon',
      url: 'https://example.supabase.co',
    },
  );
});

test('toSupabaseRecordRow maps the local record shape', () => {
  deepEqual(toSupabaseRecordRow(record), {
    completed: true,
    completed_at: '2026-05-22T11:03:00.000Z',
    duration_seconds: 180,
    record_id: 'user-123-korea-rain-2026-05-22T11:03:00.000Z',
    session_id: 'korea-rain',
    session_name: 'Korea Rain',
    started_at: '2026-05-22T11:00:00.000Z',
    user_id: 'user-123',
  });
});

test('shouldSyncSessionRecord skips local guest records', () => {
  equal(shouldSyncSessionRecord({ ...record, user_id: 'guest-0000000000' }), false);
  equal(shouldSyncSessionRecord(record), true);
});

test('syncSessionRecordToSupabase uses a signed-in access token when present', async () => {
  let requestUrl = '';
  let requestInit: RequestInit | undefined;
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    requestUrl = String(url);
    requestInit = init;
    return { ok: true } as Response;
  };

  const result = await syncSessionRecordToSupabase(
    record,
    { accessToken: 'session-token', anonKey: 'anon', url: 'https://example.supabase.co' },
    fetcher,
  );

  equal(result.status, 'synced');
  equal(requestUrl, 'https://example.supabase.co/rest/v1/session_records?on_conflict=record_id');
  equal(requestInit?.method, 'POST');
  equal(requestInit?.body, JSON.stringify(toSupabaseRecordRow(record)));
  equal((requestInit?.headers as Record<string, string>).Authorization, 'Bearer session-token');
  equal((requestInit?.headers as Record<string, string>).Prefer, 'resolution=merge-duplicates,return=minimal');
});

test('syncSessionRecordToSupabase waits for a signed-in access token before posting', async () => {
  const result = await syncSessionRecordToSupabase(
    record,
    { anonKey: 'anon', url: 'https://example.supabase.co' },
    async () => {
      throw new Error('fetch should not run without a signed-in access token');
    },
  );

  equal(result.status, 'missing-auth-token');
});

test('syncSessionRecordToSupabase does not post without config', async () => {
  const result = await syncSessionRecordToSupabase(record, {}, async () => {
    throw new Error('fetch should not run');
  });

  equal(result.status, 'missing-config');
});

test('syncSessionRecordsToSupabase summarizes batch sync results', async () => {
  const result = await syncSessionRecordsToSupabase(
    [
      record,
      { ...record, record_id: 'guest-record', user_id: 'guest-0000000000' },
    ],
    { accessToken: 'session-token', anonKey: 'anon', url: 'https://example.supabase.co' },
    async () => ({ ok: true }) as Response,
  );

  deepEqual(result, {
    errorCount: 0,
    missingAuthTokenCount: 0,
    missingConfigCount: 0,
    skippedGuestCount: 1,
    syncedCount: 1,
  });
});

test('syncSessionRecordsToSupabase summarizes records waiting for auth token', async () => {
  const result = await syncSessionRecordsToSupabase(
    [
      record,
      { ...record, record_id: 'guest-record', user_id: 'guest-0000000000' },
    ],
    { anonKey: 'anon', url: 'https://example.supabase.co' },
    async () => {
      throw new Error('fetch should not run without a signed-in access token');
    },
  );

  deepEqual(result, {
    errorCount: 0,
    missingAuthTokenCount: 1,
    missingConfigCount: 0,
    skippedGuestCount: 1,
    syncedCount: 0,
  });
});
