/**
 * Stackra file contract:
 * Purpose: the web editor a filter chip opens in its popover: one editor per `FilterKind`, each returning a
 *          `FilterValue` of its kind. Text is a `TextField`, a number is two `NumberField`s (minimum and maximum), a
 *          choice is a `RadioGroup`, several choices are a `CheckboxGroup` (reported in the order the options are
 *          listed), a date range is two `DateField`s (from and until) and a boolean is a `RadioGroup` of yes and no.
 * Boundary: internal to `FilterBar`, not in the `./react` barrel. It holds no state: it shows the value it is given and
 *           reports each change whole, so the bar's query is the only copy (ADR 0318 decision 2). A value of the wrong
 *           shape shows as an empty editor. Fields are named by the filter's label (a group) or by their own word, and
 *           the popover's title names the dialog. The words "Minimum", "Maximum", "From" and "Until" come from the `ui`
 *           catalogue in the active locale. It builds on NumberField and DateField, which are leaf groups of the same wave
 *           (ADR 0318 decision 4), so this file needs both on the branch.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decisions 3 and 4); ADR 0055 (forms); WCAG 2.2 SC 1.3.1, 2.1.1,
 *          4.1.2.
 */
import type { ReactElement } from "react";
import { useLocale } from "react-aria-components";

import { booleanFilterChoicesOf } from "#core/functions/boolean-filter-choices-of.function";
import { choiceOptionsOf } from "#core/functions/choice-options-of.function";
import { listedOptionIdsOf } from "#core/functions/listed-option-ids-of.function";
import { filterValueOfKind } from "#core/functions/filter-value-of-kind.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { CheckboxGroup } from "#react/checkbox-group/checkbox-group";
import { DateField } from "#react/date-field/date-field";
import { NumberField } from "#react/number-field/number-field";
import { RadioGroup } from "#react/radio-group/radio-group";
import { TextField } from "#react/text-field/text-field";
import type { FilterEditorProps } from "#react/filter-bar/filter-editor.props";

/**
 * The editor of one filter. Every change is reported at once, so the table behind it narrows while the user edits.
 */
export function FilterEditor({ definition, value, onChange }: FilterEditorProps): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();
  switch (definition.kind) {
    case "text": {
      return (
        <TextField
          aria-label={definition.label}
          // oxlint-disable-next-line jsx-a11y/no-autofocus -- reason: the editor opens in a popover the user just asked for; its field takes the focus
          autoFocus
          value={filterValueOfKind("text", value) ?? ""}
          onChange={onChange}
          {...(definition.placeholder === undefined ? {} : { placeholder: definition.placeholder })}
        />
      );
    }
    case "number": {
      const range = filterValueOfKind("number", value) ?? { min: null, max: null };
      const shared = { step: definition.step, formatOptions: definition.formatOptions };
      // Each bound limits the other, as the day range's do, so the range never runs backwards.
      return (
        <div className="grid gap-3">
          <NumberField
            {...shared}
            label={t(UI_KEYS.ui.filter_bar.minimum)}
            value={range.min}
            minValue={definition.minValue}
            maxValue={range.max ?? definition.maxValue}
            onChange={(min) => onChange({ ...range, min })}
          />
          <NumberField
            {...shared}
            label={t(UI_KEYS.ui.filter_bar.maximum)}
            value={range.max}
            minValue={range.min ?? definition.minValue}
            maxValue={definition.maxValue}
            onChange={(max) => onChange({ ...range, max })}
          />
        </div>
      );
    }
    case "select": {
      return (
        <RadioGroup
          aria-label={definition.label}
          options={choiceOptionsOf(definition.options)}
          value={filterValueOfKind("select", value) ?? ""}
          onChange={onChange}
        />
      );
    }
    case "multi-select": {
      return (
        <CheckboxGroup
          aria-label={definition.label}
          options={choiceOptionsOf(definition.options)}
          value={filterValueOfKind("multi-select", value) ?? []}
          // Reported in the order the options are listed, not the order they were ticked, so the value is stable.
          onChange={(chosen) => onChange(listedOptionIdsOf(definition.options, chosen))}
        />
      );
    }
    case "date-range": {
      const range = filterValueOfKind("date-range", value) ?? { start: null, end: null };
      return (
        <div className="grid gap-3">
          <DateField
            label={t(UI_KEYS.ui.filter_bar.from)}
            value={range.start}
            minValue={definition.minValue}
            maxValue={range.end ?? definition.maxValue}
            onChange={(start) => onChange({ ...range, start })}
          />
          <DateField
            label={t(UI_KEYS.ui.filter_bar.until)}
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
          options={booleanFilterChoicesOf(definition, locale, t)}
          value={answer === undefined ? "" : String(answer)}
          onChange={(next) => onChange(next === "true")}
        />
      );
    }
  }
}
