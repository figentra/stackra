/**
 * Stackra file contract:
 * Purpose: the web `RecurrenceEditor`: builds an RFC 5545 `RRULE` from plain controls: "Repeat every [n] [days, weeks,
 *          months, years]"; the weekdays of a weekly rule as toggle buttons in the locale's week order; for a monthly
 *          rule "on day 14" or "on the second Tuesday", both taken from the first day; and how it ends (never, on a
 *          date, after a number of times). Under them, the rule in one sentence. With `calendar="islamic-umalqura"`,
 *          months count in the Hijri calendar (RFC 7529 `RSCALE`) and the end date's picker shows Hijri days.
 * Boundary: a group named by `label` ("Repeat"); every control is the house field (NumberField, Select,
 *           ToggleButtonGroup, RadioGroup, DatePicker) on React Aria, so keyboard and screen reader behaviour are
 *           theirs. The sentence is a polite live region. Logical properties only, so it mirrors in Arabic. The value
 *           is always written by `rruleOf`; the end date stays Gregorian whatever the calendar shown.
 * Runtime: browser
 * Governing contract: RFC 5545 section 3.3.10; RFC 7529; ADR 0302 (decision 3); ADR 0060; WCAG 2.2 SC 1.3.1, 4.1.3;
 *          STA-1371 (owner request 2026-10-29).
 */
import { cn, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { useNumerals } from "@stackra/i18n/react";
import { useId, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import type { RecurrenceRule } from "#contracts/types/recurrence-rule.type";
import type { RecurrenceWeekday } from "#contracts/types/recurrence-weekday.type";
import { RECURRENCE_EDITOR_KEYS } from "#core/constants/recurrence-editor-keys.constant";
import { RECURRENCE_WEEKDAYS } from "#core/constants/recurrence-weekdays.constant";
import { recurrenceWeekdaysFor } from "#core/functions/recurrence-weekdays-for.function";
import { weekdayNameOf } from "#core/functions/weekday-name-of.function";
import { DatePicker } from "#react/date-picker/date-picker";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { useRecurrenceEditorState } from "#react/hooks/use-recurrence-editor-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { NumberField } from "#react/number-field/number-field";
import { RadioGroup } from "#react/radio-group/radio-group";
import type { RecurrenceEditorProps } from "#react/recurrence-editor/recurrence-editor.props";
import { Select } from "#react/select/select";
import { Text } from "#react/text/text";

/** The editor's keys. */
const K = RECURRENCE_EDITOR_KEYS.ui.recurrence_editor;

/** The frequencies, in the order offered. */
const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;

/** A recurring rule, edited in plain controls. */
export function RecurrenceEditor(props: RecurrenceEditorProps): ReactElement {
  const { label, isDisabled, className } = props;
  const t = useUiText();
  const { locale } = useLocale();
  const numerals = useNumerals();
  const format = useNumberFormat();
  const state = useRecurrenceEditorState(props, locale, numerals);
  const { rule, anchor, set } = state;
  const interval = rule.interval ?? 1;
  const titleId = useId();
  const short = (day: RecurrenceWeekday) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(
      Date.UTC(2024, 0, 1 + RECURRENCE_WEEKDAYS.indexOf(day)),
    );
  const nthLabel = t(K.nth_option, {
    nth: String(anchor.nth),
    weekday: weekdayNameOf(anchor.weekday, locale),
  });

  return (
    <div
      role="group"
      aria-labelledby={titleId}
      data-slot="recurrence-editor"
      className={cn("grid gap-4", className)}
    >
      <Text id={titleId} className="font-medium">
        {label ?? t(K.label)}
      </Text>
      <div className="flex flex-wrap items-end gap-3">
        <NumberField
          label={t(K.every)}
          className="w-28"
          minValue={1}
          maxValue={999}
          value={interval}
          isDisabled={isDisabled}
          onChange={(next) => {
            const { interval: _interval, ...rest } = rule;
            set(next !== null && next > 1 ? { ...rest, interval: next } : rest);
          }}
        />
        <Select
          aria-label={t(K.every)}
          className="min-w-36"
          value={rule.frequency}
          isDisabled={isDisabled}
          items={FREQUENCIES.map((unit) => ({
            id: unit,
            label: t(K.unit, { unit, count: interval }),
          }))}
          onChange={(next) => {
            if (next) state.setFrequency(next as RecurrenceRule["frequency"]);
          }}
        />
      </div>
      {rule.frequency === "weekly" ? (
        <div className="grid gap-1.5">
          <Text type="small" tone="muted">
            {t(K.weekdays)}
          </Text>
          <ToggleButtonGroup
            aria-label={t(K.weekdays)}
            selectionMode="multiple"
            isDisabled={isDisabled ?? false}
            className="flex-wrap"
            selectedKeys={rule.weekdays ?? []}
            onSelectionChange={(keys) => {
              // At least one day stays picked: a weekly rule with none would fall back to the first day's.
              const days = recurrenceWeekdaysFor(locale).filter((day) => keys.has(day));
              if (days.length) set({ ...rule, weekdays: days });
            }}
          >
            {recurrenceWeekdaysFor(locale).map((day) => (
              <ToggleButton key={day} id={day}>
                {/* The full day is the name from the content; an aria-label of "Sunday" over a shown "Sun" fails WCAG 2.5.3. */}
                <span aria-hidden="true">{short(day)}</span>
                <span className="sr-only">{weekdayNameOf(day, locale)}</span>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      ) : null}
      {rule.frequency === "monthly" ? (
        <RadioGroup
          label={t(K.monthly)}
          value={state.monthly}
          isDisabled={isDisabled}
          onChange={(next) => state.setMonthly(next === "nth" ? "nth" : "day")}
          options={[
            { value: "day", label: t(K.day_option, { day: format(anchor.monthDay) }) },
            { value: "nth", label: nthLabel },
          ]}
        />
      ) : null}
      <div className="grid gap-3">
        <RadioGroup
          label={t(K.ends)}
          value={state.end}
          isDisabled={isDisabled}
          onChange={(next) =>
            state.setEnd(next === "until" ? "until" : next === "count" ? "count" : "never")
          }
          options={[
            { value: "never", label: t(K.never) },
            { value: "until", label: t(K.until_label) },
            { value: "count", label: t(K.count_label) },
          ]}
        />
        {state.end === "until" && rule.until ? (
          <DatePicker
            label={t(K.end_date)}
            className="max-w-xs"
            calendar={state.calendar}
            isDisabled={isDisabled}
            minValue={state.start}
            value={parseDate(rule.until)}
            onChange={(date) => {
              if (date) set({ ...rule, until: date.toString() });
            }}
          />
        ) : null}
        {state.end === "count" ? (
          <NumberField
            label={t(K.occurrences)}
            className="w-32"
            minValue={1}
            maxValue={9999}
            value={rule.count ?? 1}
            isDisabled={isDisabled}
            onChange={(next) => {
              if (next !== null && next >= 1) set({ ...rule, count: next });
            }}
          />
        ) : null}
      </div>
      <p
        aria-live="polite"
        data-slot="recurrence-summary"
        className="m-0 rounded-[var(--radius-control)] bg-default px-3 py-2 text-sm text-foreground"
      >
        <span className="text-muted">{`${t(K.summary)}: `}</span>
        {state.summary}
      </p>
    </div>
  );
}
