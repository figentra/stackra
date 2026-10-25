/**
 * Stackra file contract:
 * Purpose: the web editor a filter chip opens in its popover: one editor per `FilterKind`, each returning a
 *          `FilterValue` of its kind. Text is a `TextField`, a number is two `NumberField`s (minimum and maximum), a
 *          choice is a `RadioGroup`, several choices are a `CheckboxGroup` (reported in the order the options are
 *          listed), a date range is two `DateField`s (from and until) and a boolean is a `RadioGroup` of yes and no.
 * Boundary: internal to `FilterBar`, not in the `./react` barrel. It holds no state: it shows the value it is given and
 *           reports each change whole, so the bar's query is the only copy (ADR 0318 decision 2). A value of the wrong
 *           shape shows as an empty editor. Fields are named by the filter's label (a group) or by their own word, and
 *           the popover's title names the dialog. The words "Minimum", "Maximum", "From" and "Until" are English
 *           defaults until i18n ships. It builds on NumberField and DateField, which are leaf groups of the same wave
 *           (ADR 0318 decision 4), so this file needs both on the branch.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decisions 3 and 4); ADR 0055 (forms); WCAG 2.2 SC 1.3.1, 2.1.1,
 *          4.1.2.
 */
import type { ReactElement } from "react";
import { useLocale } from "react-aria-components";

import type { ChoiceOption } from "#contracts/types/choice-option.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { FilterValue } from "#contracts/types/filter-value.type";
import type { SelectItem } from "#contracts/types/select-item.type";
import { filterChipTextOf } from "#core/functions/filter-chip-text-of.function";
import { filterValueOfKind } from "#core/functions/filter-value-of-kind.function";
import { CheckboxGroup } from "#react/checkbox-group/checkbox-group";
import { DateField } from "#react/date-field/date-field";
import { NumberField } from "#react/number-field/number-field";
import { RadioGroup } from "#react/radio-group/radio-group";
import { TextField } from "#react/text-field/text-field";

/** Props of {@link FilterEditor}. */
export interface FilterEditorProps {
  /** The filter being edited; its kind picks the editor. */
  readonly definition: FilterDefinition;
  /** What the query holds for the filter, or `undefined` when it holds nothing. */
  readonly value: FilterValue | undefined;
  /** Called with the whole next value, or `undefined` to drop the filter. */
  readonly onChange: (value: FilterValue | undefined) => void;
}

// shortcut: English words until @stackra/i18n ships; then the keys `ui::filter-bar.*`.
const WORDS = { minimum: "Minimum", maximum: "Maximum", from: "From", until: "Until" } as const;

/** The radios or checkboxes of a list of short choices. */
const choicesOf = (options: readonly SelectItem[]): readonly ChoiceOption[] =>
  options.map((option) => ({
    value: option.id,
    label: option.label,
    ...(option.description === undefined ? {} : { description: option.description }),
    ...(option.isDisabled === undefined ? {} : { isDisabled: option.isDisabled }),
  }));

/**
 * The editor of one filter. Every change is reported at once, so the table behind it narrows while the user edits.
 */
export function FilterEditor({ definition, value, onChange }: FilterEditorProps): ReactElement {
  const { locale } = useLocale();
  switch (definition.kind) {
    case "text":
      return (
        <TextField
          aria-label={definition.label}
          autoFocus
          value={filterValueOfKind("text", value) ?? ""}
          onChange={onChange}
          {...(definition.placeholder === undefined ? {} : { placeholder: definition.placeholder })}
        />
      );
    case "number": {
      const range = filterValueOfKind("number", value) ?? { min: null, max: null };
      const shared = { step: definition.step, formatOptions: definition.formatOptions };
      // Each bound limits the other, as the day range's do, so the range never runs backwards.
      return (
        <div className="grid gap-3">
          <NumberField
            {...shared}
            label={WORDS.minimum}
            value={range.min}
            minValue={definition.minValue}
            maxValue={range.max ?? definition.maxValue}
            onChange={(min) => onChange({ ...range, min })}
          />
          <NumberField
            {...shared}
            label={WORDS.maximum}
            value={range.max}
            minValue={range.min ?? definition.minValue}
            maxValue={definition.maxValue}
            onChange={(max) => onChange({ ...range, max })}
          />
        </div>
      );
    }
    case "select":
      return (
        <RadioGroup
          aria-label={definition.label}
          options={choicesOf(definition.options)}
          value={filterValueOfKind("select", value) ?? ""}
          onChange={onChange}
        />
      );
    case "multi-select":
      return (
        <CheckboxGroup
          aria-label={definition.label}
          options={choicesOf(definition.options)}
          value={filterValueOfKind("multi-select", value) ?? []}
          // Reported in the order the options are listed, not the order they were ticked, so the value is stable.
          onChange={(chosen) =>
            onChange(
              definition.options.map((option) => option.id).filter((id) => chosen.includes(id)),
            )
          }
        />
      );
    case "date-range": {
      const range = filterValueOfKind("date-range", value) ?? { start: null, end: null };
      return (
        <div className="grid gap-3">
          <DateField
            label={WORDS.from}
            value={range.start}
            minValue={definition.minValue}
            maxValue={range.end ?? definition.maxValue}
            onChange={(start) => onChange({ ...range, start })}
          />
          <DateField
            label={WORDS.until}
            value={range.end}
            minValue={range.start ?? definition.minValue}
            maxValue={definition.maxValue}
            onChange={(end) => onChange({ ...range, end })}
          />
        </div>
      );
    }
    case "boolean": {
      const answer = filterValueOfKind("boolean", value);
      return (
        <RadioGroup
          aria-label={definition.label}
          options={[
            { value: "true", label: filterChipTextOf(definition, true, locale) },
            { value: "false", label: filterChipTextOf(definition, false, locale) },
          ]}
          value={answer === undefined ? "" : String(answer)}
          onChange={(next) => onChange(next === "true")}
        />
      );
    }
  }
}
