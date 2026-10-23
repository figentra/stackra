/**
 * Stackra file contract:
 * Purpose: the props every runtime's `CheckboxGroup` takes: the shared field props for a list of chosen keys, the
 *          options to choose from and the look. Each runtime's `CheckboxGroupProps` is this plus its HeroUI group's
 *          own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms).
 */
import type { ControlVariant } from "#contracts/enums/control-variant.enum";
import type { ChoiceOption } from "#contracts/types/choice-option.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `CheckboxGroup`: a field that edits the list of options chosen. */
export interface CheckboxGroupContractProps extends FieldContractProps<readonly string[]> {
  /** The checkboxes, in the order they are drawn; each is reported by its `value` in the group's list. */
  readonly options: readonly ChoiceOption[];
  /** The look of every checkbox in the group; left out, each runtime picks the one that suits where it sits. */
  readonly variant?: ControlVariant | undefined;
}
