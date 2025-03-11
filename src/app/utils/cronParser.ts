import {CronExpressionParser} from 'cron-parser';
import { addMinutes } from 'date-fns';
import cronstrue from 'cronstrue';
import { DisruptionBudget, CalendarEvent } from '../types/karpenter';

// Parse a duration string like "10m" or "24h" into minutes
export function parseDuration(duration: string): number {
  if (!duration) return 0;

  const value = parseInt(duration.slice(0, -1));
  const unit = duration.slice(-1);

  switch (unit) {
    case 'm': return value; // minutes
    case 'h': return value * 60; // hours to minutes
    case 'd': return value * 24 * 60; // days to minutes
    default: return 0;
  }
}

// Convert special macros to cron expressions
function expandMacro(schedule: string): string {
  switch (schedule) {
    case '@yearly':
    case '@annually': return '0 0 1 1 *';
    case '@monthly': return '0 0 1 * *';
    case '@weekly': return '0 0 * * 0';
    case '@daily': return '0 0 * * *';
    case '@hourly': return '0 * * * *';
    default: return schedule;
  }
}

// Parse a cron expression and generate events for the given date range
export function generateEventsFromCron(
  budget: DisruptionBudget,
  startDate: Date,
  endDate: Date,
  daysToGenerate = 7
): CalendarEvent[] {
  if (!budget.schedule) return [];

  const events: CalendarEvent[] = [];
  const cronExpression = expandMacro(budget.schedule);

  try {
    const interval = CronExpressionParser.parse(cronExpression);
    const duration = parseDuration(budget.duration || '60m'); // Default to 60 minutes if not specified

    // Get the next N occurrences
    let nextDate = interval.next();
    let count = 0;

    while (count < 50 && nextDate.getTime() <= endDate.getTime()) {
      const start = new Date(nextDate.toString());
      const end = addMinutes(start, duration);

      // Create event
      const event: CalendarEvent = {
        id: `budget-${count}-${start.getTime()}`,
        title: budget.nodes === '0' ? 'No Disruptions Allowed' : `Disruptions: ${budget.nodes}`,
        start,
        end,
        resource: {
          reason: budget.reasons?.length === 1 ? budget.reasons[0] : 'All',
          nodes: budget.nodes,
          budget
        }
      };

      events.push(event);

      nextDate = interval.next();
      count++;
    }

    return events;
  } catch (error) {
    console.error('Error parsing cron expression:', error);
    return [];
  }
}

// Get a human-readable description of a cron schedule
export function describeCronSchedule(schedule: string): string {
  if (!schedule) return '';

  try {
    const expanded = expandMacro(schedule);
    return cronstrue.toString(expanded);
  } catch (error) {
    return `Invalid schedule: ${schedule}`;
  }
}
