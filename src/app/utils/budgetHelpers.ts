import parse from 'parse-duration';
import { DisruptionBudget } from '../types/karpenter';
import { describeCronSchedule } from './cronParser';
import { sort } from 'rrule/dist/esm/dateutil';

export function describeBudget(budget: DisruptionBudget): string {
  const { nodes, schedule, duration } = budget;
  let description = '';

  // Node description
  if (nodes === '0') {
    description += 'No disruptions allowed';
  } else {
    description += `Max disruptions: ${nodes}`;
  }

  // Reasons
  description += ` for ${generateLocation(budget)}`;

  // Schedule
  if (schedule) {
    const scheduleDescription = describeCronSchedule(schedule);
    description += ` ${scheduleDescription}`;
  }

  // Duration
  if (duration) {
    const minutes = parse(duration, 'm') || 0;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;

    let durationStr = '';
    if (hours > 0) {
      durationStr += `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    if (remainingMins > 0) {
      if (durationStr) durationStr += ' and ';
      durationStr += `${remainingMins} minute${remainingMins > 1 ? 's' : ''}`;
    }

    description += ` for ${durationStr}`;
  }

  return description;
}

export function humanReadableBudget(budget: DisruptionBudget): string {
  let result = '';

  // Check if this is a blocking budget (nodes=0)
  if (budget.nodes === '0') {
    result = 'BLOCKS';

    // Add specific reasons if provided
    if (budget.reasons && budget.reasons.length > 0) {
      result += ` ${budget.reasons.join(', ')}`;
    } else {
      result += ' ALL';
    }

    result += ' disruptions';

    // Add schedule if provided
    if (budget.schedule) {
      result += ` ${describeCronSchedule(budget.schedule)}`;
    }

    // Add duration if provided
    if (budget.duration) {
      const minutes = parse(budget.duration, 'm') || 0;
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;

      result += ' for ';
      if (hours > 0) {
        result += `${hours}h`;
      }
      if (remainingMins > 0) {
        result += `${remainingMins}m`;
      }
    }
  } else {
    // For non-blocking budgets
    result = `ALLOWS up to ${budget.nodes} disruptions`;

    // Add specific reasons if provided
    if (budget.reasons && budget.reasons.length > 0) {
      result += ` for ${budget.reasons.join(', ')}`;
    }
  }

  return result;
}

// for debugging
export function generateLocation(budget: DisruptionBudget): string {
  if (!budget.reasons) return 'All';
  const reasonString = budget.reasons
    .map(
      reason => reason.charAt(0).toUpperCase() + reason.slice(1).toLowerCase()
    )
    .sort()
    .join(', ');
  if (reasonString === 'Drifted, Empty, Underutilized') {
    return 'All';
  }
  return reasonString;
}

export function generateCalendarId(budget: DisruptionBudget): string {
  if (!budget.reasons) return 'all';
  const calendarId = budget.reasons
    .map(reason => reason.toLowerCase())
    .sort()
    .join('-');

  if (calendarId == 'drifted-empty-underutilized') {
    return 'all';
  }

  return calendarId;
}
