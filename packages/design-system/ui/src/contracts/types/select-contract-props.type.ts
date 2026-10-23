/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Select` takes: the field contract over the chosen key (label, description, error
 *          message, states, value and change handler) plus the list of choices, the placeholder and full width. Each
 *          runtime's `SelectProps` is this plus its HeroUI select's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms: one field contract); ADR 0165 (UI contract).
 */
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";
import type { SelectItem } from "#contracts/types/select-item.type";

/** Props shared by the web and native `Select`. `value` is the chosen key, and `null` means nothing is chosen. */
export interface SelectContractProps extends FieldContractProps<string | null> {
  /** The choices, a short static list; for a long or searchable one use a ComboBox. */
  readonly items: readonly SelectItem[];
  /** Text shown while nothing is chosen; it hints at what to pick and never replaces the label. */
  readonly placeholder?: string | undefined;
  /** True to fill the width of the parent instead of the width of the content. */
  readonly isFullWidth?: boolean | undefined;
}
