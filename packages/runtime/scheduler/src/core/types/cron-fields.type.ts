/**
 * Stackra file contract:
 * Purpose: `CronFields`, a parsed five-field cron expression: the minutes, hours, days of the month, months and days
 *          of the week it matches, and whether each day field was written as `*`.
 * Boundary: a type only; `parseCron` builds it and `cronRuns` reads it. The two `any*` flags keep the classic cron
 *           day rule: when both day fields are restricted, a day matches when either does.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 4); ADR 0305 (rule 28: the `job.cron` sub-option).
 */

/** The values a cron expression matches. */
export interface CronFields {
  /** Minutes, 0 to 59. */
  readonly minutes: ReadonlySet<number>;

  /** Hours, 0 to 23. */
  readonly hours: ReadonlySet<number>;

  /** Days of the month, 1 to 31. */
  readonly days: ReadonlySet<number>;

  /** Months, 1 to 12. */
  readonly months: ReadonlySet<number>;

  /** Days of the week, 0 (Sunday) to 6. */
  readonly weekdays: ReadonlySet<number>;

  /** The day-of-month field starts with `*`. */
  readonly anyDay: boolean;

  /** The day-of-week field starts with `*`. */
  readonly anyWeekday: boolean;
}
