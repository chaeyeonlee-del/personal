import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';

import {
  createSessionRecord,
  getCurrentStreak,
  getWeekCheckIns,
  getWeeklyRecordSummary,
  markDailyCheckIn,
  moveSessionRecordsToUser,
  prepareSignedInSessionRecords,
  sortSessionRecordsNewestFirst,
  toLocalDateKey,
  weekdayLabels,
  type DailyCheckIn,
  type SessionRecord,
} from './checkins.ts';

test('toLocalDateKey formats the local calendar date', () => {
  equal(toLocalDateKey(new Date(2026, 4, 22, 21, 10)), '2026-05-22');
});

test('markDailyCheckIn stores one completed mark per day', () => {
  const first = new Date(2026, 4, 22, 8, 10);
  const second = new Date(2026, 4, 22, 21, 10);

  const records = markDailyCheckIn(markDailyCheckIn([], first), second);

  deepEqual(records, [
    {
      date: '2026-05-22',
      completed: true,
      completedAt: second.toISOString(),
    },
  ]);
});

test('getWeekCheckIns returns Monday-first weekday marks', () => {
  const records: DailyCheckIn[] = [
    {
      date: '2026-05-18',
      completed: true,
      completedAt: new Date(2026, 4, 18, 9, 0).toISOString(),
    },
    {
      date: '2026-05-22',
      completed: true,
      completedAt: new Date(2026, 4, 22, 21, 10).toISOString(),
    },
  ];

  const week = getWeekCheckIns(records, new Date(2026, 4, 22, 12, 0));

  deepEqual(week.map((day) => day.weekday), weekdayLabels);
  deepEqual(
    week.map((day) => day.completed),
    [true, false, false, false, true, false, false],
  );
  deepEqual(
    week.map((day) => day.date),
    [
      '2026-05-18',
      '2026-05-19',
      '2026-05-20',
      '2026-05-21',
      '2026-05-22',
      '2026-05-23',
      '2026-05-24',
    ],
  );
  equal(week[4].isToday, true);
});

test('getCurrentStreak counts consecutive daily check-ins', () => {
  const records: DailyCheckIn[] = [
    {
      date: '2026-05-20',
      completed: true,
      completedAt: new Date(2026, 4, 20, 9, 0).toISOString(),
    },
    {
      date: '2026-05-21',
      completed: true,
      completedAt: new Date(2026, 4, 21, 9, 0).toISOString(),
    },
    {
      date: '2026-05-22',
      completed: true,
      completedAt: new Date(2026, 4, 22, 9, 0).toISOString(),
    },
  ];

  equal(getCurrentStreak(records, new Date(2026, 4, 22, 12, 0)), 3);
});

test('getCurrentStreak keeps yesterday streak alive before today is completed', () => {
  const records: DailyCheckIn[] = [
    {
      date: '2026-05-20',
      completed: true,
      completedAt: new Date(2026, 4, 20, 9, 0).toISOString(),
    },
    {
      date: '2026-05-21',
      completed: true,
      completedAt: new Date(2026, 4, 21, 9, 0).toISOString(),
    },
  ];

  equal(getCurrentStreak(records, new Date(2026, 4, 22, 8, 0)), 2);
});

test('getCurrentStreak resets after a missed day', () => {
  const records: DailyCheckIn[] = [
    {
      date: '2026-05-20',
      completed: true,
      completedAt: new Date(2026, 4, 20, 9, 0).toISOString(),
    },
  ];

  equal(getCurrentStreak(records, new Date(2026, 4, 22, 8, 0)), 0);
});

test('createSessionRecord captures the completed session details', () => {
  const startedAt = new Date(2026, 4, 22, 20, 0);
  const completedAt = new Date(2026, 4, 22, 20, 3);

  const record = createSessionRecord({
    session: {
      id: 'korea-rain',
      title: 'For when anxiety spikes',
      destination: 'Korea Rain',
      durationMinutes: 3,
    },
    userId: 'guest',
    startedAt,
    completedAt,
  });

  deepEqual(record, {
    record_id: 'guest-korea-rain-2026-05-22T11:03:00.000Z',
    user_id: 'guest',
    session_id: 'korea-rain',
    session_name: 'Korea Rain',
    started_at: startedAt.toISOString(),
    completed_at: completedAt.toISOString(),
    duration_seconds: 180,
    completed: true,
  });
});

test('getWeeklyRecordSummary counts completed records in the current week', () => {
  const records: SessionRecord[] = [
    {
      record_id: 'old',
      user_id: 'guest',
      session_id: 'korea-rain',
      session_name: 'Korea Rain',
      started_at: new Date(2026, 4, 15, 20, 0).toISOString(),
      completed_at: new Date(2026, 4, 15, 20, 3).toISOString(),
      duration_seconds: 180,
      completed: true,
    },
    {
      record_id: 'this-week-1',
      user_id: 'guest',
      session_id: 'korea-rain',
      session_name: 'Korea Rain',
      started_at: new Date(2026, 4, 18, 8, 0).toISOString(),
      completed_at: new Date(2026, 4, 18, 8, 3).toISOString(),
      duration_seconds: 180,
      completed: true,
    },
    {
      record_id: 'this-week-2',
      user_id: 'guest',
      session_id: 'iceland-water',
      session_name: 'Iceland Water',
      started_at: new Date(2026, 4, 22, 21, 0).toISOString(),
      completed_at: new Date(2026, 4, 22, 21, 5).toISOString(),
      duration_seconds: 300,
      completed: true,
    },
  ];

  deepEqual(getWeeklyRecordSummary(records, new Date(2026, 4, 22, 12, 0)), {
    completedCount: 2,
    totalDurationSeconds: 480,
  });
});

test('sortSessionRecordsNewestFirst returns latest completions first', () => {
  const records: SessionRecord[] = [
    {
      record_id: 'older',
      user_id: 'guest',
      session_id: 'korea-rain',
      session_name: 'Korea Rain',
      started_at: new Date(2026, 4, 21, 8, 0).toISOString(),
      completed_at: new Date(2026, 4, 21, 8, 3).toISOString(),
      duration_seconds: 180,
      completed: true,
    },
    {
      record_id: 'newer',
      user_id: 'guest',
      session_id: 'iceland-water',
      session_name: 'Iceland Water',
      started_at: new Date(2026, 4, 22, 8, 0).toISOString(),
      completed_at: new Date(2026, 4, 22, 8, 5).toISOString(),
      duration_seconds: 300,
      completed: true,
    },
  ];

  deepEqual(
    sortSessionRecordsNewestFirst(records).map((record) => record.record_id),
    ['newer', 'older'],
  );
});

test('moveSessionRecordsToUser rewrites ownership while preserving session details', () => {
  const records: SessionRecord[] = [
    {
      record_id: 'guest-0000000000-korea-rain-2026-05-22T11:03:00.000Z',
      user_id: 'guest-0000000000',
      session_id: 'korea-rain',
      session_name: 'Korea Rain',
      started_at: new Date(2026, 4, 22, 20, 0).toISOString(),
      completed_at: '2026-05-22T11:03:00.000Z',
      duration_seconds: 180,
      completed: true,
    },
  ];

  deepEqual(moveSessionRecordsToUser(records, 'user-123'), [
    {
      ...records[0],
      record_id: 'user-123-korea-rain-2026-05-22T11:03:00.000Z',
      user_id: 'user-123',
    },
  ]);
});

test('prepareSignedInSessionRecords migrates guests and queues existing user records for sync', () => {
  const guestRecord: SessionRecord = {
    record_id: 'guest-0000000000-korea-rain-2026-05-22T11:03:00.000Z',
    user_id: 'guest-0000000000',
    session_id: 'korea-rain',
    session_name: 'Korea Rain',
    started_at: '2026-05-22T11:00:00.000Z',
    completed_at: '2026-05-22T11:03:00.000Z',
    duration_seconds: 180,
    completed: true,
  };
  const existingUserRecord: SessionRecord = {
    record_id: 'user-123-iceland-water-2026-05-23T11:05:00.000Z',
    user_id: 'user-123',
    session_id: 'iceland-water',
    session_name: 'Iceland Water',
    started_at: '2026-05-23T11:00:00.000Z',
    completed_at: '2026-05-23T11:05:00.000Z',
    duration_seconds: 300,
    completed: true,
  };
  const otherUserRecord: SessionRecord = {
    record_id: 'user-456-korea-rain-2026-05-21T11:03:00.000Z',
    user_id: 'user-456',
    session_id: 'korea-rain',
    session_name: 'Korea Rain',
    started_at: '2026-05-21T11:00:00.000Z',
    completed_at: '2026-05-21T11:03:00.000Z',
    duration_seconds: 180,
    completed: true,
  };

  const result = prepareSignedInSessionRecords(
    [guestRecord, existingUserRecord, otherUserRecord],
    'user-123',
  );

  deepEqual(result.records.map((record) => record.record_id), [
    'user-123-iceland-water-2026-05-23T11:05:00.000Z',
    'user-123-korea-rain-2026-05-22T11:03:00.000Z',
    'user-456-korea-rain-2026-05-21T11:03:00.000Z',
  ]);
  deepEqual(result.recordsToSync.map((record) => record.record_id), [
    'user-123-iceland-water-2026-05-23T11:05:00.000Z',
    'user-123-korea-rain-2026-05-22T11:03:00.000Z',
  ]);
});
