import parse from 'parse-duration';
import {
  AtTimeBudget,
  DisruptionBudget,
  DisruptionReason,
  NormalizedDisruptionReason,
} from '../types/karpenter';
import { describeCronSchedule } from './cronParser';
import { CronExpressionParser } from 'cron-parser';
import { addMinutes, isWithinInterval } from 'date-fns';

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

/**
 * Determines which budgets are active at a specific datetime
 *
 * @param budgets - Array of disruption budgets
 * @param datetime - The specific datetime to check for
 * @returns Array of active budgets with their reasons
 */
export function calculateAtTimeBudgets(
  budgets: DisruptionBudget[],
  datetime: Date
): AtTimeBudget[] {
  const affected = getActiveBudgets(budgets, datetime);

  return (
    [
      {
        reason: 'drifted',
        nodesOrPercentage: getMinimumNodes(affected, 'drifted'),
      },
      {
        reason: 'empty',
        nodesOrPercentage: getMinimumNodes(affected, 'empty'),
      },
      {
        reason: 'underutilized',
        nodesOrPercentage: getMinimumNodes(affected, 'underutilized'),
      },
    ].filter(atTimeBudget => atTimeBudget.nodesOrPercentage !== '') || []
  );
}

/**
 * return active budgets at the datetime
 *
 * @param budgets - Array of disruption budgets
 * @param datetime - The specific datetime to check for
 * @returns Array of active budgets
 */
function getActiveBudgets(
  budgets: DisruptionBudget[],
  datetime: Date
): DisruptionBudget[] {
  return budgets.filter(budget => isBudgetActive(budget, datetime));
}

/**
 * return the budgets by reason
 *
 * @param budgets - Array of disruption budgets
 * @param reason - The specific reason to get budgets for
 * @returns Array of budgets
 */
function getBudgetsByReason(
  budgets: DisruptionBudget[],
  reason: NormalizedDisruptionReason
): DisruptionBudget[] {
  return budgets.filter(
    budget => !budget.reasons || budget.reasons?.includes(reason)
  );
}

/**
 * return whether the budget is activated at the datetime
 *
 * @param budgets - Array of disruption budgets
 * @param datetime - The specific datetime to check for
 * @returns Array of active budgets
 */
function isBudgetActive(budget: DisruptionBudget, datetime: Date): boolean {
  if (!budget.schedule) return true;

  try {
    const interval = CronExpressionParser.parse(budget.schedule, {
      currentDate: datetime,
      tz: 'UTC',
    });

    const start = interval.prev().toDate();
    const duration = parse(budget.duration, 'm') || 0;
    const end = addMinutes(start, duration);

    return isWithinInterval(datetime, { start, end });
  } catch (error) {
    console.error('Error parsing schedule:', error);
    return false;
  }
}

/**
 * return minimum nodes for budgets
 *
 * @param budgets - Array of disruption budgets
 * @param reason - The specific reason to get minimum nodes for
 * @returns minimum nodes for budgets
 */
export function getMinimumNodes(
  budgets: DisruptionBudget[],
  reason: NormalizedDisruptionReason
): string {
  const reasonBudgets = getBudgetsByReason(budgets, reason);

  // filter the budget with node is percentage
  const percentageBudgets = reasonBudgets.filter(budget =>
    budget.nodes.endsWith('%')
  );
  // get the minimum node percentage
  const percentageNodes = percentageBudgets.map(budget =>
    parseFloat(budget.nodes.replace('%', ''))
  );
  const minNodePercentage =
    percentageNodes.length > 0
      ? Math.min(...percentageNodes).toString() + '%'
      : '';

  // filter the budget with node is integer
  const integerBudgets = reasonBudgets.filter(
    budget => !budget.nodes.endsWith('%')
  );
  // get the minimum node
  const integerNodes = integerBudgets.map(budget => parseInt(budget.nodes));
  const minIntegerNode =
    integerNodes.length > 0 ? Math.min(...integerNodes).toString() : '';

  return [minIntegerNode, minNodePercentage].filter(Boolean).join(' or ');
}
