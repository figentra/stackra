/**
 * Stackra file contract:
 * Purpose: `useRecurrenceEditorState(props, locale, numerals)`, the state every runtime's RecurrenceEditor shares: the
 *          rule (controlled `RRULE` text or its own), the first day's defaults, the changes the controls make
 *          (frequency, interval, weekdays, monthly by day or by nth weekday, never / until / count) and the summary
 *          sentence. Text it cannot read starts from the default: every week on the first day's weekday.
 * Boundary: a React hook with no rendering; the runtimes draw the controls. The value written is always `rruleOf`'s.
 *           The web and native RecurrenceEditor both use it.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.3.10; RFC 7529; ADR 0302 (decision 3); STA-1371.
 */
import { getLocalTimeZone, today, type CalendarDate } from "@internationalized/date";
import type { NumberingSystem } from "@stackra/i18n";
import { useState } from "react";

import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";
import type { RecurrenceEditorContractProps } from "#contracts/types/recurrence-editor-contract-props.type";
import type { RecurrenceRule } from "#contracts/types/recurrence-rule.type";
import { parseRrule } from "#core/functions/parse-rrule.function";
import { recurrenceAnchorOf } from "#core/functions/recurrence-anchor-of.function";
import { recurrenceSummaryOf } from "#core/functions/recurrence-summary-of.function";
import { recurrenceWithFrequency } from "#core/functions/recurrence-with-frequency.function";
import { rruleOf } from "#core/functions/rrule-of.function";
import { toGregorian } from "#core/functions/to-gregorian.function";
import type { RecurrenceAnchor } from "#core/types/recurrence-anchor.type";
import { useUiText } from "#react/hooks/use-ui-text";

/** How many times a rule ends after when the reader first picks "after". */
const DEFAULT_COUNT = 10;

/** The rule in `text`, or `undefined` when there is none or it cannot be read. */
function readRule(text: string | undefined): RecurrenceRule | undefined {
  return text === undefined ? undefined : parseRrule(text);
}

/** The shared recurrence editor state. */
export function useRecurrenceEditorState(
  { value, defaultValue, onChange, startDate, calendar = "gregory" }: RecurrenceEditorContractProps,
  locale: string,
  numerals?: NumberingSystem,
): {
  readonly rule: RecurrenceRule;
  readonly start: CalendarDate;
  readonly anchor: RecurrenceAnchor;
  readonly calendar: CalendarSystem;
  readonly summary: string;
  readonly monthly: "day" | "nth";
  readonly end: "never" | "until" | "count";
  readonly set: (next: RecurrenceRule) => void;
  readonly setFrequency: (frequency: RecurrenceRule["frequency"]) => void;
  readonly setMonthly: (mode: "day" | "nth") => void;
  readonly setEnd: (mode: "never" | "until" | "count") => void;
} {
  const t = useUiText();
  const start = startDate ?? today(getLocalTimeZone());
  const firstCalendar = readRule(value ?? defaultValue)?.calendar ?? calendar;
  const anchor = recurrenceAnchorOf(start, firstCalendar);
  const initial: RecurrenceRule = {
    frequency: "weekly",
    weekdays: [anchor.weekday],
    ...(calendar === "gregory" ? {} : { calendar }),
  };
  const [own, setOwn] = useState<RecurrenceRule>(() => readRule(defaultValue) ?? initial);
  const rule = (value === undefined ? undefined : readRule(value)) ?? own;

  const set = (next: RecurrenceRule) => {
    setOwn(next);
    onChange?.(rruleOf(next));
  };
  const { count: _count, until: _until, ...open } = rule;
  return {
    rule,
    start,
    anchor,
    calendar: rule.calendar ?? "gregory",
    summary: recurrenceSummaryOf(rule, t, locale, numerals),
    monthly: rule.nth === undefined ? "day" : "nth",
    end: rule.count !== undefined ? "count" : rule.until ? "until" : "never",
    set,
    setFrequency: (frequency) => set(recurrenceWithFrequency(rule, frequency, anchor)),
    setMonthly: (mode) => {
      const { weekdays: _weekdays, nth: _nth, monthDay: _monthDay, ...rest } = rule;
      set(
        mode === "nth"
          ? { ...rest, weekdays: [anchor.weekday], nth: anchor.nth }
          : { ...rest, monthDay: anchor.monthDay },
      );
    },
    setEnd: (mode) => {
      if (mode === "never") set(open);
      // The first end date offered is three months after the first day.
      else if (mode === "until")
        set({ ...open, until: toGregorian(start.add({ months: 3 })).toString() });
      else set({ ...open, count: DEFAULT_COUNT });
    },
  };
}
