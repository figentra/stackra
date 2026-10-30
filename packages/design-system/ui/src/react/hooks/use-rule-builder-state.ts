/**
 * Stackra file contract:
 * Purpose: `useRuleBuilderState(props)`, the editing every runtime's RuleBuilder shares: the all-or-any choice, adding
 *          a condition (on the first field, with its first operator), removing one, and per condition its field, the
 *          operators that field allows, whether the operator takes a value, and the changes its controls make. A new
 *          field keeps the operator when the field allows it, else takes the field's first, and clears the value.
 * Boundary: a React hook with no rendering and no state of its own: every change hands `onChange` the whole new group.
 *           The web and native RuleBuilder both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { RuleOperator } from "#contracts/enums/rule-operator.enum";
import type { RuleBuilderContractProps } from "#contracts/types/rule-builder-contract-props.type";
import type { RuleCondition } from "#contracts/types/rule-condition.type";
import type { RuleField } from "#contracts/types/rule-field.type";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { ruleOperatorsOf } from "#core/functions/rule-operators-of.function";
import { useUiText } from "#react/hooks/use-ui-text";

/** The builder's words. */
const K = UI_KEYS.ui.rule_builder;

/** One condition's editing. */
interface RuleRow {
  /** The condition's field, or the first one when its key is unknown. */
  readonly field: RuleField | undefined;
  /** True unless the operator is "is empty" or "is not empty". */
  readonly needsValue: boolean;
  /** The operators the field allows, in the reader's words. */
  readonly operatorItems: readonly { readonly id: RuleOperator; readonly label: string }[];
  readonly setField: (key: unknown) => void;
  readonly setOperator: (key: unknown) => void;
  readonly setValue: (next: string | null | undefined) => void;
}

/**
 * The shared rule builder editing.
 * @param props - the fields, the group and its change handler
 * @returns the match choice, add and remove, and each condition's row
 */
export function useRuleBuilderState({
  fields,
  value,
  onChange,
}: Pick<RuleBuilderContractProps, "fields" | "value" | "onChange">): {
  readonly matchItems: readonly { readonly id: "all" | "any"; readonly label: string }[];
  readonly setMatch: (key: unknown) => void;
  readonly fieldItems: readonly { readonly id: string; readonly label: string }[];
  readonly add: () => void;
  readonly remove: (id: string) => void;
  readonly rowOf: (condition: RuleCondition) => RuleRow;
} {
  const t = useUiText();
  const update = (id: string, patch: Partial<RuleCondition>) =>
    onChange({
      ...value,
      conditions: value.conditions.map((condition) =>
        condition.id === id ? { ...condition, ...patch } : condition,
      ),
    });
  return {
    matchItems: [
      { id: "all", label: t(K.match_all) },
      { id: "any", label: t(K.match_any) },
    ],
    setMatch: (match) => onChange({ ...value, match: match === "any" ? "any" : "all" }),
    fieldItems: fields.map((item) => ({ id: item.key, label: item.label })),
    add: () => {
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
    },
    remove: (id) =>
      onChange({ ...value, conditions: value.conditions.filter((item) => item.id !== id) }),
    rowOf: (condition) => {
      const field = fields.find((item) => item.key === condition.field) ?? fields[0];
      const operators = field ? ruleOperatorsOf(field.type) : [];
      return {
        field,
        needsValue: condition.operator !== "is_empty" && condition.operator !== "is_not_empty",
        operatorItems: operators.map((operator) => ({
          id: operator,
          label: t(UI_KEYS.ui.rule_operator[operator]),
        })),
        setField: (key) => {
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
        },
        setOperator: (key) => {
          const next = operators.find((item) => item === key);
          if (next) update(condition.id, { operator: next });
        },
        setValue: (next) => update(condition.id, { value: next ?? "" }),
      };
    },
  };
}
