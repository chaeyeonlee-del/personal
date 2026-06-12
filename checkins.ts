import { isGuestUserId } from './localUser.ts';

export type DailyCheckIn = {
  date: string;
  completed: true;
  completedAt: string;
};

export type SessionRecord = {
  record_id: string;
  user_id: string;
  session_id: string;
  session_name: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  completed: true;
};

export type SessionRecordInput = {
  session: {
    id: string;
    title: string;
    destination: string;
    durationMinutes: number;
  };
  userId: string;
  startedAt: Date;
  completedAt?: Date;
};

export type WeeklyRecordSummary = {
  completedCount: number;
  totalDurationSeconds: number;
};

export type WeekCheckInDay = {
  date: string;
  weekday: string;
  completed: boolean;
  isToday: boolean;
};

export const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function markDailyCheckIn(records: DailyCheckIn[], completedAt = new Date()): DailyCheckIn[] {
  const completedRecord: DailyCheckIn = {
    date: toLocalDateKey(completedAt),
    completed: true,
    completedAt: completedAt.toISOString(),
  };
  const remainingRecords = records.filter((record) => record.date !== completedRecord.date);

  return [...remainingRecords, completedRecord].sort((left, right) => left.date.localeCompare(right.date));
}

export function createSessionRecord({
  session,
  userId,
  startedAt,
  completedAt = new Date(),
}: SessionRecordInput): SessionRecord {
  const completedAtIso = completedAt.toISOString();

  return {
    record_id: `${userId}-${session.id}-${completedAtIso}`,
    user_id: userId,
    session_id: session.id,
    session_name: session.destination,
    started_at: startedAt.toISOString(),
    completed_at: completedAtIso,
    duration_seconds: session.durationMinutes * 60,
    completed: true,
  };
}

export function sortSessionRecordsNewestFirst(records: SessionRecord[]): SessionRecord[] {
  return [...records].sort((left, right) => right.completed_at.localeCompare(left.completed_at));
}

export function moveSessionRecordsToUser(records: SessionRecord[], nextUserId: string): SessionRecord[] {
  return records.map((record) => ({
    ...record,
    record_id: `${nextUserId}-${record.session_id}-${record.completed_at}`,
    user_id: nextUserId,
  }));
}

export function prepareSignedInSessionRecords(records: SessionRecord[], nextUserId: string) {
  const guestRecords = records.filter((record) => isGuestUserId(record.user_id));
  const existingRecords = records.filter((record) => !isGuestUserId(record.user_id));
  const migratedRecords = moveSessionRecordsToUser(guestRecords, nextUserId);
  const nextRecords = sortSessionRecordsNewestFirst([...existingRecords, ...migratedRecords]);

  return {
    records: nextRecords,
    recordsToSync: nextRecords.filter((record) => record.user_id === nextUserId),
  };
}

export function getWeeklyRecordSummary(records: SessionRecord[], today = new Date()): WeeklyRecordSummary {
  const weekStart = new Date(today);
  const weekEnd = new Date(today);
  const mondayOffset = (today.getDay() + 6) % 7;

  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(today.getDate() - mondayOffset);
  weekEnd.setTime(weekStart.getTime());
  weekEnd.setDate(weekStart.getDate() + 7);

  return records.reduce(
    (summary, record) => {
      const completedAt = new Date(record.completed_at);

      if (record.completed && completedAt >= weekStart && completedAt < weekEnd) {
        return {
          completedCount: summary.completedCount + 1,
          totalDurationSeconds: summary.totalDurationSeconds + record.duration_seconds,
        };
      }

      return summary;
    },
    { completedCount: 0, totalDurationSeconds: 0 },
  );
}

export function getWeekCheckIns(records: DailyCheckIn[], today = new Date()): WeekCheckInDay[] {
  const todayKey = toLocalDateKey(today);
  const completedDates = new Set(records.filter((record) => record.completed).map((record) => record.date));
  const weekStart = new Date(today);
  const mondayOffset = (today.getDay() + 6) % 7;

  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(today.getDate() - mondayOffset);

  return weekdayLabels.map((weekday, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const dateKey = toLocalDateKey(date);

    return {
      date: dateKey,
      weekday,
      completed: completedDates.has(dateKey),
      isToday: dateKey === todayKey,
    };
  });
}

export function getCurrentStreak(records: DailyCheckIn[], today = new Date()) {
  const completedDates = new Set(records.filter((record) => record.completed).map((record) => record.date));
  const todayKey = toLocalDateKey(today);
  const cursor = new Date(today);
  let streak = 0;

  cursor.setHours(0, 0, 0, 0);

  if (!completedDates.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (completedDates.has(toLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
