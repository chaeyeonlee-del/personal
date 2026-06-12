import type { SessionRecord } from './checkins';
import { isGuestUserId } from './localUser.ts';

type SupabaseConfig = {
  accessToken?: string;
  anonKey?: string;
  url?: string;
};

type SupabaseRecordRow = {
  completed: boolean;
  completed_at: string;
  duration_seconds: number;
  record_id: string;
  session_id: string;
  session_name: string;
  started_at: string;
  user_id: string;
};

export function getSupabaseConfig(env: Record<string, string | undefined> = {}, accessToken?: string) {
  const config: SupabaseConfig = {
    anonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    url: env.EXPO_PUBLIC_SUPABASE_URL,
  };

  if (accessToken) {
    config.accessToken = accessToken;
  }

  return config;
}

export function isSupabaseConfigured(config: SupabaseConfig) {
  return Boolean(config.url && config.anonKey);
}

export function shouldSyncSessionRecord(record: SessionRecord) {
  return !isGuestUserId(record.user_id);
}

export function toSupabaseRecordRow(record: SessionRecord): SupabaseRecordRow {
  return {
    completed: record.completed,
    completed_at: record.completed_at,
    duration_seconds: record.duration_seconds,
    record_id: record.record_id,
    session_id: record.session_id,
    session_name: record.session_name,
    started_at: record.started_at,
    user_id: record.user_id,
  };
}

export async function syncSessionRecordToSupabase(
  record: SessionRecord,
  config: SupabaseConfig,
  fetcher: typeof fetch = fetch,
) {
  if (!shouldSyncSessionRecord(record)) {
    return { status: 'skipped-guest' as const };
  }

  if (!isSupabaseConfigured(config)) {
    return { status: 'missing-config' as const };
  }

  if (!config.accessToken) {
    return { status: 'missing-auth-token' as const };
  }

  const response = await fetcher(`${config.url}/rest/v1/session_records?on_conflict=record_id`, {
    body: JSON.stringify(toSupabaseRecordRow(record)),
    headers: {
      apikey: config.anonKey ?? '',
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    method: 'POST',
  });

  if (!response.ok) {
    return { status: 'error' as const };
  }

  return { status: 'synced' as const };
}

export async function syncSessionRecordsToSupabase(
  records: SessionRecord[],
  config: SupabaseConfig,
  fetcher: typeof fetch = fetch,
) {
  const results = await Promise.all(
    records.map((record) => syncSessionRecordToSupabase(record, config, fetcher)),
  );

  return {
    errorCount: results.filter((result) => result.status === 'error').length,
    missingAuthTokenCount: results.filter((result) => result.status === 'missing-auth-token').length,
    missingConfigCount: results.filter((result) => result.status === 'missing-config').length,
    skippedGuestCount: results.filter((result) => result.status === 'skipped-guest').length,
    syncedCount: results.filter((result) => result.status === 'synced').length,
  };
}
