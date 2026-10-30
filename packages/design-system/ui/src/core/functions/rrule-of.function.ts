/**
 * Stackra file contract:
 * Purpose: `rruleOf(rule)`, a `RecurrenceRule` written as RFC 5545 `RRULE` text (without the `RRULE:` prefix):
 *          `RSCALE` first for a non-Gregorian calendar (RFC 7529), then `FREQ`, `INTERVAL` above 1, `BYMONTH`, `BYDAY`
 *          (with the nth prefix of a monthly or yearly rule), `BYMONTHDAY`, and `COUNT` or `UNTIL`.
 * Boundary: pure; it writes what it is given and checks nothing, `parseRrule` is the reader that refuses bad text.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.3.10; RFC 7529 section 4.1; STA-1371.
 */
import type { RecurrenceRule } from "#contracts/types/recurrence-rule.type";

/**
 * The rule as `RRULE` text.
 * @param rule - the rule
 * @returns the text, for example `FREQ=WEEKLY;BYDAY=SU,WE;COUNT=10`
 */
export function rruleOf(rule: RecurrenceRule): string {
  const parts: string[] = [];
  if (rule.calendar && rule.calendar !== "gregory")
    parts.push(`RSCALE=${rule.calendar.toUpperCase()}`);
  parts.push(`FREQ=${rule.frequency.toUpperCase()}`);
  if (rule.interval !== undefined && rule.interval > 1) parts.push(`INTERVAL=${rule.interval}`);
  if (rule.month !== undefined) parts.push(`BYMONTH=${rule.month}`);
  if (rule.weekdays?.length) {
    const nth = rule.nth !== undefined && rule.frequency !== "weekly" ? String(rule.nth) : "";
    parts.push(`BYDAY=${rule.weekdays.map((day) => `${nth}${day}`).join(",")}`);
  }
  if (rule.monthDay !== undefined) parts.push(`BYMONTHDAY=${rule.monthDay}`);
  if (rule.count !== undefined) parts.push(`COUNT=${rule.count}`);
  else if (rule.until) parts.push(`UNTIL=${rule.until.replaceAll("-", "")}`);
  return parts.join(";");
}
