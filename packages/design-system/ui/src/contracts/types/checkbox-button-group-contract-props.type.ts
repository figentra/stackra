/**
 * Stackra file contract:
 * Purpose: the props every runtime's `CheckboxButtonGroup` takes: any number of choices, each drawn as a card.
 * Boundary: types only; a checkbox group under the hood.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055.
 */
import type { Orientation } from "#contracts/enums/orientation.enum";
import type { ChoiceItem } from "#contracts/types/choice-item.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `CheckboxButtonGroup`. */
export interface CheckboxButtonGroupContractProps extends FieldContractProps<readonly string[]> {
  /** The cards. */
  readonly items: readonly ChoiceItem[];
  /** `vertical` (the default) stacks the cards; `horizontal` puts them side by side and wraps. */
  readonly orientation?: Orientation | undefined;
}
