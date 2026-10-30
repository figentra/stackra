/**
 * Stackra file contract:
 * Purpose: the native `RuleBuilder`: "all / any of these" over cards of field, operator and value (a text field, or a
 *          select for a choice field; none for "is empty"), each removable, and a button that adds one.
 * Boundary: controlled; every edit reports a whole new rule; operators follow the field's type.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { ReactElement } from "react";
import { View } from "react-native";

import type { RuleCondition } from "#contracts/types/rule-condition.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { ruleOperatorsOf } from "#core/functions/rule-operators-of.function";
import { useUiText } from "#react/hooks/use-ui-text";
import { Button } from "#native/button/button";
import { IconButton } from "#native/icon-button/icon-button";
import type { RuleBuilderProps } from "#native/rule-builder/rule-builder.props";
import { Select } from "#native/select/select";
import { Text } from "#native/text/text";
import { TextField } from "#native/text-field/text-field";

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
    <View accessibilityLabel={label} className={["gap-3", className].filter(Boolean).join(" ")}>
      <Select
        label={t(K.match)}
        items={[
          { id: "all", label: t(K.match_all) },
          { id: "any", label: t(K.match_any) },
        ]}
        value={value.match}
        onChange={(match) => onChange({ ...value, match: match === "any" ? "any" : "all" })}
        isDisabled={isDisabled}
        isFullWidth
      />
      {value.conditions.length === 0 ? (
        <Text type="small" tone="muted">
          {t(K.empty)}
        </Text>
      ) : null}
      {value.conditions.map((condition) => {
        const field = fields.find((item) => item.key === condition.field) ?? fields[0];
        const operators = field ? ruleOperatorsOf(field.type) : [];
        const needsValue =
          condition.operator !== "is_empty" && condition.operator !== "is_not_empty";
        return (
          <View
            key={condition.id}
            className="gap-2 rounded-[var(--radius-container)] border border-separator p-3"
          >
            <View className="flex-row items-start gap-2">
              <View className="flex-1">
                <Select
                  label={t(K.field)}
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
              </View>
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
            </View>
            <Select
              label={t(K.operator)}
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
            {!needsValue ? null : field?.type === "choice" ? (
              <Select
                label={t(K.value)}
                items={field.options ?? []}
                value={condition.value || null}
                isDisabled={isDisabled}
                isFullWidth
                onChange={(next) => update(condition.id, { value: next ?? "" })}
              />
            ) : (
              <TextField
                label={t(K.value)}
                value={condition.value}
                isDisabled={isDisabled}
                {...(field?.type === "number" ? { keyboardType: "decimal-pad" as const } : {})}
                onChange={(next) => update(condition.id, { value: next })}
              />
            )}
          </View>
        );
      })}
      <Button
        variant="secondary"
        size="sm"
        startIcon="plus"
        onPress={add}
        isDisabled={isDisabled || fields.length === 0}
      >
        {t(K.add)}
      </Button>
    </View>
  );
}
