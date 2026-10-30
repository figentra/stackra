/**
 * Stackra file contract:
 * Purpose: `choiceOptionsOf(options)`, a filter's select items as the radios or checkboxes of a choice group: the id
 *          as the value, the label, and the description and disabled state when an item has them.
 * Boundary: pure; the web and native FilterEditor both use it for their select and multi-select filters.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decisions 3 and 4).
 */
import type { ChoiceOption } from "#contracts/types/choice-option.type";
import type { SelectItem } from "#contracts/types/select-item.type";

/**
 * The choice options of `options`, in their order.
 * @example choiceOptionsOf([{ id: "open", label: "Open" }]); // [{ value: "open", label: "Open" }]
 */
export function choiceOptionsOf(options: readonly SelectItem[]): readonly ChoiceOption[] {
  return options.map((option) => ({
    value: option.id,
    label: option.label,
    ...(option.description === undefined ? {} : { description: option.description }),
    ...(option.isDisabled === undefined ? {} : { isDisabled: option.isDisabled }),
  }));
}
