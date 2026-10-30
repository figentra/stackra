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

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useRuleBuilderState } from "#react/hooks/use-rule-builder-state";
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
  const { matchItems, setMatch, fieldItems, add, remove, rowOf } = useRuleBuilderState({
    fields,
    value,
    onChange,
  });
  return (
    <View accessibilityLabel={label} className={["gap-3", className].filter(Boolean).join(" ")}>
      <Select
        label={t(K.match)}
        items={matchItems}
        value={value.match}
        onChange={setMatch}
        isDisabled={isDisabled}
        isFullWidth
      />
      {value.conditions.length === 0 ? (
        <Text type="small" tone="muted">
          {t(K.empty)}
        </Text>
      ) : null}
      {value.conditions.map((condition) => {
        const { field, needsValue, operatorItems, setField, setOperator, setValue } =
          rowOf(condition);
        return (
          <View
            key={condition.id}
            className="gap-2 rounded-[var(--radius-container)] border border-separator p-3"
          >
            <View className="flex-row items-start gap-2">
              <View className="flex-1">
                <Select
                  label={t(K.field)}
                  items={fieldItems}
                  value={condition.field}
                  isDisabled={isDisabled}
                  isFullWidth
                  onChange={setField}
                />
              </View>
              <IconButton
                icon="x"
                label={t(K.remove)}
                variant="ghost"
                size="sm"
                isDisabled={isDisabled}
                onPress={() => remove(condition.id)}
              />
            </View>
            <Select
              label={t(K.operator)}
              items={operatorItems}
              value={condition.operator}
              isDisabled={isDisabled}
              isFullWidth
              onChange={setOperator}
            />
            {!needsValue ? null : field?.type === "choice" ? (
              <Select
                label={t(K.value)}
                items={field.options ?? []}
                value={condition.value || null}
                isDisabled={isDisabled}
                isFullWidth
                onChange={setValue}
              />
            ) : (
              <TextField
                label={t(K.value)}
                value={condition.value}
                isDisabled={isDisabled}
                {...(field?.type === "number" ? { keyboardType: "decimal-pad" as const } : {})}
                onChange={setValue}
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
