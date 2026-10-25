/**
 * Stackra file contract:
 * Purpose: `parseCron`, a five-field cron expression read into the values it matches: minute, hour, day of the month,
 *          month and day of the week, each a `*`, a value, a range `a-b`, a step `/n` on either, or a list of them;
 *          months and days of the week also by their English three-letter names, and 7 as Sunday.
 * Boundary: pure. The classic five fields only: no seconds, no macros (`@daily`), no `?`, `L`, `W` or `#`, the same
 *           shape `Action({ job: { cron } })` checks. Written here rather than taken from croner, which no catalog
 *           carries (ADR 0148 decision 4 names croner; the parser is the small part of it this package needs).
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 4); ADR 0305 (rule 28: the `job.cron` sub-option).
 */
import { InvalidCronError } from "#core/errors/invalid-cron.error";
import type { CronFields } from "#core/types/cron-fields.type";

/** One field: its name in a refusal, its range, and the names its values may take (the index plus `offset`). */
interface FieldSpec {
  readonly name: string;
  readonly min: number;
  readonly max: number;
  readonly names?: readonly string[];
  readonly offset?: number;
}

const MINUTE: FieldSpec = { name: "minute", min: 0, max: 59 };
const HOUR: FieldSpec = { name: "hour", min: 0, max: 23 };
const DAY: FieldSpec = { name: "day", min: 1, max: 31 };
const MONTH: FieldSpec = {
  name: "month",
  min: 1,
  max: 12,
  names: ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
  offset: 1,
};
const WEEKDAY: FieldSpec = {
  name: "weekday",
  min: 0,
  max: 7,
  names: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
  offset: 0,
};

/** A value or a step: one or two digits. */
const NUMBER = /^\d{1,2}$/;

/** The value `text` names in `spec`, or `undefined`. */
function valueOf(text: string, spec: FieldSpec): number | undefined {
  if (NUMBER.test(text)) return Number(text);
  const index = spec.names?.indexOf(text.toLowerCase()) ?? -1;
  return index === -1 ? undefined : index + (spec.offset ?? 0);
}

/** The values one field matches, or `undefined` when it is not valid; Sunday as 7 folds to 0. */
function parseField(text: string, spec: FieldSpec): ReadonlySet<number> | undefined {
  const values = new Set<number>();
  for (const part of text.split(",")) {
    const [range = "", step, extra] = part.split("/");
    if (extra !== undefined) return undefined;
    const every = step === undefined ? 1 : NUMBER.test(step) ? Number(step) : 0;
    if (every < 1) return undefined;
    let from: number | undefined = spec.min;
    let to: number | undefined = spec.max;
    if (range !== "*") {
      const [low = "", high, more] = range.split("-");
      if (more !== undefined) return undefined;
      from = valueOf(low, spec);
      // `5/15` runs from 5 to the end of the range; a lone `5` is just 5.
      to = high === undefined ? (step === undefined ? from : spec.max) : valueOf(high, spec);
    }
    if (from === undefined || to === undefined || from < spec.min || to > spec.max || from > to)
      return undefined;
    for (let value = from; value <= to; value += every)
      values.add(spec === WEEKDAY && value === 7 ? 0 : value);
  }
  return values;
}

/**
 * The values `expression` matches.
 *
 * @throws InvalidCronError when it is not five valid fields; `field` names the first that failed.
 * @example
 * parseCron("*\/5 * * * *").minutes; // Set {0, 5, 10, …, 55}
 * parseCron("30 3 * * mon-fri").weekdays; // Set {1, 2, 3, 4, 5}
 */
export function parseCron(expression: string): CronFields {
  const texts = expression.trim().split(/\s+/);
  if (texts.length !== 5) throw InvalidCronError.create({ expression, field: "expression" });
  const read = (text: string | undefined, spec: FieldSpec): ReadonlySet<number> => {
    const values = text === undefined ? undefined : parseField(text, spec);
    if (values === undefined) throw InvalidCronError.create({ expression, field: spec.name });
    return values;
  };
  const [minute, hour, day, month, weekday] = texts;
  return Object.freeze({
    minutes: read(minute, MINUTE),
    hours: read(hour, HOUR),
    days: read(day, DAY),
    months: read(month, MONTH),
    weekdays: read(weekday, WEEKDAY),
    anyDay: day?.startsWith("*") === true,
    anyWeekday: weekday?.startsWith("*") === true,
  });
}
