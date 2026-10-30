/**
 * Stackra file contract:
 * Purpose: the props every runtime's `RadioButtonGroup` takes: one choice from a few, each drawn as a card.
 * Boundary: types only; a radio group under the hood, so arrow keys move between cards.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0055.
 */
import type { Orientation } from "#contracts/enums/orientation.enum";
import type { ChoiceItem } from "#contracts/types/choice-item.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `RadioButtonGroup`. */
export interface RadioButtonGroupContractProps extends FieldContractProps<string | null> {
  /** The choice cards, one per option. */
  readonly items: readonly ChoiceItem[];
  /** `vertical` (the default) stacks the cards; `horizontal` puts them side by side and wraps. */
  readonly orientation?: Orientation | undefined;
}
