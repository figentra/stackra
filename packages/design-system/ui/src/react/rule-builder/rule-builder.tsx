/**
 * Stackra file contract:
 * Purpose: the web `RuleBuilder`: "all / any of these" over rows of field, operator and value (a text or number field,
 *          a select for one choice, tags for several, a date field for a day, two of them for a "between" range; none
 *          for "is empty" or a yes or no), each removable, and a button that adds one.
 * Boundary: controlled; every edit reports a whole new rule. Operators follow the field's type
 *           (`ruleOperatorsOf`); changing the field resets an operator it does not offer.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0505 (one filter model); WCAG 2.2 SC 1.3.1 and 2.4.6; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { Button } from "#react/button/button";
import { DateField } from "#react/date-field/date-field";
import { useRuleBuilderState } from "#react/hooks/use-rule-builder-state";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import type { RuleBuilderProps } from "#react/rule-builder/rule-builder.props";
import { Select } from "#react/select/select";
import { TagGroup } from "#react/tag-group/tag-group";
import { TextField } from "#react/text-field/text-field";

/** The words' keys. */
const K = UI_KEYS.ui.rule_builder;

/** A rule of conditions. */
export function RuleBuilder({
  fields,
  value,
  onChange,
  label,
  isDisabled = false,
  className,
}: RuleBuilderProps): ReactElement {
  const t = useUiText();
  const { matchItems, setMatch, fieldItems, add, remove, rowOf } = useRuleBuilderState({
    fields,
    value,
    onChange,
  });
  return (
    <fieldset
      data-slot="rule-builder"
      disabled={isDisabled}
      className={cn("m-0 flex min-w-0 flex-col gap-3 border-0 p-0", className)}
    >
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">{t(K.match)}</span>
        <Select
          aria-label={t(K.match)}
          items={matchItems}
          value={value.match}
          onChange={setMatch}
          isDisabled={isDisabled}
        />
      </div>
      {value.conditions.length === 0 ? (
        <p className="m-0 text-sm text-muted">{t(K.empty)}</p>
      ) : null}
      {/* A query container: each row lays out by the builder's own width, not the window's (a card, a side panel). */}
      <ol className="@container m-0 flex list-none flex-col gap-2 p-0">
        {value.conditions.map((condition) => {
          const row = rowOf(condition);
          const { field, operatorItems, setField, setOperator } = row;
          // One value input, or the `at` end of a range.
          const inputAt = (at: 0 | 1, name: string) =>
            row.input === "date" ? (
              <DateField
                aria-label={name}
                value={row.dayAt(at)}
                isDisabled={isDisabled}
                onChange={(day) => row.setDayAt(at, day)}
              />
            ) : (
              <TextField
                aria-label={name}
                {...(row.input === "number" ? { inputMode: "decimal" as const } : {})}
                value={row.textAt(at)}
                isDisabled={isDisabled}
                onChange={(next) => row.setTextAt(at, next)}
              />
            );
          return (
            <li
              key={condition.id}
              // Narrow: field and operator on one line, the value and the remove button under them. Wide: one line.
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 rounded-[var(--radius-control)] border border-separator p-2 @lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <div className="min-w-0">
                <Select
                  aria-label={t(K.field)}
                  items={fieldItems}
                  value={condition.field}
                  isDisabled={isDisabled}
                  isFullWidth
                  onChange={setField}
                />
              </div>
              <div className="col-span-2 min-w-0 @lg:col-span-1">
                <Select
                  aria-label={t(K.operator)}
                  items={operatorItems}
                  value={condition.operator}
                  isDisabled={isDisabled}
                  isFullWidth
                  onChange={setOperator}
                />
              </div>
              <div className="col-span-2 min-w-0 @lg:col-span-1">
                {row.input === "none" ? null : row.input === "choices" ? (
                  <TagGroup
                    label={t(K.value)}
                    selectionMode="multiple"
                    items={field?.options ?? []}
                    value={row.list}
                    onChange={row.setList}
                  />
                ) : row.input === "choice" ? (
                  <Select
                    aria-label={t(K.value)}
                    items={field?.options ?? []}
                    value={row.textAt(0) || null}
                    isDisabled={isDisabled}
                    isFullWidth
                    onChange={row.setValue}
                  />
                ) : row.isRange ? (
                  <div className="grid grid-cols-2 gap-2">
                    {inputAt(0, t(UI_KEYS.ui.filter_bar.from))}
                    {inputAt(1, t(UI_KEYS.ui.filter_bar.until))}
                  </div>
                ) : (
                  inputAt(0, t(K.value))
                )}
              </div>
              <IconButton
                icon="x"
                label={t(K.remove)}
                variant="ghost"
                size="sm"
                isDisabled={isDisabled}
                onPress={() => remove(condition.id)}
              />
            </li>
          );
        })}
      </ol>
      <div>
        <Button
          variant="secondary"
          size="sm"
          startIcon="plus"
          onPress={add}
          isDisabled={isDisabled || fields.length === 0}
        >
          {t(K.add)}
        </Button>
      </div>
    </fieldset>
  );
}
