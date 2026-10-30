/**
 * Stackra file contract:
 * Purpose: the props every runtime's `RadioGroup` takes: the shared field props for the one key chosen, the options
 *          to choose from, the way they are laid out and the look. Each runtime's `RadioGroupProps` is this plus its
 *          HeroUI group's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303 (decision 7, props vocabulary);
 *          ADR 0055 (forms).
 */
import type { ControlVariant } from "#contracts/enums/control-variant.enum";
import type { Orientation } from "#contracts/enums/orientation.enum";
import type { ChoiceOption } from "#contracts/types/choice-option.type";
import type { FieldContractProps } from "#contracts/types/field-contract-props.type";

/** Props shared by the web and native `RadioGroup`: a field that edits which one option is chosen. */
export interface RadioGroupContractProps extends FieldContractProps<string> {
  /** The radios, in the order they are drawn; the group's value is the `value` of the one chosen. */
  readonly options: readonly ChoiceOption[];
  /** `vertical` stacks the options, `horizontal` puts them in a wrapping row under the label. Defaults to `vertical`. */
  readonly orientation?: Orientation | undefined;
  /**
   * Lays the options out in this many equal columns, under the label (the label, description and error never take a
   * cell). Left out, the options stack (or wrap in a row, with `orientation="horizontal"`).
   */
  readonly columns?: number | undefined;
  /** The look of every radio in the group; left out, each runtime picks the one that suits where it sits. */
  readonly variant?: ControlVariant | undefined;
}
