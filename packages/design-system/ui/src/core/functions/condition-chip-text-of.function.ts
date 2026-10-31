/**
 * Stackra file contract:
 * Purpose: `conditionChipTextOf`, the text of a filter chip for any condition of a `CollectionFilter`: the column's
 *          name, the operator's word and the value (a choice by its label, a list joined, a range as "from – to").
 * Boundary: pure; the words of the operators come from the caller (the `ui` catalogue in the active locale), so the
 *           web and native chips read the same.
 * Runtime: isomorphic
 * Governing contract: ADR 0505 (one filter model); STA-1371.
 */
import type { RuleOperator } from "#contracts/enums/rule-operator.enum";
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { RuleCondition } from "#contracts/types/rule-condition.type";

/** The operators that compare with no value. */
const NO_VALUE: ReadonlySet<RuleOperator> = new Set([
  "is_empty",
  "is_not_empty",
  "is_true",
  "is_false",
]);

/**
 * A chip's text.
 * @param condition - the condition
 * @param columns - the collection's columns, for the name and the choice labels
 * @param operatorWord - the word of an operator in the active locale
 * @returns for example "Status is any of Paid, Sent"
 */
export function conditionChipTextOf(
  condition: RuleCondition,
  columns: readonly CollectionColumn[],
  operatorWord: (operator: RuleOperator) => string,
): string {
  const column = columns.find((entry) => entry.id === condition.field);
  const labelOf = (id: string) => column?.options?.find((option) => option.id === id)?.label ?? id;
  const { operator, value } = condition;
  const shown = NO_VALUE.has(operator)
    ? ""
    : typeof value === "string"
      ? labelOf(value)
      : operator === "between"
        ? `${value[0] ?? ""} – ${value[1] ?? ""}`.trim()
        : value.map(labelOf).join(", ");
  return [column?.label ?? condition.field, operatorWord(operator), shown]
    .filter(Boolean)
    .join(" ");
}
