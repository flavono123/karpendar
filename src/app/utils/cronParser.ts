import { CronExpressionParser } from 'cron-parser';
import {
  addMinutes,
  differenceInMinutes,
  endOfDay,
  startOfDay,
} from 'date-fns';
import cronstrue from 'cronstrue';
import { DisruptionBudget } from '../types/karpenter';
import {
  CalendarEvent,
  toDateString,
  toDateTimeString,
} from '@schedule-x/calendar';
import parse from 'parse-duration';
import {
  describeBudget,
  generateCalendarId,
  generateLocation,
} from './budgetHelpers';

/**
 * generate rrule events from the disruption budgets
 * @param budget - The disruption budget to generate events for
 * @param index - The index of the budget in NodePool
 * @returns An array of CalendarEvent objects
 */
export function generateEventsFromBudget(
  budget: DisruptionBudget,
  index: number,
  range: {
    start: Date;
    end: Date;
  }
): CalendarEvent[] {
  // edge1:
  if (!budget) return [];

  const id = `budget-${index}`;
  const calendarId = generateCalendarId(budget);
  const title = `[${index}]:${budget.nodes} for ${generateLocation(budget)}`;
  // const people = [budget.nodes];
  // const location = generateLocation(budget);
  const startDate = range.start;
  const endDate = range.end;
  const description = describeBudget(budget);

  const infiniteEvent = {
    id,
    title,
    // HACK: for day view as an infinite event
    // people,
    // location,
    start: toDateString(addMinutes(startDate, -1)),
    end: toDateString(addMinutes(endDate, 1)),
    description,
    calendarId,
  };
  // edge2: for all time budget(without a schedule and a duration)
  if (!budget.schedule) return [infiniteEvent];
  if (!validateSchedule(budget.schedule)) return [];
  const duration = parse(budget.duration, 'm') || 0;
  const cronInterval = getCronInterval(budget.schedule);

  // edge3: duration is over the schedule interval(naive)
  if (duration > cronInterval) return [infiniteEvent];

  const events: CalendarEvent[] = [];

  const nextInterval = CronExpressionParser.parse(budget.schedule);
  const prevInterval = CronExpressionParser.parse(budget.schedule);

  // For next occurrences (forward iteration)
  for (const next of nextInterval) {
    if (next.toDate() > endDate) break;
    events.push(
      ...eventsByDuration(
        id,
        title,
        description,
        next.toDate(),
        addMinutes(next.toDate(), duration),
        duration,
        calendarId
        // people,
        // location
      )
    );
  }

  // For previous occurrences (backward iteration)
  let prev = prevInterval.prev();
  while (prev && prev.toDate() > startDate) {
    events.push(
      ...eventsByDuration(
        id,
        title,
        description,
        prev.toDate(),
        addMinutes(prev.toDate(), duration),
        duration,
        calendarId
        // people,
        // location
      )
    );
    prev = prevInterval.prev();
  }

  return events;
}

/**
 * return events by duration
 * @param id - The id of events
 * @param title - The title of events
 * @param start - The start date
 * @param end - The end date
 * @param duration - The duration of the event
 * @returns An array of CalendarEvent objects
 */
function eventsByDuration(
  id: string,
  title: string,
  description: string,
  start: Date,
  end: Date,
  duration: number,
  calendarId: string,
  people?: string[],
  location?: string
): CalendarEvent[] {
  // if duration is under 24h and start, end is in different date, split first and second
  // first from start to end of the start date, and second from 'start of' end and end of duration
  if (duration < 24 * 60 && start.getDate() !== end.getDate()) {
    const first = {
      id,
      title,
      start: toDateTimeString(start),
      end: toDateTimeString(endOfDay(start)),
      description,
      calendarId,
      people,
      location,
    };
    const second = {
      id,
      title,
      start: toDateTimeString(startOfDay(end)),
      end: toDateTimeString(end),
      description,
      calendarId,
      people,
      location,
    };
    return [first, second];
  } else {
    return [
      {
        id,
        title,
        start: toDateTimeString(start),
        end: toDateTimeString(end),
        description,
        calendarId,
        people,
        location,
      },
    ];
  }
}
/**
 * get the 'naive' cron interval
 * @param schedule - The disruption budget to generate events for
 * @returns the cron interval in minutes
 */
function getCronInterval(schedule: string): number {
  const interval = CronExpressionParser.parse(schedule);
  // negate from next minus to next next occurrence
  return -differenceInMinutes(
    interval.next().toDate(),
    interval.next().toDate()
  );
}

/**
 * validate a schedule of budget as cron expression
 * @param schedule - The schedule to validate
 * @returns true if the schedule is valid, false otherwise
 */
function validateSchedule(schedule: string): boolean {
  try {
    CronExpressionParser.parse(schedule);
    return true;
  } catch (error) {
    console.error(`Error parsing schedule: ${schedule}`, error);
    return false;
  }
}

// Get a human-readable description of a cron schedule
export function describeCronSchedule(schedule: string): string {
  if (!schedule) return '';

  try {
    return cronstrue.toString(schedule);
  } catch (error) {
    return `Invalid schedule: ${schedule}`;
  }
}
