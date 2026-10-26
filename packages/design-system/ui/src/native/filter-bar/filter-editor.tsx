/**
 * Stackra file contract:
 * Purpose: the native editor a filter opens in its sheet: one editor per `FilterKind`, each returning a `FilterValue`
 *          of its kind, on the same contract as the web editor. Text is a `TextField`, a number is two `NumberField`s
 *          (minimum and maximum, each with the phone's number pad), a choice is a `RadioGroup`, several choices are a
 *          `CheckboxGroup` (reported in the order the options are listed), a date range is two `DateField`s (each opening
 *          the platform picker) and a boolean is a `RadioGroup` of yes and no.
 * Boundary: internal to `FilterBar`, not in the `./native` barrel. It holds no state: it shows the value it is given and
 *           reports each change whole, so the bar's query is the only copy (ADR 0318 decision 2). A value of the wrong
 *           shape shows as an empty editor. The fields are named for assistive technology by the filter's label (the
 *           sheet's title says it too) or by their own word; "Minimum", "Maximum", "From" and "Until" come from the `ui`
 *           catalogue in the active locale. It builds on NumberField and DateField, leaf groups of the same wave (ADR 0318
 *           decision 4), so this file needs both on the branch. Needs the native `DesignSystemProvider`, which holds the
 *           locale the yes and no words are written in.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decisions 3, 4 and 10); ADR 0055 (forms); ADR 0165 (HeroUI Native on
 *          native); WCAG 2.2 SC 1.3.1, 4.1.2.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#core/hooks/use-ui-text";
import type { ChoiceOption } from "#contracts/types/choice-option.type";
import type { FilterDefinition } from "#contracts/types/filter-definition.type";
import type { FilterValue } from "#contracts/types/filter-value.type";
import type { SelectItem } from "#contracts/types/select-item.type";
import { filterChipTextOf } from "#core/functions/filter-chip-text-of.function";
import { filterChipWordsOf } from "#core/functions/filter-chip-words-of.function";
import { filterValueOfKind } from "#core/functions/filter-value-of-kind.function";
import { CheckboxGroup } from "#native/checkbox-group/checkbox-group";
import { DateField } from "#native/date-field/date-field";
import { useDesignSystem } from "#native/design-system-provider/use-design-system";
import { NumberField } from "#native/number-field/number-field";
import { RadioGroup } from "#native/radio-group/radio-group";
import { TextField } from "#native/text-field/text-field";

/** Props of {@link FilterEditor}. */
export interface FilterEditorProps {
  /** The filter being edited; its kind picks the editor. */
  readonly definition: FilterDefinition;
  /** What the query holds for the filter, or `undefined` when it holds nothing. */
  readonly value: FilterValue | undefined;
  /** Called with the whole next value, or `undefined` to drop the filter. */
  readonly onChange: (value: FilterValue | undefined) => void;
}

/** The radios or checkboxes of a list of short choices. */
const choicesOf = (options: readonly SelectItem[]): readonly ChoiceOption[] =>
  options.map((option) => ({
    value: option.id,
    label: option.label,
    ...(option.description === undefined ? {} : { description: option.description }),
    ...(option.isDisabled === undefined ? {} : { isDisabled: option.isDisabled }),
  }));

/**
 * The editor of one filter. Every change is reported at once, so the list behind the sheet narrows while the user edits.
 */
export function FilterEditor({ definition, value, onChange }: FilterEditorProps): ReactElement {
  const t = useUiText();
  const WORDS = UI_KEYS.ui.filter_bar;
  const { locale } = useDesignSystem();
  switch (definition.kind) {
    case "text":
      return (
        <TextField
          accessibilityLabel={definition.label}
          value={filterValueOfKind("text", value) ?? ""}
          onChange={onChange}
          {...(definition.placeholder === undefined ? {} : { placeholder: definition.placeholder })}
        />
      );
    case "number": {
      const range = filterValueOfKind("number", value) ?? { min: null, max: null };
      const shared = {
        minValue: definition.minValue,
        maxValue: definition.maxValue,
        step: definition.step,
        formatOptions: definition.formatOptions,
      };
      return (
        <View className="gap-3">
          <NumberField
            {...shared}
            label={t(WORDS.minimum)}
            value={range.min}
            onChange={(min) => onChange({ ...range, min })}
          />
          <NumberField
            {...shared}
            label={t(WORDS.maximum)}
            value={range.max}
            onChange={(max) => onChange({ ...range, max })}
          />
        </View>
      );
    }
    case "select":
      return (
        <RadioGroup
          accessibilityLabel={definition.label}
          options={choicesOf(definition.options)}
          value={filterValueOfKind("select", value) ?? ""}
          onChange={onChange}
        />
      );
    case "multi-select":
      return (
        <CheckboxGroup
          accessibilityLabel={definition.label}
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
        <View className="gap-3">
          <DateField
            label={t(WORDS.from)}
            value={range.start}
            minValue={definition.minValue}
            maxValue={range.end ?? definition.maxValue}
            onChange={(start) => onChange({ ...range, start })}
          />
          <DateField
            label={t(WORDS.until)}
            value={range.end}
            minValue={range.start ?? definition.minValue}
            maxValue={definition.maxValue}
            onChange={(end) => onChange({ ...range, end })}
          />
        </View>
      );
    }
    case "boolean": {
      const answer = filterValueOfKind("boolean", value);
      return (
        <RadioGroup
          accessibilityLabel={definition.label}
          options={[
            {
              value: "true",
              label: filterChipTextOf(definition, true, locale, filterChipWordsOf(t)),
            },
            {
              value: "false",
              label: filterChipTextOf(definition, false, locale, filterChipWordsOf(t)),
            },
          ]}
          value={answer === undefined ? "" : String(answer)}
          onChange={(next) => onChange(next === "true")}
        />
      );
    }
  }
}
