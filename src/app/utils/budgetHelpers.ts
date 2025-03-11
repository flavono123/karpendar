import { DisruptionBudget, DisruptionReason } from "../types/karpenter";
import { describeCronSchedule, parseDuration } from "./cronParser";

export function describeBudget(budget: DisruptionBudget): string {
  const { nodes, reasons, schedule, duration } = budget;
  let description = '';

  // Node description
  if (nodes === '0') {
    description += 'No disruptions allowed';
  } else {
    description += `Max disruptions: ${nodes}`;
  }

  // Reasons
  if (reasons?.length) {
    const reasonsStr = reasons.join(', ');
    description += ` for ${reasonsStr}`;
  } else {
    description += ` for all reasons`;
  }

  // Schedule
  if (schedule) {
    const scheduleDescription = describeCronSchedule(schedule);
    description += ` ${scheduleDescription}`;
  }

  // Duration
  if (duration) {
    const minutes = parseDuration(duration);
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

export function shouldBlockDisruption(
  budgets: DisruptionBudget[],
  reason: DisruptionReason,
  currentTime: Date
): boolean {
  // Find budgets that apply to the given reason and time
  const applicableBudgets = budgets.filter(budget => {
    // If budget has no reasons specified, it applies to all
    const appliesToReason = !budget.reasons || budget.reasons.includes(reason);

    // If there's a schedule, check if it applies to the current time
    // This is simplified - a real implementation would need to check if the time
    // falls within any scheduled window based on the cron expression

    return appliesToReason;
  });

  // Check if any applicable budget has nodes=0 (blocks all disruptions)
  return applicableBudgets.some(budget => budget.nodes === '0');
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
      const minutes = parseDuration(budget.duration);
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
