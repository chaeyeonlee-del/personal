export type RoutineReminder = {
  enabled: true;
  hour: number;
  minute: number;
  frequency: 'daily';
  created_at: string;
  notification_id?: string;
};

export function createRoutineReminder(completedAt = new Date()): RoutineReminder {
  return {
    enabled: true,
    hour: completedAt.getHours(),
    minute: completedAt.getMinutes(),
    frequency: 'daily',
    created_at: completedAt.toISOString(),
  };
}

export function formatRoutineTime({ hour, minute }: Pick<RoutineReminder, 'hour' | 'minute'>) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function addMinutesToRoutineTime(
  time: Pick<RoutineReminder, 'hour' | 'minute'>,
  minutesToAdd: number,
) {
  const minutesPerDay = 24 * 60;
  const currentMinutes = time.hour * 60 + time.minute;
  const nextMinutes = (currentMinutes + minutesToAdd + minutesPerDay) % minutesPerDay;

  return {
    hour: Math.floor(nextMinutes / 60),
    minute: nextMinutes % 60,
  };
}
