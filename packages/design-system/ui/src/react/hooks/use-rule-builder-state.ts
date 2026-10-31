/**
 * Stackra file contract:
 * Purpose: `useRuleBuilderState(props)`, the editing every runtime's RuleBuilder shares: the all-or-any choice, adding
 *          a condition (on the first field, with its first operator), removing one, and per condition its field, the
 *          operators that field allows, whether the operator takes a value, and the changes its controls make. A new
 *          field keeps the operator when the field allows it, else takes the field's first, and clears the value. Each
 *          row says which input it needs (`input`: none, text, number, one choice, several choices or a day, and
 *          whether it is a `[from, to]` range), and a new operator resets the value to its shape ("" | ids | a pair).
 * Boundary: a React hook with no rendering and no state of its own: every change hands `onChange` the whole new group.
 *           The web and native RuleBuilder both use it.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0505 (one filter model); STA-1371.
 */
import { parseDate, type CalendarDate } from "@internationalized/date";

import type { RuleOperator } from "#contracts/enums/rule-operator.enum";
import type { RuleBuilderContractProps } from "#contracts/types/rule-builder-contract-props.type";
import type { RuleCondition } from "#contracts/types/rule-condition.type";
import type { RuleField } from "#contracts/types/rule-field.type";
import type { RuleValue } from "#contracts/types/rule-value.type";
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
  /** The input the value needs: none, free text, a number, one choice, several choices or a day. */
  readonly input: "none" | "text" | "number" | "choice" | "choices" | "date";
  /** True for `between`: two inputs, from and to. */
  readonly isRange: boolean;
  /** The text of the value, or of one end of a range. */
  readonly textAt: (at: 0 | 1) => string;
  /** Sets the value, or one end of a range, from text. */
  readonly setTextAt: (at: 0 | 1, next: string) => void;
  /** The day of the value, or of one end of a range, or null. */
  readonly dayAt: (at: 0 | 1) => CalendarDate | null;
  /** Sets the value, or one end of a range, to a day (null clears it). */
  readonly setDayAt: (at: 0 | 1, day: CalendarDate | null) => void;
  /** The choice ids of an `in` or `not_in` value. */
  readonly list: readonly string[];
  /** Sets the choice ids. */
  readonly setList: (next: readonly string[]) => void;
}

/** The operators that compare with no value. */
const NO_VALUE: ReadonlySet<RuleOperator> = new Set([
  "is_empty",
  "is_not_empty",
  "is_true",
  "is_false",
]);

/** The empty value of an operator's shape. */
const emptyOf = (operator: RuleOperator): RuleValue =>
  operator === "in" || operator === "not_in" ? [] : operator === "between" ? ["", ""] : "";

/** A day of ISO text, or null for empty or bad text. */
function dayOf(text: string): CalendarDate | null {
  if (text === "") return null;
  try {
    return parseDate(text);
  } catch {
    return null;
  }
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
          {
            id,
            field: field.key,
            operator: ruleOperatorsOf(field.type)[0] ?? "equals",
            value: emptyOf(ruleOperatorsOf(field.type)[0] ?? "equals"),
          },
        ],
      });
    },
    remove: (id) =>
      onChange({ ...value, conditions: value.conditions.filter((item) => item.id !== id) }),
    rowOf: (condition) => {
      const field = fields.find((item) => item.key === condition.field) ?? fields[0];
      const operators = field ? ruleOperatorsOf(field.type) : [];
      const { operator, value: current } = condition;
      const isRange = operator === "between";
      const pair: readonly [string, string] =
        typeof current === "string" ? [current, ""] : [current[0] ?? "", current[1] ?? ""];
      const textAt = (at: 0 | 1) =>
        isRange ? pair[at] : typeof current === "string" ? current : current.join(",");
      const setTextAt = (at: 0 | 1, next: string) =>
        update(condition.id, {
          value: isRange ? (at === 0 ? [next, pair[1]] : [pair[0], next]) : next,
        });
      const type = field?.type ?? "text";
      return {
        field,
        needsValue: !NO_VALUE.has(operator),
        input: NO_VALUE.has(operator)
          ? "none"
          : operator === "in" || operator === "not_in"
            ? "choices"
            : type === "choice"
              ? "choice"
              : type === "number" || type === "date"
                ? type
                : "text",
        isRange,
        textAt,
        setTextAt,
        dayAt: (at) => dayOf(textAt(at)),
        setDayAt: (at, day) => setTextAt(at, day?.toString() ?? ""),
        list: typeof current === "string" ? (current === "" ? [] : [current]) : current,
        setList: (next) => update(condition.id, { value: next }),
        operatorItems: operators.map((entry) => ({
          id: entry,
          label: t(UI_KEYS.ui.rule_operator[entry]),
        })),
        setField: (key) => {
          const next = fields.find((item) => item.key === key);
          if (!next) return;
          const allowed = ruleOperatorsOf(next.type);
          const kept = allowed.includes(condition.operator)
            ? condition.operator
            : (allowed[0] ?? "equals");
          update(condition.id, {
            field: next.key,
            operator: kept,
            value: emptyOf(kept),
          });
        },
        setOperator: (key) => {
          const next = operators.find((item) => item === key);
          if (!next) return;
          // A value keeps its text when the shape stays; a list, a range or no value starts empty.
          const isSameShape = JSON.stringify(emptyOf(next)) === JSON.stringify(emptyOf(operator));
          update(condition.id, {
            operator: next,
            ...(isSameShape ? {} : { value: emptyOf(next) }),
          });
        },
        setValue: (next) => update(condition.id, { value: next ?? "" }),
      };
    },
  };
}
