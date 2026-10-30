/**
 * Stackra file contract:
 * Purpose: `recurrenceWithFrequency(rule, frequency, anchor)`, the rule moved to another frequency: it keeps its
 *          interval, end and calendar, keeps its weekdays when it stays weekly, and takes the rest from the first day
 *          (a weekly rule its weekday, a monthly one its day of the month, a yearly one its month and day).
 * Boundary: pure; the web and native editors call it when the frequency changes.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.3.10; STA-1371.
 */
import type { RecurrenceRule } from "#contracts/types/recurrence-rule.type";
import type { RecurrenceAnchor } from "#core/types/recurrence-anchor.type";

/**
 * The rule at a new frequency.
 * @param rule - the rule now
 * @param frequency - the new frequency
 * @param anchor - the first day's defaults
 * @returns the new rule
 */
export function recurrenceWithFrequency(
  rule: RecurrenceRule,
  frequency: RecurrenceRule["frequency"],
  anchor: RecurrenceAnchor,
): RecurrenceRule {
  const kept: RecurrenceRule = {
    frequency,
    ...(rule.interval === undefined ? {} : { interval: rule.interval }),
    ...(rule.count === undefined ? {} : { count: rule.count }),
    ...(rule.until === undefined ? {} : { until: rule.until }),
    ...(rule.calendar === undefined ? {} : { calendar: rule.calendar }),
  };
  if (frequency === "weekly") {
    const isWeekly = rule.frequency === "weekly" && rule.weekdays?.length;
    return { ...kept, weekdays: isWeekly ? (rule.weekdays ?? []) : [anchor.weekday] };
  }
  if (frequency === "monthly") return { ...kept, monthDay: anchor.monthDay };
  if (frequency === "yearly") return { ...kept, month: anchor.month, monthDay: anchor.monthDay };
  return kept;
}
