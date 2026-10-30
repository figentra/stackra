/**
 * Stackra file contract:
 * Purpose: the native `RecurrenceEditor`: the web editor's controls on HeroUI Native: "Repeat every [n] [unit]", the
 *          weekdays of a weekly rule as toggle buttons in the locale's week order, a monthly rule by day or by nth
 *          weekday, how it ends, and the rule in one sentence. With `calendar="islamic-umalqura"`, months count in the
 *          Hijri calendar (RFC 7529 `RSCALE`) and the end date shows Hijri days.
 * Boundary: shares its state with the web editor (`useRecurrenceEditorState`); the controls are the house native
 *           fields. A group named by `label`; the sentence is a polite live region. Row direction follows the
 *           layout direction, so it mirrors in Arabic. The end date stays Gregorian whatever the calendar shown.
 * Runtime: react-native
 * Governing contract: RFC 5545 section 3.3.10; RFC 7529; ADR 0302 (decision 3); ADR 0060; STA-1371.
 */
import { parseDate } from "@internationalized/date";
import { useNumerals } from "@stackra/i18n/react";
import type { ReactElement } from "react";
import { View } from "react-native";

import type { RecurrenceRule } from "#contracts/types/recurrence-rule.type";
import type { RecurrenceWeekday } from "#contracts/types/recurrence-weekday.type";
import { RECURRENCE_EDITOR_KEYS } from "#core/constants/recurrence-editor-keys.constant";
import { RECURRENCE_WEEKDAYS } from "#core/constants/recurrence-weekdays.constant";
import { recurrenceWeekdaysFor } from "#core/functions/recurrence-weekdays-for.function";
import { weekdayNameOf } from "#core/functions/weekday-name-of.function";
import { useRecurrenceEditorState } from "#react/hooks/use-recurrence-editor-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { DatePicker } from "#native/date-picker/date-picker";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { useNumberFormat } from "#native/hooks/use-number-format";
import { NumberField } from "#native/number-field/number-field";
import { RadioGroup } from "#native/radio-group/radio-group";
import type { RecurrenceEditorProps } from "#native/recurrence-editor/recurrence-editor.props";
import { Select } from "#native/select/select";
import { Text } from "#native/text/text";
import { ToggleButton } from "#native/toggle-button/toggle-button";
import { ToggleButtonGroup } from "#native/toggle-button-group/toggle-button-group";

/** The editor's keys. */
const K = RECURRENCE_EDITOR_KEYS.ui.recurrence_editor;

/** The frequencies, in the order offered. */
const FREQUENCIES = ["daily", "weekly", "monthly", "yearly"] as const;

/** A recurring rule, edited in plain controls. */
export function RecurrenceEditor(props: RecurrenceEditorProps): ReactElement {
  const { label, isDisabled, className } = props;
  const t = useUiText();
  const { locale } = useDesignSystem();
  const numerals = useNumerals();
  const format = useNumberFormat();
  const state = useRecurrenceEditorState(props, locale, numerals);
  const { rule, anchor, set } = state;
  const interval = rule.interval ?? 1;
  const short = (day: RecurrenceWeekday) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(
      Date.UTC(2024, 0, 1 + RECURRENCE_WEEKDAYS.indexOf(day)),
    );
  const name = label ?? t(K.label);

  return (
    <View accessibilityRole="none" accessibilityLabel={name} className={`gap-4 ${className ?? ""}`}>
      <Text className="font-medium">{name}</Text>
      <View className="flex-row flex-wrap items-end gap-3">
        <NumberField
          label={t(K.every)}
          // Room for the two step buttons and three digits: at w-28 the input between them had no width left.
          className="w-40"
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
          // The unit reads on from the number's label ("Repeat every 2 weeks"), as on the web: no second visible label.
          accessibilityLabel={t(K.every)}
          className="min-w-36 flex-1 self-end"
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
      </View>
      {rule.frequency === "weekly" ? (
        <View className="gap-1.5">
          <Text type="small" tone="muted">
            {t(K.weekdays)}
          </Text>
          <ToggleButtonGroup
            accessibilityLabel={t(K.weekdays)}
            selectionMode="multiple"
            isDisabled={isDisabled}
            className="flex-wrap"
            selectedKeys={rule.weekdays ?? []}
            onSelectionChange={(keys) => {
              // At least one day stays picked: a weekly rule with none would fall back to the first day's.
              const days = recurrenceWeekdaysFor(locale).filter((day) => keys.has(day));
              if (days.length) set({ ...rule, weekdays: days });
            }}
          >
            {recurrenceWeekdaysFor(locale).map((day) => (
              <ToggleButton key={day} id={day} label={weekdayNameOf(day, locale)}>
                {short(day)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </View>
      ) : null}
      {rule.frequency === "monthly" ? (
        <RadioGroup
          label={t(K.monthly)}
          value={state.monthly}
          isDisabled={isDisabled}
          onChange={(next) => state.setMonthly(next === "nth" ? "nth" : "day")}
          options={[
            { value: "day", label: t(K.day_option, { day: format(anchor.monthDay) }) },
            {
              value: "nth",
              label: t(K.nth_option, {
                nth: String(anchor.nth),
                weekday: weekdayNameOf(anchor.weekday, locale),
              }),
            },
          ]}
        />
      ) : null}
      <View className="gap-3">
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
      </View>
      <View
        accessibilityLiveRegion="polite"
        className="rounded-[var(--radius-container)] bg-default px-3 py-2"
      >
        <Text type="small">
          <Text type="small" tone="muted">{`${t(K.summary)}: `}</Text>
          {state.summary}
        </Text>
      </View>
    </View>
  );
}
