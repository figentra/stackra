/**
 * Stackra file contract:
 * Purpose: the web `RuleBuilder`: "all / any of these" over rows of field, operator and value (a text field, or a
 *          select for a choice field; none for "is empty"), each removable, and a button that adds one.
 * Boundary: controlled; every edit reports a whole new rule. Operators follow the field's type
 *           (`ruleOperatorsOf`); changing the field resets an operator it does not offer.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.3.1 and 2.4.6; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import type { RuleCondition } from "#contracts/types/rule-condition.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { ruleOperatorsOf } from "#core/functions/rule-operators-of.function";
import { Button } from "#react/button/button";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import type { RuleBuilderProps } from "#react/rule-builder/rule-builder.props";
import { Select } from "#react/select/select";
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
  const fieldOf = (key: string) => fields.find((field) => field.key === key) ?? fields[0];
  const update = (id: string, patch: Partial<RuleCondition>) =>
    onChange({
      ...value,
      conditions: value.conditions.map((condition) =>
        condition.id === id ? { ...condition, ...patch } : condition,
      ),
    });
  const add = () => {
    const field = fields[0];
    if (!field) return;
    const id = `c${Date.now().toString(36)}${value.conditions.length}`;
    onChange({
      ...value,
      conditions: [
        ...value.conditions,
        { id, field: field.key, operator: ruleOperatorsOf(field.type)[0] ?? "equals", value: "" },
      ],
    });
  };
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
          items={[
            { id: "all", label: t(K.match_all) },
            { id: "any", label: t(K.match_any) },
          ]}
          value={value.match}
          onChange={(match) => onChange({ ...value, match: match === "any" ? "any" : "all" })}
          isDisabled={isDisabled}
        />
      </div>
      {value.conditions.length === 0 ? (
        <p className="m-0 text-sm text-muted">{t(K.empty)}</p>
      ) : null}
      {/* A query container: each row lays out by the builder's own width, not the window's (a card, a side panel). */}
      <ol className="@container m-0 flex list-none flex-col gap-2 p-0">
        {value.conditions.map((condition) => {
          const field = fieldOf(condition.field);
          const operators = field ? ruleOperatorsOf(field.type) : [];
          const needsValue =
            condition.operator !== "is_empty" && condition.operator !== "is_not_empty";
          return (
            <li
              key={condition.id}
              // Narrow: field and operator on one line, the value and the remove button under them. Wide: one line.
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-separator p-2 @lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
            >
              <div className="min-w-0">
                <Select
                  aria-label={t(K.field)}
                  items={fields.map((item) => ({ id: item.key, label: item.label }))}
                  value={condition.field}
                  isDisabled={isDisabled}
                  isFullWidth
                  onChange={(key) => {
                    const next = fields.find((item) => item.key === key);
                    if (!next) return;
                    const allowed = ruleOperatorsOf(next.type);
                    update(condition.id, {
                      field: next.key,
                      operator: allowed.includes(condition.operator)
                        ? condition.operator
                        : (allowed[0] ?? "equals"),
                      value: "",
                    });
                  }}
                />
              </div>
              <div className="col-span-2 min-w-0 @lg:col-span-1">
                <Select
                  aria-label={t(K.operator)}
                  items={operators.map((operator) => ({
                    id: operator,
                    label: t(UI_KEYS.ui.rule_operator[operator]),
                  }))}
                  value={condition.operator}
                  isDisabled={isDisabled}
                  isFullWidth
                  onChange={(operator) => {
                    const next = operators.find((item) => item === operator);
                    if (next) update(condition.id, { operator: next });
                  }}
                />
              </div>
              <div className="col-span-2 min-w-0 @lg:col-span-1">
                {!needsValue ? null : field?.type === "choice" ? (
                  <Select
                    aria-label={t(K.value)}
                    items={field.options ?? []}
                    value={condition.value || null}
                    isDisabled={isDisabled}
                    isFullWidth
                    onChange={(next) => update(condition.id, { value: next ?? "" })}
                  />
                ) : (
                  <TextField
                    aria-label={t(K.value)}
                    {...(field?.type === "number" ? { inputMode: "decimal" as const } : {})}
                    value={condition.value}
                    isDisabled={isDisabled}
                    onChange={(next) => update(condition.id, { value: next })}
                  />
                )}
              </div>
              <IconButton
                icon="x"
                label={t(K.remove)}
                variant="ghost"
                size="sm"
                isDisabled={isDisabled}
                onPress={() =>
                  onChange({
                    ...value,
                    conditions: value.conditions.filter((item) => item.id !== condition.id),
                  })
                }
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
