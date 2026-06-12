import { deepEqual, equal } from 'node:assert/strict';
import { test } from 'node:test';

import { addMinutesToRoutineTime, createRoutineReminder, formatRoutineTime } from './routineReminder.ts';

test('createRoutineReminder uses the completion time as the daily routine time', () => {
  const completedAt = new Date(2026, 4, 22, 21, 7);

  deepEqual(createRoutineReminder(completedAt), {
    enabled: true,
    hour: 21,
    minute: 7,
    frequency: 'daily',
    created_at: completedAt.toISOString(),
  });
});

test('formatRoutineTime displays a simple local clock time', () => {
  equal(formatRoutineTime({ hour: 9, minute: 5 }), '09:05');
  equal(formatRoutineTime({ hour: 21, minute: 7 }), '21:07');
});

test('addMinutesToRoutineTime adjusts time across day boundaries', () => {
  deepEqual(addMinutesToRoutineTime({ hour: 23, minute: 55 }, 10), { hour: 0, minute: 5 });
  deepEqual(addMinutesToRoutineTime({ hour: 0, minute: 5 }, -10), { hour: 23, minute: 55 });
});
